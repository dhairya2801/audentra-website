"use client";
import { privacyOptOut } from "../analytics/client";
import { safePath } from "../analytics/schema";
const KEY = "au-lead-context-v1";
type Context = Record<string, string | number>;
let memory: Context | undefined;
export function hubspotConsent() {
  try {
    return (
      !privacyOptOut() &&
      localStorage.getItem("au-analytics-consent") === "granted"
    );
  } catch {
    return false;
  }
}
export function clearLeadContext() {
  memory = undefined;
  try {
    sessionStorage.removeItem(KEY);
  } catch {}
}
export function captureLeadContext(cta?: string) {
  if (!hubspotConsent()) return;
  try {
    memory ||= JSON.parse(sessionStorage.getItem(KEY) || "null") || undefined;
    if (!memory || Date.now() - Number(memory.touched) > 30 * 60000) {
      memory = { touched: Date.now() };
      const page = safePath(location.pathname);
      if (page) memory.landing_page = page;
      const params = new URL(location.href).searchParams;
      for (const key of [
        "utm_source",
        "utm_medium",
        "utm_campaign",
        "utm_content",
        "utm_term",
      ]) {
        const value = params.get(key);
        if (value && value.length <= 120 && /^[a-zA-Z0-9 _.-]+$/.test(value))
          memory[key] = value;
      }
      try {
        memory.referrer = new URL(document.referrer).origin;
      } catch {}
    }
    // First touch stays intact during this tab visit. CTA is the latest origin.
    if (cta) {
      memory.cta = cta;
      memory.cta_page = safePath(location.pathname) || "";
    }
    memory.touched = Date.now();
    sessionStorage.setItem(KEY, JSON.stringify(memory));
  } catch {
    /* Blocked storage must not prevent submitting. */
  }
}
export function leadContextForForm() {
  const page = safePath(location.pathname) || "/demo";
  if (!hubspotConsent()) return JSON.stringify({ page, consent: false });
  captureLeadContext();
  const hutk = document.cookie
    .split("; ")
    .find((c) => c.startsWith("hubspotutk="))
    ?.split("=")[1];
  return JSON.stringify({
    ...memory,
    page,
    consent: true,
    ...(hutk && /^[a-f0-9]{32}$/i.test(hutk) ? { hutk } : {}),
  });
}
