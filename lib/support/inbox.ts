import { Pool } from "pg";
import { AttachmentFailure } from "./evidence";
import { createHash, createHmac, randomUUID } from "node:crypto";
import { supportService, type Submission } from "./intake";
let pool: Pool | undefined;
function db() {
  const url =
    process.env.SUPPORT_DATABASE_URL || process.env.CONTACT_DATABASE_URL;
  if (!url) throw Error("Support database unavailable");
  if (!pool) {
    pool = new Pool({
      connectionString: url,
      max: 4,
      connectionTimeoutMillis: 4000,
      statement_timeout: 5000,
      idleTimeoutMillis: 10000,
      allowExitOnIdle: true,
    });
    pool.on("error", () => console.error("support.db.connection"));
  }
  return pool;
}
const queued = (reference: string) => ({
  status: 202,
  body: { state: "queued", reference },
});
const received = (key: string) => ({
  status: 200,
  body: { state: "received", key },
});
export async function accept(report: Submission, ip?: string) {
  const { reference, portal, email, subject, description } = report;
  const fingerprint = createHash("sha256")
    .update(
      JSON.stringify([
        portal,
        email,
        subject,
        description,
        ...(report.evidence ?? []),
      ]),
    )
    .digest("hex");
  const origin = ip
    ? createHmac(
        "sha256",
        process.env.SUPPORT_ORIGIN_SECRET ||
          process.env.JIRA_API_TOKEN ||
          (() => {
            throw Error("Origin key missing");
          })(),
      )
        .update(ip)
        .digest("hex")
    : null;
  const c = await db().connect();
  try {
    await c.query("BEGIN");
    await c.query("SELECT pg_advisory_xact_lock(hashtextextended($1,494))", [
      reference,
    ]);
    const prior = (
      await c.query(
        "SELECT fingerprint,jira_key FROM audentra_support_inbox WHERE reference=$1",
        [reference],
      )
    ).rows[0];
    if (prior) {
      await c.query("COMMIT");
      if (prior.fingerprint !== fingerprint)
        return { status: 409, body: { state: "conflict" } };
      return prior.jira_key ? received(prior.jira_key) : queued(reference);
    }
    if (report.checkOnly) {
      await c.query("COMMIT");
      return null;
    }
    if (origin) {
      await c.query("SELECT pg_advisory_xact_lock(hashtextextended($1,495))", [
        origin,
      ]);
      if (
        (
          await c.query(
            "SELECT 1 FROM audentra_support_inbox WHERE origin=$1 AND created_at>now()-interval '10 minutes' OFFSET 9 LIMIT 1",
            [origin],
          )
        ).rowCount
      ) {
        await c.query("COMMIT");
        return { status: 429, body: { state: "limited" } };
      }
    }
    await c.query(
      "INSERT INTO audentra_support_inbox(reference,fingerprint,report,origin) VALUES($1,$2,$3,$4)",
      [
        reference,
        fingerprint,
        JSON.stringify({ ...report, checkOnly: false }),
        origin,
      ],
    );
    await c.query("COMMIT");
    return queued(reference);
  } catch (e) {
    await c.query("ROLLBACK").catch(() => {});
    throw e;
  } finally {
    c.release();
  }
}
// A Jira issue and its pending label form the durable notification outbox. Record
// the webhook intent separately because Slack cannot deduplicate an incoming webhook.
export function deliveryService(send: typeof fetch = fetch) {
  return supportService(process.env, send, {
    async claimSlack(key) {
      const c = await db().connect();
      try {
        await c.query("BEGIN");
        const old = (
          await c.query(
            "SELECT state,due>now() AS delayed FROM audentra_support_slack WHERE jira_key=$1",
            [key],
          )
        ).rows[0];
        if (old?.state === "sent") {
          await c.query("COMMIT");
          return "sent";
        }
        if (old?.state === "sending" || old?.delayed) {
          await c.query("COMMIT");
          return "wait";
        }
        const slot = await c.query(
          "UPDATE audentra_support_clock SET due=clock_timestamp()+interval '1 second' WHERE id=1 AND due<=clock_timestamp() RETURNING id",
        );
        if (!slot.rowCount) {
          const { rows: [clock] } = await c.query(
            "SELECT extract(epoch FROM due-clock_timestamp())*1000 AS ms FROM audentra_support_clock WHERE id=1",
          );
          await c.query("COMMIT");
          const ms = Number(clock?.ms);
          return Number.isFinite(ms) && ms <= 1000
            ? Math.max(0, Math.ceil(ms)) + 10
            : "wait";
        }
        const claim = await c.query(
          "INSERT INTO audentra_support_slack(jira_key,state) VALUES($1,'sending') ON CONFLICT(jira_key) DO UPDATE SET state='sending',due=now() WHERE audentra_support_slack.state='retry' AND audentra_support_slack.due<=now() RETURNING jira_key",
          [key],
        );
        await c.query("COMMIT");
        return claim.rowCount ? "send" : "wait";
      } catch (e) {
        await c.query("ROLLBACK").catch(() => {});
        throw e;
      } finally {
        c.release();
      }
    },
    async slackResult(key, sent, delay) {
      await db().query(
        "UPDATE audentra_support_slack SET state=$2,due=now()+$3*interval '1 second' WHERE jira_key=$1",
        [key, sent ? "sent" : "retry", delay],
      );
      if (!sent)
        await db().query(
          "UPDATE audentra_support_clock SET due=greatest(due,now()+$1*interval '1 second') WHERE id=1",
          [delay],
        );
    },
  });
}
export async function deliver(reference?: string, send: typeof fetch = fetch) {
  const service = deliveryService(send);
  const owner = randomUUID();
  const row = (
    await db().query(
      `WITH next AS (SELECT reference FROM audentra_support_inbox WHERE jira_key IS NULL AND due<=now() AND ($1::uuid IS NULL OR reference=$1) ORDER BY due LIMIT 1 FOR UPDATE SKIP LOCKED) UPDATE audentra_support_inbox i SET owner=$2,due=now()+interval '2 minutes' FROM next WHERE i.reference=next.reference RETURNING i.report,i.intent,i.attachment_attempts,i.attachment_jira_key`,
      [reference ?? null, owner],
    )
  ).rows[0];
  if (!row) return null;
  const report = row.report as Submission;
  const result = row.attachment_jira_key
    ? { ...received(row.attachment_jira_key), delay: undefined }
    : await service.submit(
        { ...report, checkOnly: row.intent },
        undefined,
        async () => {
          const changed = await db().query(
            "UPDATE audentra_support_inbox SET intent=true WHERE reference=$1 AND owner=$2 AND NOT intent RETURNING reference",
            [report.reference, owner],
          );
          if (!changed.rowCount) throw Error("Stale claim");
        },
      );
  const key = result.body.key;
  if (key) {
    let unconfirmed: number[] = [];
    if (report.evidence?.length) {
      if (!row.attachment_jira_key) {
        const claimed = await db().query(
          "UPDATE audentra_support_inbox SET attachment_jira_key=$3 WHERE reference=$1 AND owner=$2",
          [report.reference, owner, key],
        );
        if (!claimed.rowCount) return queued(report.reference);
      }
      try {
        await service.attach(key, report.evidence, result.status === 201);
      } catch (error) {
        const failure =
          error instanceof AttachmentFailure
            ? error
            : new AttachmentFailure(report.evidence.map((_, i) => i + 1));
        const attempts = row.attachment_attempts + 1;
        if (!failure.permanent && attempts < 5) {
          await db().query(
            "UPDATE audentra_support_inbox SET attachment_attempts=$3,owner=NULL,due=now()+interval '2 minutes' WHERE reference=$1 AND owner=$2",
            [report.reference, owner, attempts],
          );
          return queued(report.reference);
        }
        unconfirmed = failure.unconfirmed;
      }
    }
    const completed = await db().query(
      "UPDATE audentra_support_inbox SET jira_key=$3,attachment_jira_key=NULL,unconfirmed_attachments=$4::smallint[],report=CASE WHEN cardinality($4::smallint[])>0 THEN report ELSE NULL END,owner=NULL,due=now() WHERE reference=$1 AND owner=$2",
      [report.reference, owner, key, unconfirmed],
    );
    if (!completed.rowCount) return queued(report.reference);
    await deliverNotification(report.reference, send).catch(() => {});
    return received(key);
  }
  await db().query(
    "UPDATE audentra_support_inbox SET owner=NULL,intent=CASE WHEN $3 THEN false ELSE intent END,due=now()+$4*interval '1 second' WHERE reference=$1 AND owner=$2",
    [
      report.reference,
      owner,
      !row.intent && result.body.state === "retry",
      result.delay ?? 120,
    ],
  );
  return queued(report.reference);
}

export async function deliverNotification(
  reference?: string,
  send: typeof fetch = fetch,
) {
  const row = (
    await db().query(
      "WITH next AS (SELECT reference FROM audentra_support_inbox WHERE jira_key IS NOT NULL AND NOT notified AND due<=now() AND ($1::uuid IS NULL OR reference=$1) ORDER BY due LIMIT 1 FOR UPDATE SKIP LOCKED) UPDATE audentra_support_inbox i SET due=now()+interval '2 minutes' FROM next WHERE i.reference=next.reference RETURNING i.reference,i.jira_key,i.unconfirmed_attachments",
      [reference ?? null],
    )
  ).rows[0];
  if (!row) return null;
  const done = await deliveryService(send).notify(
    row.jira_key,
    row.unconfirmed_attachments,
  );
  if (done)
    await db().query(
      "UPDATE audentra_support_inbox SET notified=true WHERE reference=$1",
      [row.reference],
    );
  return { done };
}
