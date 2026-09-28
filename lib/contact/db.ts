import "server-only";
import { neon } from "@neondatabase/serverless";
import { contactStore } from "./store";
export function getContactStore() {
  if (!process.env.CONTACT_DATABASE_URL)
    throw new Error("CONTACT_DATABASE_NOT_CONFIGURED");
  const sql = neon(process.env.CONTACT_DATABASE_URL);
  // A worker can outlive any single database timeout while calling providers.
  // Each operation needs a fresh deadline so it can still persist the result.
  const options = () => ({
    fetchOptions: { signal: AbortSignal.timeout(8000) },
  });
  return contactStore({
    query: (text, values = []) => sql.query(text, values, options()),
    transaction: (queries) =>
      sql.transaction(
        queries.map(([text, values]) => sql.query(text, values)),
        options(),
      ),
  });
}
