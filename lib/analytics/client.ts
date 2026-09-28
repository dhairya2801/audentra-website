"use client";
import { channelFor, conversions } from "./collection";
import { track } from "@vercel/analytics";
import {
  attributionFromUrl,
  products,
  safePath,
  sanitizeAttribution,
  registerReferral,
  type Attribution,
  type EventName,
} from "./schema";

declare global {
  interface Window {
    clarity?: ((...args: unknown[]) => void) & { q?: unknown[][] };
  }
}
const KEY = "au-visit-v1";
const IDLE = 30 * 60 * 1000;
type Visit = {
  id: string;
  attribution: Attribution;
  touched: number;
  seen: string[];
};
let memory: Visit | undefined;
let enabled = false;
export function enableTracking(value: boolean) {
  enabled = value;
}
export function privacyOptOut() {
  try {
    return (
      navigator.doNotTrack === "1" ||
      (navigator as Navigator & { globalPrivacyControl?: boolean })
        .globalPrivacyControl === true ||
      localStorage.getItem("au-analytics-consent") === "denied"
    );
  } catch {
    return true;
  }
}
export function visit(rawUrl = location.href): Visit {
  const now = Date.now();
  try {
    if (!memory) {
      const stored = JSON.parse(sessionStorage.getItem(KEY) || "null");
      if (
        stored &&
        typeof stored.touched === "number" &&
        Array.isArray(stored.seen)
      )
        memory = {
          id:
            typeof stored.id === "string" && /^[0-9a-f-]{36}$/.test(stored.id)
              ? stored.id
              : crypto.randomUUID(),
          attribution: sanitizeAttribution(stored.attribution),
          touched: stored.touched,
          seen: stored.seen
            .filter((s: unknown) => typeof s === "string")
            .slice(0, 150),
        };
    }
  } catch {
    /* In-memory attribution still works with storage blocked. */
  }
  const incoming = attributionFromUrl(new URL(rawUrl), document.referrer);
  const explicit =
    incoming.referral !== "none" ||
    incoming.campaign !== "none" ||
    new URL(rawUrl).searchParams.has("utm_source");
  if (
    !memory ||
    now - memory.touched >= IDLE ||
    (explicit &&
      JSON.stringify(incoming) !== JSON.stringify(memory.attribution))
  )
    memory = {
      id: crypto.randomUUID(),
      attribution: incoming,
      touched: now,
      seen: [],
    };
  memory.touched = now;
  save();
  return memory;
}
function save() {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(memory));
  } catch {
    /* Optional storage. */
  }
}
export function clearVisit() {
  memory = undefined;
  try {
    sessionStorage.removeItem(KEY);
  } catch {}
}
export function attributionForForm(): string {
  try {
    return enabled && !privacyOptOut()
      ? JSON.stringify(visit().attribution)
      : "";
  } catch {
    return "";
  }
}
export function analyticsForForm(): string {
  try {
    if (!enabled || privacyOptOut()) return "";
    const v = visit();
    return JSON.stringify({
      tracking: true,
      page: safePath(location.pathname),
      visit_id: v.id,
      attribution: v.attribution,
    });
  } catch {
    return "";
  }
}
export function emit(name: EventName, detail = "", once = true) {
  try {
    if (
      !enabled ||
      privacyOptOut() ||
      !safePath(location.pathname) ||
      document.visibilityState !== "visible"
    )
      return;
    // Only controlled vocabulary; never DOM text, input values, IDs, or error messages.
    const allowedDetails = [
      ...products,
      "header",
      "footer",
      "hero",
      "body",
      "demo",
      "newsletter",
      "conference",
      "tab",
      "page",
      "link",
      "email",
    ];
    const safeDetail =
      name === "page_viewed"
        ? safePath(location.pathname)!
        : allowedDetails.includes(detail)
          ? detail
          : "none";
    const v = visit();
    if (name !== "visit_started" && !v.seen.includes("visit_started:none"))
      emit("visit_started");
    if (name === "demo_form_started" && !v.seen.includes("demo_viewed:none"))
      emit("demo_viewed");
    const key = `${name}:${safeDetail}`;
    if (once && v.seen.includes(key)) return;
    v.seen.push(key);
    save();
    const channel = channelFor(v.attribution);
    if (!conversions.includes(name)) {
      void fetch("/api/analytics/event", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        keepalive: true,
        body: JSON.stringify({
          visit_id: v.id,
          event_name: name,
          page: location.pathname,
          detail: safeDetail,
          attribution: v.attribution,
        }),
      }).catch(() => {});
    }
    // Page reach is first-party only; Vercel already collects automatic page views.
    if (name === "page_viewed") return;
    track(name, {
      ...v.attribution,
      channel,
      page: safePath(location.pathname)!,
      detail: safeDetail,
    });
    window.clarity?.("event", name);
    for (const [key, value] of Object.entries(v.attribution))
      window.clarity?.("set", key, value);
    if (name === "product_interest")
      window.clarity?.("set", "product", safeDetail);
  } catch {
    /* Analytics must never interfere with navigation or forms. */
  }
}

export async function resolveReferral() {
  const initialUrl = location.href;
  try {
    let code = new URL(location.href).searchParams.get("r");
    if (!code) {
      const stored = JSON.parse(sessionStorage.getItem(KEY) || "null");
      if (stored && Date.now() - stored.touched < IDLE)
        code = stored.attribution?.referral;
    }
    if (!code || !/^[a-f0-9]{6,10}$/.test(code)) {
      visit(initialUrl);
      return;
    }
    const response = await fetch(
      `/api/referral?r=${encodeURIComponent(code)}`,
      { signal: AbortSignal.timeout(2500) },
    );
    if (!response.ok) return;
    const data = await response.json();
    if (data.code === code) registerReferral(code, data.channel, data.campaign);
  } catch {
    /* A failed lookup cannot block the page or form. */
  } finally {
    // Capture the entry URL even if navigation occurred during the lookup.
    visit(initialUrl);
  }
}
