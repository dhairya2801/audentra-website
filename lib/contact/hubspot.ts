import { processingConsent, type Lead } from "./model";

export const intendedPortal = "52074694";
export type HubSpotConfig = {
  portal: string;
  form: string;
  owner: string;
  properties: Record<string, string>;
};
export function hubspotConfig(): HubSpotConfig | null {
  if (process.env.HUBSPOT_ENABLED !== "1") return null;
  if (
    process.env.HUBSPOT_VERIFIED_PORTAL_ID !== intendedPortal ||
    !process.env.HUBSPOT_ACCESS_TOKEN
  )
    throw new Error("HUBSPOT_ACCOUNT_NOT_VERIFIED");
  const form = process.env.HUBSPOT_DEMO_FORM_ID || "";
  if (!/^[a-f0-9-]{36}$/i.test(form))
    throw new Error("HUBSPOT_FORM_NOT_CONFIGURED");
  const owner = process.env.HUBSPOT_OWNER_ID || "";
  if (!/^\d+$/.test(owner)) throw new Error("HUBSPOT_OWNER_NOT_CONFIGURED");
  const properties = JSON.parse(process.env.HUBSPOT_PROPERTY_MAP || "{}");
  for (const key of [
    "interest",
    "goal",
    "pilot",
    "submissionId",
    "attribution",
  ]) {
    if (
      typeof properties[key] !== "string" ||
      !/^[a-z][a-z0-9_]{0,99}$/.test(properties[key])
    )
      throw new Error("HUBSPOT_PROPERTIES_NOT_CONFIGURED");
  }
  if (
    new Set(Object.values(properties)).size !==
      Object.values(properties).length ||
    Object.values(properties).some((p) =>
      [
        "email",
        "firstname",
        "lastname",
        "company",
        "jobtitle",
        "hubspot_owner_id",
      ].includes(String(p)),
    )
  )
    throw new Error("HUBSPOT_PROPERTIES_CONFLICT");
  return { portal: intendedPortal, form, owner, properties };
}
export function hubspotPayload(
  lead: Lead,
  config: HubSpotConfig,
  submittedAt: number,
) {
  const values: Record<string, string> = {
    email: lead.email,
    firstname: lead.firstName,
    lastname: lead.lastName,
    company: lead.institution,
    jobtitle: lead.title,
    [config.properties.interest]: lead.interest,
    [config.properties.goal]: lead.goal,
    [config.properties.pilot]: String(lead.pilot),
    [config.properties.submissionId]: lead.id,
    [config.properties.attribution]: lead.attribution
      ? JSON.stringify(lead.attribution)
      : "",
  };
  return {
    submittedAt: String(submittedAt),
    fields: Object.entries(values)
      .filter(([, value]) => value !== "")
      .map(([name, value]) => ({ objectTypeId: "0-1", name, value })),
    context: {
      pageUri: `https://www.audentra.ai${lead.page}`,
      pageName: "Audentra demo request",
      ...(lead.hutk ? { hutk: lead.hutk } : {}),
    },
    // Responding to this request is separate from subscribing to marketing.
    legalConsentOptions: {
      consent: {
        consentToProcess: true,
        text: processingConsent,
        communications: [],
      },
    },
  };
}
export type DeliveryResult = {
  state: "sent" | "retry" | "uncertain" | "blocked";
  code: string;
  delay?: number;
};
export async function sendHubSpot(
  config: HubSpotConfig,
  payload: unknown,
  fetcher = fetch,
): Promise<DeliveryResult> {
  // Also gate workers: a saved job is not permission to send to an unverified account.
  if (
    process.env.HUBSPOT_ENABLED !== "1" ||
    process.env.HUBSPOT_VERIFIED_PORTAL_ID !== config.portal ||
    config.portal !== intendedPortal ||
    !process.env.HUBSPOT_ACCESS_TOKEN
  )
    return { state: "blocked", code: "hubspot_configuration" };
  try {
    const response = await fetcher(
      `https://api.hsforms.com/submissions/v3/integration/secure/submit/${config.portal}/${config.form}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.HUBSPOT_ACCESS_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(8000),
        redirect: "error",
      },
    );
    if (response.ok) return { state: "sent", code: "accepted" };
    if (response.status === 429)
      return {
        state: "retry",
        code: "hubspot_429",
        delay: retryAfter(response.headers.get("retry-after")),
      };
    // Forms API has no documented idempotency key. Never blindly resend a POST
    // after a timeout/5xx: the provider may already have accepted it.
    return {
      state:
        response.status >= 500 || response.status === 408
          ? "uncertain"
          : "blocked",
      code: `hubspot_${response.status}`,
    };
  } catch {
    return { state: "uncertain", code: "hubspot_transport" };
  }
}
export function retryAfter(value: string | null, now = Date.now()) {
  const seconds =
    value && /^\d+$/.test(value)
      ? Number(value)
      : value
        ? (Date.parse(value) - now) / 1000
        : 60;
  return Math.max(60, Number.isFinite(seconds) ? seconds : 60);
}

export async function assignOwner(
  config: HubSpotConfig,
  email: string,
  fetcher = fetch,
): Promise<DeliveryResult> {
  if (
    process.env.HUBSPOT_ENABLED !== "1" ||
    process.env.HUBSPOT_VERIFIED_PORTAL_ID !== config.portal ||
    config.portal !== intendedPortal ||
    !process.env.HUBSPOT_ACCESS_TOKEN
  )
    return { state: "blocked", code: "owner_configuration" };
  const headers = {
    Authorization: `Bearer ${process.env.HUBSPOT_ACCESS_TOKEN}`,
    "Content-Type": "application/json",
  };
  const failure = (response: Response): DeliveryResult => ({
    state:
      response.status === 429 ||
      response.status >= 500 ||
      response.status === 408 ||
      response.status === 404
        ? "retry"
        : "blocked",
    code: `owner_${response.status}`,
    delay: retryAfter(response.headers.get("retry-after")),
  });
  const signal = AbortSignal.timeout(8000);
  try {
    // Email belongs in the private request body, never in a URL or log.
    let data;
    for (let attempt = 0; attempt < 4; attempt++) {
      if (attempt > 0) await new Promise((resolve) => setTimeout(resolve, 750));
      signal.throwIfAborted();
      const read = await fetcher(
        "https://api.hubapi.com/crm/v3/objects/contacts/batch/read",
        {
          method: "POST",
          headers,
          body: JSON.stringify({
            idProperty: "email",
            inputs: [{ id: email }],
            properties: ["hubspot_owner_id"],
          }),
          signal,
          redirect: "error",
        },
      );
      if (!read.ok) return failure(read);
      data = await read.json();
      if (data.results?.length) break;
      // HubSpot may acknowledge the form before its contact becomes readable.
      // Briefly poll within the same eight-second budget before durable retry.
    }
    if (!data?.results?.length)
      return { state: "retry", code: "owner_contact_pending" };
    if (data.results.length !== 1 || !/^\d+$/.test(data.results[0].id))
      return { state: "blocked", code: "owner_contact_ambiguous" };
    const contact = data.results[0];
    if (contact.properties?.hubspot_owner_id === config.owner)
      return { state: "sent", code: "owner_already_assigned" };
    const update = await fetcher(
      `https://api.hubapi.com/crm/v3/objects/contacts/${contact.id}`,
      {
        method: "PATCH",
        headers,
        body: JSON.stringify({
          properties: { hubspot_owner_id: config.owner },
        }),
        signal,
        redirect: "error",
      },
    );
    return update.ok
      ? { state: "sent", code: "owner_assigned" }
      : failure(update);
  } catch {
    // Repeating assignment to the same owner is safe; no form is resubmitted.
    return { state: "retry", code: "owner_transport" };
  }
}
export async function reconcileHubSpot(
  config: HubSpotConfig,
  submissionId: string,
  fetcher = fetch,
): Promise<boolean> {
  if (
    !process.env.HUBSPOT_ACCESS_TOKEN ||
    process.env.HUBSPOT_VERIFIED_PORTAL_ID !== config.portal
  )
    return false;
  let after = "";
  const signal = AbortSignal.timeout(8000);
  for (let page = 0; page < 10; page++) {
    const url = new URL(
      `https://api.hubapi.com/form-integrations/v1/submissions/forms/${config.form}`,
    );
    url.searchParams.set("limit", "50");
    if (after) url.searchParams.set("after", after);
    const response = await fetcher(url, {
      headers: { Authorization: `Bearer ${process.env.HUBSPOT_ACCESS_TOKEN}` },
      signal,
      redirect: "error",
    });
    if (!response.ok) return false;
    const data = await response.json();
    if (
      data.results?.some((r: { values?: { name: string; value: string }[] }) =>
        r.values?.some(
          (v) =>
            v.name === config.properties.submissionId &&
            v.value === submissionId,
        ),
      )
    )
      return true;
    after = data.paging?.next?.after;
    if (!after) break;
  }
  return false;
}
