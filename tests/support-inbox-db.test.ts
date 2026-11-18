import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { spawnSync } from "node:child_process";
import { Pool } from "pg";
import { readFile } from "node:fs/promises";
import { accept, deliver, deliverNotification } from "../lib/support/inbox";
// Point SUPPORT_TEST_DATABASE_URL at a disposable PostgreSQL database; isolate every run.
test(
  "committed receipts survive process exit and ambiguous provider responses",
  { skip: !process.env.SUPPORT_TEST_DATABASE_URL },
  async () => {
    const url = new URL(process.env.SUPPORT_TEST_DATABASE_URL!);
    const admin = new Pool({ connectionString: url.href });
    const schema = "test_support_" + randomUUID().replaceAll("-", "");
    await admin.query("CREATE SCHEMA " + schema);
    url.searchParams.set("options", "-c search_path=" + schema);
    const db = new Pool({ connectionString: url.href });
    Object.assign(process.env, {
      SUPPORT_DATABASE_URL: url.href,
      JIRA_SITE: "https://example.atlassian.net",
      JIRA_EMAIL: "test@example.test",
      JIRA_API_TOKEN: "test",
      JIRA_PROJECT_KEY: "TECH",
      JIRA_ISSUE_TYPE_ID: "10048",
      SLACK_WEBHOOK_URL: "https://hooks.slack.com/services/test/test/test",
    });
    try {
      await db.query(
        await readFile("scripts/migrations/005-support-inbox.sql", "utf8"),
      );
      const report = {
        portal: "staff",
        email: "test@example.test",
        subject: "restart",
        description: "synthetic",
        reference: randomUUID(),
        checkOnly: false,
      };
      const denied = { ...report, reference: randomUUID() };
      assert.equal((await accept(denied))?.status, 202);
      const originalFetch = globalThis.fetch;
      let deniedCreates = 0;
      let searches = 0;
      process.env.CRON_SECRET = "local-review";
      try {
        globalThis.fetch = async (url) => {
          if (String(url).endsWith("search/jql")) {
            searches++;
            return Response.json({ issues: [] });
          }
          assert.ok(String(url).endsWith("/issue"));
          deniedCreates++;
          return new Response(null, { status: 403 });
        };
        const { GET } = await import("../app/api/support/delivery/route");
        const response = await GET(
          new Request("http://localhost/api/support/delivery", {
            headers: { authorization: "Bearer local-review" },
          }),
        );
        assert.equal(response.status, 503);
        assert.equal(deniedCreates, 1);
        assert.ok(searches >= 2);
        assert.deepEqual(await response.json(), {
          found: 0,
          delivered: 0,
          jiraPending: 1,
        });
        const stored = await db.query(
          "SELECT report,jira_key FROM audentra_support_inbox WHERE reference=$1",
          [denied.reference],
        );
        assert.equal(stored.rows[0].report.reference, denied.reference);
        assert.equal(stored.rows[0].jira_key, null);
      } finally {
        globalThis.fetch = originalFetch;
        await db.query(
          "DELETE FROM audentra_support_inbox WHERE reference=$1",
          [denied.reference],
        );
      }
      const child = spawnSync(
        process.execPath,
        [
          "--import",
          "tsx",
          "-e",
          "require('./lib/support/inbox.ts').accept(JSON.parse(process.argv[1])).then(r=>process.exit(r.status===202?0:1)).catch(()=>process.exit(2))",
          JSON.stringify(report),
        ],
        { timeout: 15000 },
      );
      assert.equal(child.status, 0, child.stderr?.toString());
      const concurrent = await Promise.all(
        Array.from({ length: 12 }, () => accept(report)),
      );
      assert.ok(concurrent.every((x) => x?.status === 202));
      assert.equal(
        (await accept({ ...report, subject: "different" }))?.status,
        409,
      );
      let creates = 0,
        posts = 0,
        clears = 0;
      const send: typeof fetch = async (input, init) => {
        const u = String(input);
        if (u.endsWith("search/jql"))
          return Response.json({ issues: creates ? [{ key: "TECH-42" }] : [] });
        if (u.endsWith("/issue")) {
          creates++;
          throw new TypeError("simulated lost response after Jira commit");
        }
        if (u.includes("hooks.slack.com")) {
          posts++;
          return new Response("ok");
        }
        if (init?.method === "PUT")
          return new Response(null, { status: ++clears === 1 ? 503 : 204 });
        throw Error("unexpected URL");
      };
      await Promise.all(
        Array.from({ length: 5 }, () => deliver(report.reference, send)),
      );
      assert.equal(creates, 1);
      assert.equal(posts, 0);
      await db.query("UPDATE audentra_support_inbox SET due=now()");
      await deliver(report.reference, send);
      assert.equal(creates, 1);
      assert.equal(posts, 1);
      await db.query("UPDATE audentra_support_inbox SET due=now()");
      await deliverNotification(report.reference, send);
      assert.equal(posts, 1);
      assert.equal(clears, 2);
      assert.deepEqual(
        (
          await db.query(
            "SELECT jira_key,notified,report FROM audentra_support_inbox",
          )
        ).rows,
        [{ jira_key: "TECH-42", notified: true, report: null }],
      );
      // Simulate Slack accepting the message and dropping the response. A later worker
      // must leave evidence for reconciliation and never post again automatically.
      const second = { ...report, reference: randomUUID() };
      await accept(second);
      let ambiguousPosts = 0;
      const lostSlack: typeof fetch = async (input, init) => {
        const u = String(input);
        if (u.endsWith("search/jql")) return Response.json({ issues: [] });
        if (u.endsWith("/issue"))
          return Response.json({ key: "TECH-43" }, { status: 201 });
        if (u.includes("hooks.slack.com")) {
          ambiguousPosts++;
          throw new TypeError("lost acknowledgement");
        }
        if (init?.method === "PUT") throw Error("unexpected cleanup");
        throw Error("unexpected URL");
      };
      await db.query("UPDATE audentra_support_clock SET due=now()");
      await deliver(second.reference, lostSlack);
      await db.query("UPDATE audentra_support_inbox SET due=now()");
      await deliverNotification(second.reference, lostSlack);
      assert.equal(ambiguousPosts, 1);
      assert.equal(
        (
          await db.query(
            "SELECT state FROM audentra_support_slack WHERE jira_key='TECH-43'",
          )
        ).rows[0].state,
        "sending",
      );
      const burst = await Promise.all(
        Array.from({ length: 14 }, () =>
          accept({ ...report, reference: randomUUID() }, "test-origin"),
        ),
      );
      assert.equal(burst.filter((x) => x?.status === 202).length, 10);
      assert.equal(burst.filter((x) => x?.status === 429).length, 4);
    } finally {
      await db.end();
      await admin.query("DROP SCHEMA " + schema + " CASCADE");
      await admin.end();
    }
  },
);
