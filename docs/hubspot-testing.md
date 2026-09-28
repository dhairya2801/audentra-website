# Local HubSpot integration tests

These tests do not send live HubSpot submissions or email. `tests/stub-contact.mjs`
refuses Vercel execution, nonlocal Postgres, real provider keys, and real Neon
connection strings. Never use it in production. The browser tests intercept
third-party requests and the form endpoint.

Basic checks:

```sh
npm test
npm run lint
npm run typecheck
npm run build
```

Database/API tests explicitly skip unless configured. Start a disposable DB:

```sh
docker run --rm -d --name audentra-contact-test \
  -e POSTGRES_HOST_AUTH_METHOD=trust -p 127.0.0.1:55439:5432 postgres:17.5-alpine
TEST_CONTACT_DATABASE_URL=postgresql://postgres@127.0.0.1:55439/postgres \
  npm run test:contact:db
```

That test creates and removes its own schema. The separate full endpoint test
needs these tables in the disposable database (never the company database):

```sh
psql postgresql://postgres@127.0.0.1:55439/postgres <<'SQL'
CREATE TABLE outreach_referrals(code text PRIMARY KEY);
CREATE VIEW public_outreach_referrals AS SELECT code FROM outreach_referrals;
CREATE TABLE outreach_events(code text,visit_id uuid,event_name text,page text,
detail text,source text,medium text,campaign text,content text,channel text,
schema_version int,submission_id uuid UNIQUE);
CREATE TABLE test_provider_calls(destination text,payload jsonb);
SQL
psql postgresql://postgres@127.0.0.1:55439/postgres \
  -f scripts/migrations/003-contact-delivery.sql
psql postgresql://postgres@127.0.0.1:55439/postgres \
  -f scripts/migrations/004-conference-leads.sql
```

Start a test Next server in another terminal. All credentials below are dummy
values; the preload intercepts database and provider HTTP requests.

```sh
NODE_OPTIONS='--import ./tests/stub-contact.mjs' \
TEST_CONTACT_DATABASE_URL=postgresql://postgres@127.0.0.1:55439/postgres \
CONTACT_DATABASE_URL=postgresql://test:test@contact-test.neon.tech/test \
OUTREACH_DATABASE_URL=postgresql://test:test@contact-test.neon.tech/test \
CONTACT_DELIVERY_MODE=durable \
RESEND_API_KEY=local-test-only CONTACT_FROM_EMAIL=test@example.com \
HUBSPOT_ENABLED=1 HUBSPOT_VERIFIED_PORTAL_ID=52074694 \
HUBSPOT_DEMO_FORM_ID=11111111-1111-4111-8111-111111111111 \
HUBSPOT_CONFERENCE_FORM_ID=22222222-2222-4222-8222-222222222222 \
HUBSPOT_CONFERENCE_PROPERTY_MAP='{"event":"test_event","giveaway":"test_giveaway","demoRequested":"test_demo","submissionId":"test_submission","attribution":"test_attribution"}' \
HUBSPOT_OWNER_ID=123 HUBSPOT_ACCESS_TOKEN=local-test-only \
HUBSPOT_PROPERTY_MAP='{"interest":"test_interest","goal":"test_goal","pilot":"test_pilot","submissionId":"test_submission","attribution":"test_attribution"}' \
CRON_SECRET=local-cron-test-only NEXT_BUILD_DIR=.next-contact-api \
npm run dev -- --port 3113
```

Then run all Node tests, including the real endpoint and database checks:

```sh
TEST_CONTACT_DATABASE_URL=postgresql://postgres@127.0.0.1:55439/postgres \
TEST_CONTACT_API=http://localhost:3113 npm test
```

For browser tests, run a separate server:

```sh
NEXT_BUILD_DIR=.next-hubspot-test NEXT_PUBLIC_ANALYTICS_TEST=1 \
HUBSPOT_TRACKING_ENABLED=1 HUBSPOT_VERIFIED_PORTAL_ID=52074694 \
npm run dev -- --port 3112
```

```sh
npx playwright install chromium
TEST_BASE_URL=http://localhost:3112 npx playwright test \
  tests/browser/hubspot.spec.ts tests/browser/marketing.spec.ts
```

The `NEXT_PUBLIC_ANALYTICS_TEST` flag enables local host tracking only for these
intercepted tests. Never configure it on a public deployment. Shut down both
test servers and `docker stop audentra-contact-test` afterward. Next.js may
regenerate `next-env.d.ts` and add temporary build directories to `tsconfig.json`;
do not commit those generated test paths.
