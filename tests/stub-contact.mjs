// Local-only transport adapter: real disposable Postgres, mocked providers.
// Start Next with NODE_OPTIONS='--import ./tests/stub-contact.mjs'.
import pg from "pg";
if (process.env.VERCEL || !process.env.TEST_CONTACT_DATABASE_URL)
  throw new Error("Contact stub requires an isolated local database");
const dbUrl = new URL(process.env.TEST_CONTACT_DATABASE_URL);
if (!["127.0.0.1", "localhost"].includes(dbUrl.hostname))
  throw new Error("Local database only");
const pool = new pg.Pool({ connectionString: dbUrl.href });
const originalFetch = globalThis.fetch;
globalThis.fetch = async (input, init) => {
  const url = new URL(
    typeof input === "string"
      ? input
      : input instanceof URL
        ? input.href
        : input.url,
  );
  if (url.hostname.endsWith(".neon.tech")) {
    const headers = new Headers(init?.headers);
    if (
      !headers.get("Neon-Connection-String")?.includes("contact-test.neon.tech")
    )
      throw new Error("Real DB access forbidden in contact tests");
    const body = JSON.parse(init.body);
    const c = await pool.connect();
    try {
      await c.query("BEGIN");
      const results = [];
      for (const q of body.queries || [body]) {
        const r = await c.query({
          text: q.query,
          values: q.params,
          rowMode: "array",
        });
        results.push({
          fields: r.fields,
          rows: r.rows.map((row) =>
            row.map((v) =>
              v == null
                ? null
                : v instanceof Date
                  ? v.toISOString()
                  : typeof v === "object"
                    ? JSON.stringify(v)
                    : String(v),
            ),
          ),
          rowCount: r.rowCount,
          command: r.command,
        });
      }
      await c.query("COMMIT");
      return Response.json(body.queries ? { results } : results[0]);
    } catch {
      await c.query("ROLLBACK");
      return Response.json(
        { message: "Test database rejected query" },
        { status: 400 },
      );
    } finally {
      c.release();
    }
  }
  if (
    ["api.hsforms.com", "api.hubapi.com", "api.resend.com"].includes(
      url.hostname,
    )
  ) {
    if (
      new Headers(init?.headers).get("authorization") !==
      "Bearer local-test-only"
    )
      throw new Error("Real provider credential forbidden in tests");
    if (url.hostname === "api.hubapi.com") {
      if (url.pathname.endsWith("/batch/read"))
        return Response.json({ results: [{ id: "999", properties: {} }] });
      if (init?.method === "PATCH") {
        await pool.query(
          "INSERT INTO test_provider_calls(destination,payload) VALUES('owner',$1)",
          [init.body],
        );
        return Response.json({ id: "999" });
      }
      const r = await pool.query(
        "SELECT payload FROM test_provider_calls WHERE destination='hubspot'",
      );
      return Response.json({
        results: r.rows.map((r) => ({ values: r.payload.fields })),
      });
    }
    const payload = JSON.parse(init.body),
      destination = url.hostname === "api.hsforms.com" ? "hubspot" : "email";
    await pool.query(
      "INSERT INTO test_provider_calls(destination,payload) VALUES($1,$2)",
      [destination, JSON.stringify(payload)],
    );
    if (
      destination === "hubspot" &&
      payload.fields.some((f) => f.value === "TEST_TIMEOUT")
    )
      throw new Error("Simulated lost response after acceptance");
    return Response.json({ id: "test-accepted" });
  }
  return originalFetch(input, init);
};
