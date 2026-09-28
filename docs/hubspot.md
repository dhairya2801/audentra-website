# Audentra lead delivery: implementation and admin handoff

Status, September 28, 2026: **deployed and verified on https://www.audentra.ai**.
Initial verified production deployment: `dpl_FxWfJ8HXoGxf7QnGoJVLeoVhdtCY`.
That rollout deployed the marketing project through its existing Vercel
connection. Subsequent merges to main use the existing Git deployment triggers
for both projects. Both use the existing Neon analytics ledger.

## Verified account configuration

- Company **Audentra**, portal **52074694**, domain **audentra.ai**; authenticated
  user now verified as Super Admin. Billing shows Free tools plus a separate
  Sales Hub Professional trial. No upgrades or trial-dependent workflows used.
- Form **Audentra Demo Request**, ID **c9a0011e-b0d9-4e81-9349-bd36218ec819**:
  [open editor](https://app.hubspot.com/forms/52074694/editor/c9a0011e-b0d9-4e81-9349-bd36218ec819/edit/form).
  No existing forms were found by either UI or public API. Published form has
  all ten mapped fields and processing consent without communications consent.
- Inventoried 401 contact properties; no existing custom equivalents. Created
  exactly the five `audentra_*` properties in the mapping below. Hidden fields
  must be optional in HubSpot; the website still requires a valid submission ID.
- Follow-up owner and notification recipient: **Dr. Zaibis Muñoz-Isme**,
  **zaibis.munozisme@vekend.com**, verified owner/user ID **159663764**.
  Form notification recipient is this user; owner notifications are off to avoid
  sending a second notification. Existing Resend mail to hello@audentra.ai remains.
- Service key **Audentra Landing Demo Delivery**, ID **54920964**, with only
  `forms`, `crm.objects.contacts.read`, and `crm.objects.contacts.write`.
  Temporary schema/owner lookup scopes were removed after setup. Credentials
  are in ignored local configuration and Vercel secrets, never source control.
- Both website domains were already in HubSpot's tracking domain list. Existing
  bot filtering, automatic capture and other account-wide settings were preserved.
  Both website forms explicitly opt out of automatic non-HubSpot capture.
- No form automation is configured. Existing subscription types are Marketing
  Information and One to One; neither is automatically opted into by this flow.
  The Free account does not expose a marketing-contact toggle on this form.
- Additive private delivery tables and the restricted `audentra_contact` role
  have been created in the existing Neon database.

## Live verification

- Test contact [HUBSPOT INTEGRATION TEST DO NOT CONTACT](https://app.hubspot.com/contacts/52074694/record/0-1/251570546559)
  (reserved example.com email), contact ID **251570546559**. Keep this labeled
  test record out of sales follow-up; no deal or visitor email was created.
- Two real backend/Neon outbox requests: `f4bfa2d7-d949-4c95-9f81-c7c21f6fcf78`
  and `eecbb93a-6753-4c7e-b7d0-a877f571571f`. HubSpot submission history contains
  exactly one entry for each despite concurrent acceptance/delivery attempts.
  All mapped fields, owner, same-email contact reuse, pilot true/false, private
  CTA/UTM context, and preservation of blank optional values checked by API.
  The second request declined tracking and contained no cookie or campaign data.
  HubSpot updates are eventually consistent; wait for the matching submission ID
  before checking contact fields. The first owner job retried safely after the
  form was accepted but the contact was not yet readable. The worker now polls
  briefly within its existing eight-second deadline before durable retry.
- [Vercel preview](https://audentra-website-1215l58f4-dhairya5.vercel.app/demo),
  deployment `dpl_61YGq9UEHd9RKuNXXxyMnQTboLpr`: actual browser double-click
  produced one HTTP 202, UUID `0e7b1128-8ba3-4846-9b0b-7a1a01933b8f`, and the
  accurate queued success message. HubSpot, ownership and Resend jobs all reached
  `sent` in one attempt each. Tracking scripts were absent on the preview.
- Form notifications were disabled for the first two direct tests, then enabled
  for Dr. Zaibis before the preview submission. The user confirmed Dr. Zaibis
  received the notification. Resend acceptance
  verifies provider acceptance, not inbox arrival.
- Production browser test `754a69ec-e28a-456d-9de0-b57eb59e7ea6`: one UI
  request from a double-click plus two concurrent HTTP retries produced one
  HubSpot submission, one Resend send, one owner job, and exactly one
  `demo_submitted` ledger event. All delivery jobs completed in one attempt.
  All fields and the same contact/owner were checked by the real HubSpot API.
  Real HubSpot cookie was included only after consent; private originating CTA
  and landing page both matched `/pilot`. General analytics requests contained
  no form values. The ledger separately recorded one CTA click, two page views,
  and one accepted request, with no meeting-booked event.
- Actual vendor network checks: script absent before consent, installed once
  after opt-in, exactly one HubSpot pageview on `/pilot` and one on SPA navigation
  to `/demo`. Withdrawal reloaded with no HubSpot script and removed all four
  first-party HubSpot tracking cookies.
- Production declined-consent/browser-blocker test
  `3496087d-1cd3-4718-920f-13b3d98842f6` reached the same contact, with all three
  jobs sent once. No cookie, optional attribution, or analytics event was stored.
  Blank optional title/goal preserved earlier values. Invalid preview input
  returned 400 and honeypot input returned its deliberate fake-success response.
- Production recovery endpoint returned 401 without authorization and 200 with
  the configured secret; Vercel reports the daily cron enabled on this deployment.
  The scheduled invocation itself has not yet run. Provider timeout, 429 and 5xx
  behavior was tested using mocks, not induced against the live account.
- HubSpot does not expose a marketing-status field for this Free account's test
  contact. Form communications consent is empty and no subscription API or
  automation is used; no marketing opt-in was requested or sent.

## Evidence and existing behavior

- Repository: `dhairya2801/audentra-website`, local `audentra-landing-page`.
  Next.js 16.3 App Router. `AGENTS.md` and installed Next.js documentation read.
  README describes Vercel deployment; no additional approval/deployment policy
  or GitHub deployment workflow was found. Existing uncommitted `next-env.d.ts`
  was present before this work.
- `audentra-website` and `audentra-analytics` share this repository. Only analytics
  sets `AUDENTRA_APP=analytics`. Private outreach and first-party events use Neon.
- Header (desktop/mobile), footer, homepage, About, Why Audentra, Pricing, Pilot,
  Solutions, enrollment readiness, platform product pages, Trust, Accessibility,
  Terms, Privacy, and 404 CTAs link to `/demo`. `/pilot` is informational and
  links to that same form. `mailto:` links are email intent only.
- `components/demo-form.tsx` sends `source=product-walkthrough` to
  `/api/contact`. Pilot interest is a checkbox on that form.
  `components/newsletter-form.tsx` in the footer sends `source=newsletter`.
- Previously both forms only called Resend, addressed to `hello@audentra.ai`.
  There was no durable submission store, HubSpot installation, booking provider,
  or newsletter subscription API. Resend credentials are absent from local
  configuration. After refreshing Vercel authentication, production and preview
  RESEND_API_KEY and CONTACT_FROM_EMAIL were confirmed configured. They were
  preserved, and preview delivery was accepted by Resend.
- Authenticated Account Defaults for portal **52074694** showed account name
  **Audentra**, company **Audentra**, domain **audentra.ai**. The public supplied
  script matches that portal and includes automatic form capture.
- During the September 27 inspection, Forms UI explicitly required reporting permission; Users & Teams and email
  subscriptions denied access. Tracking settings did not allow editing.
  Account & Billing was inaccessible. Properties reported 230 contact properties
  but its list stayed loading;
  individual custom properties could not be verified. Legacy Apps shows none.
  Connected Apps shows **Jira** and **Slack**; neither was changed.
- User explicitly designated **Dr. Zaibis, zaibis.munozisme@vekend.com** for
  follow-up. Owner and notification user IDs are now verified as listed above.

## Submission behavior

The current UI and styles remain. The server validates bounded inputs, origin,
required fields, email, allowed interest, and submission ID; it keeps the
honeypot and adds a per-instance rate limit. Tracking is optional.

`CONTACT_DELIVERY_MODE=durable` saves private lead data and delivery jobs in
Neon. When first-party analytics is permitted, the existing `demo_submitted`
or `newsletter_submitted` event commits in that **same transaction**. A database
failure returns an error, never success. A committed request returns HTTP 202
and the UI says it was saved and is awaiting delivery. It does not claim HubSpot
received the request or that a meeting was booked.

`after()` attempts the immutable email/HubSpot/ownership jobs immediately. The authenticated
Vercel cron retries daily at 13:00 UTC (no plan upgrade); it processes up to 20
due jobs within a bounded execution window. The same endpoint can be called
again by an authorized operator to drain a backlog. Responses contain only
delivery counts/states. Monitor this queue: daily recovery can delay follow-up.

HubSpot uses the supported authenticated Forms Submission API, not CRM contact
upsert plus accidental automatic capture. Email remains addressed to
`hello@audentra.ai`, with the submission ID and intended follow-up owner in its
body. Newsletter requests remain email-only and never enter the demo form.
There are no deals, paid workflows, or marketing subscription calls.

One submission ID means one durable request, one job per destination (email, form, ownership) and one
conversion. Concurrent requests lock jobs in Postgres. Retrying the same ID
with changed form fields returns 409. A later intentional request gets a new
ID and can attach to the same HubSpot email contact. Blank optional properties
are omitted, preserving existing values. A false pilot checkbox is meaningful
and updates the most recent request's pilot value.

### Delivery failures and operations

- HTTP 429: backoff honors Retry-After. Requests remain durable.
- HubSpot timeout, HTTP 408/5xx, or expired worker lease: mark uncertain. The
  worker searches up to 500 form submissions for the stable submission ID.
  A match confirms delivery **without another POST**. Absence or missing read
  access does not prove failure; it stays uncertain for manual review.
- Owner updates are idempotent and retry timeout/429/5xx independently, including
  after an interrupted worker. They never run until the form job is confirmed
  sent. Existing assignment to Dr. Zaibis avoids a redundant PATCH.
- Other HubSpot errors: blocked for configuration/data correction. Ten failed
  attempts also become blocked. Records are never silently dropped.
- Resend retries use its idempotency key; automatic retries stop after 23 hours
  from the first attempt to stay within its 24-hour idempotency window. Because
  this Hobby deployment only schedules daily recovery, an email failure may
  require an operator to trigger recovery promptly or review it manually after
  that window. The HubSpot form notification is an independent follow-up path.
- No exactly-once claim is made for a remote API without idempotency support.
  Uncertain cases require provider reconciliation rather than risking duplicates.
- `npm run contact:status` shows safe IDs, states and counts from the private
  connection. It never prints lead fields or credentials. Inspect private lead
  details in the secured Neon console if delivery needs manual follow-up.
  Worker warnings also include only UUID, destination, status and a controlled
  error code, making unresolved deliveries visible in existing Vercel logs.
- After checking the actual provider record, an operator can use
  `node scripts/contact-ops.mjs confirm-sent UUID hubspot --provider-checked`
  or `retry UUID hubspot --provider-checked` (replace `hubspot` with `email` for
  email or `owner` for ownership). Retry **only after confirming the original was not accepted**.
  The CLI will not reset sent/in-flight jobs or rewrite payloads. Correct a
  form/property configuration first. Keep submission IDs when investigating.
- Lead data and consent-at-submission context are private in
  `contact_submissions`; jobs are in `contact_deliveries`. A separate database
  role has no access to private outreach records. Existing anonymous analytics
  credentials gain no access to lead data. Apply the company's lead-retention
  policy to both tables together, retaining deduplication records as needed;
  no automatic deletion of unresolved requests is introduced.

## Configuration and maintenance

The setup below is complete for this account; retain these instructions for
credential rotation, recovery, and future account changes.

1. Sign into [Audentra portal 52074694](https://app.hubspot.com/home/52074694).
   Grant Forms view/edit/publish and the reporting permission the Forms page
   requests. An administrator also needs contact/property editing, users/owners
   visibility, tracking-settings access, and access to inspect subscription and
   notification settings. Developer access alone did not provide those rights.
2. Inspect existing forms and properties before creating anything. Reuse an
   appropriate demo form; otherwise create **Audentra Demo Request**. Use its
   published GUID as `HUBSPOT_DEMO_FORM_ID`. List **every mapped field** on that
   form, including hidden submission ID and request attribution fields.
   Do not reuse a newsletter/marketing subscription form.
3. Resolve Dr. Zaibis by the exact email above to an active HubSpot **owner ID**
   (not a user ID). Set `HUBSPOT_OWNER_ID`. After confirmed form delivery, a separate durable job reads the contact by email in a POST body and PATCHes only its owner using its numeric contact ID. Each demo request explicitly assigns
   this owner, including repeat requests; confirm that convention is appropriate
   for existing contacts. Set this form's internal submission notification to
   Dr. Zaibis and verify their notification preferences. Keep existing useful
   recipients. Do not turn on visitor marketing follow-up emails.
4. The following mapping is configured after inventorying existing properties.
   Keep `HUBSPOT_PROPERTY_MAP` consistent with the published form.

| Website value | HubSpot property | Type / handling |
| --- | --- | --- |
| First / last name | `firstname` / `lastname` | Single-line text |
| Work email | `email` | Email; same address identifies repeat contact |
| Institution | `company` | Single-line text |
| Job title | `jobtitle` | Optional, omitted if blank |
| Primary interest | `audentra_primary_interest` | Text or enum with website option values |
| What to improve | `audentra_improvement_goal` | Multiline text; optional |
| Pilot interest | `audentra_pilot_interest` | Boolean (`true` / `false`) |
| Stable request UUID | `audentra_submission_id` | Single-line text; hidden; used for reconciliation |
| Request campaign/CTA context | `audentra_request_attribution` | Multiline text; hidden; JSON for this request |
| Follow-up owner | `hubspot_owner_id` | Separate CRM update after form delivery; verified Dr. Zaibis owner ID |

Interest values: `enrollment-readiness`, `enrollment-management`, `admissions`,
`financial-aid`, `enrollment-operations`, `leadership`, `student-experience`.
These custom fields describe the **latest request**; older submissions retain
their individual field snapshots. Do not map them to HubSpot original-source or
first-touch contact properties. The site retains the first consented landing
context for a tab visit, plus the most recent CTA page/placement. Referrers are
origins only; no query strings or paths. The page URL contains no personal data.

5. Configure the demo form for consent to process the inquiry, matching its
   visible website notice. It must not require consent to marketing. The API
   sends an empty communications-consent array. Disable automatic marketing
   contact creation **for this form**, if that setting exists in this account;
   check existing workflows for unwanted subscriptions. Do not unsubscribe or
   change marketing status of existing contacts account-wide. Ensure CAPTCHA
   settings are compatible with server API submission; the existing website
   honeypot/rate limit remains, and API validation is never bypassed.
6. Use the account service key with **`forms`**,
   **`crm.objects.contacts.read`**, and **`crm.objects.contacts.write`** scopes.
   Forms access supports submission/reconciliation; contact read/write is needed
   for the separate owner assignment (no paid workflow). Save its token securely as
   `HUBSPOT_ACCESS_TOKEN` in the marketing project's server environment. HubSpot
   now recommends service keys for new in-account REST integrations; legacy
   private-app creation is being retired. If
   account setup uses API lookups, owner/property read or property-write permissions are temporary setup needs,
   not runtime requirements. Do not
   store personal developer keys or the browser session in the application.
7. Tracking settings: verify `audentra.ai` and `www.audentra.ai` are authorized
   website domains. Leave analytics.audentra.ai and authenticated portals out.
   Preserve account-wide settings used by other sites. Both website forms have
   `data-hs-do-not-collect="true"`; this was confirmed in HubSpot's current
   collector implementation. Test this again after vendor changes.
8. Apply existing outreach migrations, then `npm run contact:migrate` using the
   database administrator connection. This creates only additive private tables
   and an `audentra_contact` role; its generated credential is saved to ignored
   `.env.local`, never printed. Securely configure that `CONTACT_DATABASE_URL`
   in **audentra-website**, not the analytics deployment. Do not deploy admin DB
   credentials to the public website. Confirm `RESEND_API_KEY` and
   `CONTACT_FROM_EMAIL` remain configured.
9. Generate a strong `CRON_SECRET` in secure Vercel environment configuration.
   Configure the values below in the marketing project only. Keep both HubSpot
   flags off until account/form review is finished; deploy to a controlled
   preview for live tests. `NEXT_PUBLIC_ANALYTICS_TEST=1` is local-test-only.

```dotenv
CONTACT_DELIVERY_MODE=durable
CONTACT_DATABASE_URL=<secure restricted Neon connection>
CRON_SECRET=<secure random value>
HUBSPOT_ENABLED=1
HUBSPOT_VERIFIED_PORTAL_ID=52074694
HUBSPOT_DEMO_FORM_ID=<published form GUID>
HUBSPOT_OWNER_ID=<verified Dr. Zaibis owner ID>
HUBSPOT_ACCESS_TOKEN=<secure service key with forms and contact read/write scopes>
HUBSPOT_PROPERTY_MAP={"interest":"audentra_primary_interest","goal":"audentra_improvement_goal","pilot":"audentra_pilot_interest","submissionId":"audentra_submission_id","attribution":"audentra_request_attribution"}
HUBSPOT_TRACKING_ENABLED=1
```

The property map above matches the configured account. All values
except the tracking script's public portal ID remain server-side. Build-time
tracking flags require a rebuild to change. No credentials belong in chat,
logs, Git, browser storage, URLs, or `NEXT_PUBLIC_*` variables.

## Consent, analytics and verification

HubSpot loads once through `next/script` only on the eligible production
marketing site after explicit consent. The initial pageview is automatic;
later pathname navigation is explicit. Pending script load does not enqueue
duplicate views. Decline/withdrawal disables tracking, revokes HubSpot consent,
removes first-party HubSpot tracking cookies and lead attribution storage, and
reloads an active recorder. DNT/GPC are respected. Forms work with blockers or
declined analytics. The HubSpot cookie is included only with affirmative consent.

Vercel and Clarity keep existing event names and allowlisted dimensions. Private
lead campaign text, cookie, form fields and email do not enter those events.
`demo_cta_clicked`, `demo_submitted` (durable acceptance), and a confirmed meeting
are distinct. There is no booking integration, so no booking event was added.

Local automated checks include provider-response mocks and an isolated Postgres
database, plus browser tests for consent, blocked scripts, attribution, retry
IDs, double-clicks, queued messages and existing marketing behavior. These simulations alone do not verify remote delivery; the separate real
HubSpot and notification checks are recorded above.

Review regression: slow mocked email and HubSpot responses totaling nine seconds
reproduced an expired database timeout in the original worker. Database deadlines
are now renewed for each query/transaction; the same test verifies all three jobs
finish once, without losing delivery status. This uses the real Next endpoint and
a disposable Postgres database, with mocked provider delays.

Recorded local results: **21 Node tests passed** with both database and full
Next endpoint tests enabled; **10 Playwright tests passed** (four HubSpot and six
existing marketing tests); lint/type checking and the marketing production build
passed for both marketing and analytics configurations. The endpoint test uses real Postgres through a local Neon transport
adapter and mocked HubSpot/Resend. See [local test instructions](hubspot-testing.md).

For future releases, repeat this controlled verification as needed (completed
checks for this release are recorded above):

1. Arrange a monitored team-owned test email and tell Dr. Zaibis the test window.
   Use name **HUBSPOT INTEGRATION TEST — DO NOT CONTACT** and institution **TEST**.
   Avoid a real prospective customer's address. Verify all optional fields,
   consent, and pilot checked/unchecked cases. Use a controlled test notification
   recipient until the normal recipient is ready for the final check.
2. Submit through `/demo`; record the response submission UUID. Confirm the
   private queue reaches `sent`, then open **Marketing → Forms → Audentra Demo
   Request → Submissions** and **CRM → Contacts**, searching the test email.
   Check every field, Dr. Zaibis's ownership, page/CTA/campaign context, and the
   UUID. Contact properties can reflect the latest request; the form's individual
   submissions preserve history.
3. Repeat with the same email and a new UUID: one intended contact, two intentional
   submissions. Retry the original UUID/double-click: no extra provider delivery
   or conversion. Check HubSpot did not auto-create a captured form submission.
4. Decline consent and block third-party scripts: lead still reaches HubSpot with
   no `hutk` or optional tracking context. Withdraw consent after granting it and
   verify subsequent tracking stops. Check SPA views once per navigation.
5. Verify invalid fields/honeypot do not reach either provider. Simulate timeout,
   429 and 5xx using mocks (do not disrupt the production account): accurate queued
   UI, retained records, retries/reconciliation, and no extra analytics conversion.
6. Confirm the real internal notification arrives at Dr. Zaibis and the existing
   Resend notification reaches hello@audentra.ai. Verify no marketing subscription
   is added. Use the existing Vercel deployment process. Vercel authentication was
   renewed successfully for this release.

Rollback: disable `HUBSPOT_TRACKING_ENABLED` and rebuild to stop script loading.
Disabling `HUBSPOT_ENABLED` blocks HubSpot workers safely; accepted jobs remain
for review. Keep the durable mode/worker running to retain acceptance and email
delivery. Never delete pending/uncertain records as a rollback step.

## Official references used

- [Authenticated Forms Submission API](https://developers.hubspot.com/docs/api-reference/legacy/marketing/forms/v3-legacy/submit-data-authenticated)
- [Read submissions for reconciliation](https://developers.hubspot.com/docs/api-reference/legacy/marketing/forms/v1/get-form-integrations-v1-submissions-forms-form_guid)
- [Forms management](https://developers.hubspot.com/docs/api-reference/legacy/marketing/forms/guide)
- [Tracking code and SPA pageviews](https://developers.hubspot.com/docs/api-reference/latest/account/settings/tracking-code/overview)
- [Do not track](https://developers.hubspot.com/docs/api-reference/latest/account/settings/tracking-code/do-not-track)
- [Revoke cookie consent](https://developers.hubspot.com/docs/api-reference/latest/account/settings/tracking-code/revoke-cookie-consent)
- [Non-HubSpot forms](https://knowledge.hubspot.com/forms/use-non-hubspot-forms)
- [Current collector implementation](https://js.hscollectedforms.net/collectedforms.js) for the per-form exclusion attribute.

- [Contacts API: batch read and update](https://developers.hubspot.com/docs/api-reference/legacy/crm/objects/contacts/guide)

- [HubSpot account service keys](https://developers.hubspot.com/docs/apps/developer-platform/build-apps/authentication/account-service-keys)
- [Legacy private app creation sunset](https://developers.hubspot.com/changelog/legacy-private-app-creation-sunset)
