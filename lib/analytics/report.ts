import "server-only";
import { firstPartyReport } from "./first-party-report";
export type Row = Record<string, string | number | null>;
export type QueryResult = { rows: Row[]; error?: string };
export type Report = {
  since: string;
  until: string;
  fetchedAt: string;
  dimension: string;
  selected: string;
  traffic: QueryResult;
  trend: QueryResult;
  pages: QueryResult;
  referrers: QueryResult;
  events: QueryResult;
  products: QueryResult;
  quality: Record<string, QueryResult>;
  premium: QueryResult;
  firstParty: {
    summary: QueryResult;
    trend: QueryResult;
    pages: QueryResult;
    attribution: QueryResult;
  };
};
export function parseRows(payload: unknown): Row[] {
  if (!payload || typeof payload !== "object" || !("data" in payload))
    throw new Error("Unexpected API response");
  const data = (payload as { data: unknown }).data;
  const rows = Array.isArray(data)
    ? data
    : data && typeof data === "object"
      ? [data]
      : null;
  if (
    !rows ||
    rows.some(
      (r) =>
        !r ||
        typeof r !== "object" ||
        !["pageviews", "count", "visitors"].some(
          (k) => typeof r[k] === "number",
        ),
    )
  )
    throw new Error("Unexpected API response");
  return rows as Row[];
}
async function query(
  dataset: "visits" | "events",
  since: string,
  until: string,
  by: string,
  extra = "",
): Promise<QueryResult> {
  if (!process.env.ANALYTICS_VERCEL_TOKEN || !process.env.ANALYTICS_PROJECT_ID)
    return {
      rows: [],
      error:
        "Connect Vercel: set ANALYTICS_VERCEL_TOKEN and ANALYTICS_PROJECT_ID on this dashboard project.",
    };
  const params = new URLSearchParams({
    projectId: process.env.ANALYTICS_PROJECT_ID,
    since,
    until,
    by,
    limit: "100",
    filter: `environment eq 'production'${extra ? ` and (${extra})` : ""}`,
  });
  if (process.env.ANALYTICS_TEAM_ID)
    params.set("teamId", process.env.ANALYTICS_TEAM_ID);
  try {
    const response = await fetch(
      `https://api.vercel.com/v1/query/web-analytics/${dataset}/aggregate?${params}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.ANALYTICS_VERCEL_TOKEN}`,
        },
        next: { revalidate: 120 },
        signal: AbortSignal.timeout(10000),
      },
    );
    if (!response.ok) {
      const errors: Record<number, string> = {
        401: "The Vercel analytics token needs to be renewed.",
        402: "This report requires a Vercel plan with custom events (Pro or Enterprise).",
        403: "Vercel denied access. Check token scope, project access, and Web Analytics plan.",
        429: "Vercel is rate limiting reports. Please retry shortly.",
        400: "Vercel could not query this report. Check the reporting window and project configuration.",
      };
      return {
        rows: [],
        error:
          errors[response.status] ||
          `Vercel report unavailable (HTTP ${response.status}).`,
      };
    }
    return { rows: parseRows(await response.json()) };
  } catch {
    return {
      rows: [],
      error:
        "Vercel did not return a usable report. Retry shortly; no data has been replaced with sample values.",
    };
  }
}
export async function getReport(
  days: number,
  dimension: string,
  selected = "",
): Promise<Report> {
  const now = new Date(),
    end = new Date(now);

  const start = new Date(now);
  start.setUTCHours(0, 0, 0, 0);
  start.setUTCDate(start.getUTCDate() - days + 1);
  const since = start.toISOString(),
    until = end.toISOString();
  const [neon, traffic, trend, pages, referrers, premium] = await Promise.all([
    firstPartyReport(since, until, dimension, selected),
    query("visits", since, until, "environment"),
    query("visits", since, until, "day"),
    query("visits", since, until, "requestPath"),
    query("visits", since, until, "referrerHostname"),
    // Optional comparison only; no first-party card depends on this paid dataset.
    query("events", since, until, "eventName"),
  ]);
  return {
    since,
    until,
    fetchedAt: now.toISOString(),
    dimension,
    selected,
    traffic,
    trend,
    pages,
    referrers,
    premium,
    ...neon,
  };
}
