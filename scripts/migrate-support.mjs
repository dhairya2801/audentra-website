import pg from "pg";
import { readFile } from "node:fs/promises";
// Deliberately require separate migration credentials; never silently migrate a live DB.
const connectionString = process.env.SUPPORT_MIGRATION_DATABASE_URL;
if (!connectionString)
  throw Error(
    "Set SUPPORT_MIGRATION_DATABASE_URL for the intended environment",
  );
const role = process.env.SUPPORT_RUNTIME_ROLE;
if (role && !/^[a-z_][a-z0-9_]{0,62}$/.test(role))
  throw Error("Invalid SUPPORT_RUNTIME_ROLE");
const client = new pg.Client({
  connectionString,
  connectionTimeoutMillis: 5000,
});
await client.connect();
try {
  await client.query("BEGIN");
  await client.query(
    await readFile(
      new URL("./migrations/005-support-inbox.sql", import.meta.url),
      "utf8",
    ),
  );
  if (role)
    await client.query(
      'GRANT SELECT, INSERT, UPDATE ON audentra_support_inbox, audentra_support_slack, audentra_support_clock TO "' +
        role +
        '"',
    );
  await client.query("COMMIT");
  console.log("Support migration applied.");
} catch (error) {
  await client.query("ROLLBACK");
  throw error;
} finally {
  await client.end();
}
