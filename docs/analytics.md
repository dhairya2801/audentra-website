# Audentra marketing analytics

This setup covers the public marketing website only. It must not be installed in authenticated university/student/staff portals.

## Architecture

The same Next.js repository deploys to two Vercel projects:

- `audentra-website` (existing): marketing pages, contact API, Vercel Web Analytics, and consented Microsoft Clarity project `yetbx84cq5`.
- `audentra-analytics`: set `AUDENTRA_APP=analytics`. The root serves the team workspace; `/login` and `/api/auth/*` manage its password session. `/api/dashboard` makes authenticated server-side calls to Vercel. Intended domain: `analytics.audentra.ai`.

A free Neon Postgres database, `audentra-outreach`, is the source of truth for individual links, private contact/organization/notes/status/date fields, and first-party per-referral activity. `outreach_referrals` holds private records; `outreach_events` holds only opaque codes, random tab-visit IDs, allowlisted event names, public paths, controlled detail, and server receipt times. These tables are joined only inside the authenticated dashboard.

The marketing deployment uses a separate `audentra_marketing` database role. It can SELECT the `public_outreach_referrals` view (code/channel/campaign only) and INSERT anonymous event records. It cannot SELECT or UPDATE private contacts. `/api/referral?r=CODE` explicitly projects only those public fields. `/api/analytics/event` accepts a bounded, same-origin, allowlisted payload, excludes known scanner user agents, and has a per-instance request limit. A database foreign key rejects unknown codes; a unique visit/event/detail constraint deduplicates retries. No IPs or raw user agents are persisted in the ledger. These first-party referral metrics work independently of the Vercel custom-event plan.

