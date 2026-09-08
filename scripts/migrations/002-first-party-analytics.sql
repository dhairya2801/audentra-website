-- Additive migration: retain historical rows and unknown historical UTMs.
ALTER TABLE outreach_events ALTER COLUMN code DROP NOT NULL;
ALTER TABLE outreach_events ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'unknown';
ALTER TABLE outreach_events ADD COLUMN IF NOT EXISTS medium text NOT NULL DEFAULT 'unknown';
ALTER TABLE outreach_events ADD COLUMN IF NOT EXISTS campaign text NOT NULL DEFAULT 'unknown';
ALTER TABLE outreach_events ADD COLUMN IF NOT EXISTS content text NOT NULL DEFAULT 'unknown';
ALTER TABLE outreach_events ADD COLUMN IF NOT EXISTS channel text NOT NULL DEFAULT 'unknown';
ALTER TABLE outreach_events ADD COLUMN IF NOT EXISTS schema_version smallint NOT NULL DEFAULT 1;
ALTER TABLE outreach_events ADD COLUMN IF NOT EXISTS submission_id uuid;
ALTER TABLE outreach_events DROP CONSTRAINT IF EXISTS outreach_events_visit_id_event_name_detail_key;
CREATE UNIQUE INDEX IF NOT EXISTS outreach_events_browser_unique ON outreach_events(visit_id,event_name,detail) WHERE submission_id IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS outreach_events_submission_unique ON outreach_events(submission_id) WHERE submission_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS outreach_events_received ON outreach_events(received_at);
CREATE INDEX IF NOT EXISTS outreach_events_visit ON outreach_events(visit_id);
