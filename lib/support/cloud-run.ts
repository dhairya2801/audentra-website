import { createHash } from "node:crypto";

const jwtTokenType = "urn:ietf:params:oauth:token-type:jwt";
let cachedIdentity: { key: string; token: string; until: number } | undefined;

function tokenExpiry(token: string) {
  try {
    const { exp } = JSON.parse(Buffer.from(token.split(".")[1], "base64url").toString("utf8"));
    return typeof exp === "number" && Number.isFinite(exp) ? exp * 1000 : 0;
  } catch {
    return 0;
  }
}

async function mintIdentity(
  oidcToken: string,
  provider: string,
  serviceAccount: string,
  audience: string,
  signal: AbortSignal,
) {
  const exchange = await fetch("https://sts.googleapis.com/v1/token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      audience: provider,
      grantType: "urn:ietf:params:oauth:grant-type:token-exchange",
      requestedTokenType: "urn:ietf:params:oauth:token-type:access_token",
      scope: "https://www.googleapis.com/auth/cloud-platform",
      subjectTokenType: jwtTokenType,
      subjectToken: oidcToken,
    }),
    redirect: "error",
    signal,
  });
  if (!exchange.ok) throw new Error("Support identity exchange failed");
  const { access_token: accessToken } = await exchange.json();
  if (typeof accessToken !== "string" || !accessToken) {
    throw new Error("Support identity exchange did not return a token");
  }

  const identityEndpoint = new URL(
    "/v1/projects/-/serviceAccounts/" + encodeURIComponent(serviceAccount) + ":generateIdToken",
    "https://iamcredentials.googleapis.com",
  );
  const identity = await fetch(identityEndpoint, {
    method: "POST",
    headers: {
      Authorization: "Bearer " + accessToken,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ audience, includeEmail: true }),
    redirect: "error",
    signal,
  });
  if (!identity.ok) throw new Error("Support Cloud Run identity request failed");
  const { token: identityToken } = await identity.json();
  if (typeof identityToken !== "string" || !identityToken) {
    throw new Error("Support Cloud Run identity request did not return a token");
  }

  return identityToken;
}

export async function relaySupportSubmission(
  oidcToken: string,
  ip: string | undefined,
  submission: unknown,
) {
  const service = new URL(process.env.SUPPORT_CLOUD_RUN_URL ?? "");
  const provider = process.env.SUPPORT_GCP_WIF_PROVIDER ?? "";
  const serviceAccount = process.env.SUPPORT_GCP_INVOKER_EMAIL ?? "";
  if (
    service.protocol !== "https:" ||
    !service.hostname.endsWith(".run.app") || service.port ||
    service.href !== service.origin + "/" ||
    !/^\/\/iam\.googleapis\.com\/projects\/\d+\/locations\/global\/workloadIdentityPools\/[\w-]+\/providers\/[\w-]+$/.test(provider) ||
    !/^[\w-]+@[\w-]+\.iam\.gserviceaccount\.com$/.test(serviceAccount) ||
    !oidcToken
  ) {
    throw new Error("Support Cloud Run relay is not configured");
  }

  const signal = AbortSignal.timeout(45_000);
  // Reuse only a previously exchanged identity for the same caller and audience.
  const key = createHash("sha256")
    .update(JSON.stringify([oidcToken, provider, serviceAccount, service.origin]))
    .digest("hex");
  let identityToken = cachedIdentity?.key === key && cachedIdentity.until > Date.now()
    ? cachedIdentity.token
    : undefined;
  if (!identityToken) {
    identityToken = await mintIdentity(oidcToken, provider, serviceAccount, service.origin, signal);
    const now = Date.now();
    const until = Math.min(now + 60_000, tokenExpiry(oidcToken) - 5_000, tokenExpiry(identityToken) - 5_000);
    if (until > now) cachedIdentity = { key, token: identityToken, until };
  }

  const headers = new Headers({
    "Content-Type": "application/json",
    "X-Serverless-Authorization": "Bearer " + identityToken,
  });
  if (ip) headers.set("X-Audentra-Support-Origin-IP", ip);
  const response = await fetch(new URL("/api/support", service), {
    method: "POST",
    headers,
    body: JSON.stringify(submission),
    redirect: "error",
    signal,
  });
  if ((response.status === 401 || response.status === 403) && cachedIdentity?.token === identityToken)
    cachedIdentity = undefined;
  return response;
}
