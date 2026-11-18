import { createHash, createHmac } from "node:crypto";

const pending = "audentra-support-slack-pending";
const source = "audentra-web-support";
export type Report = {
  portal: string;
  email: string;
  subject: string;
  description: string;
};
export type Submission = Report & { reference: string; checkOnly: boolean };
export function parseSubmission(value: unknown): Submission | null {
  if (!value || typeof value !== "object") return null;
  const v = value as Record<string, unknown>;
  const field = (name: string) =>
    typeof v[name] === "string" ? v[name].trim() : "";
  const portal = field("portal"),
    email = field("email"),
    subject = field("subject"),
    description = field("description");
  const reference = field("reference");
  if (
    [email, subject, description].some(
      (text) =>
        text.includes(String.fromCharCode(0)) || /[\uD800-\uDFFF]/u.test(text),
    ) ||
    !["admin-it", "staff", "student"].includes(portal) ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
    email.length > 254 ||
    !subject ||
    subject.length > 160 ||
    !description ||
    description.length > 5000 ||
    !/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(
      reference,
    ) ||
    typeof v.checkOnly !== "boolean"
  )
    return null;
  return {
    portal,
    email,
    subject,
    description,
    reference,
    checkOnly: v.checkOnly,
  };
}

export function supportService(
  env: Record<string, string | undefined> = process.env,
  send: typeof fetch = fetch,
  journal?: {
    claimSlack(key: string): Promise<"send" | "sent" | "wait">;
    slackResult(key: string, sent: boolean, delay: number): Promise<void>;
  },
) {
  const site = env.JIRA_SITE?.replace(/\/$/, ""),
    project = env.JIRA_PROJECT_KEY,
    type = env.JIRA_ISSUE_TYPE_ID;
  if (
    !site ||
    !/^https:\/\/[a-z0-9-]+\.atlassian\.net$/.test(site) ||
    !project ||
    !/^[A-Z][A-Z0-9_]+$/.test(project) ||
    !type ||
    !/^[0-9]+$/.test(type) ||
    !env.JIRA_EMAIL ||
    !env.JIRA_API_TOKEN
  )
    throw Error("Jira configuration unavailable");
  const auth =
    "Basic " +
    Buffer.from(env.JIRA_EMAIL + ":" + env.JIRA_API_TOKEN).toString("base64");
  const validKey = (key: unknown): key is string =>
    typeof key === "string" && new RegExp("^" + project + "-[0-9]+$").test(key);
  function jira(path: string, body: unknown, method = "POST") {
    return send(site + "/rest/api/3/" + path, {
      method,
      headers: { Authorization: auth, "Content-Type": "application/json" },
      body: JSON.stringify(body),
      cache: "no-store",
      redirect: "error",
      signal: AbortSignal.timeout(6000),
    });
  }
  async function search(filter: string, limit: number) {
    const lookup = () =>
      jira("search/jql", {
        jql:
          "project = " +
          project +
          ' AND labels = "' +
          source +
          '" AND ' +
          filter,
        fields: ["key"],
        maxResults: limit,
      });
    // A search can safely be repeated if the connection fails before its response.
    // Leave HTTP rejections (including rate limits) and all writes to their own handling.
    let response: Response;
    try {
      response = await lookup();
    } catch (error) {
      if (
        !(error instanceof TypeError) &&
        !(error instanceof Error && error.name === "TimeoutError")
      )
        throw error;
      await new Promise((resolve) =>
        setTimeout(resolve, 100 + Math.random() * 200),
      );
      response = await lookup();
    }
    if (!response.ok) throw Error("Jira search unavailable");
    const data = await response.json();
    if (!Array.isArray(data.issues))
      throw Error("Invalid Jira search response");
    return data.issues.map((issue: { key?: unknown }) => {
      if (!validKey(issue.key)) throw Error("Invalid issue key");
      return issue.key;
    }) as string[];
  }
  async function notify(key: string): Promise<boolean> {
    try {
      const webhook = env.SLACK_WEBHOOK_URL;
      if (
        !webhook ||
        !/^https:\/\/hooks\.slack\.com\/services\/[\w-]+\/[\w-]+\/[\w-]+$/.test(
          webhook,
        )
      )
        throw Error();
      const action = await journal?.claimSlack(key);
      if (action === "wait") return false;
      if (action !== "sent") {
        const result = await send(webhook, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          redirect: "error",
          signal: AbortSignal.timeout(6000),
          body: JSON.stringify({
            text:
              "New Audentra support ticket <" +
              site +
              "/browse/" +
              key +
              "|" +
              key +
              ">",
            unfurl_links: false,
            unfurl_media: false,
          }),
        });
        if (result.status >= 400 && result.status < 500) {
          const delay = Number(result.headers.get("Retry-After"));
          await journal?.slackResult(
            key,
            false,
            Number.isFinite(delay) ? Math.max(60, delay) : 60,
          );
          return false;
        }
        if (!result.ok || (await result.text()).trim() !== "ok") throw Error();
        await journal?.slackResult(key, true, 0);
      }
      if (
        !(
          await jira(
            "issue/" + key,
            { update: { labels: [{ remove: pending }] } },
            "PUT",
          )
        ).ok
      )
        throw Error();
      return true;
    } catch {
      console.error("support.slack.pending", key);
      return false;
    }
  }
  async function submit(
    report: Submission,
    clientIp?: string,
    beforeCreate?: () => Promise<void>,
  ) {
    const { reference, portal, email, subject, description } = report;
    const marker =
      "support-" +
      createHash("sha256")
        .update(
          JSON.stringify([reference, portal, email, subject, description]),
        )
        .digest("hex");
    let matches: string[];
    try {
      matches = await search('labels = "' + marker + '"', 2);
    } catch {
      return {
        status: 503,
        body: { state: report.checkOnly ? "unknown" : "retry" },
      };
    }
    if (matches.length === 1)
      return { status: 200, body: { state: "received", key: matches[0] } };
    if (report.checkOnly || matches.length > 1)
      return { status: 409, body: { state: "unknown" } };
    const labels = [source, marker, pending];
    if (clientIp) {
      const ipLabel =
        "support-origin-" +
        createHmac("sha256", env.JIRA_API_TOKEN!)
          .update(clientIp)
          .digest("hex")
          .slice(0, 24);
      try {
        if (
          (await search('labels = "' + ipLabel + '" AND created >= -10m', 10))
            .length >= 10
        )
          return { status: 429, body: { state: "limited" } };
      } catch {
        return { status: 503, body: { state: "retry" } };
      }
      labels.push(ipLabel);
    }
    try {
      const paragraphs = [
        "Portal: " + portal,
        "Contact: " + email,
        "Reference: " + reference,
        description,
      ];
      await beforeCreate?.();
      const result = await jira("issue", {
        fields: {
          project: { key: project },
          issuetype: { id: type },
          summary: subject,
          labels,
          description: {
            type: "doc",
            version: 1,
            content: paragraphs.map((text) => ({
              type: "paragraph",
              content: [{ type: "text", text }],
            })),
          },
        },
      });
      if (result.status === 429 && journal) {
        const seconds = Number(result.headers.get("Retry-After"));
        return {
          status: 503,
          body: { state: "retry" },
          delay: Number.isFinite(seconds) ? Math.max(120, seconds) : 120,
        };
      }
      if ([400, 401, 403, 404, 429].includes(result.status))
        return { status: 503, body: { state: "retry" } };
      if (result.status !== 201) throw Error();
      const { key } = await result.json();
      if (!validKey(key)) throw Error();
      if (!journal) await notify(key);
      return { status: 201, body: { state: "received", key } };
    } catch {
      return { status: 503, body: { state: "unknown" } };
    }
  }
  async function retryNotifications(deadline = Infinity) {
    const keys = await search(
      'labels = "' + pending + '" AND created <= -10m ORDER BY updated ASC',
      10,
    );
    let delivered = 0;
    for (const key of keys) {
      if (Date.now() + 13500 > deadline) break;
      if (delivered) await new Promise((resolve) => setTimeout(resolve, 1000));
      if (await notify(key)) delivered++;
    }
    return { found: keys.length, delivered };
  }
  return { submit, notify, retryNotifications };
}
