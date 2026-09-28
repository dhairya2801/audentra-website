-- Private lead records. Never grant these tables to audentra_marketing.
CREATE TABLE IF NOT EXISTS contact_submissions (
 id uuid PRIMARY KEY,
 fingerprint text NOT NULL,
 source text NOT NULL CHECK (source IN ('newsletter','product-walkthrough')),
 lead jsonb NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS contact_deliveries (
 submission_id uuid NOT NULL REFERENCES contact_submissions(id),
 destination text NOT NULL CHECK (destination IN ('hubspot','email','owner')),
 payload jsonb NOT NULL,
 config jsonb NOT NULL DEFAULT '{}',
 state text NOT NULL DEFAULT 'pending' CHECK (state IN ('pending','in_flight','sent','retry','uncertain','blocked')),
 attempts integer NOT NULL DEFAULT 0,
 next_attempt_at timestamptz NOT NULL DEFAULT now(),
 lease_id uuid,
 lease_until timestamptz,
 first_attempt_at timestamptz,
 updated_at timestamptz NOT NULL DEFAULT now(),
 last_code text,
 PRIMARY KEY (submission_id,destination)
);
CREATE INDEX IF NOT EXISTS contact_deliveries_due ON contact_deliveries(next_attempt_at) WHERE state IN ('pending','retry','uncertain');
