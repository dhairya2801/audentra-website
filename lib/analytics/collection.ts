import {
  sanitizeAttribution,
  safePath,
  products,
  events,
  type Attribution,
  type EventName,
} from "./schema";
import outreach from "./outreach.json";
export const uuid =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export const conversions = [
  "demo_submitted",
  "newsletter_submitted",
  "conference_submitted",
];
export const botPattern =
  /bot|crawler|spider|preview|headless|facebookexternalhit|slackbot|linkedinbot/i;
export function channelFor(a: Attribution) {
  return (
    outreach.campaigns.find(
      (c) =>
        c.source === a.source &&
        c.medium === a.medium &&
        c.content === a.content,
    )?.id || a.source
  );
}
export function safeSnapshot(value: unknown): Attribution {
  const a = sanitizeAttribution(value);
  const raw =
    value && typeof value === "object"
      ? (value as Record<string, unknown>)
      : {};
  // A code is opaque. Database insertion resolves existence without exposing private fields.
  return {
    ...a,
    referral:
      typeof raw.referral === "string" && /^[a-f0-9]{6,10}$/.test(raw.referral)
        ? raw.referral
        : "none",
  };
}
export type CollectedEvent = {
  visit_id: string;
  event_name: EventName;
  page: string;
  detail: string;
  attribution: Attribution;
  submission_id?: string;
};
export function browserEvent(raw: unknown): CollectedEvent | null {
  if (!raw || typeof raw !== "object") return null;
  const b = raw as Record<string, unknown>;
  if (
    typeof b.visit_id !== "string" ||
    !uuid.test(b.visit_id) ||
    !events.includes(b.event_name as EventName) ||
    conversions.includes(String(b.event_name)) ||
    typeof b.page !== "string" ||
    !safePath(b.page)
  )
    return null;
  const name = b.event_name as EventName;
  const allowed =
    name === "page_viewed"
      ? [b.page]
      : name === "product_interest"
        ? products
        : name === "demo_cta_clicked"
          ? ["header", "footer", "hero", "body"]
          : name === "form_error"
            ? ["demo", "newsletter", "conference"]
            : name === "email_intent"
              ? ["email"]
              : ["none"];
  if (typeof b.detail !== "string" || !allowed.includes(b.detail)) return null;
  // Compatibility with cached version-one clients: only their code was collected.
  const attribution = b.attribution
    ? safeSnapshot(b.attribution)
    : safeSnapshot({
        referral: b.code,
        source: "individual-referral",
        medium: "referral",
      });
  return {
    visit_id: b.visit_id,
    event_name: name,
    page: b.page,
    detail: b.detail,
    attribution,
  };
}
export function formAnalytics(
  raw: unknown,
): { visit_id: string; attribution: Attribution; page: string | null } | null {
  if (!raw || typeof raw !== "object") return null;
  const b = raw as Record<string, unknown>;
  if (
    b.tracking !== true ||
    typeof b.visit_id !== "string" ||
    !uuid.test(b.visit_id)
  )
    return null;
  return {
    visit_id: b.visit_id,
    attribution: safeSnapshot(b.attribution),
    page: typeof b.page === "string" ? safePath(b.page) : null,
  };
}
