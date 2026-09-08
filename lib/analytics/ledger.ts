import { marketingDb } from "@/lib/outreach/db";
import { channelFor, type CollectedEvent } from "./collection";
export async function recordEvent(e: CollectedEvent) {
  const sql = marketingDb(),
    a = e.attribution;
  // The public view contains only code/channel/campaign; unknown codes become NULL.
  // Captured categories are snapshots, never joined retroactively to private records.
  await sql`INSERT INTO outreach_events(code,visit_id,event_name,page,detail,source,medium,campaign,content,channel,schema_version,submission_id)
 VALUES ((SELECT code FROM public_outreach_referrals WHERE code=${a.referral}),${e.visit_id},${e.event_name},${e.page},${e.detail},${a.source},${a.medium},${a.campaign},${a.content},${channelFor(a)},2,${e.submission_id || null}) ON CONFLICT DO NOTHING`;
}
