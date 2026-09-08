import campaigns from "@/lib/analytics/outreach.json";
export const statuses = [
  "unassigned",
  "not-sent",
  "sent",
  "replied",
  "meeting-booked",
  "closed",
] as const;
export type OutreachStatus = (typeof statuses)[number];
export type Referral = {
  code: string;
  contact_name: string;
  organization: string;
  channel: string;
  campaign: string;
  date_sent: string | null;
  notes: string;
  status: OutreachStatus;
  version: number;
  created_at: string;
  updated_at: string;
  products: string[];
  form_starts: number;
  errors: number;
  demo_views: number;
  visits: number;
  engaged: number;
  cta: number;
  demos: number;
  newsletters: number;
  last_visit: string | null;
  last_activity: string | null;
};
export type ReferralFields = Pick<
  Referral,
  | "contact_name"
  | "organization"
  | "channel"
  | "campaign"
  | "date_sent"
  | "notes"
  | "status"
>;
export const blankReferral: ReferralFields = {
  contact_name: "",
  organization: "",
  channel: "none",
  campaign: "none",
  date_sent: null,
  notes: "",
  status: "unassigned",
};
export function validateReferral(input: unknown): ReferralFields | null {
  if (!input || typeof input !== "object") return null;
  const v = input as Record<string, unknown>;
  for (const [key, max] of [
    ["contact_name", 120],
    ["organization", 160],
    ["notes", 2000],
  ] as const)
    if (typeof v[key] !== "string" || v[key].length > max) return null;
  if (!statuses.includes(v.status as OutreachStatus)) return null;
  if (
    v.channel !== "none" &&
    !campaigns.campaigns.some((c) => c.id === v.channel)
  )
    return null;
  if (
    v.campaign !== "none" &&
    !campaigns.campaigns.some((c) => c.campaign === v.campaign)
  )
    return null;
  const date = v.date_sent === "" || v.date_sent === null ? null : v.date_sent;
  if (
    date !== null &&
    (typeof date !== "string" ||
      !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
      !Number.isFinite(Date.parse(date)) ||
      new Date(date).toISOString().slice(0, 10) !== date)
  )
    return null;
  return {
    contact_name: (v.contact_name as string).trim(),
    organization: (v.organization as string).trim(),
    notes: (v.notes as string).trim(),
    status: v.status as OutreachStatus,
    channel: v.channel as string,
    campaign: v.campaign as string,
    date_sent: date as string | null,
  };
}
export function referralUrl(code: string) {
  return `https://audentra.ai/?r=${code}`;
}
export function safeSpreadsheetCell(value: unknown): string {
  const text = String(value ?? "");
  return /^[\s]*[=+\-@\t\r]/.test(text) ? `'${text}` : text;
}
