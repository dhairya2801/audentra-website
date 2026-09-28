import nextEnv from "@next/env";
import { neon } from "@neondatabase/serverless";
nextEnv.loadEnvConfig(process.cwd());
const connection = process.env.CONTACT_DATABASE_URL;
if (!connection) throw new Error("CONTACT_DATABASE_URL required");
const sql = neon(connection);
const [action = "status", id, destination, evidence] = process.argv.slice(2);
try {
  if (action === "status") {
    console.table(
      await sql`SELECT destination,state,count(*)::int AS count,min(updated_at) AS oldest_update FROM contact_deliveries GROUP BY destination,state ORDER BY destination,state`,
    );
    console.table(
      await sql`SELECT submission_id,destination,state,attempts,last_code,next_attempt_at FROM contact_deliveries WHERE state<>'sent' ORDER BY updated_at LIMIT 100`,
    );
  } else if (["retry", "confirm-sent"].includes(action)) {
    if (
      !/^[0-9a-f-]{36}$/i.test(id || "") ||
      !["email", "hubspot", "owner"].includes(destination) ||
      evidence !== "--provider-checked"
    )
      throw new Error(
        "Usage: contact-ops.mjs retry|confirm-sent SUBMISSION_UUID email|hubspot|owner --provider-checked",
      );
    // Operator must inspect the provider record first. The CLI deliberately
    // cannot reset a sent/in-flight delivery or mutate the original payload.
    const rows =
      await sql`UPDATE contact_deliveries SET state=${action === "retry" ? "retry" : "sent"},last_code=${action === "retry" ? "operator_confirmed_absent" : "operator_confirmed_sent"},next_attempt_at=now(),attempts=0,lease_id=NULL,lease_until=NULL,updated_at=now() WHERE submission_id=${id} AND destination=${destination} AND state IN ('blocked','uncertain','retry') RETURNING submission_id,destination,state`;
    console.table(rows);
  } else throw new Error("Unknown command");
} catch {
  console.error(
    "Contact operation failed. Check command arguments, provider evidence and database permissions. Secrets and payloads suppressed.",
  );
  process.exitCode = 1;
}
