CREATE TABLE IF NOT EXISTS audentra_support_inbox (
 reference uuid PRIMARY KEY, fingerprint text NOT NULL, report jsonb, origin text,
 created_at timestamptz NOT NULL DEFAULT now(), due timestamptz NOT NULL DEFAULT now(),
 intent boolean NOT NULL DEFAULT false, owner uuid, jira_key text UNIQUE, notified boolean NOT NULL DEFAULT false
);
CREATE INDEX IF NOT EXISTS support_pending_due ON audentra_support_inbox(due) WHERE jira_key IS NULL;
CREATE INDEX IF NOT EXISTS support_origin_created ON audentra_support_inbox(origin,created_at);
CREATE TABLE IF NOT EXISTS audentra_support_slack (
 jira_key text PRIMARY KEY, state text NOT NULL CHECK(state IN ('sending','sent','retry')), due timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS audentra_support_clock (id integer PRIMARY KEY CHECK(id=1), due timestamptz NOT NULL);
INSERT INTO audentra_support_clock VALUES (1,now()) ON CONFLICT DO NOTHING;

CREATE INDEX IF NOT EXISTS support_notify_due ON audentra_support_inbox(due) WHERE jira_key IS NOT NULL AND NOT notified;
