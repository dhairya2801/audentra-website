import { test } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { parseLead, leadFingerprint } from "../lib/contact/model";
import {
  assignOwner,
  hubspotConfig,
  hubspotPayload,
  reconcileHubSpot,
  retryAfter,
  sendHubSpot,
  type HubSpotConfig,
} from "../lib/contact/hubspot";
import { POST } from "../app/api/contact/route";

export const config: HubSpotConfig = {
  portal: "52074694",
  form: "11111111-1111-4111-8111-111111111111",
  owner: "123",
  properties: {
    interest: "test_interest",
    goal: "test_goal",
    pilot: "test_pilot",
    submissionId: "test_submission",
    attribution: "test_attribution",
  },
};
function form() {
  const f = new FormData();
  for (const [k, v] of Object.entries({
    source: "product-walkthrough",
    submissionId: randomUUID(),
    email: "HUBSPOT-TEST@example.com",
    firstName: "INTEGRATION TEST",
    lastName: "Do not contact",
    institution: "TEST Institution",
    title: "Tester",
    interest: "financial-aid",
    goal: "TEST request",
    pilot: "on",
  }))
    f.set(k, v);
  return f;
}
const request = (headers: HeadersInit = {}) =>
  new Request("https://www.audentra.ai/api/contact", { headers });
