# Customer support: /support

Portal links can preselect admin-it, staff or student using the portal query parameter. Jira is the ticket system; Slack receives the Jira link and, if needed, a notice identifying unconfirmed attachments by position. The website uses its PostgreSQL database to hold reports until Jira accepts them. No D1 or separate backend deployment is needed.

## Deploy

Production uses dhairya2801/audentra-website and Vercel project dhairya5/audentra-website. Deploy the backend from the same reviewed commit to an IAM-protected Cloud Run service. Use separate service identities and databases for preview and production.

1. Provision the target PostgreSQL database and runtime role. Apply the additive migration before routing traffic or starting workers. Run `npm ci` and `npm run support:migrate` with `SUPPORT_MIGRATION_DATABASE_URL` set to the target migration connection and `SUPPORT_RUNTIME_ROLE` to the limited app role. The migration can be rerun. Apply it even if all queued reports have no attachments. The app needs `SUPPORT_DATABASE_URL`. Keep migration credentials outside the app.
2. Configure Cloud Run with `JIRA_SITE=https://audentra.atlassian.net`, `JIRA_PROJECT_KEY=TECH`, `JIRA_ISSUE_TYPE_ID=10048`, and `SUPPORT_TRUST_RELAY_IP=1`. Supply `JIRA_EMAIL`, `JIRA_API_TOKEN`, `SLACK_WEBHOOK_URL` for #audentra-support-test, `CRON_SECRET`, `SUPPORT_ORIGIN_SECRET` and the runtime database URL through Secret Manager. Keep the Cloud Run invoker check enabled and its HTTPS endpoint reachable from Vercel.
3. Enable Vercel OIDC with the team issuer. Configure the Google workload identity provider to allow only the intended Vercel project and environment and map `google.subject` to `assertion.sub`. The production subject is `owner:dhairya5:project:audentra-website:environment:production`. Grant it `roles/iam.workloadIdentityUser` on a dedicated caller identity with `roles/run.invoker` only on the intended Cloud Run service. Use distinct preview identity/configuration. Set Vercel server-only variables `SUPPORT_CLOUD_RUN_URL` (native HTTPS `run.app` service origin), `SUPPORT_GCP_WIF_PROVIDER` (full `//iam.googleapis.com/projects/PROJECT_NUMBER/locations/global/workloadIdentityPools/POOL/providers/PROVIDER` resource), and `SUPPORT_GCP_INVOKER_EMAIL`. Allow the default `https://vercel.com/dhairya5` audience in this provider. Keep provider and database secrets in Cloud Run.
4. Schedule a Cloud Run Job once per minute. Use the same source revision and run `node scripts/run-support-delivery.mjs`. Set `SUPPORT_CLOUD_RUN_URL` and mount the same `CRON_SECRET` used by the service. Grant the job identity `roles/run.invoker` on the service. Grant Cloud Scheduler permission to execute only the job. Verify a real scheduled execution and monitor failures and the age of unfinished receipts.
5. From a protected Vercel preview, submit a synthetic report with a PNG and a short video. Match the receipt and both attachments in Jira and the matching Jira link in Slack. Verify a retry uses the same receipt and ticket. Repeat in production before rebuilding the portals with `NEXT_PUBLIC_SUPPORT_URL=https://www.audentra.ai/support`.

Before production, assign an owner to review terminal Jira attachment failures and approve how long to keep unconfirmed evidence. Preserve pending receipts, restrict review to authorized operators and confirm the database backup policy. Failed evidence remains available for recovery.
If a frontend rollback is needed after intake opens, restore the previous Vercel deployment and disable portal entry links. Leave the production database and retry job running so accepted reports can drain.

After a minute-scheduled delivery execution succeeds, set server-side SUPPORT_DELIVERY_MODE=scheduled on the private Cloud Run backend for fast receipts. The form gets its reference after PostgreSQL commits the report, and the scheduled worker handles Jira and Slack delivery. The default inline mode attempts delivery during intake.

## Receipts and recovery

A 202 with a UUID means the report is committed to PostgreSQL. A Jira key means Jira has confirmed creation; Slack can still be pending. An HTTP failure is not a receipt: retry the same report with its original reference. Reusing a reference with changed content is rejected. On Vercel, up to ten new submissions per originating network are accepted per ten minutes. Form drafts are kept in session storage until receipt. Closing the browser before acceptance can lose an unsubmitted draft.

Workers claim rows atomically. A restart before Jira creation leaves a recoverable row. A worker writes its intent before sending to Jira. If the response is lost, workers search for the original marker instead of issuing another create. Reports are removed from the inbox payload when Jira has the ticket and all its attachments. Receipt fingerprints and delivery metadata remain for reconciliation. Slack delivery uses a separate ledger and a shared sending interval. A failed Jira label cleanup after a confirmed Slack post retries only the cleanup.

Monitor unfinished work without selecting report contents:

    SELECT reference, jira_key, intent, created_at, due FROM audentra_support_inbox
    WHERE NOT notified ORDER BY created_at LIMIT 100;
    SELECT jira_key, state, due FROM audentra_support_slack WHERE state <> 'sent' ORDER BY due;

A stale Jira intent with no key means the create might have happened. Search TECH for the reference and inspect the source/marker labels. If found, restore any missing marker and let the worker reconcile. **Only after independently confirming no issue was created**, stop active delivery for that receipt, clear its intent and owner, and set due=now(). If uncertain, leave it pending. For a stale Slack 'sending' row, search the private channel for its exact Jira link. If present, mark the row 'sent'; if confirmed absent after the request has settled, mark it 'retry' with due=now(). Invoke delivery and verify the pending Jira label clears. Record the evidence and any operator changes in ENR-494. Incoming webhooks cannot resolve ambiguous delivery automatically.

### When Jira cannot accept evidence

A permanent Jira attachment rejection, or five unsuccessful delivery passes for temporary errors, ends automatic file retries. Support still gets the ticket link. The Slack alert identifies the unconfirmed file positions in selection order, without filenames or contents. A lost acknowledgement can mean a file is already present in Jira. Failed reports keep their original evidence in the restricted inbox until an authorized operator reconciles the files.

    SELECT reference, jira_key, unconfirmed_attachments FROM audentra_support_inbox
    WHERE cardinality(unconfirmed_attachments) > 0;

For each listed receipt, inspect the issue's attachments before uploading anything. The generated Jira filename consists of the original 1-based position, the first 16 hex characters of the file's SHA-256 and the normalized filename. Resolve the Jira rejection, then use approved restricted tooling to upload only missing files to the existing ticket. Verify the downloaded bytes match the retained files. Never paste the evidence or report payload into Slack, logs or the audit ticket. After all files match, clear the payload and the warning together for that reference and Jira key. If recovery is impossible, keep the evidence for the approved retention process. Record the reconciliation outcome in ENR-494.

## Verification

Run npm test, npm run lint, npm run build and the support Playwright test. To include the restart/concurrency integration test, set SUPPORT_TEST_DATABASE_URL to a disposable PostgreSQL database; the test creates and removes its own schema. Provider failures are simulated. The historical VM burst verifier in ops/support checks the previous synchronous prototype's data format; it is not a throughput or delivery guarantee for this version.
