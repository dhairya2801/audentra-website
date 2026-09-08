import outreach from "./outreach.json";

export const paths = [
  "/",
  "/about",
  "/why-audentra",
  "/solutions",
  "/solutions/enrollment-readiness",
  "/platform/morning-brew",
  "/platform/edward",
  "/platform/action-center",
  "/platform/student-experience",
  "/pricing",
  "/pilot",
  "/demo",
  "/trust",
  "/accessibility",
  "/legal/privacy",
  "/legal/terms",
];
export const products = [
  "morning-brew",
  "edward",
  "action-center",
  "student-experience",
  "enrollment-readiness",
];
export const events = [
  "page_viewed",
  "visit_started",
  "engaged_visit",
  "product_interest",
  "demo_cta_clicked",
  "demo_viewed",
  "demo_form_started",
  "demo_submitted",
  "newsletter_started",
  "newsletter_submitted",
  "form_error",
  "email_intent",
] as const;
export type EventName = (typeof events)[number];
export type Attribution = {
  source: string;
  medium: string;
  campaign: string;
  content: string;
  referral: string;
};
export const direct: Attribution = {
  source: "direct",
  medium: "none",
  campaign: "none",
  content: "none",
  referral: "none",
};
export const utmKeys = {
  source: "utm_source",
  medium: "utm_medium",
  campaign: "utm_campaign",
  content: "utm_content",
} as const;
export function safePath(path: string) {
  return paths.includes(path) ? path : null;
}
const resolved = new Map<string, { channel: string; campaign: string }>();
export function registerReferral(
  code: string,
  channel: string,
  campaign: string,
) {
  if (/^[a-f0-9]{6,10}$/.test(code)) resolved.set(code, { channel, campaign });
}
export function safeReferral(value: unknown): string {
  return typeof value === "string" &&
    (outreach.referrals.includes(value) || resolved.has(value))
    ? value
    : "none";
}
export function safeValue(key: keyof typeof utmKeys, value: unknown): string {
  return typeof value === "string" &&
    outreach.campaigns.some((c) => c[key] === value)
    ? value
    : direct[key];
}
export function attributionFromUrl(url: URL, referrer = ""): Attribution {
  const result = {
    ...direct,
    referral: safeReferral(url.searchParams.get("r")),
  };
  for (const key of Object.keys(utmKeys) as (keyof typeof utmKeys)[])
    result[key] = safeValue(key, url.searchParams.get(utmKeys[key]));
  if (result.source === "direct") {
    if (result.referral !== "none") {
      result.source = "individual-referral";
      result.medium = "referral";
    } else
      try {
        const host = new URL(referrer).hostname;
        if (!["audentra.ai", "www.audentra.ai", url.hostname].includes(host)) {
          result.source = /(^|\.)linkedin\.com$/.test(host)
            ? "linkedin"
            : /(^|\.)google\.com$/.test(host)
              ? "google"
              : /(^|\.)(bing\.com)$/.test(host)
                ? "bing"
                : "other-external";
          result.medium = ["google", "bing"].includes(result.source)
            ? "organic"
            : "referral";
        }
      } catch {
        /* No usable referrer. */
      }
  }
  const assigned = resolved.get(result.referral);
  if (assigned && !url.searchParams.has("utm_source")) {
    const channel = outreach.campaigns.find((c) => c.id === assigned.channel);
    if (channel) {
      result.source = channel.source;
      result.medium = channel.medium;
      result.content = channel.content;
    }
    result.campaign = safeValue("campaign", assigned.campaign);
  }
  return result;
}
export function sanitizeAttribution(value: unknown): Attribution {
  if (!value || typeof value !== "object") return { ...direct };
  const v = value as Record<string, unknown>;
  return {
    source: [
      "direct",
      "individual-referral",
      "google",
      "bing",
      "other-external",
    ].includes(String(v.source))
      ? String(v.source)
      : safeValue("source", v.source),
    medium: ["none", "organic", "referral"].includes(String(v.medium))
      ? String(v.medium)
      : safeValue("medium", v.medium),
    campaign: safeValue("campaign", v.campaign),
    content: safeValue("content", v.content),
    referral: safeReferral(v.referral),
  };
}
export function sanitizedUrl(raw: string): string | null {
  try {
    const url = new URL(raw);
    if (!safePath(url.pathname)) return null;
    const clean = new URL(url.origin + url.pathname);
    for (const key of Object.keys(utmKeys) as (keyof typeof utmKeys)[]) {
      const v = url.searchParams.get(utmKeys[key]);
      if (v && safeValue(key, v) === v) clean.searchParams.set(utmKeys[key], v);
    }
    const referral = safeReferral(url.searchParams.get("r"));
    if (referral !== "none") clean.searchParams.set("r", referral);
    return clean.href;
  } catch {
    return null;
  }
}
export function campaignUrl(
  c: (typeof outreach.campaigns)[number],
  referral?: string,
) {
  const url = new URL("https://audentra.ai/");
  for (const key of Object.keys(utmKeys) as (keyof typeof utmKeys)[])
    url.searchParams.set(utmKeys[key], c[key]);
  if (referral && safeReferral(referral) !== "none")
    url.searchParams.set("r", referral);
  return url.href;
}

// Keep historical conventions recognized, while offering only four current links.
export const generalCampaigns = outreach.campaigns
  .filter((c) =>
    ["linkedin-post", "whatsapp", "email-outreach", "founder-network"].includes(
      c.id,
    ),
  )
  .map((c) => ({
    ...c,
    label:
      c.id === "linkedin-post"
        ? "LinkedIn"
        : c.id === "email-outreach"
          ? "Email"
          : c.id === "founder-network"
            ? "Founder Network"
            : c.label,
  }));