test("maps all demo fields; no blank properties, marketing subscriptions or fabricated identity", () => {
  const f = form();
  f.set("title", "");
  const lead = parseLead(f, request());
  const p = hubspotPayload(lead, config, 12345);
  const fields = Object.fromEntries(p.fields.map((v) => [v.name, v.value]));
  assert.equal(fields.email, "hubspot-test@example.com");
  assert.equal(fields.firstname, "INTEGRATION TEST");
  assert.equal(fields.lastname, "Do not contact");
  assert.equal(fields.company, "TEST Institution");
  assert.equal(fields.test_interest, "financial-aid");
  assert.equal(fields.test_goal, "TEST request");
  assert.equal(fields.test_pilot, "true");
  assert.equal(fields.hubspot_owner_id, undefined);
  assert.equal(fields.test_submission, lead.id);
  assert.equal(fields.jobtitle, undefined);
  assert.equal(fields.test_attribution, undefined);
  assert.equal(p.context.hutk, undefined);
  assert.deepEqual(p.legalConsentOptions.consent.communications, []);
  assert.equal(p.submittedAt, "12345");
});
test("rejects invalid names/email/interest, oversized fields, files, UUID and control characters", () => {
  for (const [key, value] of [
    ["firstName", ""],
    ["email", "bad"],
    ["interest", "not-real"],
    ["goal", "a".repeat(2001)],
    ["submissionId", "not-uuid"],
    ["lastName", "bad\u0000"],
  ]) {
    const f = form();
    f.set(key, value);
    assert.throws(() => parseLead(f, request()));
  }
  const f = form();
  f.set("title", new Blob(["file"]));
  assert.throws(() => parseLead(f, request()));
});
test("opt-out/DNT/GPC discard tracking cookie and campaign; request still valid", () => {
  for (const headers of [{}, { dnt: "1" }, { "sec-gpc": "1" }] as Record<
    string,
    string
  >[]) {
    const f = form();
    f.set(
      "leadContext",
      JSON.stringify({
        consent: Object.keys(headers).length > 0,
        hutk: "a".repeat(32),
        utm_source: "linkedin",
        page: "/demo",
      }),
    );
    const lead = parseLead(f, request(headers));
    assert.equal(lead.hutk, undefined);
    assert.equal(lead.attribution, undefined);
  }
});
test("private attribution is sanitized separately from allowlisted general analytics", () => {
  const f = form();
  f.set(
    "leadContext",
    JSON.stringify({
      consent: true,
      hutk: "a".repeat(32),
      utm_source: "email",
      utm_campaign: "fall-2026",
      utm_content: "test@example.com",
      landing_page: "/pilot",
      page: "/demo",
      cta: "hero",
      cta_page: "/pilot",
      referrer: "https://example.org/private?email=test@example.com#person",
    }),
  );
  f.set(
    "analytics",
    JSON.stringify({
      tracking: true,
      visit_id: randomUUID(),
      page: "/demo",
      attribution: { campaign: "fall-2026", email: "test@example.com" },
    }),
  );
  const lead = parseLead(f, request());
  assert.equal(lead.hutk, "a".repeat(32));
  assert.equal(lead.attribution?.referrer, "https://example.org");
  assert.equal(lead.attribution?.utm_content, undefined);
  assert.equal(lead.attribution?.utm_campaign, "fall-2026");
  assert.equal(lead.attribution?.cta, "hero");
  assert.equal(JSON.stringify(lead.analytics).includes("fall-2026"), false);
  assert.equal(JSON.stringify(lead.analytics).includes("@"), false);
  assert.equal(
    leadFingerprint(lead),
    leadFingerprint({ ...lead, hutk: undefined, attribution: undefined }),
  );
});
test("HubSpot config fails closed without verified destination, form, properties and owner", () => {
  process.env.HUBSPOT_ENABLED = "1";
  delete process.env.HUBSPOT_VERIFIED_PORTAL_ID;
  assert.throws(hubspotConfig);
  process.env.HUBSPOT_VERIFIED_PORTAL_ID = "52074694";
  process.env.HUBSPOT_ACCESS_TOKEN = "mock-server-secret";
  process.env.HUBSPOT_DEMO_FORM_ID = config.form;
  process.env.HUBSPOT_PROPERTY_MAP = JSON.stringify(config.properties);
  delete process.env.HUBSPOT_OWNER_ID;
  assert.throws(hubspotConfig);
  process.env.HUBSPOT_OWNER_ID = "123";
  assert.deepEqual(hubspotConfig(), config);
});
test("HubSpot accepted, rate limited, permanent, 5xx and timeout outcomes are distinct", async () => {
  process.env.HUBSPOT_ENABLED = "1";
  process.env.HUBSPOT_VERIFIED_PORTAL_ID = "52074694";
  process.env.HUBSPOT_ACCESS_TOKEN = "mock-server-secret";
  for (const [status, state] of [
    [200, "sent"],
    [429, "retry"],
    [400, "blocked"],
    [401, "blocked"],
    [403, "blocked"],
    [500, "uncertain"],
  ] as const) {
    const result = await sendHubSpot(config, {}, async (url, init) => {
      assert.equal(
        String(url),
        `https://api.hsforms.com/submissions/v3/integration/secure/submit/52074694/${config.form}`,
      );
      assert.equal(
        (init?.headers as Record<string, string>).Authorization,
        "Bearer mock-server-secret",
      );
      assert.ok(init?.signal);
      return new Response(null, { status, headers: { "retry-after": "300" } });
    });
    assert.equal(result.state, state);
    if (status === 429) assert.equal(result.delay, 300);
  }
  assert.equal(
    (
      await sendHubSpot(config, {}, async () => {
        throw new Error("timeout");
      })
    ).state,
    "uncertain",
  );
  assert.equal(retryAfter("120"), 120);
  assert.equal(retryAfter("bad"), 60);
  delete process.env.HUBSPOT_VERIFIED_PORTAL_ID;
  assert.equal(
    (
      await sendHubSpot(config, {}, async () => {
        assert.fail("must not send");
      })
    ).state,
    "blocked",
  );
});
test("ambiguous POST is reconciled by stable submission field, including pagination", async () => {
  process.env.HUBSPOT_VERIFIED_PORTAL_ID = "52074694";
  const id = randomUUID();
  let calls = 0;
  const found = await reconcileHubSpot(config, id, async (url) => {
    assert.match(String(url), /form-integrations\/v1\/submissions\/forms/);
    if (++calls === 1)
      return Response.json({
        results: [],
        paging: { next: { after: "cursor" } },
      });
    assert.match(String(url), /after=cursor/);
    return Response.json({
      results: [
        { values: [{ name: config.properties.submissionId, value: id }] },
      ],
    });
  });
  assert.equal(found, true);
  assert.equal(calls, 2);
  assert.equal(
    await reconcileHubSpot(
      config,
      id,
      async () => new Response(null, { status: 403 }),
    ),
    false,
  );
});
test("API preserves spam protection, same-origin, bounded bodies and accurate errors", async () => {
  process.env.CONTACT_DELIVERY_MODE = "durable";
  const make = (f: FormData, headers: HeadersInit = {}) =>
    new Request("https://www.audentra.ai/api/contact", {
      method: "POST",
      body: f,
      headers,
    });
  const f = form();
  f.set("website", "spam");
  assert.deepEqual(await (await POST(make(f))).json(), { ok: true });
  assert.equal(
    (
      await POST(
        make(form(), {
          origin: "https://evil.example",
          host: "www.audentra.ai",
        }),
      )
    ).status,
    403,
  );
  const large = form();
  large.set("goal", "x".repeat(17000));
  assert.equal((await POST(make(large))).status, 413);
  const bad = form();
  bad.set("email", "bad");
  assert.equal((await POST(make(bad))).status, 400);
  delete process.env.RESEND_API_KEY;
  process.env.HUBSPOT_ENABLED = "0";
  const result = await POST(make(form()));
  assert.equal(result.status, 503);
  assert.equal((await result.json()).accepted, undefined);
  delete process.env.CONTACT_DELIVERY_MODE;
});

