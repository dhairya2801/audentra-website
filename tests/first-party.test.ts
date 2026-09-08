import { test } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import {
  browserEvent,
  formAnalytics,
  safeSnapshot,
} from "../lib/analytics/collection";
import {
  campaignUrl,
  generalCampaigns,
  attributionFromUrl,
} from "../lib/analytics/schema";
test("current campaign library has four categories and persists approved UTM snapshots", () => {
  assert.deepEqual(
    generalCampaigns.map((c) => c.label),
    ["LinkedIn", "Email", "WhatsApp", "Founder Network"],
  );
  for (const c of generalCampaigns) {
    const attribution = attributionFromUrl(new URL(campaignUrl(c)));
    const e = browserEvent({
      visit_id: randomUUID(),
      event_name: "visit_started",
      page: "/",
      detail: "none",
      attribution,
    });
    assert.equal(e?.attribution.source, c.source);
    assert.equal(e?.attribution.medium, c.medium);
    assert.equal(e?.attribution.campaign, "none");
    assert.equal(e?.attribution.content, c.content);
    assert.equal(e?.attribution.referral, "none");
  }
});
test("public collector rejects forged conversions, unbounded details, unknown paths and invalid sessions", () => {
  const base = {
    visit_id: randomUUID(),
    event_name: "page_viewed",
    page: "/demo",
    detail: "/demo",
    attribution: { source: "email" },
  };
  assert.ok(browserEvent(base));
  for (const delta of [
    { event_name: "demo_submitted" },
    { event_name: "newsletter_submitted" },
    { detail: "person@school.edu" },
    { page: "/private/person" },
    { visit_id: "a".repeat(36) },
  ])
    assert.equal(browserEvent({ ...base, ...delta }), null);
});
test("form analytics requires opt-in context and drops all PII/unknown metadata", () => {
  const b = {
    visit_id: randomUUID(),
    tracking: true,
    attribution: {
      source: "Jane",
      campaign: "jane@school.edu",
      content: "University Name",
      referral: "f012abcdef",
      name: "Jane",
      email: "jane@school.edu",
    },
  };
  assert.equal(formAnalytics({ ...b, tracking: false }), null);
  const a = formAnalytics(b)!;
  assert.equal(a.attribution.source, "direct");
  assert.equal(a.attribution.campaign, "none");
  assert.equal(a.attribution.content, "none");
  assert.equal(a.attribution.referral, "f012abcdef");
  assert.equal(JSON.stringify(a).includes("Jane"), false);
  assert.equal(JSON.stringify(a).includes("@"), false);
  assert.equal(safeSnapshot(null).referral, "none");
});
