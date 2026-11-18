import assert from "node:assert/strict";
import test from "node:test";
import {
  parseSubmission,
  supportService,
  type Submission,
} from "../lib/support/intake";
const report: Submission = {
  portal: "student",
  email: "reporter@example.test",
  subject: "Course missing",
  description: "The course list is empty.",
  reference: "4e6bfed2-10f8-43e1-850c-d010a163bb73",
  checkOnly: false,
};
const env = {
  JIRA_SITE: "https://mock.atlassian.net",
  JIRA_EMAIL: "test@example.test",
  JIRA_API_TOKEN: "synthetic",
  JIRA_PROJECT_KEY: "TECH",
  JIRA_ISSUE_TYPE_ID: "10048",
  SLACK_WEBHOOK_URL: "https://hooks.slack.com/services/TTEST/BTEST/testing",
};
function fixture() {
  const state = {
    outage: false,
    searchTimeouts: 0,
    loseResponse: false,
    slackDown: false,
    creates: 0,
    sends: 0,
    marked: false,
    labels: [] as string[],
  };
  const transport: typeof fetch = async (url, init) => {
    const body = JSON.parse(String(init?.body));
    if (String(url).endsWith("/search/jql")) {
      if (state.searchTimeouts > 0) {
        state.searchTimeouts--;
        throw new DOMException("Simulated transport timeout", "TimeoutError");
      }
      if (state.outage) return new Response(null, { status: 503 });
      return Response.json({
        issues: state.labels.some(
          (label) =>
            label !== "audentra-web-support" &&
            body.jql.includes('"' + label + '"'),
        )
          ? [{ key: "TECH-1" }]
          : [],
      });
    }
    if (String(url).endsWith("/issue")) {
      state.creates++;
      assert.equal(body.fields.issuetype.id, "10048");
      assert.equal(body.fields.project.key, "TECH");
      assert.ok(JSON.stringify(body.fields.description).includes(report.email));
      assert.ok(
        JSON.stringify(body.fields.description).includes(report.description),
      );
      state.labels = body.fields.labels;
      if (state.loseResponse) throw Error("timeout after commit");
      return Response.json({ key: "TECH-1" }, { status: 201 });
    }
    if (url === env.SLACK_WEBHOOK_URL) {
      if (state.slackDown) return new Response(null, { status: 429 });
      assert.ok(body.text.includes("https://mock.atlassian.net/browse/TECH-1"));
      state.sends++;
      return new Response("ok");
    }
    assert.equal(
      String(url),
      "https://mock.atlassian.net/rest/api/3/issue/TECH-1",
    );
    state.labels = state.labels.filter(
      (label) => label !== body.update.labels[0].remove,
    );
    state.marked = true;
    return new Response(null, { status: 204 });
  };
  const service = () => supportService(env, transport);
  return { state, service };
}
test("validates fields, portal and submission reference", () => {
  assert.deepEqual(parseSubmission(report), report);
  for (const change of [
    { portal: "bad" },
    { reference: "bad" },
    { email: "bad" },
    { subject: " " },
    { description: "x".repeat(5001) },
  ])
    assert.equal(parseSubmission({ ...report, ...change }), null);
});
test("Jira outage returns a retry; accepted report survives Slack outage and a fresh process can deliver the saved reference", async () => {
  const { state, service } = fixture();
  state.outage = true;
  assert.equal((await service().submit(report)).body.state, "retry");
  assert.equal(state.creates, 0);
  state.outage = false;
  state.slackDown = true;
  assert.equal((await service().submit(report)).body.key, "TECH-1");
  assert.equal(state.sends, 0);
  assert.equal(
    (await service().submit({ ...report, checkOnly: true })).body.key,
    "TECH-1",
  );
  state.slackDown = false;
  assert.deepEqual(await service().retryNotifications(), {
    found: 1,
    delivered: 1,
  });
  assert.deepEqual(await service().retryNotifications(), {
    found: 0,
    delivered: 0,
  });
  assert.equal(state.sends, 1);
  assert.equal(state.creates, 1);
  assert.ok(state.marked);
});
test("lost Jira response and delayed indexing never issue a second create on check", async () => {
  const { state, service } = fixture();
  state.loseResponse = true;
  assert.equal((await service().submit(report)).body.state, "unknown");
  const labels = state.labels;
  state.labels = [];
  assert.equal(
    (await service().submit({ ...report, checkOnly: true })).body.state,
    "unknown",
  );
  state.labels = labels;
  assert.equal(
    (await service().submit({ ...report, checkOnly: true })).body.key,
    "TECH-1",
  );
  assert.equal(state.creates, 1);
});

test("a search timeout can recover without creating twice; repeated timeouts leave the report unaccepted", async () => {
  const { state, service } = fixture();
  state.searchTimeouts = 2;
  assert.equal((await service().submit(report)).body.state, "retry");
  assert.equal(state.creates, 0);
  state.searchTimeouts = 1;
  assert.equal((await service().submit(report)).body.key, "TECH-1");
  assert.equal(state.creates, 1);
  assert.equal(state.sends, 1);
});

test("rejects text PostgreSQL cannot store while accepting emoji", () => {
  assert.equal(
    parseSubmission({
      ...report,
      description: "a" + String.fromCharCode(0) + "b",
    }),
    null,
  );
  assert.equal(
    parseSubmission({ ...report, subject: String.fromCharCode(0xd800) }),
    null,
  );
  assert.ok(parseSubmission({ ...report, subject: "Course 📚" }));
});
