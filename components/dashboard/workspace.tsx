"use client";
import { ReferralWorkspace } from "./referral-workspace";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { QueryResult, Report, Row } from "@/lib/analytics/report";
import outreach from "@/lib/analytics/outreach.json";
import { campaignUrl, generalCampaigns } from "@/lib/analytics/schema";
const number = (n: number) => new Intl.NumberFormat("en-US").format(n);
const value = (rows: Row[], key: string) =>
  rows.reduce(
    (sum, row) =>
      sum + (typeof row[key] === "number" ? (row[key] as number) : 0),
    0,
  );
const names: Record<string, string> = {
  "morning-brew": "Morning Brew",
  edward: "EDward",
  "action-center": "Action Center",
  "student-experience": "Student Experience",
  "enrollment-readiness": "Enrollment Readiness",
  direct: "Direct / unknown",
  none: "Unattributed",
  unknown: "Unknown / historical",
  "individual-referral": "Individual referral",
  "other-external": "Other external referral",
};
const label = (key: string) =>
  outreach.campaigns.find((c) => c.id === key)?.label || names[key] || key;
function Empty({
  result,
  text = "No activity recorded in this period.",
}: {
  result?: QueryResult;
  text?: string;
}) {
  return (
    <div className={`empty-state ${result?.error ? "unavailable" : ""}`}>
      <span aria-hidden="true">{result?.error ? "◌" : "—"}</span>
      <p>{result?.error || text}</p>
    </div>
  );
}
function Meter({ current, max }: { current: number; max: number }) {
  return (
    <div className="meter">
      <i
        style={{ width: `${max ? Math.min(100, (current / max) * 100) : 0}%` }}
      />
    </div>
  );
}
function Breakdown({
  result,
  dimension,
  unit,
}: {
  result: QueryResult;
  dimension: string;
  unit: string;
}) {
  if (result.error || !result.rows.length) return <Empty result={result} />;
  const max = Math.max(...result.rows.map((r) => Number(r[unit] || 0)), 1);
  return (
    <div className="breakdown">
      {result.rows.slice(0, 8).map((row, i) => (
        <div key={i}>
          <div>
            <span title={String(row[dimension] || "")}>
              {label(String(row[dimension] || "direct"))}
            </span>
            <strong>{number(Number(row[unit] || 0))}</strong>
          </div>
          <Meter current={Number(row[unit] || 0)} max={max} />
        </div>
      ))}
    </div>
  );
}
function Trend({
  result,
  since,
  until,
  firstParty = false,
}: {
  result: QueryResult;
  since: string;
  until: string;
  firstParty?: boolean;
}) {
  const [metric, setMetric] = useState(firstParty ? "sessions" : "pageviews");
  if (result.error) return <Empty result={result} />;
  const start = new Date(since),
    end = new Date(until);
  const points: { date: string; n: number }[] = [];
  for (let day = start.getTime(); day <= end.getTime(); day += 86400000) {
    const date = new Date(day).toISOString().slice(0, 10);
    points.push({
      date,
      n: value(
        result.rows.filter((r) => String(r.timestamp).slice(0, 10) === date),
        metric,
      ),
    });
  }
  const max = Math.max(...points.map((p) => p.n), 1);
  return (
    <>
      <div className="chart-tools">
        <div className="segmented">
          {(firstParty
            ? ["sessions", "engaged", "demos"]
            : ["pageviews", "visitors"]
          ).map((m) => (
            <button
              key={m}
              aria-pressed={metric === m}
              onClick={() => setMetric(m)}
            >
              {
                (
                  {
                    pageviews: "Page views",
                    visitors: "Visitors",
                    sessions: "Sessions",
                    engaged: "Engaged",
                    demos: "Demo requests",
                  } as Record<string, string>
                )[m]
              }
            </button>
          ))}
        </div>
        <small>
          Daily · UTC ·{" "}
          {firstParty ? "Neon · follows filter" : "Vercel · all traffic"}
        </small>
      </div>
      <div
        className="traffic-chart"
        role="img"
        aria-label={`Daily ${metric}: ${points.map((p) => `${p.date}: ${p.n}`).join(", ")}`}
      >
        <div className="chart-axis">
          <span>{number(max)}</span>
          <span>{number(Math.round(max / 2))}</span>
          <span>0</span>
        </div>
        <div className="chart-bars">
          {points.map((p) => (
            <div
              className="chart-bar-wrap"
              key={p.date}
              tabIndex={0}
              aria-label={`${p.date}: ${p.n} ${metric}`}
            >
              <div className="chart-tooltip">
                {p.date}
                <strong>
                  {number(p.n)} {metric}
                </strong>
              </div>
              <i style={{ height: `${(p.n / max) * 100}%` }} />
            </div>
          ))}
        </div>
      </div>
      <div className="chart-dates">
        <span>{points[0]?.date}</span>
        <span>{points.at(-1)?.date}</span>
      </div>
      {!result.rows.length && (
        <small className="chart-note">
          No traffic recorded yet. This chart will populate with real visits.
        </small>
      )}
    </>
  );
}
export function Dashboard({
  clarityUrl,
  vercelUrl,
}: {
  clarityUrl: string;
  vercelUrl: string;
}) {
  const router = useRouter();
  const [days, setDays] = useState(7),
    [dimension, setDimension] = useState("channel"),
    [selected, setSelected] = useState("");
  const [tab, setTab] = useState("overview"),
    [report, setReport] = useState<Report | null>(null),
    [error, setError] = useState(""),
    [loading, setLoading] = useState(true),
    [refresh, setRefresh] = useState(0),
    [copied, setCopied] = useState("");
  useEffect(() => {
    const controller = new AbortController();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    setError("");
    fetch(
      `/api/dashboard?${new URLSearchParams({ days: String(days), dimension, selected })}`,
      { signal: controller.signal },
    )
      .then(async (response) => {
        if (response.status === 401) {
          router.replace("/login");
          return;
        }
        if (!response.ok)
          throw new Error("Could not load reports. Please retry.");
        const data = await response.json();
        if (!controller.signal.aborted) setReport(data);
      })
      .catch((e) => {
        if (e.name !== "AbortError") setError(e.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [days, dimension, selected, refresh, router]);
  const eventCount = (name: string, key = "count") =>
    value(report?.events.rows.filter((r) => r.eventName === name) || [], key);
  const qCount = (name: string, key: string, metric = "count") =>
    value(
      report?.quality[name]?.rows.filter(
        (r) => String(r.eventData || "none") === key,
      ) || [],
      metric,
    );
  const qualityKeys = [
    ...new Set(
      Object.values(report?.quality || {}).flatMap((r) =>
        r.rows.map((row) => String(row.eventData || "none")),
      ),
    ),
  ].sort(
    (a, b) =>
      qCount("demo_submitted", b) - qCount("demo_submitted", a) ||
      qCount("engaged_visit", b) - qCount("engaged_visit", a) ||
      qCount("visit_started", b) - qCount("visit_started", a),
  );
  const sessions = eventCount("visit_started"),
    demos = eventCount("demo_submitted", "requests"),
    converted = eventCount("demo_submitted");
  const unavailable = !!report?.events.error;
  const rate = (n: number, total: number) =>
    total ? `${((n / total) * 100).toFixed(1)}%` : "—";
  async function copy(id: string, url: string) {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(id);
    } catch {
      setCopied("Clipboard unavailable; select the URL.");
    }
  }
  return (
    <div className="insights workspace">
      <aside className="workspace-sidebar">
        <Link href="/" className="dashboard-brand">
          <span className="brand-symbol">a</span>audentra
        </Link>
        <span className="workspace-label">WEBSITE ANALYTICS</span>
        <nav aria-label="Workspace">
          {[
            ["overview", "◫", "Overview"],
            ["outreach", "↗", "Referral links"],
            ["links", "⌁", "Link library"],
          ].map(([id, icon, text]) => (
            <button
              key={id}
              aria-current={tab === id ? "page" : undefined}
              onClick={() => setTab(id)}
            >
              <span>{icon}</span>
              {text}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <a href={vercelUrl} target="_blank" rel="noreferrer">
            Vercel Analytics ↗
          </a>
          <a href={clarityUrl} target="_blank" rel="noreferrer">
            Clarity recordings ↗
          </a>
          <form action="/api/auth/logout" method="post">
            <button>Sign out ↪</button>
          </form>
          <small>PRIVATE TEAM WORKSPACE</small>
        </div>
      </aside>
      <div className="workspace-main">
        <header className="workspace-topbar">
          <span>
            <i className="status-dot" /> audentra.ai / Marketing website
          </span>
          <span className="private-badge">◈ Private</span>
        </header>
        <main className="workspace-content">
          {tab !== "links" && (
            <div className="page-heading">
              <div>
                <h1>
                  {tab === "overview"
                    ? "Audentra website analytics"
                    : "Referral links"}
                </h1>
                {tab === "outreach" && (
                  <p>
                    Create and share unique links to see visits and activity. A
                    link identifies an attributed visit, not necessarily a
                    person.
                  </p>
                )}
              </div>
              {tab === "overview" && (
                <div className="date-controls">
                  <label className="sr-only" htmlFor="date-range">
                    Date range
                  </label>
                  <select
                    id="date-range"
                    value={days}
                    onChange={(e) => setDays(Number(e.target.value))}
                  >
                    <option value={7}>Last 7 days</option>
                    <option value={30}>Last 30 days</option>
                  </select>
                  <button
                    aria-label="Refresh analytics"
                    disabled={loading}
                    onClick={() => setRefresh((x) => x + 1)}
                  >
                    ↻
                  </button>
                </div>
              )}
            </div>
          )}
          {tab === "overview" && (
            <>
              <div className="report-status" role="status">
                {loading
                  ? "Updating reports…"
                  : error ||
                    `Updated ${new Date(report?.fetchedAt || 0).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} · Neon refreshes immediately · Vercel cached 2 minutes · UTC, today partial`}
              </div>
              {error && (
                <button
                  className="small-button"
                  onClick={() => setRefresh((x) => x + 1)}
                >
                  Retry
                </button>
              )}
              {selected && (
                <div className="filter-notice">
                  Neon reports filtered by {dimension}:{" "}
                  <strong>{label(selected)}</strong>. Vercel traffic remains
                  site-wide.
                  <button onClick={() => setSelected("")}>
                    Clear filter ×
                  </button>
                </div>
              )}
              {report && (
                <div
                  className={
                    loading ? "report-content is-loading" : "report-content"
                  }
                  aria-busy={loading}
                >
                  {report.events.error && <Empty result={report.events} />}
                  <section className="metric-grid" aria-label="Key metrics">
                    {[
                      [
                        "Sessions",
                        number(sessions),
                        "Neon · anonymous tab visits with activity",
                      ],
                      [
                        "Engaged sessions",
                        number(eventCount("engaged_visit")),
                        "Neon · 15 focused seconds + interaction",
                      ],
                      [
                        "Demo requests",
                        number(demos),
                        "Neon · accepted submissions, deduplicated",
                      ],
                      [
                        "Demo conversion",
                        rate(converted, sessions),
                        "Neon · sessions with an accepted request",
                      ],
                    ].map(([title, note, detail]) => (
                      <article
                        key={title}
                        className={
                          title === "Demo requests" ? "metric-highlight" : ""
                        }
                      >
                        <span>
                          {title}
                          {selected && " · filtered"}
                        </span>
                        <strong>{unavailable ? "—" : note}</strong>
                        <small>{detail}</small>
                      </article>
                    ))}
                  </section>
                  <div className="table-note">
                    General campaigns, referral links, and direct visits are
                    included. Attribution starts with this release; older
                    referral events retain unknown campaign dimensions. Opt-outs
                    and blockers can reduce counts.
                  </div>
                  <div className="overview-grid">
                    <section className="report-card trend-card">
                      <div className="card-heading">
                        <h2>Activity over time</h2>
                        <span className="subtle-tag">NEON</span>
                      </div>
                      <Trend
                        result={report.firstParty.trend}
                        since={report.since}
                        until={report.until}
                        firstParty
                      />
                    </section>
                    <section className="report-card">
                      <div className="card-heading">
                        <h2>Demo funnel</h2>
                        <span className="subtle-tag">NEON</span>
                      </div>
                      {unavailable ? (
                        <Empty result={report.events} />
                      ) : (
                        <div className="funnel">
                          {[
                            ["visit_started", "Session observed"],
                            ["demo_cta_clicked", "Demo CTA"],
                            ["demo_viewed", "Demo page"],
                            ["demo_form_started", "Form started"],
                            ["demo_submitted", "Request accepted"],
                          ].map(([event, text], i) => (
                            <div key={event}>
                              <span className="step-number">0{i + 1}</span>
                              <div>
                                <div className="funnel-label">
                                  <span>{text}</span>
                                  <strong>{number(eventCount(event))}</strong>
                                </div>
                                <Meter
                                  current={eventCount(event)}
                                  max={Math.max(sessions, eventCount(event))}
                                />
                              </div>
                            </div>
                          ))}
                          <p>
                            Distinct sessions at each milestone within the date
                            range. This is an aggregate funnel, not an ordered
                            cohort. Demo requests above count accepted
                            submissions.
                          </p>
                        </div>
                      )}
                    </section>
                  </div>
                  <section className="report-card outreach-card">
                    <div className="card-heading">
                      <div>
                        <h2>Outreach performance</h2>
                        <p>
                          Neon first-party data. Select a row to inspect its
                          activity and attribution.
                        </p>
                      </div>
                      <label>
                        <span className="sr-only">Group outreach by</span>
                        <select
                          value={dimension}
                          onChange={(e) => {
                            setDimension(e.target.value);
                            setSelected("");
                          }}
                        >
                          {[
                            "channel",
                            "source",
                            "medium",
                            "campaign",
                            "content",
                            "referral",
                          ].map((d) => (
                            <option key={d} value={d}>
                              By {d === "referral" ? "referral code" : d}
                            </option>
                          ))}
                        </select>
                      </label>
                    </div>
                    {Object.values(report.quality).some((r) => r.error) ? (
                      <Empty result={report.events} />
                    ) : (
                      <div className="table-scroll">
                        <table>
                          <thead>
                            <tr>
                              <th>
                                {dimension === "referral"
                                  ? "Referral code"
                                  : dimension}
                              </th>
                              <th>Sessions</th>
                              <th>Engaged</th>
                              <th>Product interest</th>
                              <th>CTA</th>
                              <th>Demo page</th>
                              <th>Form started</th>
                              <th>Demo requests</th>
                              <th>Newsletter</th>
                              <th>Engagement</th>
                              <th>Demo conversion</th>
                            </tr>
                          </thead>
                          <tbody>
                            {qualityKeys.map((key) => (
                              <tr key={key} data-selected={selected === key}>
                                <td>
                                  <button onClick={() => setSelected(key)}>
                                    {label(key)} ↗
                                  </button>
                                </td>
                                <td>{number(qCount("visit_started", key))}</td>
                                {[
                                  "engaged_visit",
                                  "product_interest",
                                  "demo_cta_clicked",
                                  "demo_viewed",
                                  "demo_form_started",
                                ].map((n) => (
                                  <td key={n}>{number(qCount(n, key))}</td>
                                ))}
                                <td>
                                  <strong>
                                    {number(
                                      qCount("demo_submitted", key, "requests"),
                                    )}
                                  </strong>
                                </td>
                                <td>
                                  {number(
                                    qCount(
                                      "newsletter_submitted",
                                      key,
                                      "requests",
                                    ),
                                  )}
                                </td>
                                <td>
                                  {rate(
                                    qCount("engaged_visit", key),
                                    qCount("visit_started", key),
                                  )}
                                </td>
                                <td>
                                  {rate(
                                    qCount("demo_submitted", key),
                                    qCount("visit_started", key),
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        {!qualityKeys.length && (
                          <Empty text="No activity in this period. Share a campaign or referral link to begin." />
                        )}
                      </div>
                    )}
                    <div className="table-note">
                      Engagement, product interest, CTA, and funnel counts
                      represent distinct sessions. Links can be forwarded and
                      scanners can create opens; activity does not conclusively
                      identify a person.
                    </div>
                  </section>
                  {selected && (
                    <section className="report-card">
                      <div className="card-heading">
                        <h2>Captured attribution</h2>
                        <span className="subtle-tag">
                          NEON · UP TO 100 COMBINATIONS
                        </span>
                      </div>
                      {report.firstParty.attribution.error ? (
                        <Empty result={report.firstParty.attribution} />
                      ) : (
                        <div className="table-scroll">
                          <table>
                            <thead>
                              <tr>
                                {[
                                  "Source",
                                  "Medium",
                                  "Campaign",
                                  "Content",
                                  "Channel",
                                  "Referral",
                                  "Sessions",
                                ].map((t) => (
                                  <th key={t}>{t}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {report.firstParty.attribution.rows.map(
                                (r, i) => (
                                  <tr key={i}>
                                    {[
                                      "source",
                                      "medium",
                                      "campaign",
                                      "content",
                                      "channel",
                                      "referral",
                                      "sessions",
                                    ].map((k) => (
                                      <td key={k}>{String(r[k])}</td>
                                    ))}
                                  </tr>
                                ),
                              )}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </section>
                  )}
                  <div className="three-grid">
                    <section className="report-card">
                      <div className="card-heading">
                        <h2>Product interest</h2>
                        <span className="subtle-tag">NEON</span>
                      </div>
                      <Breakdown
                        result={report.products}
                        dimension="eventData"
                        unit="count"
                      />
                      <p className="card-footnote">
                        Distinct sessions per product: links, selected tabs, and
                        page arrivals.
                      </p>
                    </section>
                    <section className="report-card">
                      <div className="card-heading">
                        <h2>Pages explored</h2>
                        <span className="subtle-tag">NEON</span>
                      </div>
                      <Breakdown
                        result={report.firstParty.pages}
                        dimension="requestPath"
                        unit="count"
                      />
                      <p className="card-footnote">
                        Distinct sessions per page, captured from this release.
                        Follows the selected outreach filter.
                      </p>
                    </section>
                    <section className="report-card">
                      <div className="card-heading">
                        <h2>Intent & friction</h2>
                        <span className="subtle-tag">NEON</span>
                      </div>
                      {unavailable ? (
                        <Empty result={report.events} />
                      ) : (
                        <div className="action-metrics">
                          {[
                            ["demo_cta_clicked", "Demo CTA sessions"],
                            ["email_intent", "Email intent"],
                            ["newsletter_started", "Newsletter started"],
                            ["newsletter_submitted", "Newsletter converted"],
                            ["form_error", "Sessions with form failures"],
                          ].map(([key, title]) => (
                            <div key={key}>
                              <span>{title}</span>
                              <strong>{number(eventCount(key))}</strong>
                            </div>
                          ))}
                        </div>
                      )}
                    </section>
                  </div>
                  <section className="report-card">
                    <div className="card-heading">
                      <h2>Site traffic</h2>
                      <span className="subtle-tag">VERCEL · HOBBY</span>
                    </div>
                    {report.traffic.error ? (
                      <Empty result={report.traffic} />
                    ) : (
                      <div className="action-metrics">
                        <div>
                          <span>Visitors · all traffic</span>
                          <strong>
                            {number(value(report.traffic.rows, "visitors"))}
                          </strong>
                        </div>
                        <div>
                          <span>Page views · all traffic</span>
                          <strong>
                            {number(value(report.traffic.rows, "pageviews"))}
                          </strong>
                        </div>
                      </div>
                    )}
                    <Trend
                      result={report.trend}
                      since={report.since}
                      until={report.until}
                    />
                    <p className="card-footnote">
                      Vercel anonymous visitors differ from Neon sessions. These
                      site-wide metrics do not follow outreach filters.
                    </p>
                  </section>
                  <div className="two-grid">
                    <section className="report-card">
                      <div className="card-heading">
                        <h2>Top pages</h2>
                        <span className="subtle-tag">VERCEL · VIEWS</span>
                      </div>
                      <Breakdown
                        result={report.pages}
                        dimension="requestPath"
                        unit="pageviews"
                      />
                    </section>
                    <section className="report-card">
                      <div className="card-heading">
                        <h2>Referring sites</h2>
                        <span className="subtle-tag">VERCEL · VIEWS</span>
                      </div>
                      <Breakdown
                        result={report.referrers}
                        dimension="referrerHostname"
                        unit="pageviews"
                      />
                    </section>
                  </div>
                  <section className="clarity-card">
                    <a href={clarityUrl} target="_blank" rel="noreferrer">
                      Open Microsoft Clarity ↗
                    </a>
                    <p>
                      Use Clarity for consented session recordings and heatmaps.
                      Filter by referral, campaign, source, or custom event to
                      explore the behavior behind a signal.
                    </p>
                  </section>
                  <section className="report-card optional-pro">
                    <div className="card-heading">
                      <div>
                        <h2>Optional Vercel Pro reports</h2>
                        <p>
                          Vendor comparisons only. All core outreach and
                          conversion metrics above work on Hobby with Neon.
                        </p>
                      </div>
                      <span className="subtle-tag">PRO / ENTERPRISE</span>
                    </div>
                    <div className="two-grid">
                      {[
                        ["engaged_visit", "Vercel engaged visits"],
                        ["demo_submitted", "Vercel demo events"],
                      ].map(([event, title]) => (
                        <div key={event}>
                          <h3>{title}</h3>
                          {report.premium.error ? (
                            <Empty result={report.premium} />
                          ) : (
                            <strong>
                              {number(
                                value(
                                  report.premium.rows.filter(
                                    (r) => r.eventName === event,
                                  ),
                                  "count",
                                ),
                              )}
                            </strong>
                          )}
                        </div>
                      ))}
                    </div>
                    <p className="card-footnote">
                      Available automatically with an eligible Vercel plan and
                      configured reporting token. Vendor event counts may differ
                      from server-confirmed Neon conversions.
                    </p>
                  </section>
                </div>
              )}
            </>
          )}
          {tab === "outreach" && (
            <ReferralWorkspace
              inspect={(code) => {
                setDimension("referral");
                setSelected(code);
                setTab("overview");
              }}
            />
          )}
          {tab === "links" && (
            <section className="report-card">
              <div className="card-heading">
                <h1>Approved general campaign links</h1>
              </div>
              <div className="link-grid">
                {generalCampaigns.map((c) => (
                  <article key={c.id}>
                    <div>
                      <h3>{c.label}</h3>
                      <button onClick={() => copy(c.id, campaignUrl(c))}>
                        {copied === c.id ? "Copied ✓" : "Copy link ↗"}
                      </button>
                    </div>
                    <p>
                      {c.source} · {c.medium} · {c.campaign}
                    </p>
                    <code>{campaignUrl(c)}</code>
                  </article>
                ))}
              </div>
              <p className="card-footnote">
                Use these for broad outreach. For an individual introduction,
                create a private record in Referral links. Never add contact
                information to a URL.
              </p>
            </section>
          )}
          <footer className="workspace-footer">
            <span>Audentra website analytics</span>
            <span>Neon outreach · Vercel traffic · Clarity behavior</span>
          </footer>
        </main>
      </div>
    </div>
  );
}
