import nextEnv from "@next/env";
import { neon } from "@neondatabase/serverless";
import { randomBytes } from "node:crypto";
import { readFile, appendFile } from "node:fs/promises";
nextEnv.loadEnvConfig(process.cwd());
if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL required");
const sql = neon(process.env.DATABASE_URL);
try {
  const statements = (
    await readFile("scripts/migrations/003-contact-delivery.sql", "utf8")
  )
    .split(";")
    .map((s) => s.trim())
    .filter(Boolean);
  await sql.transaction(statements.map((s) => sql.query(s)));
  const roles =
    await sql`SELECT rolname FROM pg_roles WHERE rolname='audentra_contact'`;
  if (!roles.length) {
    const password = randomBytes(32).toString("hex");
    await sql.query(
      `CREATE ROLE audentra_contact LOGIN PASSWORD '${password}'`,
    );
    const url = new URL(process.env.DATABASE_URL);
    url.username = "audentra_contact";
    url.password = password;
    await appendFile(".env.local", `\nCONTACT_DATABASE_URL=${url.href}\n`, {
      mode: 0o600,
    });
  }
  await sql`GRANT USAGE ON SCHEMA public TO audentra_contact`;
  await sql`GRANT SELECT,INSERT ON contact_submissions TO audentra_contact`;
  await sql`GRANT SELECT,INSERT,UPDATE ON contact_deliveries TO audentra_contact`;
  await sql`GRANT SELECT ON public_outreach_referrals TO audentra_contact`;
  await sql`GRANT INSERT ON outreach_events TO audentra_contact`;
  console.log(
    "Contact delivery schema ready. Restricted credential saved locally if newly created. No private lead access granted to analytics collection role.",
  );
} catch {
  console.error(
    "Contact migration failed. Check database access and existing outreach migrations; secrets suppressed.",
  );
  process.exitCode = 1;
}
