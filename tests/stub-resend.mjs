if (process.env.VERCEL)
  throw new Error("Email test stub must never run on Vercel");
const originalFetch = globalThis.fetch;
globalThis.fetch = async (input, init) => {
  const url =
    typeof input === "string"
      ? input
      : input instanceof URL
        ? input.href
        : input.url;
  if (url === "https://api.resend.com/emails") {
    if (init?.headers?.Authorization !== "Bearer local-test-only")
      throw new Error("Test stub must use the local-only key");
    return Response.json({ id: "local-test-accepted" });
  }
  return originalFetch(input, init);
};
