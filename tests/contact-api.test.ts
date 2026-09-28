import { test } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import pg from "pg";

test(
  "actual Next route + Postgres, mocked providers: acceptance, after worker, duplicate retry and cron reconciliation",
  { skip: !process.env.TEST_CONTACT_API },
  async () => {
    const base = process.env.TEST_CONTACT_API!;
    assert.equal(new URL(base).hostname, "localhost");
    const dbUrl = new URL(process.env.TEST_CONTACT_DATABASE_URL!);
    assert.ok(["localhost", "127.0.0.1"].includes(dbUrl.hostname));
    const pool = new pg.Pool({ connectionString: dbUrl.href });
    const ids: string[] = [];
    async function send(
      id: string,
      goal = "TEST",
      email = "hubspot-test@example.com",
    ) {
      const f = new FormData();
      for (const [k, v] of Object.entries({
        submissionId: id,
        source: "product-walkthrough",
        firstName: "HUBSPOT TEST",
        lastName: "Do not contact",
        institution: "TEST",
        email,
        interest: "admissions",
        goal,
        pilot: "on",
        leadContext: JSON.stringify({ consent: false, page: "/demo" }),
        analytics: JSON.stringify({
          tracking: true,
          visit_id: randomUUID(),
          page: "/demo",
          attribution: {},
        }),
      }))
        f.set(k, v);
      return fetch(`${base}/api/contact`, {
        method: "POST",
        body: f,
        headers: { Origin: base },
      });
    }
    async function delivered(
      id: string,
      state: string,
      destination = "hubspot",
      polls = 50,
    ) {
      for (let i = 0; i < polls; i++) {
        const r = await pool.query(
          "SELECT state FROM contact_deliveries WHERE submission_id=$1 AND destination=$2",
          [id, destination],
        );
        if (r.rows[0]?.state === state) return;
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
      assert.fail(`Delivery did not reach ${state}`);
    }
    try {
      const id = randomUUID();
      ids.push(id);
      const response = await send(id);
      assert.equal(response.status, 202);
      assert.equal((await response.json()).delivery, "queued");
      await delivered(id, "sent");
      await delivered(id, "sent", "owner");
      const retries = await Promise.all([send(id), send(id), send(id)]);
      assert.ok(retries.every((r) => r.status === 202));
      assert.equal((await send(id, "CHANGED")).status, 409);
      const conversion = await pool.query(
        "SELECT count(*) FROM outreach_events WHERE submission_id=$1",
        [id],
      );
      assert.equal(Number(conversion.rows[0].count), 1);
      const sent = await pool.query(
        "SELECT payload FROM test_provider_calls WHERE destination='hubspot' AND payload->'fields' @> $1::jsonb",
        [JSON.stringify([{ name: "test_submission", value: id }])],
      );
      assert.equal(sent.rows.length, 1);
      assert.equal(sent.rows[0].payload.context.hutk, undefined);
      const repeat = randomUUID();
      ids.push(repeat);
      assert.equal((await send(repeat)).status, 202);
      await delivered(repeat, "sent");
      await delivered(repeat, "sent", "owner");
      const timeout = randomUUID();
      ids.push(timeout);
      assert.equal((await send(timeout, "TEST_TIMEOUT")).status, 202);
      await delivered(timeout, "uncertain");
      await delivered(timeout, "pending", "owner");
      assert.equal((await fetch(`${base}/api/contact/delivery`)).status, 401);
      await pool.query(
        "UPDATE contact_deliveries SET next_attempt_at=now() WHERE submission_id=$1",
        [timeout],
      );
      assert.equal(
        (
          await fetch(`${base}/api/contact/delivery`, {
            headers: { Authorization: "Bearer local-cron-test-only" },
          })
        ).status,
        200,
      );
      await delivered(timeout, "sent");
      await delivered(timeout, "sent", "owner");
      const ambiguous = await pool.query(
        "SELECT count(*) FROM test_provider_calls WHERE destination='hubspot' AND payload->'fields' @> $1::jsonb",
        [JSON.stringify([{ name: "test_submission", value: timeout }])],
      );
      assert.equal(Number(ambiguous.rows[0].count), 1);
      const slow = randomUUID();
      ids.push(slow);
      assert.equal((await send(slow, "TEST_SLOW_DELIVERY")).status, 202);
      await delivered(slow, "sent", "owner", 150);
      const slowJobs = await pool.query(
        "SELECT state,attempts FROM contact_deliveries WHERE submission_id=$1",
        [slow],
      );
      assert.equal(slowJobs.rows.length, 3);
      assert.ok(
        slowJobs.rows.every(
          (job) => job.state === "sent" && job.attempts === 1,
        ),
      );
    } finally {
      for (const id of ids) {
        await pool.query(
          "DELETE FROM contact_deliveries WHERE submission_id=$1",
          [id],
        );
        await pool.query("DELETE FROM contact_submissions WHERE id=$1", [id]);
        await pool.query("DELETE FROM outreach_events WHERE submission_id=$1", [
          id,
        ]);
      }
      await pool.end();
    }
  },
);
