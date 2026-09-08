import "server-only";
import { events } from "./schema";
export type Row = Record<string, string | number | null>;
export type QueryResult = { rows: Row[]; error?: string };
export type Report = {
  since: string;
  until: string;
  fetchedAt: string;
  dimension: string;
  selected: string;
  traffic: QueryResult;
  previous: QueryResult;
  trend: QueryResult;
  pages: QueryResult;
  referrers: QueryResult;
  events: QueryResult;
  products: QueryResult;
  quality: Record<string, QueryResult>;
};
const quote = (s: string) => `'${s.replaceAll("'", "''")}'`;
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
  end.setUTCHours(23, 59, 59, 999);
  const start = new Date(now);
  start.setUTCHours(0, 0, 0, 0);
  start.setUTCDate(start.getUTCDate() - days + 1);
  const previousEnd = new Date(start.getTime() - 1),
    previousStart = new Date(start.getTime() - days * 86400000);
  const since = start.toISOString(),
    until = end.toISOString();
  const segment = selected
    ? `eventData/${dimension} eq ${quote(selected)}`
    : "";
  const eventFilter = (name: string) =>
    `eventName eq ${quote(name)}${segment ? ` and ${segment}` : ""}`;
  const qualityEvents = [
    "visit_started",
    "engaged_visit",
    "demo_viewed",
    "demo_submitted",
    "newsletter_submitted",
  ];
  const queries = await Promise.all([
    query("visits", since, until, "environment"),
    query(
      "visits",
      previousStart.toISOString(),
      previousEnd.toISOString(),
      "environment",
    ),
    query("visits", since, until, "day"),
    query("visits", since, until, "requestPath"),
    query("visits", since, until, "referrerHostname"),
    query(
      "events",
      since,
      until,
      "eventName",
      `eventName in (${events.map(quote).join(",")})${segment ? ` and ${segment}` : ""}`,
    ),
    query(
      "events",
      since,
      until,
      "eventData/detail",
      eventFilter("product_interest"),
    ),
    ...qualityEvents.map((name) =>
      query(
        "events",
        since,
        until,
        `eventData/${dimension}`,
        `eventName eq ${quote(name)}`,
      ),
    ),
  ]);
  return {
    since,
    until,
    fetchedAt: now.toISOString(),
    dimension,
    selected,
    traffic: queries[0],
    previous: queries[1],
    trend: queries[2],
    pages: queries[3],
    referrers: queries[4],
    events: queries[5],
    products: queries[6],
    quality: Object.fromEntries(
      qualityEvents.map((e, i) => [e, queries[7 + i]]),
    ),
  };
}
