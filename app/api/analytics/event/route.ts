import { requestOrigin } from "@/lib/analytics/request-origin";
import { events, products, safePath } from "@/lib/analytics/schema";
import { marketingDb } from "@/lib/outreach/db";
const limits = new Map<string, { count: number; until: number }>();
export async function POST(request: Request) {
  if (process.env.AUDENTRA_APP === "analytics")
    return new Response(null, { status: 404 });
  if (!requestOrigin(request)) return new Response(null, { status: 403 });
  if (
    /bot|crawler|spider|preview|headless|facebookexternalhit|slackbot|linkedinbot/i.test(
      request.headers.get("user-agent") || "",
    )
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
  if (
    !body ||
    typeof body !== "object" ||
    Array.isArray(body) ||
    !/^[a-f0-9]{6,10}$/.test(body.code) ||
    !/^[0-9a-f-]{36}$/.test(body.visit_id) ||
    !events.includes(body.event_name) ||
    !safePath(body.page) ||
    ![
      "none",
      ...products,
      "header",
      "footer",
      "hero",
      "body",
      "demo",
      "newsletter",
      "email",
    ].includes(body.detail)
  )
    return new Response(null, { status: 400 });
  try {
    const sql = marketingDb();
    // Foreign key and UNIQUE(visit_id,event_name,detail) validate known links and
    // deduplicate retries in durable storage. This role cannot read contact data.
    await sql`INSERT INTO outreach_events (code,visit_id,event_name,page,detail) VALUES (${body.code},${body.visit_id},${body.event_name},${body.page},${body.detail}) ON CONFLICT DO NOTHING`;
    return new Response(null, { status: 204 });
  } catch {
    return new Response(null, { status: 503 });
  }
}
