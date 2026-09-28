import { conference } from "../conference/config";
import type { Lead } from "./model";
import {
  assignOwner,
  reconcileHubSpot,
  retryAfter,
  sendHubSpot,
  type DeliveryResult,
} from "./hubspot";
import type { ContactStore, Job } from "./store";

export function emailPayload(lead: Lead) {
  const newsletter = lead.source === "newsletter";
  const text = lead.conference
    ? [
        `Conference signup: ${conference.name}`,
        `Name: ${lead.firstName} ${lead.lastName}`,
        `Email: ${lead.email}`,
        `Institution: ${lead.institution}`,
        `Giveaway interest: ${lead.conference.offer}`,
        `Demo requested on this submission: ${lead.conference.demoRequested ? "Yes — please follow up" : "No"}`,
      ].join("\n")
    : newsletter
      ? `Newsletter request\nEmail: ${lead.email}`
      : [
          lead.pilot ? "Pilot request" : "Demo request",
          `Name: ${lead.firstName} ${lead.lastName}`,
          `Work email: ${lead.email}`,
          `Institution: ${lead.institution}`,
          `Job title: ${lead.title || "Not provided"}`,
          `Primary interest: ${lead.interest}`,
          `Interested in a pilot: ${lead.pilot ? "Yes" : "No"}`,
          "What they would like to improve:",
          lead.goal || "Not provided",
        ].join("\n");
  return {
    from: process.env.CONTACT_FROM_EMAIL,
    to: ["hello@audentra.ai"],
    reply_to: lead.email,
    subject: lead.conference
      ? `Audentra — ${conference.name}${lead.conference.demoRequested ? " — Demo requested" : " — Coffee / swag signup"}`
      : newsletter
        ? "New Audentra newsletter request"
        : `New Audentra ${lead.pilot ? "pilot" : "demo"} request`,
    text: `${text}\n\nSubmission ID: ${lead.id}\nSubmission page: ${lead.page}\n${lead.attribution ? `Request attribution: ${JSON.stringify(lead.attribution)}\n` : ""}${newsletter ? "" : "Follow-up: Dr. Zaibis (zaibis.munozisme@vekend.com).\n"}Website acceptance confirmed. HubSpot delivery is tracked separately.`,
  };
}
async function sendEmail(
  job: Job,
  fetcher: typeof fetch,
): Promise<DeliveryResult> {
  if (!process.env.RESEND_API_KEY || !(job.payload as { from?: string }).from)
    return { state: "blocked", code: "email_configuration" };
  // Resend retains idempotency keys for 24 hours. Past that window, reconcile
  // manually instead of potentially notifying twice.
  if (
    job.attempts > 1 &&
    Date.now() - new Date(job.first_attempt_at).getTime() >= 23 * 3600000
  )
    return { state: "blocked", code: "email_idempotency_expired" };
  try {
    const response = await fetcher("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
        "Idempotency-Key": `contact-${job.submission_id}`,
      },
      body: JSON.stringify(job.payload),
      signal: AbortSignal.timeout(8000),
      redirect: "error",
    });
    if (response.ok) return { state: "sent", code: "accepted" };
    return {
      state:
        response.status === 429 || response.status >= 500 ? "retry" : "blocked",
      code: `email_${response.status}`,
      delay: retryAfter(response.headers.get("retry-after")),
    };
  } catch {
    return { state: "retry", code: "email_transport" };
  }
}
export async function drainDeliveries(
  store: ContactStore,
  options: { id?: string; limit?: number; fetcher?: typeof fetch } = {},
) {
  const fetcher = options.fetcher || fetch;
  const deadline = Date.now() + 25000;
  for (let i = 0; i < (options.limit || 4); i++) {
    if (Date.now() >= deadline) break;
    const job = await store.claim(options.id);
    if (!job) break;
    let result: DeliveryResult;
    if (job.destination === "email") result = await sendEmail(job, fetcher);
    else if (job.destination === "owner")
      result = await assignOwner(
        job.config,
        (job.payload as { email: string }).email,
        fetcher,
      );
    else if (job.state === "uncertain") {
      try {
        result = (await reconcileHubSpot(
          job.config,
          job.submission_id,
          fetcher,
        ))
          ? { state: "sent", code: "reconciled" }
          : {
              state: "uncertain",
              code: "hubspot_reconciliation_required",
              delay: 3600,
            };
      } catch {
        result = {
          state: "uncertain",
          code: "hubspot_reconciliation_unavailable",
          delay: 3600,
        };
      }
    } else result = await sendHubSpot(job.config, job.payload, fetcher);
    await store.finish(job, result);
    if (result.state !== "sent") {
      console.warn("Contact delivery retained for retry or review.", {
        submissionId: job.submission_id,
        destination: job.destination,
        state: result.state,
        code: result.code,
      });
    }
  }
}
