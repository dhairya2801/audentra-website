import "server-only";
import { neon } from "@neondatabase/serverless";
export function dashboardDb() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_NOT_CONFIGURED");
  return neon(process.env.DATABASE_URL, {
    fetchOptions: { signal: AbortSignal.timeout(8000) },
  });
}
export function marketingDb() {
  if (!process.env.OUTREACH_DATABASE_URL)
    throw new Error("DATABASE_NOT_CONFIGURED");
  return neon(process.env.OUTREACH_DATABASE_URL, {
    fetchOptions: { signal: AbortSignal.timeout(4000) },
  });
}
