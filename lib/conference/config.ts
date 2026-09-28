export const conference = {
  slug: "aacrao-baltimore",
  name: "AACRAO Baltimore",
  path: "/events/aacrao-baltimore",
  url: "https://www.audentra.ai/events/aacrao-baltimore",
} as const;
export const offers = {
  coffee: {
    label: "Morning Brew coffee",
    button: "Join us for coffee",
    collection: "your complimentary Morning Brew coffee",
  },
  swag: {
    label: "Audentra swag",
    button: "Count me in",
    collection: "a complimentary Audentra swag item",
  },
  both: {
    label: "Coffee or swag",
    button: "Count me in",
    collection: "a complimentary Morning Brew coffee or swag item",
  },
} as const;
export type ConferenceOffer = keyof typeof offers;
export function conferenceOffer(): ConferenceOffer {
  const value = process.env.CONFERENCE_OFFER || "coffee";
  if (!(value in offers)) throw new Error("CONFERENCE_OFFER_INVALID");
  return value as ConferenceOffer;
}
export function conferenceQrUrl(placement: "booth-signage" | "handout") {
  const url = new URL(conference.url);
  url.searchParams.set("utm_source", "aacrao");
  url.searchParams.set("utm_medium", "qr");
  url.searchParams.set("utm_campaign", conference.slug);
  url.searchParams.set("utm_content", placement);
  return url.href;
}
