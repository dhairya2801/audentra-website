import { randomUUID } from "node:crypto";
import { channelFor } from "../analytics/collection";
import { ContactError, leadFingerprint, type Lead } from "./model";
import type { DeliveryResult, HubSpotConfig } from "./hubspot";

export type Query = [string, unknown[]];
export interface Database {
  query(text: string, values?: unknown[]): Promise<Record<string, unknown>[]>;
  transaction(queries: Query[]): Promise<unknown>;
}
export type Job = {
  submission_id: string;
  destination: "hubspot" | "email" | "owner";
  payload: unknown;
  config: HubSpotConfig;
  state: string;
  attempts: number;
  lease_id: string;
  first_attempt_at: string;
};
export type NewJob = {
  destination: Job["destination"];
  payload: unknown;
  config?: HubSpotConfig;
};
export function contactStore(db: Database) {
  return {
    async accept(lead: Lead, jobs: NewJob[]) {
      const fingerprint = leadFingerprint(lead);
      const queries: Query[] = [
        [
          `INSERT INTO contact_submissions(id,fingerprint,source,lead) VALUES($1,$2,$3,$4::jsonb) ON CONFLICT DO NOTHING`,
          [lead.id, fingerprint, lead.source, JSON.stringify(lead)],
        ],
      ];
      for (const job of jobs)
        queries.push([
          `INSERT INTO contact_deliveries(submission_id,destination,payload,config) SELECT id,$3,$4::jsonb,$5::jsonb FROM contact_submissions WHERE id=$1 AND fingerprint=$2 ON CONFLICT DO NOTHING`,
          [
            lead.id,
            fingerprint,
            job.destination,
            JSON.stringify(job.payload),
            JSON.stringify(job.config || {}),
          ],
        ]);
      // Conversion and durable acceptance commit together; browser and retries
      // cannot produce another ledger conversion for the same submission.
      const a = lead.analytics;
      if (a)
        queries.push([
          `INSERT INTO outreach_events(code,visit_id,event_name,page,detail,source,medium,campaign,content,channel,schema_version,submission_id) SELECT (SELECT code FROM public_outreach_referrals WHERE code=$3),$4,$5,$6,'none',$7,$8,$9,$10,$11,2,id FROM contact_submissions WHERE id=$1 AND fingerprint=$2 ON CONFLICT DO NOTHING`,
          [
            lead.id,
            fingerprint,
            a.attribution.referral,
            a.visit_id,
            lead.source === "conference"
              ? "conference_submitted"
              : lead.source === "newsletter"
                ? "newsletter_submitted"
                : "demo_submitted",
            a.page || lead.page,
            a.attribution.source,
            a.attribution.medium,
            a.attribution.campaign,
            a.attribution.content,
            channelFor(a.attribution),
          ],
        ]);
      await db.transaction(queries);
      const [saved] = await db.query(
        `SELECT fingerprint FROM contact_submissions WHERE id=$1`,
        [lead.id],
      );
      if (saved?.fingerprint !== fingerprint)
        throw new ContactError(
          "This submission identifier was already used. Reload the form before sending a different request.",
          409,
        );
    },
    async claim(id?: string): Promise<Job | null> {
      // A process can die after POST but before recording its response. Expired
      // leases become uncertain, never a blind duplicate HubSpot POST.
      await db.query(
        `UPDATE contact_deliveries SET state='uncertain',lease_id=NULL,lease_until=NULL,last_code='lease_expired',next_attempt_at=now() WHERE state='in_flight' AND lease_until < now()`,
      );
      const rows = await db.query(
        `WITH candidate AS (SELECT submission_id,destination,state FROM contact_deliveries WHERE state IN ('pending','retry','uncertain') AND next_attempt_at<=now() AND (destination<>'owner' OR EXISTS (SELECT 1 FROM contact_deliveries h WHERE h.submission_id=contact_deliveries.submission_id AND h.destination='hubspot' AND h.state='sent')) AND ($1::uuid IS NULL OR submission_id=$1) ORDER BY next_attempt_at FOR UPDATE SKIP LOCKED LIMIT 1) UPDATE contact_deliveries d SET state='in_flight',lease_id=$2,lease_until=now()+interval '2 minutes',first_attempt_at=coalesce(d.first_attempt_at,now()),attempts=d.attempts+1,updated_at=now() FROM candidate c WHERE d.submission_id=c.submission_id AND d.destination=c.destination RETURNING d.*,c.state AS previous_state`,
        [id || null, randomUUID()],
      );
      if (!rows.length) return null;
      return { ...rows[0], state: rows[0].previous_state } as Job;
    },
    async finish(job: Job, result: DeliveryResult) {
      const state =
        job.attempts >= 10 && result.state !== "sent"
          ? "blocked"
          : result.state;
      const delay = Math.max(
        result.delay || 0,
        Math.min(86400, 60 * 2 ** Math.min(job.attempts - 1, 10)),
      );
      await db.query(
        `UPDATE contact_deliveries SET state=$4,last_code=$5,next_attempt_at=now()+($6 * interval '1 second'),lease_until=NULL,lease_id=NULL,updated_at=now() WHERE submission_id=$1 AND destination=$2 AND lease_id=$3`,
        [
          job.submission_id,
          job.destination,
          job.lease_id,
          state,
          result.code,
          delay,
        ],
      );
    },
    async status(id: string) {
      return db.query(
        `SELECT destination,state FROM contact_deliveries WHERE submission_id=$1`,
        [id],
      );
    },
    async health() {
      return db.query(
        `SELECT destination,state,count(*)::int AS count,min(updated_at) AS oldest_update FROM contact_deliveries GROUP BY destination,state`,
      );
    },
  };
}
export type ContactStore = ReturnType<typeof contactStore>;
