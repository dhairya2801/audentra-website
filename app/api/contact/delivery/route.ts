import { timingSafeEqual } from "node:crypto";
import { getContactStore } from "@/lib/contact/db";
import { drainDeliveries } from "@/lib/contact/delivery";

export const maxDuration = 60;
export async function GET(request: Request) {
  if (
    process.env.AUDENTRA_APP === "analytics" ||
    process.env.CONTACT_DELIVERY_MODE !== "durable"
  )
    return new Response(null, { status: 404 });
  const expected = Buffer.from(`Bearer ${process.env.CRON_SECRET || ""}`);
  const actual = Buffer.from(request.headers.get("authorization") || "");
  if (
    !process.env.CRON_SECRET ||
    expected.length !== actual.length ||
    !timingSafeEqual(expected, actual)
  )
    return new Response(null, { status: 401 });
  try {
    const store = getContactStore();
    await drainDeliveries(store, { limit: 20 });
    return Response.json(
      { delivery: await store.health() },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch {
    return Response.json(
      { error: "Delivery worker unavailable. Requests retained." },
      { status: 503 },
    );
  }
}
