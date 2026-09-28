import "server-only";
import { neon } from "@neondatabase/serverless";
import { contactStore } from "./store";
export function getContactStore() {
  if (!process.env.CONTACT_DATABASE_URL)
    throw new Error("CONTACT_DATABASE_NOT_CONFIGURED");
  const sql = neon(process.env.CONTACT_DATABASE_URL, {
    fetchOptions: { signal: AbortSignal.timeout(8000) },
  });
  return contactStore({
    query: (text, values = []) => sql.query(text, values),
    transaction: (queries) =>
      sql.transaction(queries.map(([text, values]) => sql.query(text, values))),
  });
}
