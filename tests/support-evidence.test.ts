import test from "node:test";
import assert from "node:assert/strict";
import { attachEvidence, parseEvidence } from "../lib/support/evidence";
const file = {
  name: "screen.png",
  mime: "image/png",
  data: Buffer.from("89504e470d0a1a0a00", "hex").toString("base64"),
};
const clip = {
  name: "clip.webm",
  mime: "video/webm",
  data: Buffer.concat([
    Buffer.from("1a45dfa3", "hex"),
    Buffer.from("webm"),
  ]).toString("base64"),
};
test("validates file signatures and aggregate limit", () => {
  assert.equal(parseEvidence([file, clip])?.length, 2);
  assert.deepEqual(
    parseEvidence([{ ...file, name: "screen.jpg", mime: "image/jpeg" }]),
    [file],
  );
  assert.equal(
    parseEvidence([
      { ...file, data: Buffer.from("not an image").toString("base64") },
    ]),
    null,
  );
  assert.equal(parseEvidence([file, clip, file]), null);
  assert.equal(parseEvidence([{ ...file, data: "x".repeat(4194305) }]), null);
});
test("retries partial Jira upload with the same files and no duplicate", async () => {
  const saved: { filename: string }[] = [];
  let fail = true;
  const send: typeof fetch = async (_url, init) => {
    if (init?.method !== "POST")
      return Response.json({ fields: { attachment: saved } });
    const item = (init.body as FormData).get("file") as File;
    if (item.name.endsWith("webm") && fail) {
      fail = false;
      return new Response(null, { status: 503 });
    }
    saved.push({ filename: item.name });
    return Response.json([]);
  };
  await assert.rejects(
    attachEvidence(
      "https://example.atlassian.net",
      "test",
      "TECH-1",
      [file, clip],
      send,
    ),
  );
  await attachEvidence(
    "https://example.atlassian.net",
    "test",
    "TECH-1",
    [file, clip],
    send,
  );
  assert.equal(saved.length, 2);
});

test("accepts exactly three MiB and rejects one byte over the combined limit", () => {
  const bytes = Buffer.alloc(3 * 1024 * 1024);
  Buffer.from(file.data, "base64").copy(bytes);
  const atLimit = { ...file, data: bytes.toString("base64") };
  assert.equal(parseEvidence([atLimit])?.length, 1);
  const excess = {
    ...file,
    data: Buffer.concat([bytes, Buffer.from([0])]).toString("base64"),
  };
  assert.equal(parseEvidence([excess]), null);
  assert.equal(parseEvidence([atLimit, clip]), null);
});
