import { neon } from "@neondatabase/serverless";
import { randomBytes } from "node:crypto";
import { readFile, appendFile } from "node:fs/promises";
import nextEnv from "@next/env";
const { loadEnvConfig } = nextEnv;
loadEnvConfig(process.cwd());
if (!process.env.DATABASE_URL)
  throw new Error("Set DATABASE_URL in .env.local before migrating.");
const sql = neon(process.env.DATABASE_URL);
await sql`CREATE TABLE IF NOT EXISTS outreach_referrals (
 code text PRIMARY KEY CHECK (code ~ '^[a-f0-9]{6,10}$'), contact_name varchar(120) NOT NULL DEFAULT '', organization varchar(160) NOT NULL DEFAULT '',
 channel text NOT NULL DEFAULT 'none', campaign text NOT NULL DEFAULT 'none', date_sent date, notes varchar(2000) NOT NULL DEFAULT '',
 status text NOT NULL DEFAULT 'unassigned' CHECK (status IN ('unassigned','not-sent','sent','replied','meeting-booked','closed')),
 version integer NOT NULL DEFAULT 1, created_at timestamptz NOT NULL DEFAULT now(),updated_at timestamptz NOT NULL DEFAULT now())`;
await sql`CREATE TABLE IF NOT EXISTS outreach_events (
 code text NOT NULL REFERENCES outreach_referrals(code), visit_id uuid NOT NULL, event_name text NOT NULL,
 page text NOT NULL, detail text NOT NULL, received_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE (visit_id,event_name,detail))`;
await sql`CREATE INDEX IF NOT EXISTS outreach_events_code_date ON outreach_events(code,received_at DESC)`;
await sql`CREATE OR REPLACE VIEW public_outreach_referrals AS SELECT code,channel,campaign FROM outreach_referrals`;
const manifest = JSON.parse(
  await readFile("lib/analytics/outreach.json", "utf8"),
);
await sql.transaction(
  manifest.referrals.map(
    (code) =>
      sql`INSERT INTO outreach_referrals(code) VALUES (${code}) ON CONFLICT(code) DO NOTHING`,
  ),
);
// Create once; subsequent migrations never rotate credentials or overwrite edits.
const roles =
  await sql`SELECT rolname FROM pg_roles WHERE rolname='audentra_marketing'`;
if (!roles.length) {
  const password = randomBytes(32).toString("hex");
  // Password is generated hex, never user input. PostgreSQL DDL cannot bind it.
  await sql.query(
    `CREATE ROLE audentra_marketing LOGIN PASSWORD '${password}'`,
  );
  const url = new URL(process.env.DATABASE_URL);
  url.username = "audentra_marketing";
  url.password = password;
  await appendFile(".env.local", `\nOUTREACH_DATABASE_URL=${url.href}\n`, {
    mode: 0o600,
  });
  console.log("Created restricted marketing credential in ignored .env.local.");
}
await sql`GRANT USAGE ON SCHEMA public TO audentra_marketing`;
await sql`GRANT SELECT ON public_outreach_referrals TO audentra_marketing`;
await sql`GRANT INSERT ON outreach_events TO audentra_marketing`;
console.log(
  "Outreach schema ready. Initial codes inserted only if absent; existing records preserved.",
);
