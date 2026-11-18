import { createHash } from "node:crypto";
export type Evidence = { name: string; mime: string; data: string };
const limit = 3 * 1024 * 1024;
function mediaType(b: Buffer) {
  if (b.subarray(0, 8).equals(Buffer.from("89504e470d0a1a0a", "hex")))
    return ["image/png", "png"];
  if (b.subarray(0, 3).toString("hex") === "ffd8ff")
    return ["image/jpeg", "jpg"];
  if (
    b.toString("ascii", 0, 4) === "RIFF" &&
    b.toString("ascii", 8, 12) === "WEBP"
  )
    return ["image/webp", "webp"];
  if (
    b.length >= 16 &&
    b.toString("ascii", 4, 8) === "ftyp" &&
    /^(isom|iso[2-9]|mp4[12]|avc1|M4V )$/.test(b.toString("ascii", 8, 12))
  )
    return ["video/mp4", "mp4"];
  if (
    b.subarray(0, 4).toString("hex") === "1a45dfa3" &&
    b.subarray(0, 256).includes(Buffer.from("webm"))
  )
    return ["video/webm", "webm"];
}
export function parseEvidence(input: unknown): Evidence[] | null {
  if (input === undefined) return [];
  if (!Array.isArray(input) || input.length > 2) return null;
  let total = 0;
  const result: Evidence[] = [];
  for (const file of input) {
    if (
      !file ||
      typeof file.data !== "string" ||
      !file.data.length ||
      file.data.length > (limit * 4) / 3 ||
      typeof file.name !== "string" ||
      file.name.length > 160
    )
      return null;
    const bytes = Buffer.from(file.data, "base64");
    total += bytes.length;
    const type = mediaType(bytes);
    if (
      !type ||
      total > limit ||
      bytes.toString("base64") !== file.data
    )
      return null;
    const stem =
      file.name
        .replace(/\.[^.]*$/, "")
        .replace(/[^a-zA-Z0-9_-]/g, "_")
        .slice(0, 50) || "evidence";
    result.push({ name: stem + "." + type[1], mime: type[0], data: file.data });
  }
  return result;
}
// Report attachment positions, never file contents or filenames, to Slack.
function terminalRejection(status: number) {
  return (
    status >= 400 && status < 500 && ![408, 409, 423, 425, 429].includes(status)
  );
}
export class AttachmentFailure extends Error {
  constructor(
    readonly unconfirmed: number[],
    readonly permanent = false,
  ) {
    super("Jira attachment upload incomplete");
  }
}
export async function attachEvidence(
  site: string,
  auth: string,
  key: string,
  files: Evidence[],
  send: typeof fetch,
) {
  if (!files.length) return;
  const url = site + "/rest/api/3/issue/" + encodeURIComponent(key);
  const options = {
    headers: { Authorization: auth },
    redirect: "error" as const,
  };
  const existing = await send(url + "?fields=attachment", {
    ...options,
    signal: AbortSignal.timeout(6000),
  });
  if (!existing.ok)
    throw new AttachmentFailure(
      files.map((_, i) => i + 1),
      terminalRejection(existing.status),
    );
  const saved = new Set(
    (await existing.json()).fields.attachment.map(
      (a: { filename: string }) => a.filename,
    ),
  );
  const unconfirmed: number[] = [];
  let transient = false;

  for (const [i, file] of files.entries()) {
    const bytes = Buffer.from(file.data, "base64");
    const name =
      i +
      1 +
      "-" +
      createHash("sha256").update(bytes).digest("hex").slice(0, 16) +
      "-" +
      file.name;
    if (saved.has(name)) continue;
    const body = new FormData();
    body.append(
      "file",
      new Blob([new Uint8Array(bytes)], { type: file.mime }),
      name,
    );
    try {
      const r = await send(url + "/attachments", {
        ...options,
        method: "POST",
        headers: { ...options.headers, "X-Atlassian-Token": "no-check" },
        body,
        signal: AbortSignal.timeout(15000),
      });
      if (r.ok) continue;
      if (!terminalRejection(r.status)) transient = true;
    } catch {
      transient = true;
      // An upload can succeed before the response is lost. The next pass lists Jira files first.
    }
    unconfirmed.push(i + 1);
  }
  if (unconfirmed.length) throw new AttachmentFailure(unconfirmed, !transient);
}
