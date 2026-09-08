-- Run only in an empty local test database with psql -v ON_ERROR_STOP=1.
CREATE TABLE outreach_referrals(code text PRIMARY KEY, contact_name text);
CREATE TABLE outreach_events(code text NOT NULL REFERENCES outreach_referrals,visit_id uuid NOT NULL,event_name text NOT NULL,page text NOT NULL,detail text NOT NULL,received_at timestamptz NOT NULL DEFAULT now(),UNIQUE(visit_id,event_name,detail));
INSERT INTO outreach_referrals VALUES('abcdef','Private fixture');
INSERT INTO outreach_events(code,visit_id,event_name,page,detail) VALUES('abcdef','11111111-1111-4111-8111-111111111111','demo_submitted','/demo','none');
\ir ../scripts/migrations/002-first-party-analytics.sql
\ir ../scripts/migrations/002-first-party-analytics.sql
INSERT INTO outreach_events(code,visit_id,event_name,page,detail,source,schema_version) VALUES(NULL,'22222222-2222-4222-8222-222222222222','visit_started','/','none','linkedin',2) ON CONFLICT DO NOTHING;
INSERT INTO outreach_events(code,visit_id,event_name,page,detail,source,schema_version) VALUES(NULL,'22222222-2222-4222-8222-222222222222','visit_started','/','none','linkedin',2) ON CONFLICT DO NOTHING;
INSERT INTO outreach_events(code,visit_id,event_name,page,detail,submission_id,schema_version) VALUES(NULL,'22222222-2222-4222-8222-222222222222','demo_submitted','/demo','none','33333333-3333-4333-8333-333333333333',2) ON CONFLICT DO NOTHING;
INSERT INTO outreach_events(code,visit_id,event_name,page,detail,submission_id,schema_version) VALUES(NULL,'22222222-2222-4222-8222-222222222222','demo_submitted','/demo','none','33333333-3333-4333-8333-333333333333',2) ON CONFLICT DO NOTHING;
INSERT INTO outreach_events(code,visit_id,event_name,page,detail,submission_id,schema_version) VALUES(NULL,'22222222-2222-4222-8222-222222222222','demo_submitted','/demo','none','44444444-4444-4444-8444-444444444444',2) ON CONFLICT DO NOTHING;
DO $$ BEGIN
 IF (SELECT count(*) FROM outreach_events) <> 4 THEN RAISE EXCEPTION 'deduplication failed'; END IF;
 IF NOT EXISTS(SELECT 1 FROM outreach_events WHERE schema_version=1 AND source='unknown' AND code='abcdef') THEN RAISE EXCEPTION 'history was changed'; END IF;
END $$;
