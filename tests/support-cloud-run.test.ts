import assert from "node:assert/strict";
import test from "node:test";
import type { NextApiRequest, NextApiResponse } from "next";
import handler from "../pages/api/support";

const reference = "450132e2-1360-437a-ab40-462137cfd772";
const report = {
  reference,
  checkOnly: false,
  portal: "student",
  email: "test@example.test",
  subject: "Synthetic portal issue",
  description: "The upload could not finish.",
};

test("Vercel authenticates the support relay and preserves the backend receipt", async (t) => {
  const settings = {
    VERCEL: "1",
    SUPPORT_CLOUD_RUN_URL: "https://support-example.run.app",
    SUPPORT_GCP_WIF_PROVIDER: "//iam.googleapis.com/projects/123/locations/global/workloadIdentityPools/vercel/providers/website",
    SUPPORT_GCP_INVOKER_EMAIL: "invoker@example-project.iam.gserviceaccount.com",
  };
  const original = Object.fromEntries(Object.keys(settings).map((key) => [key, process.env[key]]));
  Object.assign(process.env, settings);
  t.after(() => {
    for (const [key, value] of Object.entries(original)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  });

  const calls: string[] = [];
  let rejectExchange = false;
  t.mock.method(globalThis, "fetch", async (url: URL | string, init: RequestInit) => {
    const endpoint = new URL(url);
    calls.push(endpoint.origin);
    assert.equal(init.redirect, "error");
    assert.equal(init.method, "POST");
    if (endpoint.hostname === "sts.googleapis.com") {
      const body = JSON.parse(String(init.body));
      assert.equal(body.subjectToken, "test-vercel-token");
      assert.equal(body.audience, settings.SUPPORT_GCP_WIF_PROVIDER);
      return rejectExchange ? new Response(null, { status: 403 }) : Response.json({ access_token: "sts-token" });
    }
    if (endpoint.hostname === "iamcredentials.googleapis.com") {
      assert.match(decodeURIComponent(endpoint.pathname), /invoker@example-project\.iam\.gserviceaccount\.com:generateIdToken$/);
      assert.equal(new Headers(init.headers).get("authorization"), "Bearer sts-token");
      assert.equal(JSON.parse(String(init.body)).audience, settings.SUPPORT_CLOUD_RUN_URL);
      return Response.json({ token: "run-token" });
    }
    assert.equal(endpoint.href, settings.SUPPORT_CLOUD_RUN_URL + "/api/support");
    assert.equal(new Headers(init.headers).get("x-serverless-authorization"), "Bearer run-token");
    assert.equal(new Headers(init.headers).get("x-audentra-support-origin-ip"), "192.0.2.1");
    assert.equal(new Headers(init.headers).get("origin"), null);
    assert.equal(new Headers(init.headers).get("x-vercel-oidc-token"), null);
    assert.equal(JSON.parse(String(init.body)).reference, reference);
    return Response.json({ state: "queued", reference }, { status: 202 });
  });

  async function request(headers: Record<string, string> = {}, body: unknown = report) {
    let status = 0;
    let result: unknown;
    const res = {
      setHeader() {},
      status(value: number) { status = value; return this; },
      json(value: unknown) { result = value; },
      end() {},
    };
    await handler({
      method: "POST",
      headers: {
        host: "www.audentra.ai",
        origin: "https://www.audentra.ai",
        "content-type": "application/json",
        "x-vercel-oidc-token": "test-vercel-token",
        "x-vercel-forwarded-for": "192.0.2.1",
        "x-audentra-support-origin-ip": "198.51.100.1",
        ...headers,
      },
      body,
    } as unknown as NextApiRequest, res as unknown as NextApiResponse);
    return { status, result };
  }

  assert.deepEqual(await request({ origin: "https://elsewhere.example" }), { status: 403, result: undefined });
  assert.equal((await request({}, { ...report, reference: "bad" })).status, 400);
  assert.deepEqual(await request({ "x-vercel-forwarded-for": "" }), { status: 503, result: { state: "retry" } });
  assert.equal(calls.length, 0);
  assert.deepEqual(await request(), { status: 202, result: { state: "queued", reference } });
  assert.equal(calls.length, 3);
  rejectExchange = true;
  assert.deepEqual(await request({}, { ...report, checkOnly: true }), { status: 503, result: { state: "unknown" } });
  assert.equal(calls.length, 4);
});
