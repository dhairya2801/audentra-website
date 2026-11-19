import { isIP } from "node:net";
import type { NextApiRequest, NextApiResponse } from "next";
import { parseSubmission, supportService } from "@/lib/support/intake";
import { accept, deliver } from "@/lib/support/inbox";
import { runSubmission } from "@/lib/support/concurrency";
import { relaySupportSubmission } from "@/lib/support/cloud-run";

export const config = {
  api: { bodyParser: { sizeLimit: "4250kb" } },
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
  if (!report) {
    const fieldsValid =
      req.body?.evidence !== undefined &&
      parseSubmission({ ...req.body, evidence: undefined }) !== null;
    return res
      .status(400)
      .json({ state: fieldsValid ? "invalid_evidence" : "invalid" });
  }
  const unavailable = { state: report.checkOnly ? "unknown" : "retry" };
  try {
    if (process.env.VERCEL === "1") {
      const oidc = req.headers["x-vercel-oidc-token"];
      const forwarded = req.headers["x-vercel-forwarded-for"];
      const ip = typeof forwarded === "string" && isIP(forwarded) ? forwarded : undefined;
      if (!ip) return res.status(503).json(unavailable);
      const upstream = await relaySupportSubmission(
        typeof oidc === "string" ? oidc : "",
        ip,
        req.body,
      );
      if (!upstream.headers.get("content-type")?.startsWith("application/json")) {
        return res.status(503).json(unavailable);
      }
      return res.status(upstream.status).json(await upstream.json());
    }

    // Enable only on the IAM-protected Cloud Run service, with invoker access scoped to the relay.
    const fromRelay = req.headers["x-audentra-support-origin-ip"];
    const ip = process.env.SUPPORT_TRUST_RELAY_IP === "1" &&
      typeof fromRelay === "string" && isIP(fromRelay) ? fromRelay : undefined;
    if (process.env.SUPPORT_TRUST_RELAY_IP === "1" && !ip) {
      return res.status(503).json(unavailable);
    }
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
