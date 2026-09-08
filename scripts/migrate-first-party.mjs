import nextEnv from "@next/env";
import { neon } from "@neondatabase/serverless";
import { readFile } from "node:fs/promises";
nextEnv.loadEnvConfig(process.cwd());
const connection =
  process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;
if (!connection) throw new Error("DATABASE_URL required");
const direct = new URL(connection);
direct.hostname = direct.hostname.replace("-pooler.", ".");
const sql = neon(direct.href);
const statements = (
  await readFile("scripts/migrations/002-first-party-analytics.sql", "utf8")
)
  .split(";")
  .map((s) => s.trim())
  .filter(Boolean);
await sql.transaction(statements.map((statement) => sql.query(statement)));
console.log(
  "First-party migration applied; historical rows retained with unknown attribution.",
);
