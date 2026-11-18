import { timingSafeEqual } from "node:crypto";
import {
  deliver,
  deliverNotification,
  deliveryService,
} from "@/lib/support/inbox";
export const maxDuration = 60;
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const actual = Buffer.from(request.headers.get("authorization") || "");
  const expected = Buffer.from("Bearer " + secret);
  if (
    !secret ||
    actual.length !== expected.length ||
    !timingSafeEqual(actual, expected)
  )
    return new Response(null, { status: 401 });
  try {
    const start = Date.now();
    let jiraPending = 0;
    for (let i = 0; i < 10 && Date.now() - start < 12000; i++) {
      const jira = await deliver();
      if (jira?.status === 202) jiraPending++;
      const slack = await deliverNotification();
      if (!jira && !slack) break;
    }
    const result =
      Date.now() - start < 30000
        ? await deliveryService().retryNotifications(start + 54000)
        : { found: 0, delivered: 0 };
    return Response.json(
      { ...result, jiraPending },
      {
        status:
          jiraPending === 0 && result.delivered === result.found ? 200 : 503,
        headers: { "Cache-Control": "no-store" },
      },
    );
  } catch {
    return Response.json({ error: "Delivery check failed" }, { status: 503 });
  }
}
