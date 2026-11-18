# Customer support: /support

Portal links can preselect admin-it, staff or student using the portal query parameter. Jira is the ticket system; Slack receives the Jira link and, if needed, a notice identifying unconfirmed attachments by position. The website uses its PostgreSQL database to hold reports until Jira accepts them. No D1 or separate backend deployment is needed.

## Deploy

1. On an isolated preview database, set SUPPORT_MIGRATION_DATABASE_URL to the migration connection and SUPPORT_RUNTIME_ROLE to the website database role (for example audentra_contact), then run npm run support:migrate. Keep migration credentials out of the running website. Repeat against the intended production database before enabling the production route. The migration creates three support-only tables and indexes. Use a database role with SELECT, INSERT and UPDATE on them. Use a PostgreSQL connection URL compatible with node-postgres and encrypted transport on hosted databases. SUPPORT_DATABASE_URL overrides CONTACT_DATABASE_URL. Do not point previews at production.
2. Configure server-side JIRA_SITE=https://audentra.atlassian.net, JIRA_PROJECT_KEY=TECH, JIRA_ISSUE_TYPE_ID=10048, JIRA_EMAIL, JIRA_API_TOKEN, SLACK_WEBHOOK_URL for #audentra-support-test and CRON_SECRET. Jira requires search, create, and edit-label access. Use SUPPORT_ORIGIN_SECRET for a stable network rate-limit hash; otherwise the Jira token is used. Neither this hash nor the reporter's email is posted to Slack.
3. Invoke the authenticated GET /api/support/delivery regularly. The repository includes a daily Vercel fallback; **for timely delivery configure a scheduler to call it every minute** with Authorization: Bearer followed by CRON_SECRET. Monitor failures and the oldest unfinished row. Each invocation is bounded; concurrent calls safely compete for work. A daily schedule alone is unsuitable for a backlog.
4. In preview submit one synthetic report; match its reference to the database and Jira and verify the same Jira link in Slack. Repeat after promotion. Confirm Jira access controls and database backup/retention policy.

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
