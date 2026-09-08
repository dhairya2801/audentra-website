"use client";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import campaigns from "@/lib/analytics/outreach.json";
import {
  blankReferral,
  referralUrl,
  statuses,
  type Referral,
  type ReferralFields,
} from "@/lib/outreach/shared";
const title = (s: string) => s.replaceAll("-", " ");
const date = (s: string | null) =>
  s
    ? new Date(s).toLocaleString([], {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "No activity yet";
export function ReferralWorkspace({
  inspect,
}: {
  inspect: (code: string) => void;
}) {
  const router = useRouter();
  const [rows, setRows] = useState<Referral[]>([]),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(""),
    [query, setQuery] = useState(""),
    [status, setStatus] = useState("all"),
    [channel, setChannel] = useState("all"),
    [copied, setCopied] = useState("");
  const [editing, setEditing] = useState<Referral | null | undefined>(
      undefined,
    ),
    [fields, setFields] = useState<ReferralFields>(blankReferral),
    [saving, setSaving] = useState(false),
    [saveError, setSaveError] = useState("");
  const dialog = useRef<HTMLDialogElement>(null);
  async function load() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/outreach");
      if (response.status === 401) {
        router.replace("/login");
        return;
      }
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setRows(data.referrals);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Could not load referral records.",
      );
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    // Synchronize the initial database request with loading state.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load(); /* Initial database load; subsequent refreshes are explicit. */ // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    if (editing !== undefined) dialog.current?.showModal();
    else dialog.current?.close();
  }, [editing]);
  function edit(row: Referral | null) {
    setFields(
      row
        ? {
            contact_name: row.contact_name,
            organization: row.organization,
            channel: row.channel,
            campaign: row.campaign,
            date_sent: row.date_sent?.slice(0, 10) || null,
            notes: row.notes,
            status: row.status,
          }
        : { ...blankReferral },
    );
    setSaveError("");
    setEditing(row);
  }
  function field<K extends keyof ReferralFields>(
    key: K,
    value: ReferralFields[K],
  ) {
    setFields((old) => ({ ...old, [key]: value }));
  }
  async function save(e: FormEvent) {
    e.preventDefault();
    if (saving) return;
    setSaving(true);
    setSaveError("");
    try {
      const response = await fetch("/api/outreach", {
        method: editing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...fields,
          ...(editing ? { code: editing.code, version: editing.version } : {}),
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not save.");
      setEditing(undefined);
      await load();
    } catch (e) {
      setSaveError(
        e instanceof Error ? e.message : "Could not save the record.",
      );
    } finally {
      setSaving(false);
    }
  }
  async function copy(code: string) {
    try {
      await navigator.clipboard.writeText(referralUrl(code));
      setCopied(code);
    } catch {
      setCopied("Clipboard unavailable; select the URL in the record editor.");
    }
  }
  const filtered = rows.filter((r) => {
    const needle = query.toLowerCase();
    return (
      (!needle ||
        [r.code, r.contact_name, r.organization, r.notes].some((v) =>
          v.toLowerCase().includes(needle),
        )) &&
      (status === "all" || r.status === status) &&
      (channel === "all" || r.channel === channel)
    );
  });
  return (
    <section className="referral-workspace">
      <div className="referral-intro">
        <button
          className="create-referral"
          onClick={() => edit(null)}
          disabled={!!error || loading}
        >
          ＋ New referral link
        </button>
      </div>
      <div className="referral-summary">
        <div>
          <strong>{rows.length}</strong>
          <span>Referral links</span>
        </div>
        <div>
          <strong>
            {rows.filter((r) => r.status === "unassigned").length}
          </strong>
          <span>Ready to assign</span>
        </div>
        <div>
          <strong>{rows.reduce((n, r) => n + r.visits, 0)}</strong>
          <span>Recorded visits</span>
        </div>
        <div>
          <strong>
            {rows.filter((r) => r.status === "meeting-booked").length}
          </strong>
          <span>Meetings booked</span>
        </div>
      </div>
      <div className="report-card">
        <div className="referral-toolbar">
          <label>
            <span className="sr-only">Search referrals</span>
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search contact, organization, code, notes…"
            />
          </label>
          <label>
            <span className="sr-only">Outreach status</span>
            <select value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="all">All statuses</option>
              {statuses.map((s) => (
                <option key={s} value={s}>
                  {title(s)}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span className="sr-only">Outreach channel</span>
            <select
              value={channel}
              onChange={(e) => setChannel(e.target.value)}
            >
              <option value="all">All channels</option>
              <option value="none">Unassigned channel</option>
              {campaigns.campaigns.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
          </label>
          <button className="small-button" onClick={load} disabled={loading}>
            ↻ Refresh
          </button>
          <div className="export-buttons">
            <a href="/api/outreach/export?format=csv">CSV ↓</a>
            <a href="/api/outreach/export?format=xlsx">Excel ↓</a>
          </div>
        </div>
        <div className="referral-table-status" role="status">
          {loading
            ? "Loading saved records…"
            : `${filtered.length} of ${rows.length} links · All-time activity · Exports include all records`}
          {copied && (
            <span>{copied.length <= 10 ? `Copied ${copied}` : copied}</span>
          )}
        </div>
        {error ? (
          <div className="empty-state unavailable">
            <p>{error}</p>
            <button className="small-button" onClick={load}>
              Retry connection
            </button>
          </div>
        ) : (
          <div className="table-scroll">
            <table className="referral-table">
              <thead>
                <tr>
                  <th>Contact / referral</th>
                  <th>Channel & campaign</th>
                  <th>Status</th>
                  <th>Sent</th>
                  <th>Visits</th>
                  <th>Engaged</th>
                  <th>CTA</th>
                  <th>Demos</th>
                  <th>Last visit</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr key={r.code}>
                    <td>
                      <button onClick={() => edit(r)} className="contact-cell">
                        <strong>
                          {r.contact_name || "Unassigned contact"}
                        </strong>
                        <span>{r.organization || "No organization"}</span>
                        <code>{r.code}</code>
                      </button>
                    </td>
                    <td>
                      <span>
                        {campaigns.campaigns.find((c) => c.id === r.channel)
                          ?.label || "Not assigned"}
                      </span>
                      <small>
                        {r.campaign === "none" ? "No campaign" : r.campaign}
                      </small>
                    </td>
                    <td>
                      <span className={`outreach-status status-${r.status}`}>
                        {title(r.status)}
                      </span>
                    </td>
                    <td>{r.date_sent?.slice(0, 10) || "—"}</td>
                    <td>{r.visits}</td>
                    <td>{r.engaged}</td>
                    <td>{r.cta}</td>
                    <td>{r.demos}</td>
                    <td>
                      <span title={r.last_visit || undefined}>
                        {date(r.last_visit)}
                      </span>
                    </td>
                    <td>
                      <div className="row-actions">
                        <button
                          onClick={() => copy(r.code)}
                          aria-label={`Copy referral ${r.code}`}
                        >
                          {copied === r.code ? "Copied ✓" : "Copy link"}
                        </button>
                        <button onClick={() => edit(r)}>Edit</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!loading && !filtered.length && (
              <div className="empty-state">
                <p>
                  {rows.length
                    ? "No referrals match these filters."
                    : "Create your first referral link."}
                </p>
              </div>
            )}
          </div>
        )}
        <div className="table-note">
          ⓘ Link activity is recorded in your first-party database,
          independently of Vercel’s custom-event plan. Known previews are
          filtered, but activity does not conclusively identify a human.
          Newsletter and last-activity details are available when you open a
          record.
        </div>
      </div>
      <dialog
        ref={dialog}
        className="referral-dialog"
        onCancel={(e) => {
          if (saving) e.preventDefault();
          else setEditing(undefined);
        }}
      >
        <div className="dialog-heading">
          <div>
            <span className="eyebrow">PRIVATE TEAM RECORD</span>
            <h2>{editing ? "Edit referral" : "Create a referral link"}</h2>
          </div>
          <button
            aria-label="Close referral editor"
            disabled={saving}
            onClick={() => setEditing(undefined)}
          >
            ×
          </button>
        </div>
        {editing && (
          <div className="editor-link">
            <code>{referralUrl(editing.code)}</code>
            <button onClick={() => copy(editing.code)}>
              {copied === editing.code ? "Copied ✓" : "Copy link ↗"}
            </button>
          </div>
        )}
        <form onSubmit={save}>
          <div className="editor-fields">
            <label>
              Contact name
              <input
                value={fields.contact_name}
                onChange={(e) => field("contact_name", e.target.value)}
                maxLength={120}
                autoComplete="off"
              />
            </label>
            <label>
              Organization
              <input
                value={fields.organization}
                onChange={(e) => field("organization", e.target.value)}
                maxLength={160}
                autoComplete="off"
              />
            </label>
            <label>
              Channel / source
              <select
                value={fields.channel}
                onChange={(e) => field("channel", e.target.value)}
              >
                <option value="none">Unassigned</option>
                {campaigns.campaigns.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Campaign (optional)
              <select
                value={fields.campaign}
                onChange={(e) => field("campaign", e.target.value)}
              >
                <option value="none">No campaign</option>
                {[...new Set(campaigns.campaigns.map((c) => c.campaign))].map(
                  (c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ),
                )}
              </select>
            </label>
            <label>
              Date sent
              <input
                type="date"
                value={fields.date_sent || ""}
                onChange={(e) => field("date_sent", e.target.value || null)}
              />
            </label>
            <label>
              Status
              <select
                value={fields.status}
                onChange={(e) =>
                  field("status", e.target.value as ReferralFields["status"])
                }
              >
                {statuses.map((s) => (
                  <option key={s} value={s}>
                    {title(s)}
                  </option>
                ))}
              </select>
            </label>
            <label className="full-field">
              Notes
              <textarea
                value={fields.notes}
                onChange={(e) => field("notes", e.target.value)}
                maxLength={2000}
                rows={4}
              />
            </label>
          </div>
          <p className="editor-privacy">
            Names, organizations, notes, status, and dates stay in this database
            and authenticated exports. The public URL always contains only the
            random code.
          </p>
          {editing && (
            <div className="editor-activity">
              <h3>Activity on this link</h3>
              <p>
                Products explored:{" "}
                {editing.products?.length
                  ? editing.products.map(title).join(", ")
                  : "None recorded"}
              </p>
              <p>
                {editing.demo_views || 0} demo page visits ·{" "}
                {editing.form_starts || 0} form starts · {editing.errors || 0}{" "}
                form failures
              </p>
              <div>
                <span>{editing.visits} visits</span>
                <span>{editing.engaged} engaged</span>
                <span>{editing.cta} CTA visits</span>
                <span>{editing.demos} demo requests</span>
                <span>{editing.newsletters} newsletter requests</span>
              </div>
              <p>Last activity: {date(editing.last_activity)}</p>
              <button
                type="button"
                onClick={() => {
                  setEditing(undefined);
                  inspect(editing.code);
                }}
              >
                Inspect product interest & funnel ↗
              </button>
            </div>
          )}
          {saveError && (
            <p role="alert" className="error-text">
              {saveError}
            </p>
          )}
          <div className="editor-actions">
            <button
              type="button"
              className="small-button"
              disabled={saving}
              onClick={() => setEditing(undefined)}
            >
              Cancel
            </button>
            <button type="submit" className="create-referral" disabled={saving}>
              {saving ? "Saving…" : editing ? "Save changes" : "Generate link"}
            </button>
          </div>
        </form>
      </dialog>
    </section>
  );
}
