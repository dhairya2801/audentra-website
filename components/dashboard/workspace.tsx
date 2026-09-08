"use client";
import { ReferralWorkspace } from "./referral-workspace";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { QueryResult, Report, Row } from "@/lib/analytics/report";
import outreach from "@/lib/analytics/outreach.json";
import { campaignUrl } from "@/lib/analytics/schema";
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
}: {
  result: QueryResult;
  since: string;
  until: string;
}) {
  const [metric, setMetric] = useState("pageviews");
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
          {["pageviews", "visitors"].map((m) => (
            <button
              key={m}
              aria-pressed={metric === m}
              onClick={() => setMetric(m)}
            >
              {m === "pageviews" ? "Page views" : "Visitors"}
            </button>
          ))}
        </div>
        <small>Daily · UTC · All traffic</small>
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
    // Synchronize loading state with the external report request.
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
          throw new Error("Could not load the workspace. Please retry.");
        setReport(await response.json());
      })
      .catch((e) => {
        if (e.name !== "AbortError") setError(e.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [days, dimension, selected, refresh, router]);
  const eventCount = (name: string) =>
    report
      ? value(
          report.events.rows.filter((r) => r.eventName === name),
          "count",
        )
      : 0;
  const eventUnavailable = !report || !!report.events.error;
  const opened = eventCount("visit_started"),
    demos = eventCount("demo_submitted");
  const qualityKeys = [
    ...new Set([
      ...(dimension === "referral" ? outreach.referrals : []),
      ...Object.values(report?.quality || {}).flatMap((r) =>
        r.rows.map((row) => String(row.eventData || "none")),
      ),
    ]),
  ];
  const qCount = (name: string, key: string) =>
    value(
      report?.quality[name]?.rows.filter(
        (r) => String(r.eventData || "none") === key,
      ) || [],
      "count",
    );
  qualityKeys.sort(
    (a, b) =>
      qCount("demo_submitted", b) - qCount("demo_submitted", a) ||
      qCount("engaged_visit", b) - qCount("engaged_visit", a) ||
      qCount("visit_started", b) - qCount("visit_started", a),
  );
  const views = value(report?.traffic.rows || [], "pageviews"),
    previousViews = value(report?.previous.rows || [], "pageviews");
  async function copy(id: string, url: string) {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(id);
    } catch {
      setCopied("Copy unavailable — select the URL below.");
    }
  }
  return (
    <div className="insights workspace">
      <aside className="workspace-sidebar">
        <Link href="/" className="dashboard-brand">
          <span className="brand-symbol">a</span>audentra
        </Link>
        <span className="workspace-label">OUTREACH INTELLIGENCE</span>
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
        <div className="sidebar-note">
          <span className="status-dot" />
          <strong>Signals, with context.</strong>
          <p>
            A link open is a beginning.
            <br />
            Engagement tells the story.
          </p>
        </div>
        <div className="sidebar-bottom">
          <a href={vercelUrl} target="_blank" rel="noreferrer">
            Vercel Analytics <span>↗</span>
          </a>
          <a href={clarityUrl} target="_blank" rel="noreferrer">
            Clarity recordings <span>↗</span>
          </a>
          <form action="/api/auth/logout" method="post">
            <button>
              Sign out <span>↪</span>
            </button>
          </form>
          <small>PRIVATE TEAM WORKSPACE</small>
        </div>
      </aside>
      <div className="workspace-main">
        <header className="workspace-topbar">
          <span>
            <i className="status-dot" /> audentra.ai{" "}
            <span className="topbar-slash">/</span> Marketing website
          </span>
          <span className="private-badge">◈ Private</span>
        </header>
        <main className="workspace-content">
          <div className="page-heading">
            <div>
              <span className="eyebrow">
                {tab === "links"
                  ? "START A CONVERSATION"
                  : "MAKE EVERY CONVERSATION COUNT"}
              </span>
              <h1>
                {tab === "overview"
                  ? "The bigger picture."
                  : tab === "outreach"
                    ? "Where interest begins."
                    : "A link for every introduction."}
              </h1>
              <p>
                {tab === "overview"
                  ? "Who’s finding Audentra. What resonates. What happens next."
                  : tab === "outreach"
                    ? "Compare outreach by the actions it inspires, beyond the first open."
                    : "Approved general campaign links. Manage individual codes in Referral links."}
              </p>
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
                  onClick={() => setRefresh((x) => x + 1)}
                  disabled={loading}
                >
                  ↻
                </button>
              </div>
            )}
          </div>
          {tab === "overview" && (
            <>
              <div className="report-status" role="status">
                {loading
                  ? "Updating reports…"
                  : error ||
                    `Updated ${new Date(report?.fetchedAt || "1970-01-01").toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} · Reports cached for 2 minutes · Current day is partial`}
              </div>
              {error && (
                <button
                  className="primary-button"
                  onClick={() => setRefresh((x) => x + 1)}
                >
                  Retry
                </button>
              )}
              {selected && (
                <div className="filter-notice">
                  Event reports filtered to <strong>{label(selected)}</strong>.
                  Traffic remains site-wide.
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
                  {tab === "overview" && (
                    <>
                      <section className="metric-grid" aria-label="Key metrics">
                        <article>
                          <span>Visitors</span>
                          <strong>
                            {report.traffic.error
                              ? "—"
                              : number(value(report.traffic.rows, "visitors"))}
                          </strong>
                          <small>Vercel anonymous visitors · all traffic</small>
                        </article>
                        <article>
                          <span>Page views</span>
                          <strong>
                            {report.traffic.error ? "—" : number(views)}
                          </strong>
                          <small>
                            {report.previous.error
                              ? "Previous period unavailable"
                              : previousViews
                                ? `${views >= previousViews ? "+" : ""}${Math.round(((views - previousViews) / previousViews) * 100)}% vs previous ${days} days`
                                : "No previous traffic to compare"}
                          </small>
                        </article>
                        <article>
                          <span>Engaged visits {selected && "· filtered"}</span>
                          <strong>
                            {eventUnavailable
                              ? "—"
                              : number(eventCount("engaged_visit"))}
                          </strong>
                          <small>15s visible + active interaction</small>
                        </article>
                        <article className="metric-highlight">
                          <span>Demo requests {selected && "· filtered"}</span>
                          <strong>
                            {eventUnavailable ? "—" : number(demos)}
                          </strong>
                          <small>
                            {!eventUnavailable && opened
                              ? `${((demos / opened) * 100).toFixed(1)}% of tracked visits`
                              : "Accepted by the email provider"}
                          </small>
                        </article>
                      </section>
                      <div className="overview-grid">
                        <section className="report-card trend-card">
                          <div className="card-heading">
                            <div>
                              <span className="eyebrow">MOMENTUM</span>
                              <h2>Traffic over time</h2>
                            </div>
                            <span className="subtle-tag">ALL TRAFFIC</span>
                          </div>
                          <Trend
                            result={report.trend}
                            since={report.since}
                            until={report.until}
                          />
                        </section>
                        <section className="report-card">
                          <div className="card-heading">
                            <div>
                              <span className="eyebrow">
                                FROM VISIT TO CONVERSATION
                              </span>
                              <h2>Walkthrough funnel</h2>
                            </div>
                          </div>
                          {report.events.error ? (
                            <Empty result={report.events} />
                          ) : (
                            <div className="funnel">
                              {[
                                ["visit_started", "Visit opened"],
                                ["demo_viewed", "Walkthrough page"],
                                ["demo_form_started", "Form started"],
                                ["demo_submitted", "Request accepted"],
                              ].map(([event, text], i) => (
                                <div key={event}>
                                  <span className="step-number">0{i + 1}</span>
                                  <div>
                                    <div className="funnel-label">
                                      <span>{text}</span>
                                      <strong>
                                        {number(eventCount(event))}
                                      </strong>
                                    </div>
                                    <Meter
                                      current={eventCount(event)}
                                      max={Math.max(opened, eventCount(event))}
                                    />
                                  </div>
                                </div>
                              ))}
                              <p>
                                Milestones counted once per tab visit. Counts
                                can cross date boundaries; this is not a
                                visitor-level cohort funnel.
                              </p>
                            </div>
                          )}
                        </section>
                      </div>
                      <div className="three-grid">
                        <section className="report-card">
                          <div className="card-heading">
                            <div>
                              <span className="eyebrow">WHAT RESONATES</span>
                              <h2>Product interest</h2>
                            </div>
                          </div>
                          <Breakdown
                            result={report.products}
                            dimension="eventData"
                            unit="count"
                          />
                          <p className="card-footnote">
                            Explicit product links, selected tabs, and product
                            page arrivals. Once per product per visit.
                          </p>
                        </section>
                        <section className="report-card">
                          <div className="card-heading">
                            <div>
                              <span className="eyebrow">CONTENT</span>
                              <h2>Top pages</h2>
                            </div>
                            <small>Views</small>
                          </div>
                          <Breakdown
                            result={report.pages}
                            dimension="requestPath"
                            unit="pageviews"
                          />
                        </section>
                        <section className="report-card">
                          <div className="card-heading">
                            <div>
                              <span className="eyebrow">DISCOVERY</span>
                              <h2>Referring sites</h2>
                            </div>
                            <small>Views</small>
                          </div>
                          <Breakdown
                            result={report.referrers}
                            dimension="referrerHostname"
                            unit="pageviews"
                          />
                        </section>
                      </div>
                    </>
                  )}
                  <section className="report-card outreach-card">
                    <div className="card-heading">
                      <div>
                        <span className="eyebrow">QUALITY OVER VOLUME</span>
                        <h2>Outreach performance</h2>
                        <p>
                          Ranked by demo requests, then engaged visits. Select a
                          row to inspect its event reports.
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
                          <option value="channel">By channel</option>
                          <option value="campaign">By campaign</option>
                          <option value="referral">By referral code</option>
                        </select>
                      </label>
                    </div>
                    {Object.values(report.quality).some((r) => r.error) ? (
                      <Empty
                        result={Object.values(report.quality).find(
                          (r) => r.error,
                        )}
                      />
                    ) : (
                      <div className="table-scroll">
                        <table>
                          <thead>
                            <tr>
                              <th>
                                {dimension === "referral"
                                  ? "Referral code"
                                  : dimension === "campaign"
                                    ? "Campaign"
                                    : "Channel"}
                              </th>
                              <th>Opened</th>
                              <th>Engaged</th>
                              <th>Demo page</th>
                              <th>Demo requests</th>
                              <th>Newsletter</th>
                              <th>Engagement rate</th>
                            </tr>
                          </thead>
                          <tbody>
                            {qualityKeys.map((key) => {
                              const visits = qCount("visit_started", key),
                                engaged = qCount("engaged_visit", key);
                              return (
                                <tr key={key} data-selected={selected === key}>
                                  <td>
                                    <button
                                      disabled={!/^[a-z0-9-]{1,64}$/.test(key)}
                                      onClick={() => {
                                        setSelected(key);
                                        setTab("overview");
                                      }}
                                    >
                                      {dimension === "referral"
                                        ? key
                                        : label(key)}{" "}
                                      <span>↗</span>
                                    </button>
                                  </td>
                                  <td>{number(visits)}</td>
                                  <td>{number(engaged)}</td>
                                  <td>{number(qCount("demo_viewed", key))}</td>
                                  <td>
                                    <strong>
                                      {number(qCount("demo_submitted", key))}
                                    </strong>
                                  </td>
                                  <td>
                                    {number(
                                      qCount("newsletter_submitted", key),
                                    )}
                                  </td>
                                  <td>
                                    {visits
                                      ? `${((engaged / visits) * 100).toFixed(0)}%`
                                      : "—"}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                        {!qualityKeys.length && (
                          <Empty text="Share a campaign link to start comparing outreach." />
                        )}
                      </div>
                    )}
                    <div className="table-note">
                      <span>ⓘ</span> A unique link identifies the link and
                      attributed visit, not conclusively a person. Forwarded
                      links and scanners can create opens. Engagement is a
                      quality signal, not proof of a human.
                    </div>
                  </section>
                  <div className="two-grid">
                    <section className="report-card">
                      <div className="card-heading">
                        <h2>Intent & friction</h2>
                      </div>
                      {eventUnavailable ? (
                        <Empty result={report.events} />
                      ) : (
                        <div className="action-metrics">
                          {[
                            ["demo_cta_clicked", "Demo CTA engagement"],
                            ["email_intent", "Email intent"],
                            ["newsletter_submitted", "Newsletter requests"],
                            ["form_error", "Form failures"],
                          ].map(([key, text]) => (
                            <div key={key}>
                              <span>{text}</span>
                              <strong>{number(eventCount(key))}</strong>
                            </div>
                          ))}
                        </div>
                      )}
                      <p className="card-footnote">
                        CTA counts are once per placement per visit. Form
                        failures count once per form per visit; no field values
                        or error messages are collected.
                      </p>
                    </section>
                    <section className="clarity-card">
                      <span className="eyebrow">
                        THE STORY BEHIND THE NUMBERS
                      </span>
                      <h2>
                        See where curiosity
                        <br />
                        turns into hesitation.
                      </h2>
                      <p>
                        Use Clarity for consented session recordings and
                        heatmaps. Filter by referral, campaign, source, or
                        custom event to explore the behavior behind a signal.
                      </p>
                      <a href={clarityUrl} target="_blank" rel="noreferrer">
                        Open Microsoft Clarity <span>↗</span>
                      </a>
                    </section>
                  </div>
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
            <>
              <div className="link-intro">
                <span>01</span>
                <p>
                  <strong>
                    Campaigns give you context. Codes give you continuity.
                  </strong>
                  <br />
                  Use a general link for a post or campaign. Use one anonymous
                  code per contact; manage the identity mapping and activity in
                  the private Referral links workspace.
                </p>
              </div>
              <section className="report-card">
                <div className="card-heading">
                  <h2>General campaign links</h2>
                  <span className="subtle-tag">
                    {outreach.campaigns.length} CHANNELS
                  </span>
                </div>
                <div className="link-grid">
                  {outreach.campaigns.map((c) => (
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
              </section>
              <div className="methodology">
                <h2>A few useful boundaries</h2>
                <p>
                  Use the approved UTM values in these links. Unknown values are
                  discarded to keep names and email addresses out of analytics.
                  To add general campaigns, update the approved campaign
                  manifest. Individual codes are created in the Referral links
                  workspace. Attribution lasts within a browser tab until 30
                  minutes of inactivity, or a new explicit campaign link
                  arrives.
                </p>
              </div>
            </>
          )}
          <footer className="workspace-footer">
            <span>Audentra · Outreach intelligence</span>
            <span>
              Vercel quantitative analytics + Clarity behavioral analytics
            </span>
          </footer>
        </main>
      </div>
    </div>
  );
}