Traffic and broader event reports use the official [Vercel Web Analytics API](https://vercel.com/docs/analytics/web-analytics-api), verified September 7, 2026. Specifically, `GET /v1/query/web-analytics/{visits|events}/aggregate` with `projectId`, team scope, `since`, `until`, `by`, `limit`, and OData `filter`. Only production data is requested; queries are cached server-side for two minutes. The API returns aggregated rows, not individual sessions. Tokens never reach the browser. Clarity remains the place for heatmaps and session recordings.

Current account prerequisites: Web Analytics must be enabled on the marketing project. [Custom events require Pro or Enterprise](https://vercel.com/docs/analytics/custom-events); the team was on Hobby at implementation. A dedicated Vercel token must be configured on the dashboard. A missing token or API error is displayed explicitly, without fabricated data. Empty successful reports are shown as zero/empty, not errors.

## Exact tracking inventory

Vercel automatically records page views with device/browser/country and native referrer/UTM dimensions. Pages must be in the public-route allowlist. Before sending, our hook removes URL fragments and all unapproved query values. Unknown routes are excluded. We deliberately do not instrument every click, decorative animation, hover, scroll percentage, legal link, or mock-product interaction.

| Custom event | Trigger and deduplication | Why |
| --- | --- | --- |
| `visit_started` | First visible page in a tab visit; once per visit | Record an opened outreach link and provide the visit denominator |
| `engaged_visit` | At least 15 focused/visible seconds on a page plus a trusted pointer, keyboard, or scroll interaction; once per visit | Separate sustained interest from a quick/scanner open |
| `product_interest` | Product link selected, product page arrived at, or platform capability tab selected; once per product per visit | Compare Morning Brew, EDward, Action Center, Student Experience, and Enrollment Readiness |
| `demo_cta_clicked` | Internal link to `/demo`; once per placement per visit (`header`, `footer`, `hero`, `body`) | Compare where walkthrough intent is generated |
| `demo_viewed` | `/demo` visible; once per visit | Walkthrough funnel milestone |
| `demo_form_started` | First form change; once per visit | Distinguish viewing from beginning a request |
| `demo_submitted` | Browser receives `accepted: true` from the contact API after Resend accepts delivery; once per visit | Meaningful conversion, not a button click |
| `newsletter_started` | First newsletter form change; once per visit | Newsletter intent |
| `newsletter_submitted` | Server-confirmed Resend acceptance; once per visit | Lower-intent conversion, separate from demo requests |
| `form_error` | Contact API/network failure; once per form type per visit | Detect funnel friction without transmitting error text |
| `email_intent` | A `mailto:` link selected; once per visit | Contact intent only, never presented as an email sent |

Each custom event has exactly these eight properties: `source`, `medium`, `campaign`, `content`, `referral`, `channel`, `page`, `detail`. All are controlled vocabulary from code/manifest; no DOM text or user form values. `channel` distinguishes LinkedIn post from DM even when both share the founder-outreach campaign. `detail` holds the product, CTA placement, or form type where applicable; otherwise `none`.

For a known referral, the event is also sent asynchronously to the first-party ledger, with its random tab-visit ID. That ID never goes to Vercel or Clarity. The same event names are sent to Clarity only when its consented recorder is loaded. Clarity gets `source`, `medium`, `campaign`, `content`, and `referral` custom tags, plus `product` on interest. There is no `identify` call, email hash, IP-based identity, persistent person ID, or cross-device matching.

## Attribution and outreach links

`lib/analytics/outreach.json` contains the one-time seed of 20 random six-character codes and the approved general campaign conventions. The database is the source of truth after migration. New codes are generated with cryptographic randomness by the authenticated dashboard (10 hexadecimal characters), with database uniqueness checks. Migration inserts missing seed codes only and never overwrites assigned records. Referral example: `https://audentra.ai/?r=CODE`. Newly generated codes are resolved against the database without redeploying. Unknown codes are ignored; initial seeded codes remain a safe fallback if metadata resolution is temporarily unavailable. Contacts belong in the dashboard; exports of them are sensitive.

General campaign links use `utm_source`, `utm_medium`, `utm_campaign`, and `utm_content`. The workbook and dashboard library contain complete URLs for LinkedIn posts, LinkedIn DMs, personal email, general email outreach, WhatsApp, founder network, higher-ed outreach, investor/advisor outreach, partners, conference follow-up, and X posts. `utm_term` is deliberately unused. Individual referral URLs stay **opaque**, containing only `?r=CODE`. Assign the channel and optional campaign privately in the dashboard; the marketing site resolves only the approved categories. General campaign URLs remain available for broad posts. Existing combined code/UTM links remain compatible, but contact details must never be appended.

Only approved values are accepted. Do not improvise names, organizations, emails, or free text in UTMs. Create individual codes directly in the dashboard. To add entirely new campaign/channel categories, extend the approved campaign manifest and redeploy. The CSV/Excel export buttons and local export script read saved database records. Exports are point-in-time snapshots; editing one does not update the database, and there is no spreadsheet import flow.

Attribution lives in `sessionStorage` under `au-visit-v1`, with an in-memory fallback. It survives internal navigation, reloads, and form submission in the same tab. After 30 minutes without tracked activity, the next event starts a new visit. A new explicit campaign/referral link replaces the visit attribution. Channel/campaign metadata is resolved at visit initialization; editing a referral affects future visits, not previously recorded Vercel event properties. No long-lived first-touch cookie or retroactive campaign reassignment. A fresh direct visit does not revive an earlier campaign. Browser-created tabs can copy sessionStorage, so tab visits are an approximation, not unique people.

Source precedence: approved UTMs → known individual code → known external referrer bucket → direct/unknown. Only a small recognized source bucket is copied into custom properties (Google/Bing/LinkedIn/other-external); raw external referrer URLs are not copied. Vercel's own native referral reports remain separate. Internal navigation does not overwrite the stored source.

The contact API sanitizes optional attribution again and adds it to the transactional email, alongside the contact information provided for that request. Contact email is not an analytics event. The API never sends submitted PII to Vercel or Clarity. Existing honeypot submissions return a generic success without `accepted`, so they do not count as conversions. Resend receives an idempotency key reused on retries of unchanged form data. The browser deduplicates conversions per visit; no claim of globally exactly-once delivery is made.

## Reading the dashboard

**Referral links** is the operational workspace. Authenticated users can create codes; assign/edit contact, organization, channel, optional campaign, date sent, status, and notes; copy the opaque URL; search contact/organization/code/notes; filter by channel/status; and export all records to CSV or XLSX. Statuses: unassigned, not sent, sent, replied, meeting booked, closed. Records are saved with version checks so concurrent edits produce a conflict instead of silently overwriting a teammate's changes. There is intentionally no email-sending, lead scoring, enrichment, or CRM automation.

The referral table shows all-time first-party visits, engagement, CTA visits, demo requests, and last visit. Opening a record adds products explored, demo views, form starts, form errors, newsletter requests, and last activity. CTA visits count distinct tab visits with a demo CTA. Last visit/activity use server receipt times, not a visitor-supplied clock. This register is independent of the Vercel API's date-filtered overview. Events, records, and metrics persist in Postgres; there is no JSON-file storage fallback. Database failures are explicit and do not discard unsaved edits.

The overview below uses Vercel reports:

- Visitors/page views and traffic trends are always site-wide Vercel metrics. Vercel anonymous visitors are not identified people and should not be summed across time buckets.
- 7/30-day windows include today (partial), in UTC. Page views compare against an equal preceding period when retention permits it.
- Outreach table groups by **channel**, **campaign**, or **referral**. It compares opened/engaged visits, demo-page visits, accepted demo requests, newsletter requests, and engaged/opened rate. Ranks by demo requests, engaged visits, then opened visits.
- Selecting a table row filters event cards, product interest, intent/friction, and funnel. The UI explicitly keeps traffic charts site-wide. The outreach comparison table remains unfiltered so another segment can be selected.
- Referral grouping includes all 20 codes, including unused links. With the upstream API unavailable it shows that error instead of pretending all codes have zero visits.
- The walkthrough funnel is **aggregate milestone counts**, not an ordered person-level cohort. Most visits naturally follow opened → demo page → form started → accepted. Events across the date boundary, copied tabs, and blocked/dropped events can affect ratios. Newsletter is separate. Do not interpret more engagement as a confirmed lead.
- Grouped reports request up to 100 values; Vercel may put overflow in `Others`. Small page/referrer/product panels show the top eight. These are bounded top-value reports, not exhaustive exports.
- Backend timeouts, plan errors, expired credentials, malformed responses, and rate limits have explicit unavailable states. Live reports never include sample data. Browser screenshot tests use fixtures only inside tests.

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

Export the register from the dashboard at any time. The initial requested workbook is `deliverables/audentra-outreach-links.xlsx`, with 20 unassigned records, general campaign URLs/UTMs, and a usage tab. It is ignored by Git and deployment uploads, and should remain private once populated.

## Domain handoff

`analytics.audentra.ai` is attached to the dashboard project. In Bluehost add a **CNAME** with host **analytics** and target **0f6cd3bb42f9e3ae.vercel-dns-017.com** (the current Vercel recommendation). No Bluehost DNS was modified by this implementation. Vercel account SSO protection is disabled on this project so the team can use the application's password login; every private page and data endpoint remains protected by that login.
