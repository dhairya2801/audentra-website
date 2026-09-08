import { dashboardDb } from "@/lib/outreach/db";
import type { QueryResult, Row } from "./report";
export const dimensions = ["channel", "referral"] as const;
export async function firstPartyReport(
  since: string,
  until: string,
  dimension: string,
  selected: string,
) {
  try {
    const sql = dashboardDb();
    const rows = await sql`WITH base AS (
   SELECT *, CASE ${dimension} WHEN 'referral' THEN coalesce(code,'none') ELSE channel END group_key
   FROM outreach_events WHERE received_at >= ${since}::timestamptz AND received_at < ${until}::timestamptz
  ), scoped AS (SELECT * FROM base WHERE ${selected}='' OR group_key=${selected}),
  event_totals AS (SELECT event_name "eventName",count(DISTINCT visit_id)::int count,count(*)::int requests FROM scoped WHERE event_name <> 'visit_started' GROUP BY event_name
   UNION ALL SELECT 'visit_started',count(DISTINCT visit_id)::int,count(DISTINCT visit_id)::int FROM scoped),
  quality_base AS (SELECT * FROM base WHERE ${dimension}<>'referral' OR ${selected}='' OR code=${selected}),
  quality AS (SELECT channel "eventData",event_name "eventName",count(DISTINCT visit_id)::int count,count(*)::int requests FROM quality_base WHERE event_name <> 'visit_started' GROUP BY channel,event_name
   UNION ALL SELECT channel,'visit_started',count(DISTINCT visit_id)::int,count(DISTINCT visit_id)::int FROM quality_base GROUP BY channel),
  product AS (SELECT detail "eventData", count(DISTINCT visit_id)::int count FROM scoped WHERE event_name='product_interest' GROUP BY detail ORDER BY count DESC),
  pages AS (SELECT page "requestPath",count(DISTINCT visit_id)::int count FROM scoped WHERE event_name='page_viewed' GROUP BY page ORDER BY count DESC),
  trend AS (SELECT to_char(received_at AT TIME ZONE 'UTC','YYYY-MM-DD') timestamp,count(DISTINCT visit_id)::int sessions,count(DISTINCT visit_id) FILTER (WHERE event_name='engaged_visit')::int engaged,count(*) FILTER (WHERE event_name='demo_submitted')::int demos FROM scoped GROUP BY 1 ORDER BY 1),
  attribution AS (SELECT source,medium,content,channel,coalesce(code,'none') referral,count(DISTINCT visit_id)::int sessions FROM scoped GROUP BY 1,2,3,4,5 ORDER BY sessions DESC LIMIT 100)
  SELECT jsonb_build_object(
    'referrals',coalesce((SELECT jsonb_agg(r) FROM (SELECT code,contact_name FROM outreach_referrals) r),'[]'::jsonb),
    'events',coalesce((SELECT jsonb_agg(e) FROM event_totals e),'[]'::jsonb),
    'quality',coalesce((SELECT jsonb_agg(q) FROM quality q),'[]'::jsonb),
    'products',coalesce((SELECT jsonb_agg(p) FROM product p),'[]'::jsonb),
    'pages',coalesce((SELECT jsonb_agg(p) FROM pages p),'[]'::jsonb),
    'trend',coalesce((SELECT jsonb_agg(t) FROM trend t),'[]'::jsonb),
    'attribution',coalesce((SELECT jsonb_agg(a) FROM attribution a),'[]'::jsonb),
    'summary',jsonb_build_array(jsonb_build_object('sessions',(SELECT count(DISTINCT visit_id)::int FROM scoped),'legacyEvents',(SELECT count(*)::int FROM scoped WHERE schema_version=1)))) report`;
    const data = rows[0].report as Record<string, Row[]>;
    const quality: Record<string, QueryResult> = {};
    for (const row of data.quality) {
      const name = String(row.eventName);
      (quality[name] ||= { rows: [] }).rows.push(row);
    }
    return {
      events: { rows: data.events },
      products: { rows: data.products },
      quality,
      firstParty: {
        referrals: { rows: data.referrals },
        summary: { rows: data.summary },
        trend: { rows: data.trend },
        pages: { rows: data.pages },
        attribution: { rows: data.attribution },
      },
    };
  } catch {
    const error = {
      rows: [],
      error:
        "First-party analytics unavailable. Retry shortly; check the database migration and connection if this persists.",
    };
    return {
      events: error,
      products: error,
      quality: { visit_started: error },
      firstParty: {
        referrals: error,
        summary: error,
        trend: error,
        pages: error,
        attribution: error,
      },
    };
  }
}
