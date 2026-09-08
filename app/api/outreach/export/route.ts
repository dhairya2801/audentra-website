import { isAuthorized } from "@/lib/analytics/access";
import { listReferrals } from "@/lib/outreach/store";
import { csvExport, xlsxExport } from "@/lib/outreach/export";
export async function GET(request: Request) {
  if (!(await isAuthorized())) return new Response(null, { status: 401 });
  const format =
    new URL(request.url).searchParams.get("format") === "csv" ? "csv" : "xlsx";
  try {
    const rows = await listReferrals();
    const body =
      format === "csv"
        ? csvExport(rows)
        : new Uint8Array(await xlsxExport(rows));
    return new Response(body, {
      headers: {
        "Cache-Control": "private, no-store",
        "Content-Type":
          format === "csv"
            ? "text/csv; charset=utf-8"
            : "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="audentra-outreach-${new Date().toISOString().slice(0, 10)}.${format}"`,
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return Response.json(
      {
        error:
          "Export unavailable. Check the database connection and try again.",
      },
      { status: 503, headers: { "Cache-Control": "private, no-store" } },
    );
  }
}
