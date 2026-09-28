# Audentra marketing analytics

This setup covers the public marketing website only. It must not be installed in authenticated university/student/staff portals.

## Architecture

The same Next.js repository deploys to two Vercel projects:

- `audentra-website` (existing): marketing pages, contact API, Vercel Web Analytics, and consented Microsoft Clarity project `yetbx84cq5`.
- `audentra-analytics`: set `AUDENTRA_APP=analytics`. The root serves the team workspace; `/login` and `/api/auth/*` manage its password session. `/api/dashboard` makes authenticated server-side calls to Vercel. Intended domain: `analytics.audentra.ai`.

A free Neon Postgres database, `audentra-outreach`, is the source of truth for individual links, private contact/organization/notes/status/date fields, and first-party per-referral activity. `outreach_referrals` holds private records; `outreach_events` holds nullable opaque codes, random tab-visit IDs, allowlisted event names, public paths, controlled detail, server receipt times, approved source/medium/campaign/content/channel snapshots, schema version, and a random submission ID for accepted conversions. It now captures general campaign and direct traffic as well as individual referrals. These tables are joined only inside the authenticated dashboard.

The marketing deployment uses a separate `audentra_marketing` database role. It can SELECT the `public_outreach_referrals` view (code/channel/campaign only) and INSERT anonymous event records. It cannot SELECT or UPDATE private contacts. `/api/referral?r=CODE` explicitly projects only those public fields. `/api/analytics/event` accepts a bounded, same-origin, allowlisted payload, excludes known scanner user agents, and has a per-instance request limit. A lookup against the public view resolves known codes; an unknown code becomes NULL. Partial unique indexes deduplicate browser milestones by visit/event/detail and server conversions by submission ID. The collector rejects browser-supplied conversion events. No IPs or raw user agents are persisted in the ledger. These first-party referral metrics work independently of the Vercel custom-event plan.

