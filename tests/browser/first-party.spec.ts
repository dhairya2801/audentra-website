import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";
import { parseEnv } from "node:util";
import { randomBytes } from "node:crypto";
import { neon } from "@neondatabase/serverless";
import { generalCampaigns, campaignUrl } from "../../lib/analytics/schema";
const local = parseEnv(readFileSync(".env.local", "utf8"));
const password = readFileSync("deliverables/dashboard-access.local.txt", "utf8")
  .trim()
  .replace("Dashboard password: ", "");
test("Neon records general UTM, opaque referral and direct journeys, server conversions, retries, and drill-down without Vercel", async ({
  browser,
  request,
}) => {
  test.setTimeout(150000);
  test.skip(
    !process.env.TEST_STUB_EMAIL,
    "Start the marketing server with the documented local Resend stub before running this test.",
  );
  const sql = neon(local.DATABASE_URL!),
    code = randomBytes(5).toString("hex");
  const visits = new Set<string>();
  await sql`INSERT INTO outreach_referrals(code,channel,campaign) VALUES(${code},'linkedin-dm','founder-outreach')`;
  const dashboard = await browser.newContext({
    baseURL: "http://localhost:3101",
  });
  const login = await dashboard.newPage();
  try {
    await login.goto("/login");
    await login.getByLabel("Team password").fill(password);
    await login.getByRole("button", { name: "Open workspace" }).click();
    await expect(login.locator(".report-status")).toContainText("Updated");
    const c = generalCampaigns.find((c) => c.id === "email-outreach")!;
    for (const [
      entry,
      expectedSource,
      expectedMedium,
      expectedContent,
      referral,
    ] of [
      [
        campaignUrl(c).replace("https://audentra.ai", "http://localhost:3100"),
        "email",
        "email",
        "introduction",
        null,
      ],
      [
        `http://localhost:3100/?r=${code}`,
        "linkedin",
        "direct-message",
        "personal-dm",
        code,
      ],
      ["http://localhost:3100/", "direct", "none", "none", null],
    ]) {
      const context = await browser.newContext({
        userAgent: "Mozilla/5.0 Chrome/146.0.0.0 Safari/537.36",
      });
      try {
        const page = await context.newPage();
        await page.route(
          /clarity\.ms|vercel-scripts\.com|_vercel\/insights/,
          (r) => r.fulfill({ contentType: "application/javascript", body: "" }),
        );
        page.on("request", (r) => {
          if (r.url().includes("/api/analytics/event")) {
            const b = r.postDataJSON();
            if (b?.visit_id) visits.add(b.visit_id);
          }
        });
        await page.goto(entry!);
        await expect
          .poll(() =>
            page.evaluate(
              () =>
                JSON.parse(sessionStorage.getItem("au-visit-v1") || "null")?.id,
            ),
          )
          .toBeTruthy();
        const id = await page.evaluate(
          () => JSON.parse(sessionStorage.getItem("au-visit-v1")!).id as string,
        );
        visits.add(id);
        await page.mouse.click(20, 300);
        await page.waitForTimeout(17000);
        await page
          .getByRole("link", {
            name: "Explore Enrollment Readiness",
            exact: true,
          })
          .first()
          .click();
        await expect(page).toHaveURL(/enrollment-readiness$/);
        await page.locator('a[href="/demo"]').first().click();
        await expect(page).toHaveURL(/\/demo$/);
        await page
          .getByLabel("First name", { exact: true })
          .fill("PRIVATE_TEST_NAME");
        await page
          .getByLabel("Last name", { exact: true })
          .fill("PRIVATE_TEST_LAST");
        await page
          .getByLabel("Work email", { exact: true })
          .first()
          .fill("private-test@example.com");
        await page
          .getByLabel("Institution", { exact: true })
          .fill("PRIVATE_TEST_ORG");
        const submit = page.waitForRequest((r) =>
          r.url().endsWith("/api/contact"),
        );
        await page
          .getByRole("button", { name: "Schedule a Walkthrough" })
          .click();
        await expect(
          page.getByRole("heading", { name: /Thanks/ }),
        ).toBeVisible();
        const sent = await submit;
        const retry = await request.post("http://localhost:3100/api/contact", {
          headers: {
            Origin: "http://localhost:3100",
            "Content-Type": sent.headers()["content-type"],
          },
          data: sent.postDataBuffer()!,
        });
        expect(retry.status()).toBe(200);
        await expect
          .poll(async () =>
            Number(
              (
                await sql`SELECT count(*) count FROM outreach_events WHERE visit_id=${id} AND event_name='demo_submitted'`
              )[0].count,
            ),
          )
          .toBe(1);
        const saved =
          await sql`SELECT * FROM outreach_events WHERE visit_id=${id}`;
        expect(
          saved.every(
            (e) =>
              e.source === expectedSource &&
              e.medium === expectedMedium &&
              e.content === expectedContent &&
              e.code === referral,
          ),
        ).toBe(true);
        expect(
          saved.every(
            (e) => e.campaign === (referral ? "founder-outreach" : "none"),
          ),
        ).toBe(true);
        expect(saved.map((e) => e.event_name)).toEqual(
          expect.arrayContaining([
            "visit_started",
            "engaged_visit",
            "page_viewed",
            "product_interest",
            "demo_cta_clicked",
            "demo_viewed",
            "demo_form_started",
            "demo_submitted",
          ]),
        );
        expect(
          saved.filter((e) => e.event_name === "page_viewed"),
        ).toHaveLength(3);
        expect(
          saved.filter((e) => e.event_name === "demo_submitted")[0]
            .submission_id,
        ).toBeTruthy();
        expect(JSON.stringify(saved)).not.toMatch(/PRIVATE_TEST|private-test@/);
        const dimension = referral ? "referral" : "source",
          selected = referral || expectedSource;
        const report = await (
          await dashboard.request.get(
            `/api/dashboard?days=7&dimension=${dimension}&selected=${selected}`,
          )
        ).json();
        expect(report.events.error).toBeUndefined();
        expect(
          report.events.rows.find(
            (r: { eventName: string }) => r.eventName === "demo_submitted",
          ).requests,
        ).toBeGreaterThanOrEqual(1);
        expect(
          report.firstParty.attribution.rows.some(
            (r: { source: string; medium: string }) =>
              r.source === expectedSource && r.medium === expectedMedium,
          ),
        ).toBe(true);
        expect(report.premium.error).toBeTruthy();
        const forged = await request.post(
          "http://localhost:3100/api/analytics/event",
          {
            headers: { Origin: "http://localhost:3100" },
            data: {
              visit_id: id,
              event_name: "demo_submitted",
              page: "/demo",
              detail: "none",
            },
          },
        );
        expect(forged.status()).toBe(400);
      } finally {
        await context.close();
      }
    }
    await login.reload();
    await expect(login.locator(".report-status")).toContainText("Updated");
    await login.getByLabel("Group outreach by").selectOption("referral");
    await login.getByRole("button", { name: `${code} ↗`, exact: true }).click();
    await expect(
      login.getByRole("heading", { name: "Captured attribution" }),
    ).toBeVisible();
    await expect(login.locator(".metric-grid")).toContainText("Demo requests");
  } finally {
    await dashboard.close();
    for (const id of visits)
      await sql`DELETE FROM outreach_events WHERE visit_id=${id}`;
    await sql`DELETE FROM outreach_events WHERE code=${code}`;
    await sql`DELETE FROM outreach_referrals WHERE code=${code}`;
  }
});
