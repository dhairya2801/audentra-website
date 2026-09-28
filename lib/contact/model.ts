import {
  conference,
  conferenceOffer,
  type ConferenceOffer,
} from "../conference/config";
import { createHash, randomUUID } from "node:crypto";
import { formAnalytics, uuid } from "../analytics/collection";
import { safePath } from "../analytics/schema";

export const interests = [
  "enrollment-readiness",
  "enrollment-management",
  "admissions",
  "financial-aid",
  "enrollment-operations",
  "leadership",
  "student-experience",
];
export { processingConsent } from "./model-copy";
export type Lead = {
  id: string;
  source: "newsletter" | "product-walkthrough" | "conference";
  conference?: {
    event: string;
    offer: ConferenceOffer;
    demoRequested: boolean;
  };
  email: string;
  firstName: string;
  lastName: string;
  institution: string;
  title: string;
  interest: string;
  goal: string;
  pilot: boolean;
  page: string;
  attribution?: Record<string, string>;
  hutk?: string;
  analytics: ReturnType<typeof formAnalytics>;
};
export class ContactError extends Error {
  constructor(
    message: string,
    public status = 400,
  ) {
    super(message);
  }
}
function json(raw: FormDataEntryValue | null) {
  try {
    return typeof raw === "string" ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}
export function parseLead(data: FormData, request: Request): Lead {
  const field = (key: string, max: number, multiline = false) => {
    const value = data.get(key);
    if (value !== null && typeof value !== "string")
      throw new ContactError("Invalid form field.");
    const text = (value || "").trim();
    if (
      text.length > max ||
      /[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(text)
    )
      throw new ContactError("A form field is too long or invalid.");
    return multiline ? text : text.replace(/\s+/g, " ");
  };
  const source = field("source", 32);
  if (!["newsletter", "product-walkthrough", "conference"].includes(source))
    throw new ContactError("Invalid form.");
  const email = field("email", 254).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    throw new ContactError("Enter a valid work email address.");
  const firstName = field("firstName", 80),
    lastName = field("lastName", 80),
    institution = field("institution", 160);
  if (source !== "newsletter" && (!firstName || !lastName || !institution))
    throw new ContactError("Complete all required fields.");
  const interest = field("interest", 80);
  if (source === "product-walkthrough" && !interests.includes(interest))
    throw new ContactError("Select a valid area of interest.");
  const id = field("submissionId", 36);
  if (id && !uuid.test(id))
    throw new ContactError(
      "Invalid submission identifier. Reload the form and try again.",
    );
  const optOut =
    request.headers.get("dnt") === "1" ||
    request.headers.get("sec-gpc") === "1";
  const context = json(data.get("leadContext"));
  const allowed = !optOut && context?.consent === true;
  const attribution: Record<string, string> = {};
  if (allowed && context && typeof context === "object") {
    // Private lead context only. These values NEVER enter general analytics.
    for (const key of [
      "utm_source",
      "utm_medium",
      "utm_campaign",
      "utm_content",
      "utm_term",
    ]) {
      const value = context[key];
      if (
        typeof value === "string" &&
        value.length <= 120 &&
        /^[a-zA-Z0-9 _.-]+$/.test(value)
      )
        attribution[key] = value;
    }
    for (const key of ["landing_page", "cta_page"]) {
      if (typeof context[key] === "string" && safePath(context[key]))
        attribution[key] = context[key];
    }
    if (["header", "footer", "hero", "body"].includes(context.cta))
      attribution.cta = context.cta;
    try {
      const ref = new URL(context.referrer);
      if (["http:", "https:"].includes(ref.protocol))
        attribution.referrer = ref.origin;
    } catch {
      /* Referrer is optional; strip paths, credentials, queries and fragments. */
    }
  }
  const page =
    typeof context?.page === "string" && safePath(context.page)
      ? context.page
      : source === "newsletter"
        ? "/"
        : "/demo";
  return {
    id: id || randomUUID(),
    source: source as Lead["source"],
    ...(source === "conference"
      ? {
          conference: {
            event: conference.slug,
            offer: conferenceOffer(),
            demoRequested: data.get("demoRequested") === "on",
          },
        }
      : {}),
    email,
    firstName,
    lastName,
    institution,
    title: field("title", 120),
    interest,
    goal: field("goal", 2000, true),
    pilot: data.get("pilot") === "on",
    page: source === "conference" ? conference.path : page,
    ...(Object.keys(attribution).length ? { attribution } : {}),
    ...(allowed &&
    typeof context.hutk === "string" &&
    /^[a-f0-9]{32}$/i.test(context.hutk)
      ? { hutk: context.hutk }
      : {}),
    analytics: optOut ? null : formAnalytics(json(data.get("analytics"))),
  };
}
export function leadFingerprint(lead: Lead) {
  // Attribution/cookie changes between retries do not create a second request.
  const {
    source,
    email,
    firstName,
    lastName,
    institution,
    title,
    interest,
    goal,
    pilot,
  } = lead;
  return createHash("sha256")
    .update(
      JSON.stringify({
        source,
        email,
        firstName,
        lastName,
        institution,
        title,
        interest,
        goal,
        pilot,
        ...(lead.conference ? { conference: lead.conference } : {}),
      }),
    )
    .digest("hex");
}
