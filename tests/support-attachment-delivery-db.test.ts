import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import { Pool } from "pg";
import { accept, deliver, deliverNotification } from "../lib/support/inbox";

// The HTTP transport is simulated. Claims, payload retention, retries and the
// notification ledger use the same PostgreSQL tables as the delivery worker.
test(
  "delivery reconciles Jira attachments before notifying Slack",
  { skip: !process.env.SUPPORT_TEST_DATABASE_URL },
  async (t) => {
    const url = new URL(process.env.SUPPORT_TEST_DATABASE_URL!);
    const admin = new Pool({ connectionString: url.href });
    const schema = "evidence_" + randomUUID().replaceAll("-", "");
    await admin.query("CREATE SCHEMA " + schema);
    url.searchParams.set("options", "-c search_path=" + schema);
    const db = new Pool({ connectionString: url.href });
    Object.assign(process.env, {
      SUPPORT_DATABASE_URL: url.href,
      JIRA_API_TOKEN: "test",
      JIRA_SITE: "https://example.atlassian.net",
      JIRA_PROJECT_KEY: "TECH",
      JIRA_ISSUE_TYPE_ID: "10048",
      JIRA_EMAIL: "support@example.test",
      SLACK_WEBHOOK_URL: "https://hooks.slack.com/services/test/test/test",
    });
    try {
      await db.query(
        await readFile("scripts/migrations/005-support-inbox.sql", "utf8"),
      );
      const cases = [
        {
          name: "healthy delivery batches both files and waits briefly for the Slack channel",
          status: 200,
          failures: 0,
          attempts: 1,
          failed: false,
          paced: true,
        },
        {
          name: "temporary 503 retries only the missing file",
          status: 503,
          failures: 1,
          attempts: 2,
          failed: false,
        },
        {
          name: "permanent 403 survives deferred Slack delivery",
          status: 403,
          failures: Infinity,
          attempts: 1,
          failed: true,
        },
        {
          name: "repeated 429 stops after five failed passes",
          status: 429,
          failures: Infinity,
          attempts: 5,
          failed: true,
        },
      ];
      for (const [index, c] of cases.entries())
        await t.test(c.name, async () => {
          const key = "TECH-" + (100 + index),
            reference = randomUUID();
          const evidence = [
            { name: "first.png", mime: "image/png", data: "iVBORw0KGgo=" },
            { name: "second.webm", mime: "video/webm", data: "GkXfo3dlYm0=" },
          ];
          const report = {
            reference,
            checkOnly: false,
            email: "test@example.test",
            subject: "two files",
            description: "synthetic evidence",
            portal: "staff",
            evidence,
          };
          const saved: string[] = [],
            posts: string[] = [],
            slack: string[] = [];
          let created = 0,
            lookups = 0,
            batches = 0,
            remaining = c.failures;
          const send: typeof fetch = async (input, init) => {
            const url = String(input);
            if (url.endsWith("search/jql")) {
              assert.equal(
                created,
                0,
                "once Jira confirms creation, attachment retries use its stored key",
              );
              return Response.json({ issues: [] });
            }
            if (url.endsWith("/issue")) {
              created++;
              return Response.json({ key }, { status: 201 });
            }
            if (url.endsWith("?fields=attachment")) {
              lookups++;
              return Response.json({
                fields: { attachment: saved.map((filename) => ({ filename })) },
              });
            }
            if (url.endsWith("/attachments")) {
              batches++;
              const names = ((init!.body as FormData).getAll("file") as File[]).map((file) => file.name);
              for (const name of names) {
                posts.push(name);
                if (name.endsWith("webm") && remaining-- > 0)
                  return new Response(null, { status: c.status });
                saved.push(name);
              }
              return Response.json(names.map((filename) => ({ filename })));
            }
            if (url.includes("hooks.slack.com")) {
              slack.push(JSON.parse(String(init?.body)).text);
              return new Response("ok");
            }
            if (init?.method === "PUT")
              return new Response(null, { status: 204 });
            throw Error("Unexpected operation " + url);
          };
          assert.equal((await accept(report))?.status, 202);
          await db.query(
            c.failed
              ? "UPDATE audentra_support_clock SET due=now()+interval '10 minutes'"
              : c.paced
                ? "UPDATE audentra_support_clock SET due=now()+interval '300 milliseconds'"
                : "UPDATE audentra_support_clock SET due=now()",
          );
          for (let i = 1; i <= c.attempts; i++) {
            await db.query(
              "UPDATE audentra_support_inbox SET due=now() WHERE reference=$1",
              [reference],
            );
            const result = await deliver(reference, send);
            assert.equal(result?.status, i === c.attempts ? 200 : 202);
            if (i < c.attempts) {
              assert.deepEqual(slack, []);
              const {
                rows: [pending],
              } = await db.query(
                "SELECT jira_key,attachment_jira_key FROM audentra_support_inbox WHERE reference=$1",
                [reference],
              );
              assert.equal(pending.jira_key, null);
              assert.equal(pending.attachment_jira_key, key);
            }
          }
          if (c.paced) {
            assert.equal(batches, 1);
            assert.equal(lookups, 0);
            assert.equal(slack.length, 1, "the short pacing delay must not wait for a scheduled retry");
          }
          if (c.failed) {
            assert.deepEqual(slack, []);
            const {
              rows: [retained],
            } = await db.query(
              "SELECT jira_key,attachment_jira_key,unconfirmed_attachments FROM audentra_support_inbox WHERE reference=$1",
              [reference],
            );
            assert.equal(retained.jira_key, key);
            assert.equal(retained.attachment_jira_key, null);
            assert.deepEqual(retained.unconfirmed_attachments, [2]);
          }
          await db.query("UPDATE audentra_support_clock SET due=now()");
          await db.query(
            "UPDATE audentra_support_inbox SET due=now() WHERE reference=$1",
            [reference],
          );
          await deliverNotification(reference, send);
          assert.equal(await deliver(reference, send), null);
          assert.equal(await deliverNotification(reference, send), null);
          assert.equal(created, 1);
          assert.equal(slack.length, 1);
          assert.ok(slack[0].includes(key));
          assert.equal(slack[0].includes("file 2"), c.failed);
          assert.ok(!slack[0].includes("second.webm"));
          assert.equal(posts.filter((x) => x.endsWith(".png")).length, 1);
          assert.equal(
            posts.filter((x) => x.endsWith(".webm")).length,
            c.attempts + Number(c.status === 403),
          );
          const {
            rows: [row],
          } = await db.query(
            "SELECT jira_key,notified,report,unconfirmed_attachments FROM audentra_support_inbox WHERE reference=$1",
            [reference],
          );
          assert.equal(row.jira_key, key);
          assert.equal(row.notified, true);
          assert.deepEqual(row.unconfirmed_attachments, c.failed ? [2] : []);
          assert.deepEqual(
            row.report?.evidence ?? null,
            c.failed ? evidence : null,
          );
        });
    } finally {
      await db.end();
      await admin.query("DROP SCHEMA " + schema + " CASCADE");
      await admin.end();
    }
  },
);
