import nextEnv from "@next/env";
import { neon } from "@neondatabase/serverless";
import { mkdir, writeFile } from "node:fs/promises";
import { xlsxExport } from "../lib/outreach/export.ts";
nextEnv.loadEnvConfig(process.cwd());
if (!process.env.DATABASE_URL)
  throw new Error(
    "Set DATABASE_URL: exports come from the database, never a local contact list.",
  );
const sql = neon(process.env.DATABASE_URL);
const rows =
  await sql`SELECT r.*, coalesce(m.visits,0)::int visits, coalesce(m.engaged,0)::int engaged, coalesce(m.cta,0)::int cta, coalesce(m.demos,0)::int demos, coalesce(m.newsletters,0)::int newsletters, m.last_visit,m.last_activity FROM outreach_referrals r LEFT JOIN (SELECT code,count(DISTINCT visit_id) visits,count(*) FILTER (WHERE event_name='engaged_visit') engaged,count(DISTINCT visit_id) FILTER (WHERE event_name='demo_cta_clicked') cta,count(*) FILTER (WHERE event_name='demo_submitted') demos,count(*) FILTER (WHERE event_name='newsletter_submitted') newsletters,max(received_at) FILTER (WHERE event_name='visit_started') last_visit,max(received_at) last_activity FROM outreach_events GROUP BY code) m ON r.code=m.code ORDER BY r.created_at,r.code`;
await mkdir("deliverables", { recursive: true });
await writeFile(
  "deliverables/audentra-outreach-links.xlsx",
  new Uint8Array(await xlsxExport(rows)),
  { mode: 0o600 },
);
console.log(
  `Exported ${rows.length} saved referral records and the general campaign links to deliverables/audentra-outreach-links.xlsx`,
);
