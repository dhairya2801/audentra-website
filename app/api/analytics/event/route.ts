import { requestOrigin } from "@/lib/analytics/request-origin";
import { browserEvent, botPattern } from "@/lib/analytics/collection";
import { recordEvent } from "@/lib/analytics/ledger";
const limits = new Map<string, { count: number; until: number }>();
export async function POST(request: Request) {
  if (process.env.AUDENTRA_APP === "analytics")
    return new Response(null, { status: 404 });
  if (!requestOrigin(request)) return new Response(null, { status: 403 });
  if (
    request.headers.get("dnt") === "1" ||
    request.headers.get("sec-gpc") === "1" ||
    botPattern.test(request.headers.get("user-agent") || "")
  )
    return new Response(null, { status: 204 });
  const now = Date.now(),
    ip = request.headers.get("x-forwarded-for")?.split(",")[0] || "local";
  for (const [k, v] of limits) if (v.until < now) limits.delete(k);
  const limit = limits.get(ip) || { count: 0, until: now + 60000 };
  limit.count++;
  limits.set(ip, limit);
  if (limit.count > 120 || limits.size > 10000)
    return new Response(null, { status: 429 });
  let body;
  try {
    const text = await request.text();
    if (text.length > 1500) return new Response(null, { status: 413 });
    body = JSON.parse(text);
  } catch {
    return new Response(null, { status: 400 });
  }
  const event = browserEvent(body);
  if (!event) return new Response(null, { status: 400 });
  try {
    await recordEvent(event);
    return new Response(null, { status: 204 });
  } catch {
    return new Response(null, { status: 503 });
  }
}
