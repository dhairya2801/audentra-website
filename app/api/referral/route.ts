import { publicReferral } from "@/lib/outreach/store";
export async function GET(request: Request) {
  if (process.env.AUDENTRA_APP === "analytics")
    return new Response(null, { status: 404 });
  const code = new URL(request.url).searchParams.get("r") || "";
  try {
    const referral = await publicReferral(code);
    if (!referral)
      return Response.json(
        { referral: null },
        { status: 404, headers: { "Cache-Control": "no-store" } },
      );
    // Explicit projection: no contact name, organization, status, dates, or notes.
    return Response.json(
      {
        code: referral.code,
        channel: referral.channel,
        campaign: referral.campaign,
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return Response.json(
      { referral: null },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
