import { test } from "node:test";
import assert from "node:assert/strict";
import { randomBytes, scryptSync } from "node:crypto";
import {
  attributionFromUrl,
  sanitizeAttribution,
  sanitizedUrl,
  campaignUrl,
} from "../lib/analytics/schema";
import outreach from "../lib/analytics/outreach.json";
import {
  authConfigured,
  createSession,
  validPassword,
  validSession,
  SESSION_SECONDS,
} from "../lib/analytics/auth";
import { POST } from "../app/api/contact/route";

test("every generated referral can be captured, alone and with campaigns", () => {
  assert.equal(new Set(outreach.referrals).size, 20);
  for (const r of outreach.referrals) {
    assert.match(r, /^[a-f0-9]{6}$/);
    assert.equal(
      attributionFromUrl(new URL(`https://audentra.ai/?r=${r}`)).referral,
      r,
    );
    const c = outreach.campaigns[1],
      a = attributionFromUrl(new URL(campaignUrl(c, r)));
    assert.equal(a.source, c.source);
    assert.equal(a.referral, r);
  }
});
test("PII, unrecognized codes, and arbitrary URL data are discarded", () => {
  const a = attributionFromUrl(
    new URL(
      "https://audentra.ai/?r=alice&utm_source=alice%40school.edu&utm_content=Alice&email=private%40example.com",
    ),
  );
  assert.equal(a.referral, "none");
  assert.equal(a.source, "direct");
  assert.equal(a.content, "none");
  assert.equal(
    sanitizedUrl("https://audentra.ai/demo?email=private%40example.com#Alice"),
    "https://audentra.ai/demo",
  );
  assert.equal(sanitizedUrl("https://audentra.ai/private/alice"), null);
  assert.equal(
    JSON.stringify(
      sanitizeAttribution({
        source: "Alice",
        name: "Alice",
        referral: "email@example.com",
      }),
    ).includes("Alice"),
    false,
  );
});
test("referrers retain only a controlled source bucket", () => {
  assert.equal(
    attributionFromUrl(
      new URL("https://audentra.ai/"),
      "https://www.google.com/search?q=private",
    ).source,
    "google",
  );
  assert.equal(
    attributionFromUrl(
      new URL("https://audentra.ai/"),
      "https://alice.example.com/private",
    ).source,
    "other-external",
  );
  assert.equal(
    attributionFromUrl(
      new URL("https://audentra.ai/"),
      "https://www.audentra.ai/demo",
    ).source,
    "direct",
  );
});
test("auth fails closed and sessions expire, resist tampering, and rotate with password", () => {
  delete process.env.ANALYTICS_PASSWORD_HASH;
  delete process.env.ANALYTICS_SESSION_SECRET;
  assert.equal(authConfigured(), false);
  assert.equal(validSession("123"), false);
  const salt = randomBytes(16).toString("hex");
  process.env.ANALYTICS_PASSWORD_HASH = `${salt}:${scryptSync("test-password", salt, 64).toString("hex")}`;
  process.env.ANALYTICS_SESSION_SECRET = randomBytes(32).toString("hex");
  assert.equal(validPassword("wrong"), false);
  assert.equal(validPassword("test-password"), true);
  const now = Date.now(),
    session = createSession(now);
  assert.equal(validSession(session, now), true);
  assert.equal(validSession(session, now + SESSION_SECONDS * 1000), false);
  assert.equal(validSession(session.replace(/.$/, "z"), now), false);
  process.env.ANALYTICS_PASSWORD_HASH = `${salt}:${scryptSync("new-password", salt, 64).toString("hex")}`;
  assert.equal(validSession(session, now), false);
});
test("honeypot success is not a confirmed conversion", async () => {
  const f = new FormData();
  f.set("website", "spam");
  const r = await POST(
    new Request("https://audentra.ai/api/contact", { method: "POST", body: f }),
  );
  assert.deepEqual(await r.json(), { ok: true });
});
test("failed form delivery is never accepted; attribution is optional", async () => {
  delete process.env.RESEND_API_KEY;
  delete process.env.CONTACT_FROM_EMAIL;
  const f = new FormData();
  f.set("email", "test@example.com");
  f.set("source", "newsletter");
  f.set("attribution", "not json");
  const r = await POST(
    new Request("https://audentra.ai/api/contact", { method: "POST", body: f }),
  );
  assert.equal(r.status, 503);
  assert.equal((await r.json()).accepted, undefined);
});
test("successful delivery preserves safe attribution and uses idempotency", async () => {
  process.env.RESEND_API_KEY = "test";
  process.env.CONTACT_FROM_EMAIL = "test@example.com";
  const originalFetch = globalThis.fetch;
  let sent: RequestInit | undefined;
  globalThis.fetch = async (_input, init) => {
    sent = init;
    return Response.json({ id: "test" });
  };
  try {
    const f = new FormData();
    f.set("email", "test@example.com");
    f.set("source", "newsletter");
    f.set("submissionId", "65f24c1d-2dc2-42a9-9915-6a9d5a61cf80");
    f.set(
      "attribution",
      JSON.stringify({
        referral: outreach.referrals[0],
        source: "linkedin",
        name: "SHOULD_NOT_COPY",
      }),
    );
    const r = await POST(
      new Request("https://audentra.ai/api/contact", {
        method: "POST",
        body: f,
      }),
    );
    assert.equal((await r.json()).accepted, true);
    assert.ok(String(sent?.body).includes(outreach.referrals[0]));
    assert.equal(String(sent?.body).includes("SHOULD_NOT_COPY"), false);
    assert.ok((sent?.headers as Record<string, string>)["Idempotency-Key"]);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