test("ownership uses contact ID, minimal PATCH, and safe retries without repeating a form", async () => {
  process.env.HUBSPOT_ENABLED = "1";
  process.env.HUBSPOT_VERIFIED_PORTAL_ID = "52074694";
  process.env.HUBSPOT_ACCESS_TOKEN = "mock-server-secret";
  let updates = 0;
  const result = await assignOwner(
    config,
    "test@example.com",
    async (url, init) => {
      assert.equal(String(url).includes("test@example.com"), false);
      if (init?.method === "POST") {
        assert.deepEqual(JSON.parse(String(init.body)).inputs, [
          { id: "test@example.com" },
        ]);
        return Response.json({ results: [{ id: "999", properties: {} }] });
      }
      assert.match(String(url), /contacts\/999$/);
      assert.equal(init?.method, "PATCH");
      assert.deepEqual(JSON.parse(String(init.body)), {
        properties: { hubspot_owner_id: "123" },
      });
      updates++;
      return Response.json({ id: "999" });
    },
  );
  assert.equal(result.state, "sent");
  assert.equal(updates, 1);
  let reads = 0;
  let delayedUpdates = 0;
  const delayed = await assignOwner(
    config,
    "test@example.com",
    async (_, init) => {
      if (init?.method === "POST") {
        reads++;
        return Response.json({
          results: reads === 1 ? [] : [{ id: "999", properties: {} }],
        });
      }
      delayedUpdates++;
      return Response.json({ id: "999" });
    },
  );
  assert.equal(delayed.state, "sent");
  assert.equal(reads, 2);
  assert.equal(delayedUpdates, 1);
  assert.equal(
    (
      await assignOwner(config, "test@example.com", async () =>
        Response.json({ results: [] }),
      )
    ).state,
    "retry",
  );
  assert.equal(
    (
      await assignOwner(config, "test@example.com", async () => {
        throw new Error("timeout");
      })
    ).state,
    "retry",
  );
  assert.equal(
    (
      await assignOwner(
        config,
        "test@example.com",
        async () => new Response(null, { status: 403 }),
      )
    ).state,
    "blocked",
  );
  assert.equal(
    (
      await assignOwner(config, "test@example.com", async () =>
        Response.json({
          results: [{ id: "999", properties: { hubspot_owner_id: "123" } }],
        }),
      )
    ).code,
    "owner_already_assigned",
  );
});
