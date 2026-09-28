import { test } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import pg from "pg";
import { contactStore, type Database } from "../lib/contact/store";
import { drainDeliveries, emailPayload } from "../lib/contact/delivery";
import { hubspotPayload, type HubSpotConfig } from "../lib/contact/hubspot";
import type { Lead } from "../lib/contact/model";

test(
  "isolated Postgres: atomic acceptance, concurrency, recoverable delivery and no duplicate conversions",
  { skip: !process.env.TEST_CONTACT_DATABASE_URL },
  async () => {
    const url = new URL(process.env.TEST_CONTACT_DATABASE_URL!);
    assert.ok(
      ["127.0.0.1", "localhost"].includes(url.hostname),
      "Tests must use a disposable local database.",
    );
    const pool = new pg.Pool({ connectionString: url.href });
    const schema = `test_${randomUUID().replaceAll("-", "")}`;
    await pool.query(`CREATE SCHEMA ${schema}`);
    const query: Database["query"] = async (sql, values = []) => {
      const c = await pool.connect();
      try {
        await c.query(`SET search_path TO ${schema}`);
        return (await c.query(sql, values)).rows;
      } finally {
        c.release();
      }
    };
    const db: Database = {
      query,
      transaction: async (queries) => {
        const c = await pool.connect();
        try {
          await c.query("BEGIN");
          await c.query(`SET LOCAL search_path TO ${schema}`);
          for (const [s, v] of queries) await c.query(s, v);
          await c.query("COMMIT");
        } catch (e) {
          await c.query("ROLLBACK");
          throw e;
        } finally {
          c.release();
        }
      },
    };
    const config: HubSpotConfig = {
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
    const lead: Lead = {
      id: randomUUID(),
      source: "product-walkthrough",
      email: "integration-test@example.com",
      firstName: "TEST",
      lastName: "Do not contact",
      institution: "TEST",
      title: "",
      interest: "admissions",
      goal: "TEST",
      pilot: true,
      page: "/demo",
      analytics: {
        visit_id: randomUUID(),
        page: "/demo",
        attribution: {
          source: "direct",
          medium: "none",
          campaign: "none",
          content: "none",
          referral: "none",
        },
      },
    };
    process.env.HUBSPOT_ENABLED = "1";
    process.env.HUBSPOT_VERIFIED_PORTAL_ID = "52074694";
    process.env.HUBSPOT_ACCESS_TOKEN = "test";
    process.env.RESEND_API_KEY = "test";
    process.env.CONTACT_FROM_EMAIL = "test@example.com";
    try {
      await query(
        `CREATE TABLE outreach_referrals(code text PRIMARY KEY); CREATE VIEW public_outreach_referrals AS SELECT code FROM outreach_referrals; CREATE TABLE outreach_events(code text,visit_id uuid,event_name text,page text,detail text,source text,medium text,campaign text,content text,channel text,schema_version int,submission_id uuid UNIQUE);`,
      );
      await query(
        await readFile("scripts/migrations/003-contact-delivery.sql", "utf8"),
      );
      await query(
        await readFile("scripts/migrations/004-conference-leads.sql", "utf8"),
      );
      const store = contactStore(db);
      const jobs = [
        {
          destination: "hubspot" as const,
          config,
          payload: hubspotPayload(lead, config, Date.now()),
        },
        { destination: "email" as const, payload: emailPayload(lead) },
      ];
      await Promise.all(
        Array.from({ length: 8 }, () => store.accept(lead, jobs)),
      );
      assert.equal(
        (await query("SELECT * FROM contact_submissions")).length,
        1,
      );
      assert.equal((await query("SELECT * FROM contact_deliveries")).length, 2);
      assert.equal((await query("SELECT * FROM outreach_events")).length, 1);
      assert.equal(
        JSON.stringify(await query("SELECT * FROM outreach_events")).includes(
          "example.com",
        ),
        false,
      );
      await assert.rejects(
        store.accept({ ...lead, email: "different@example.com" }, jobs),
        /already used/,
      );
      const calls: string[] = [];
      const fetcher: typeof fetch = async (url) => {
        calls.push(String(url));
        return Response.json({});
      };
      await Promise.all(
        Array.from({ length: 5 }, () => drainDeliveries(store, { fetcher })),
      );
      assert.equal(calls.length, 2);
      assert.ok((await store.status(lead.id)).every((r) => r.state === "sent"));
      await store.accept(lead, jobs);
      await drainDeliveries(store, { fetcher });
      assert.equal(calls.length, 2);
      // A later intentional request uses a new ID, even for the same email.
      const repeat = { ...lead, id: randomUUID() };
      await store.accept(repeat, [
        { ...jobs[0], payload: hubspotPayload(repeat, config, Date.now()) },
      ]);
      assert.equal(
        (await query("SELECT * FROM contact_submissions")).length,
        2,
      );
      assert.equal((await query("SELECT * FROM outreach_events")).length, 2);
      let posts = 0;
      await drainDeliveries(store, {
        fetcher: async () => {
          posts++;
          return new Response(null, {
            status: 429,
            headers: { "retry-after": "3600" },
          });
        },
      });
      assert.equal((await store.status(repeat.id))[0].state, "retry");
      await drainDeliveries(store, { fetcher });
      assert.equal(calls.length, 2);
      await query(
        "UPDATE contact_deliveries SET next_attempt_at=now() WHERE submission_id=$1",
        [repeat.id],
      );
      await drainDeliveries(store, {
        fetcher: async () => {
          posts++;
          throw new Error("ambiguous timeout");
        },
      });
      assert.equal((await store.status(repeat.id))[0].state, "uncertain");
      await query(
        "UPDATE contact_deliveries SET next_attempt_at=now() WHERE submission_id=$1",
        [repeat.id],
      );
      await drainDeliveries(store, {
        fetcher: async (url, init) => {
          assert.notEqual(init?.method, "POST");
          assert.match(String(url), /form-integrations/);
          return Response.json({
            results: [
              {
                values: [
                  { name: config.properties.submissionId, value: repeat.id },
                ],
              },
            ],
          });
        },
      });
      assert.equal((await store.status(repeat.id))[0].state, "sent");
      assert.equal(posts, 2);
      // Crash after sending: expired lease reconciles without another POST.
      const crash = { ...lead, id: randomUUID(), analytics: null };
      await store.accept(crash, [jobs[0]]);
      const old = await store.claim(crash.id);
      assert.ok(old);
      await query(
        "UPDATE contact_deliveries SET lease_until=now()-interval '1 minute' WHERE submission_id=$1",
        [crash.id],
      );
      await drainDeliveries(store, {
        fetcher: async (_url, init) => {
          assert.notEqual(init?.method, "POST");
          return Response.json({ results: [] });
        },
      });
      assert.equal((await store.status(crash.id))[0].state, "uncertain");
      await store.finish(old!, { state: "sent", code: "stale_worker" });
      assert.equal((await store.status(crash.id))[0].state, "uncertain");
      // Invalid job rolls back the lead and conversion, avoiding false success.
      const rollback = { ...lead, id: randomUUID() };
      await assert.rejects(
        store.accept(rollback, [
          { destination: "invalid" as "email", payload: {} },
        ]),
      );
      assert.equal(
        (
          await query("SELECT * FROM contact_submissions WHERE id=$1", [
            rollback.id,
          ])
        ).length,
        0,
      );
      // Denied optional analytics still creates durable lead and delivery.
      const denied = { ...lead, id: randomUUID(), analytics: null };
      await store.accept(denied, [jobs[1]]);
      assert.equal(
        (
          await query("SELECT * FROM outreach_events WHERE submission_id=$1", [
            denied.id,
          ])
        ).length,
        0,
      );
      // Newsletter remains email-only, never gets routed into the demo form.
      const newsletter = {
        ...denied,
        id: randomUUID(),
        source: "newsletter" as const,
      };
      await store.accept(newsletter, [
        { destination: "email", payload: emailPayload(newsletter) },
      ]);
      assert.deepEqual(
        (await store.status(newsletter.id)).map((r) => r.destination),
        ["email"],
      );
    } finally {
      await pool.query(`DROP SCHEMA ${schema} CASCADE`);
      await pool.end();
    }
  },
);
