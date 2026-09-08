import { isAuthorized } from "@/lib/analytics/access";
import { getReport } from "@/lib/analytics/report";
export async function GET(request: Request) {
  if (!(await isAuthorized()))
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  const params = new URL(request.url).searchParams;
  const days = params.get("days") === "30" ? 30 : 7;
  const dimension = ["channel", "referral", "campaign"].includes(
    params.get("dimension") || "",
  )
    ? params.get("dimension")!
    : "channel";
  const selected = params.get("selected") || "";
  if (selected && !/^[a-z0-9-]{1,64}$/.test(selected))
    return Response.json({ error: "Invalid filter." }, { status: 400 });
  return Response.json(await getReport(days, dimension, selected), {
    headers: { "Cache-Control": "private, no-store" },
  });
}
