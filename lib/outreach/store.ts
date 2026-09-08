import "server-only";
import { randomBytes } from "node:crypto";
import { dashboardDb, marketingDb } from "./db";
import type { Referral, ReferralFields } from "./shared";
export async function listReferrals() {
  const sql = dashboardDb();
  return (await sql`SELECT r.*, coalesce(m.visits,0)::int visits, coalesce(m.engaged,0)::int engaged, coalesce(m.cta,0)::int cta, coalesce(m.demos,0)::int demos, coalesce(m.newsletters,0)::int newsletters, m.last_visit, m.last_activity, coalesce(m.products, ARRAY[]::text[]) products, coalesce(m.form_starts,0)::int form_starts, coalesce(m.errors,0)::int errors, coalesce(m.demo_views,0)::int demo_views FROM outreach_referrals r LEFT JOIN (SELECT code, count(DISTINCT visit_id) visits, count(*) FILTER (WHERE event_name='engaged_visit') engaged, count(DISTINCT visit_id) FILTER (WHERE event_name='demo_cta_clicked') cta, count(*) FILTER (WHERE event_name='demo_submitted') demos, count(*) FILTER (WHERE event_name='newsletter_submitted') newsletters, max(received_at) FILTER (WHERE event_name='visit_started') last_visit, max(received_at) last_activity, array_agg(DISTINCT detail) FILTER (WHERE event_name='product_interest') products, count(*) FILTER (WHERE event_name='demo_form_started') form_starts, count(*) FILTER (WHERE event_name='form_error') errors, count(*) FILTER (WHERE event_name='demo_viewed') demo_views FROM outreach_events GROUP BY code) m ON m.code=r.code ORDER BY r.created_at DESC, r.code`) as Referral[];
}
export async function createReferral(fields: ReferralFields) {
  const sql = dashboardDb();
  for (let i = 0; i < 4; i++) {
    const code = randomBytes(5).toString("hex");
    const rows =
      await sql`INSERT INTO outreach_referrals (code,contact_name,organization,channel,campaign,date_sent,notes,status) VALUES (${code},${fields.contact_name},${fields.organization},${fields.channel},${fields.campaign},${fields.date_sent},${fields.notes},${fields.status}) ON CONFLICT (code) DO NOTHING RETURNING code`;
    if (rows.length) return code;
  }
  throw new Error("CODE_GENERATION_FAILED");
}
export async function updateReferral(
  code: string,
  version: number,
  fields: ReferralFields,
) {
  const sql = dashboardDb();
  return (
    (
      await sql`UPDATE outreach_referrals SET contact_name=${fields.contact_name},organization=${fields.organization},channel=${fields.channel},campaign=${fields.campaign},date_sent=${fields.date_sent},notes=${fields.notes},status=${fields.status},version=version+1,updated_at=now() WHERE code=${code} AND version=${version} RETURNING code`
    ).length > 0
  );
}
export async function publicReferral(code: string) {
  if (!/^[a-f0-9]{6,10}$/.test(code)) return null;
  const sql = marketingDb();
  const rows =
    await sql`SELECT code,channel,campaign FROM public_outreach_referrals WHERE code=${code} LIMIT 1`;
  return rows[0] as
    { code: string; channel: string; campaign: string } | undefined;
}
