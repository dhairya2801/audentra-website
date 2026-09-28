import { test } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { parseLead, leadFingerprint } from "../lib/contact/model";
import {
  hubspotConfig,
  hubspotPayload,
  type HubSpotConfig,
} from "../lib/contact/hubspot";
import { emailPayload } from "../lib/contact/delivery";
import {
  conference,
  conferenceQrUrl,
  conferenceOffer,
} from "../lib/conference/config";
import { attributionFromUrl, sanitizedUrl } from "../lib/analytics/schema";
import { browserEvent } from "../lib/analytics/collection";
const config: HubSpotConfig = {
  portal: "52074694",
  form: "22222222-2222-4222-8222-222222222222",
  owner: "123",
  properties: {
    event: "test_event",
    giveaway: "test_giveaway",
    demoRequested: "test_demo",
    submissionId: "test_submission",
    attribution: "test_attribution",
  },
};
function form(demo = false) {
  const f = new FormData();
  for (const [k, v] of Object.entries({
    source: "conference",
    email: "attendee@gmail.com",
    firstName: "CONFERENCE TEST",
    lastName: "Do not contact",
    institution: "TEST",
    submissionId: randomUUID(),
    leadContext: JSON.stringify({ consent: false, page: conference.path }),
  }))
    f.set(k, v);
  if (demo) f.set("demoRequested", "on");
  return f;
}
const request = () => new Request("https://www.audentra.ai/api/contact");
test("conference short form accepts personal email, records event, and never clears prior demo/pilot interests", () => {
  const lead = parseLead(form(), request());
  const payload = hubspotPayload(lead, config, 12345);
  const fields = Object.fromEntries(
    payload.fields.map((f) => [f.name, f.value]),
  );
  assert.equal(lead.conference?.demoRequested, false);
  assert.equal(fields.test_event, "AACRAO Baltimore");
  assert.equal(fields.test_giveaway, "coffee");
  assert.equal(fields.test_demo, undefined);
  assert.equal(fields.audentra_pilot_interest, undefined);
  assert.equal(fields.jobtitle, undefined);
  assert.equal(
    JSON.parse(fields.test_attribution).demo_requested_this_submission,
    false,
  );
  assert.equal(payload.context.pageUri, conference.url);
  assert.equal(payload.context.hutk, undefined);
  assert.deepEqual(payload.legalConsentOptions.consent.communications, []);
  const checked = parseLead(form(true), request());
  assert.equal(
    hubspotPayload(checked, config, 12345).fields.find(
      (f) => f.name === "test_demo",
    )?.value,
    "true",
  );
  assert.notEqual(
    leadFingerprint(lead),
    leadFingerprint({
      ...lead,
      conference: { ...lead.conference!, demoRequested: true },
    }),
  );
  assert.match(emailPayload(lead).subject, /Coffee \/ swag signup/);
  assert.match(emailPayload(checked).subject, /Demo requested/);
});
test("conference destination fails closed and does not reuse the demo form", () => {
  process.env.HUBSPOT_ENABLED = "1";
  process.env.HUBSPOT_ACCESS_TOKEN = "test";
  process.env.HUBSPOT_VERIFIED_PORTAL_ID = "52074694";
  process.env.HUBSPOT_OWNER_ID = "123";
  process.env.HUBSPOT_DEMO_FORM_ID = "11111111-1111-4111-8111-111111111111";
  delete process.env.HUBSPOT_CONFERENCE_FORM_ID;
  assert.throws(() => hubspotConfig("conference"));
  process.env.HUBSPOT_CONFERENCE_FORM_ID = config.form;
  process.env.HUBSPOT_CONFERENCE_PROPERTY_MAP = JSON.stringify(
    config.properties,
  );
  assert.deepEqual(hubspotConfig("conference"), config);
});
test("configurable giveaways use server configuration, not arbitrary browser fields", () => {
  for (const offer of ["coffee", "swag", "both"]) {
    process.env.CONFERENCE_OFFER = offer;
    const f = form();
    f.set("offer", "arbitrary");
    assert.equal(parseLead(f, request()).conference?.offer, offer);
  }
  process.env.CONFERENCE_OFFER = "invalid";
  assert.throws(conferenceOffer);
  delete process.env.CONFERENCE_OFFER;
});
test("both printed QR campaigns survive analytics sanitization and cannot forge a conversion", () => {
  for (const placement of ["booth-signage", "handout"] as const) {
    const url = conferenceQrUrl(placement);
    assert.equal(sanitizedUrl(url), url);
    assert.deepEqual(attributionFromUrl(new URL(url)), {
      source: "aacrao",
      medium: "qr",
      campaign: "aacrao-baltimore",
      content: placement,
      referral: "none",
    });
  }
  assert.equal(
    browserEvent({
      event_name: "conference_submitted",
      visit_id: randomUUID(),
      page: conference.path,
      detail: "none",
    }),
    null,
  );
});
