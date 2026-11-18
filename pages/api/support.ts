import type { NextApiRequest, NextApiResponse } from "next";
import { parseSubmission, supportService } from "@/lib/support/intake";
import { accept, deliver } from "@/lib/support/inbox";
import { runSubmission } from "@/lib/support/concurrency";

export const config = {
  api: { bodyParser: { sizeLimit: "32kb" } },
  maxDuration: 60,
};
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  res.setHeader("Cache-Control", "no-store");
  if (process.env.AUDENTRA_APP === "analytics") return res.status(404).end();
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).end();
  }
  const origin = req.headers.origin;
  if (
    req.headers["sec-fetch-site"] === "cross-site" ||
    (origin &&
      (!URL.canParse(origin) || new URL(origin).host !== req.headers.host))
  )
    return res.status(403).end();
  if (!req.headers["content-type"]?.startsWith("application/json"))
    return res.status(415).end();
  const report = parseSubmission(req.body);
  if (!report) return res.status(400).json({ state: "invalid" });
  const unavailable = { state: report.checkOnly ? "unknown" : "retry" };
  const forwarded = req.headers["x-vercel-forwarded-for"];
  const ip =
    process.env.VERCEL && typeof forwarded === "string"
      ? forwarded.split(",")[0]?.trim()
      : undefined;
  try {
    const saved = await accept(report, ip);
    if (!saved) {
      const old = await supportService().submit({ ...report, checkOnly: true });
      return res.status(old.status).json(old.body);
    }
    if (saved.body.state === "queued" && !report.checkOnly) {
      const result = await runSubmission(() => deliver(report.reference)).catch(
        () => null,
      );
      if (result) return res.status(result.status).json(result.body);
    }
    return res.status(saved.status).json(saved.body);
  } catch {
    return res.status(503).json(unavailable);
  }
}
