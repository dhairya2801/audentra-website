// Run in a Cloud Run Job whose identity can invoke only the support service.
const service = new URL(process.env.SUPPORT_CLOUD_RUN_URL ?? "");
const secret = process.env.CRON_SECRET;
if (service.protocol !== "https:" || !service.hostname.endsWith(".run.app") || service.port ||
    service.href !== service.origin + "/" || !secret) {
  throw new Error("Set the Cloud Run support service URL and retry secret");
}
const signal = AbortSignal.timeout(45_000);
const endpoint = new URL("http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/identity");
endpoint.searchParams.set("audience", service.origin);
endpoint.searchParams.set("format", "full");
const tokenResponse = await fetch(endpoint, {
  headers: { "Metadata-Flavor": "Google" },
  redirect: "error",
  signal,
});
if (!tokenResponse.ok) throw new Error("Could not obtain the support job identity");
const token = (await tokenResponse.text()).trim();
if (!token) throw new Error("Support job identity was empty");
const response = await fetch(new URL("/api/support/delivery", service), {
  headers: {
    "X-Serverless-Authorization": "Bearer " + token,
    Authorization: "Bearer " + secret,
  },
  redirect: "error",
  signal,
});
if (!response.ok) throw new Error("Support delivery returned HTTP " + response.status);
console.log("Support retry completed");