Aggregate site traffic and optional bottom-of-page vendor comparisons use the official [Vercel Web Analytics API](https://vercel.com/docs/analytics/web-analytics-api), verified September 7, 2026. Specifically, `GET /v1/query/web-analytics/{visits|events}/aggregate` with `projectId`, team scope, `since`, `until`, `by`, `limit`, and OData `filter`. Only production data is requested; queries are cached server-side for two minutes. The API returns aggregated rows, not individual sessions. Tokens never reach the browser. Clarity remains the place for heatmaps and session recordings.

Core reporting works on Vercel Hobby. Neon powers sessions, engagement, product interest, page reach, CTA activity, demo/newsletter funnel milestones, conversions, attribution, outreach performance, and referral drill-down. Vercel supplies site-wide visitors, page views, daily traffic, top pages, and referring sites through its supported visits API. Optional Vercel custom-event comparison cards remain at the bottom; their Pro/Enterprise requirement never replaces or blocks the Neon cards. No Web Analytics Plus UTM dimensions are queried. A Vercel reporting token is needed only for the vendor reports. Missing credentials or unavailable data are explicit, not replaced with fixtures.

## Exact tracking inventory

Vercel automatically records page views with device/browser/country and native referrer/UTM dimensions. Pages must be in the public-route allowlist. Before sending, our hook removes URL fragments and all unapproved query values. Unknown routes are excluded. We deliberately do not instrument every click, decorative animation, hover, scroll percentage, legal link, or mock-product interaction.

| Custom event | Trigger and deduplication | Why |
| --- | --- | --- |
| `visit_started` | First visible page in a tab visit; once per visit | Record an opened visit |
| `page_viewed` | A visible public path; once per path per visit; Neon only | Compare page reach within campaign/referral segments without duplicating Vercel page views |
| `engaged_visit` | At least 15 focused/visible seconds on a page plus a trusted pointer, keyboard, or scroll interaction; once per visit | Separate sustained interest from a quick/scanner open |
| `product_interest` | Product link selected, product page arrived at, or platform capability tab selected; once per product per visit | Compare Morning Brew, EDward, Action Center, Student Experience, and Enrollment Readiness |
| `demo_cta_clicked` | Internal link to `/demo`; once per placement per visit (`header`, `footer`, `hero`, `body`) | Compare where walkthrough intent is generated |
| `demo_viewed` | `/demo` visible; once per visit | Walkthrough funnel milestone |
| `demo_form_started` | First form change; once per visit | Distinguish viewing from beginning a request |
| `demo_submitted` | In durable mode, private request + delivery jobs + conversion commit in one Postgres transaction, deduplicated by submission ID. Legacy mode counts Resend acceptance. | Count accepted requests without claiming HubSpot delivery or a booked meeting |
| `conference_started` | First conference form change | Booth signup intent, separate from demos |
| `conference_submitted` | Conference acceptance commits with private delivery jobs; deduplicated by submission UUID | Conference signups; optional demo choice remains in HubSpot |
| `newsletter_started` | First newsletter form change; once per visit | Newsletter intent |
| `newsletter_submitted` | Same server-side acceptance and submission-ID deduplication as demos; email-only delivery | Lower-intent conversion, separate from demo requests |
| `form_error` | Contact API/network failure; once per form type per visit | Detect funnel friction without transmitting error text |
| `email_intent` | A `mailto:` link selected; once per visit | Contact intent only, never presented as an email sent |

Each Vercel custom event has exactly these eight properties: `source`, `medium`, `campaign`, `content`, `referral`, `channel`, `page`, `detail`. All are controlled vocabulary from code/manifest; no DOM text or user form values. `channel` distinguishes LinkedIn post from DM even when both share the founder-outreach campaign. `detail` holds the product, CTA placement, or form type where applicable; otherwise `none`.

All eligible browser milestones are sent asynchronously to the first-party ledger with their random tab-visit ID and sanitized attribution snapshot, including visits with no referral code. Conversions are written by the contact handler instead of the public collector. The browser still mirrors accepted conversions to optional Vercel and consented Clarity; those mirrors are not the dashboard conversion authority. That ID never goes to Vercel or Clarity. The same event names are sent to Clarity only when its consented recorder is loaded. Clarity gets `source`, `medium`, `campaign`, `content`, and `referral` custom tags, plus `product` on interest. There is no `identify` call, email hash, IP-based identity, persistent person ID, or cross-device matching.

## Attribution and outreach links

HubSpot integration details are in [hubspot.md](hubspot.md). HubSpot loads only
after explicit analytics consent and verified account configuration. Existing
Vercel/Clarity events retain their controlled vocabulary. Private lead campaign
context and the consented HubSpot cookie never enter those events. The same
submission UUID correlates the private outbox, accepted conversion, and HubSpot
form submission. Delivery retries do not emit another conversion. No meeting
booking event exists; the dashboard's manually maintained `meeting-booked`
outreach status remains a separate operator-entered status.

`lib/analytics/outreach.json` contains the one-time seed of 20 random six-character codes and the approved general campaign conventions. The database is the source of truth after migration. New codes are generated with cryptographic randomness by the authenticated dashboard (10 hexadecimal characters), with database uniqueness checks. Migration inserts missing seed codes only and never overwrites assigned records. Referral example: `https://audentra.ai/?r=CODE`. Newly generated codes are resolved against the database without redeploying. Unknown codes are ignored; initial seeded codes remain a safe fallback if metadata resolution is temporarily unavailable. Contacts belong in the dashboard; exports of them are sensitive.

General campaign links use `utm_source`, `utm_medium`, `utm_campaign`, and `utm_content`. The workbook and dashboard library currently offer four links: LinkedIn, WhatsApp, Email, and Founder Network. Previously shared approved conventions remain recognized for backward compatibility and can still be assigned to referral records. `utm_term` is deliberately unused. Individual referral URLs stay **opaque**, containing only `?r=CODE`. Assign the channel and optional campaign privately in the dashboard; the marketing site resolves only the approved categories. General campaign URLs remain available for broad posts. Existing combined code/UTM links remain compatible, but contact details must never be appended.

Only approved values are accepted. Do not improvise names, organizations, emails, or free text in UTMs. Create individual codes directly in the dashboard. To add entirely new campaign/channel categories, extend the approved campaign manifest and redeploy. The CSV/Excel export buttons and local export script read saved database records. Exports are point-in-time snapshots; editing one does not update the database, and there is no spreadsheet import flow.

Attribution lives in `sessionStorage` under `au-visit-v1`, with an in-memory fallback. It survives internal navigation, reloads, and form submission in the same tab. After 30 minutes without tracked activity, the next event starts a new visit. A new explicit campaign/referral link replaces the visit attribution. Channel/campaign metadata is resolved at visit initialization; editing a referral affects future visits, not previously recorded Vercel event properties. No long-lived first-touch cookie or retroactive campaign reassignment. A fresh direct visit does not revive an earlier campaign. Browser-created tabs can copy sessionStorage, so tab visits are an approximation, not unique people.

Source precedence: approved UTMs → known individual code → known external referrer bucket → direct/unknown. Only a small recognized source bucket is copied into custom properties (Google/Bing/LinkedIn/other-external); raw external referrer URLs are not copied. Vercel's own native referral reports remain separate. Internal navigation does not overwrite the stored source.

The contact API sanitizes optional attribution again and adds it to the transactional email, alongside the contact information provided for that request. Contact email is not an analytics event. The API never sends submitted PII to Vercel or Clarity. Existing honeypot submissions return a generic success without `accepted`, so they do not count as conversions. Resend receives an idempotency key reused on retries of unchanged form data. The first-party conversion is deduplicated by submission ID; multiple distinct accepted submissions in one visit are separate requests. Next `after()` keeps analytics outside the delivery response, with failure isolated and logged without contact data. There is no infinite retry queue: an unavailable database can still lose telemetry. A decline, DNT, or GPC suppresses first-party analytics, including attributed conversion recording; consequently analytics is not a complete substitute for the operational Resend inbox.

## Reading the dashboard

**Referral links** is the operational workspace. Authenticated users can create codes; assign/edit contact, organization, channel, optional campaign, date sent, status, and notes; copy the opaque URL; search contact/organization/code/notes; filter by channel/status; and export all records to CSV or XLSX. Statuses: unassigned, not sent, sent, replied, meeting booked, closed. Records are saved with version checks so concurrent edits produce a conflict instead of silently overwriting a teammate's changes. There is intentionally no email-sending, lead scoring, enrichment, or CRM automation.

The referral table shows all-time first-party visits, engagement, CTA visits, demo requests, and last visit. Opening a record adds products explored, demo views, form starts, form errors, newsletter requests, and last activity. CTA visits count distinct tab visits with a demo CTA. Last visit/activity use server receipt times, not a visitor-supplied clock. This register is independent of the Vercel API's date-filtered overview. Events, records, and metrics persist in Postgres; there is no JSON-file storage fallback. Database failures are explicit and do not discard unsaved edits.

The overview leads with **Neon** metrics and supports 7/30-day windows (UTC, current day partial). Sessions count distinct anonymous visit IDs with any event received in that window. Engagement, product interest, CTA, and funnel milestones count distinct sessions. Demo requests count accepted submissions; conversion rate divides sessions with an accepted request by observed sessions, so retries and multiple requests do not inflate the rate. Daily sessions must not be summed to infer people or the period-wide distinct count.

Outreach Performance groups by **source, medium, campaign, content, channel, or referral code**, ranks by conversion and engagement, and supports a selected row filter for all Neon reports. A referral can also be opened from the private register. Captured attribution shows its persisted source/medium/campaign/content/channel/referral combinations. Each event carries the browser visit's captured snapshot; later editing a contact's channel/campaign does not rewrite prior analytics. The UI never joins private names or notes into analytics event payloads.

The funnel is aggregate milestone counts within the window, not an ordered person-level cohort. A visitor can enter directly on `/demo`, skip the CTA step, or have activity across date boundaries. Pages explored counts distinct sessions on each public path and follows the outreach filter. It is separate from Vercel page views. All current values are aggregated in Postgres, rather than downloading raw activity to the browser. Attribution combinations are capped at 100 for display; page/product panels show the top eight.

Site-wide Vercel visitors, page views, trend, top pages, and referrers remain below the core Neon reports. They do not follow an outreach filter and do not require Vercel custom-event or UTM reporting. Anonymous Vercel visitors and first-party sessions have different definitions. Clarity is a link to consented recordings/heatmaps, not a source of numeric dashboard totals. Optional Pro custom-event comparison cards appear last; core analytics continues working when they are unavailable.

### Audit and historical coverage

Before this change, the deployed `outreach_events` table had only `code` (required), `visit_id`, `event_name`, `page`, `detail`, and `received_at`. UTMs were retained in tab storage and transactional contact context, but **were not persisted in Neon**. Non-referral activity was never inserted there. The overview incorrectly relied on Vercel custom events, including its demo request card. The live audit found two referral visits and one `demo_submitted` event already in Neon; switching report authority exposes that existing conversion.

Migration `scripts/migrations/002-first-party-analytics.sql` makes `code` nullable and adds `source`, `medium`, `campaign`, `content`, `channel`, `schema_version`, and `submission_id`. These source/medium/campaign/content columns persist the sanitized UTM values or resolved/referrer/direct attribution as applicable. `visit_id` remains the anonymous tab-session key. Historical records retain `schema_version=1` and unknown attribution dimensions. The migration does not infer old campaigns from the current referral assignment or fabricate missing direct/UTM visits. New records use version 2. Historical browser-confirmed conversions remain visible, while new conversions come from the server.

## Privacy and robustness

Clarity loads asynchronously only after explicit analytics consent, with `consentv2` analytics storage granted and advertising storage denied. Both forms use `data-clarity-mask`. Unknown query parameters, fragments, or paths prevent recorder initialization because Clarity reads URLs itself. It is not initialized on the private dashboard. [Microsoft's Consent V2 reference](https://learn.microsoft.com/en-us/clarity/setup-and-installation/clarity-consent-api-v2) describes the supported calls.

The footer always offers Analytics preferences. Declining disables the integration; withdrawing from a running recorder sends denied consent and reloads to unload it. Do Not Track and Global Privacy Control are respected. Basic Vercel traffic analytics starts before a choice, without Clarity; the tab-scoped attribution storage is disclosed in the website privacy page. Clarity recordings are a consented subset and will differ from Vercel counts. The existing site's general legal-policy placeholder remains and should be finalized separately.

Tracking is restricted to production `audentra.ai`/`www.audentra.ai`. Local tests explicitly opt in via `NEXT_PUBLIC_ANALYTICS_TEST=1`; never set that variable in Vercel. Known bot/crawler/preview user agents are excluded by our integration. JavaScript-only visible opens and the engagement threshold reduce scanner noise; sophisticated automated browsers can still qualify. Ad blockers, consent, JavaScript failures, storage restrictions, and privacy tools can undercount. No fingerprinting or attempt to bypass blocking.

Analytics event calls are exception-isolated. Consent/attribution storage is optional. No analytics request is awaited by form delivery or navigation. The lightweight Vercel package handles traffic; Clarity is deferred. Dashboard code and credentials are server-gated and its styles are scoped separately from the landing page.

## Internal security

Password: random 192-bit value, stored only in ignored `deliverables/dashboard-access.local.txt`. The deployment stores only a salted scrypt hash in `ANALYTICS_PASSWORD_HASH`, plus an independent 256-bit `ANALYTICS_SESSION_SECRET`. No plaintext password is committed or sent as a client environment variable.

Authentication uses constant-time comparisons and HMAC-signed, 8-hour, HttpOnly, Secure (production), SameSite=Strict, host-only cookies. Changing either authentication secret invalidates sessions. Origin checks protect login/logout. Login attempts have a bounded, minute-long per-instance limit; for distributed abuse controls add a Vercel Firewall rate-limit rule on `/api/auth/login`. The cryptographically random password remains the main brute-force defense; this is a small shared team login, not an identity platform.

The Next proxy protects dashboard requests, and the root server component plus data route independently require authentication. Marketing mode returns 404 for dashboard/auth endpoints. The dashboard sends no-store, noindex/nofollow/noarchive, anti-framing, and same-origin referrer headers (cross-origin referrers are suppressed; same-origin form Origin remains available for CSRF checks). Public/private behavior is selected by server environment, not a spoofable hostname. Preview deployments use the same authentication. No public directory contains published reports, tokens, the workbook, or the password. Export handlers independently authenticate, emit no-store attachment responses, and neutralize spreadsheet-formula prefixes in text. Private values never pass through the marketing analytics module. All database queries use bound parameters.

## Environment variables

| Variable | Deployment | Secret? |
| --- | --- | --- |
| `NEXT_PUBLIC_CLARITY_PROJECT_ID=yetbx84cq5` | Marketing; dashboard link | No |
| `AUDENTRA_APP=analytics` | Dashboard only | No |
| `ANALYTICS_PROJECT_ID=prj_7hKggdteZhmSVqhOXcMlco2gP3AW` | Dashboard | No; this is the marketing project |
| `ANALYTICS_TEAM_ID=team_Xm5oncd0CL6TYHpf9P12oC1s` | Dashboard | No |
| `ANALYTICS_VERCEL_TOKEN` | Dashboard only | Yes; least-scope token that can read the marketing project |
| `ANALYTICS_PASSWORD_HASH` | Dashboard only | Yes |
| `ANALYTICS_SESSION_SECRET` | Dashboard only | Yes |
| `DATABASE_URL` | Dashboard only | Yes; Neon owner connection, provisioned on production only |
| `OUTREACH_DATABASE_URL` | Marketing only | Yes; restricted public-metadata/insert credential |
| `RESEND_API_KEY`, `CONTACT_FROM_EMAIL` | Existing marketing project only | Existing email credentials/config |

Copy selected values from `.env.example`, rather than setting `AUDENTRA_APP=analytics` on the marketing project. `.env.local`, all `*.local.txt`, and generated deliverables are ignored by Git; `.vercelignore` excludes them from deployments. Never put secrets in `NEXT_PUBLIC_*`, a URL, or this documentation.

## Local verification

```sh
npm ci
npm run lint
npm run typecheck
npm test
npm run build
npm run outreach:migrate # requires DATABASE_URL; idempotent schema/seed initialization
npm run outreach:workbook # exports the current database, not the seed manifest
npx playwright install chromium
```

Run marketing browser tests against a local server:

```sh
NEXT_PUBLIC_ANALYTICS_TEST=1 npm run dev -- --webpack --port 3100
npx playwright test tests/browser/marketing.spec.ts
```

Run dashboard browser tests against the second local server, with generated auth secrets in `.env.local` and the private access file present:

```sh
AUDENTRA_APP=analytics NEXT_BUILD_DIR=.next-test-dashboard npm run dev -- --webpack --port 3101
TEST_BASE_URL=http://localhost:3101 npx playwright test tests/browser/dashboard.spec.ts tests/browser/outreach.spec.ts
```

Marketing browser tests intercept third-party analytics and contact delivery; they never send test PII or actual contact emails. The outreach integration test creates a temporary fake contact through the authenticated UI, verifies opaque public resolution, first-party event deduplication, database privileges and exports, then deletes only its own test record/events. Tests cover attribution across navigation, safe properties, duplicate events, consent withdrawal, failure isolation, private endpoints, CSRF, authentication, and responsive layout. The dashboard fixture is test-only. To verify a real production visit, use a fresh tab and one workbook code, select a product, actively read for 15 seconds, open `/demo`, and inspect Vercel events by `eventData/referral`. Submit only an intentional contact request. Confirm no PII in network event payloads; confirm Clarity is absent until allowed, then filter its recordings by the `referral` custom tag. Allow upstream processing plus two minutes of dashboard caching.

## Database operation and deployment

Neon resource: `audentra-outreach`, Free plan, US East (`iad1`). Dashboard project: `prj_5LeDjPQRiJtIADW8NtJF2jiT02Ki`. Provisioning was performed through the Vercel Marketplace after the owner accepted the terms. The database is connected to **production only**, so routine preview deployments cannot edit production contact records. Use a separate Neon branch and credentials when testing deployed preview changes that need records.

`npm run outreach:migrate` creates the schema, indexes, public view, and restricted role, then inserts 20 seed codes only if absent. It saves the generated restricted connection to ignored `.env.local`; configure that value as `OUTREACH_DATABASE_URL` on the marketing project. Re-running migrations does not rotate credentials or overwrite contacts. Never reuse `DATABASE_URL` for the public marketing role. The dashboard's production database connection is managed by the Neon integration.

The first-party ledger stores no names, emails, organizations, notes, status, or date-sent fields. Those belong only in private records and exports. Lifetime referral metrics and records currently remain until the team removes them; there is no automatic deletion job. Review retention as outreach grows, clear private fields for removal requests, and manage database backups/retention in Neon. Vendor analytics retention follows each vendor plan. The ledger is a browser-behavior signal, not tamper-proof proof of human identity or revenue: public collection endpoints can be imitated, consent/blockers can undercount, and the client does not retry failed telemetry indefinitely.

Export the register from the dashboard at any time. The initial requested workbook is `deliverables/audentra-outreach-links.xlsx`. Current exports contain saved records, the four current general campaign URLs/UTMs, and a usage tab. It is ignored by Git and deployment uploads, and should remain private once populated.

## Domain handoff

`analytics.audentra.ai` is attached to the dashboard project. In Bluehost add a **CNAME** with host **analytics** and target **0f6cd3bb42f9e3ae.vercel-dns-017.com** (the current Vercel recommendation). No Bluehost DNS was modified by this implementation. Vercel account SSO protection is disabled on this project so the team can use the application's password login; every private page and data endpoint remains protected by that login.

## Testing this revision

The additive migration was tested twice against an isolated local Postgres copy of the original schema, with assertions for history preservation, nullable referrals, duplicate browser events, retry deduplication, and two distinct conversions within one session. Neon control-plane credentials were unavailable; existing database credentials were used to apply the tested migration. Run `psql -v ON_ERROR_STOP=1 -f tests/migration.sql` only in an empty disposable local database. Apply the production migration with `node scripts/migrate-first-party.mjs` (uses an unpooled connection).

`tests/browser/first-party.spec.ts` exercises a general email UTM link, a newly generated individual referral, and a direct visit through multiple pages, meaningful engagement, demo CTA, form start, and accepted form submission. It checks actual persisted dimensions, server conversion deduplication, PII absence, filtered Neon reports, and rejection of forged public conversion events, then deletes only its own test visit IDs and temporary code. This test requires `TEST_STUB_EMAIL=1` and a local-only Node fetch stub for Resend (the production application has no mock-delivery switch). All other requests, including Neon persistence, are real. Never point this test's contact submissions at the live site.

Reproduce the local end-to-end test with these commands (in separate terminals; use the ignored local auth/database environment already configured):

```sh
NEXT_PUBLIC_ANALYTICS_TEST=1 RESEND_API_KEY=local-test-only CONTACT_FROM_EMAIL=test@example.com NODE_OPTIONS=--import=./tests/stub-resend.mjs npm run dev -- --webpack --port 3100
AUDENTRA_APP=analytics NEXT_BUILD_DIR=.next-test-dashboard npm run dev -- --webpack --port 3101
TEST_STUB_EMAIL=1 npx playwright test tests/browser/first-party.spec.ts
```

`tests/stub-resend.mjs` is excluded from deployment uploads and refuses to run on Vercel. It replaces only the email-provider request when the explicit local test key is in use.
