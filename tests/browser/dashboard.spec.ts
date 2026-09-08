import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";
import outreach from "../../lib/analytics/outreach.json";
import { blankReferral } from "../../lib/outreach/shared";
const password = readFileSync("deliverables/dashboard-access.local.txt", "utf8")
  .trim()
  .replace("Dashboard password: ", "");
const query = (rows: Record<string, string | number>[]) => ({ rows });
const fixture = {
  premium: {
    rows: [],
    error:
      "This report requires a Vercel plan with custom events (Pro or Enterprise).",
  },
  firstParty: {
    summary: query([{ sessions: 520, legacyEvents: 0 }]),
    trend: query([
      { timestamp: "2026-09-07", sessions: 520, engaged: 284, demos: 18 },
    ]),
    pages: query([
      { requestPath: "/", count: 500 },
      { requestPath: "/demo", count: 92 },
    ]),
    referrals: query([{ code: "01de78", contact_name: "Dhairya Shah" }]),
    attribution: query([
      {
        source: "linkedin",
        medium: "social",
        content: "general",
        channel: "linkedin-post",
        referral: "01de78",
        sessions: 5,
      },
      {
        source: "linkedin",
        medium: "social",
        content: "general",
        channel: "linkedin-post",
        referral: "abcdef",
        sessions: 1,
      },
    ]),
  },
  since: "2026-09-01T00:00:00Z",
  until: "2026-09-07T23:59:59Z",
  fetchedAt: "2026-09-07T15:00:00Z",
  dimension: "channel",
  selected: "",
  traffic: query([{ pageviews: 1248, visitors: 836 }]),
  previous: query([{ pageviews: 1020, visitors: 713 }]),
  trend: query(
    [102, 140, 123, 207, 186, 264, 226].map((n, i) => ({
      timestamp: `2026-09-0${i + 1}T00:00:00Z`,
      pageviews: n,
      visitors: Math.round(n * 0.7),
    })),
  ),
  pages: query([
    { requestPath: "/", pageviews: 680 },
    { requestPath: "/solutions/enrollment-readiness", pageviews: 286 },
    { requestPath: "/platform/edward", pageviews: 162 },
    { requestPath: "/demo", pageviews: 120 },
  ]),
  referrers: query([
    { referrerHostname: "linkedin.com", pageviews: 412 },
    { referrerHostname: "", pageviews: 382 },
    { referrerHostname: "google.com", pageviews: 145 },
  ]),
  events: query(
    [
      ["visit_started", 520],
      ["engaged_visit", 284],
      ["demo_viewed", 92],
      ["demo_form_started", 26],
      ["demo_submitted", 18],
      ["demo_cta_clicked", 73],
      ["newsletter_submitted", 11],
      ["form_error", 2],
    ].map(([eventName, count]) => ({ eventName, count, requests: count })),
  ),
  products: query([
    { eventData: "enrollment-readiness", count: 164 },
    { eventData: "edward", count: 125 },
    { eventData: "morning-brew", count: 83 },
    { eventData: "action-center", count: 62 },
    { eventData: "student-experience", count: 49 },
  ]),
  quality: Object.fromEntries(
    [
      "visit_started",
      "engaged_visit",
      "demo_viewed",
      "demo_submitted",
      "newsletter_submitted",
    ].map((name, i) => [
      name,
      query([
        {
          eventData: "linkedin-dm",
          count: [162, 119, 48, 11, 4][i],
          requests: [162, 119, 48, 11, 4][i],
        },
        { eventData: "higher-ed", count: [92, 63, 24, 5, 3][i] },
        { eventData: "personal-email", count: [83, 51, 12, 2, 4][i] },
        { eventData: "linkedin-post", count: [183, 51, 8, 0, 0][i] },
      ]),
    ]),
  ),
};
test("every data entry point requires auth; login has safe headers; CSRF rejected", async ({
  request,
}) => {
  expect((await request.get("/api/dashboard")).status()).toBe(401);
  const login = await request.get("/login");
  expect(login.headers()["x-robots-tag"]).toContain("noindex");
  expect(login.headers()["cache-control"]).toMatch(/no-store|no-cache/);
  const cross = await request.post("/api/auth/login", {
    form: { password },
    headers: { Origin: "https://evil.example" },
  });
  expect(cross.status()).toBe(403);
  const root = await request.get("/", { maxRedirects: 0 });
  expect(root.status()).toBe(307);
  expect(root.headers().location).toContain("/login");
});
test("sign in, real missing-data state, logout, and no tracking scripts", async ({
  page,
}) => {
  await page.goto("/login");
  await page.getByLabel("Team password").fill(password);
  await page.getByRole("button", { name: "Open workspace" }).click();
  await expect(
    page.getByRole("heading", { name: "Audentra website analytics" }),
  ).toBeVisible();
  await expect(page.getByText(/Connect Vercel:/).first()).toBeVisible();
  expect(
    await page
      .locator(
        'script[src*="clarity"],script[src*="insights"],script[src*="vercel-scripts"]',
      )
      .count(),
  ).toBe(0);
  const cookie = (await page.context().cookies()).find(
    (c) => c.name === "au-analytics-session",
  );
  expect(cookie?.httpOnly).toBe(true);
  expect(cookie?.sameSite).toBe("Strict");
  await page.getByRole("button", { name: "Sign out" }).click();
  await expect(page).toHaveURL(/\/login$/);
});
test("dashboard renders reports, filters, link library, and responsive layouts (test fixture only)", async ({
  page,
}) => {
  await page.route("**/api/outreach", (route) =>
    route.fulfill({
      json: {
        referrals: outreach.referrals.map((code) => ({
          ...blankReferral,
          code,
          contact_name: code === "01de78" ? "Dhairya Shah" : "",
          version: 1,
          created_at: "2026-09-07",
          updated_at: "2026-09-07",
          visits: 0,
          engaged: 0,
          cta: 0,
          demos: 0,
          newsletters: 0,
          last_visit: null,
          last_activity: null,
          products: [],
          form_starts: 0,
          errors: 0,
          demo_views: 0,
        })),
      },
    }),
  );
  await page.route("**/api/dashboard?*", (route) =>
    route.fulfill({ json: fixture }),
  );
  await page.goto("/login");
  await page.getByLabel("Team password").fill(password);
  await page.getByRole("button", { name: "Open workspace" }).click();
  await expect(page.getByText("1,248", { exact: true })).toBeVisible();
  await expect(page.getByText("Optional Vercel Pro reports")).toHaveCount(0);
  await expect(
    page.getByRole("combobox", { name: "Group outreach by" }),
  ).toHaveCount(0);
  await expect(
    page.locator(".outreach-card").getByText("By channel"),
  ).toBeVisible();
  await page
    .locator(".outreach-card")
    .getByRole("button", { name: "LinkedIn ↗", exact: true })
    .click();
  await expect(
    page.getByRole("cell", { name: "Dhairya Shah (01de78)", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("cell", { name: "abcdef", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("columnheader", { name: "Campaign", exact: true }),
  ).toHaveCount(0);
  await page.setViewportSize({ width: 1512, height: 1200 });
  await page.screenshot({
    path: "deliverables/dashboard-desktop.png",
    fullPage: true,
  });
  const requestPromise = page.waitForRequest(
    (r) => r.url().includes("/api/dashboard?") && r.url().includes("days=30"),
  );
  await page.getByLabel("Date range").selectOption("30");
  await requestPromise;
  await page.getByRole("button", { name: "Link library" }).click();
  await expect(
    page.getByRole("heading", { name: "Approved general links" }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Referral links", exact: false })
    .click();
  await expect(
    page.getByRole("heading", { name: "Referral links" }),
  ).toBeVisible();
  for (const r of outreach.referrals)
    await expect(
      page.getByText(r === "01de78" ? "Dhairya Shah (01de78)" : r, {
        exact: true,
      }),
    ).toBeVisible();
  await page.getByRole("button", { name: /New referral link/ }).click();
  await expect(
    page.getByLabel("Channel / source").locator("option:not([disabled])"),
  ).toHaveText(["LinkedIn", "Email", "WhatsApp", "Founder Network"]);
  await expect(page.getByLabel("Campaign", { exact: false })).toHaveCount(0);
  await page.getByRole("button", { name: "Cancel", exact: true }).click();
  await page.getByRole("button", { name: /Dhairya Shah \(01de78\)/ }).click();
  await page.getByRole("button", { name: /Inspect product interest/ }).click();
  await expect(page.locator(".filter-notice")).toContainText(
    "Dhairya Shah (01de78)",
  );
  await expect(
    page
      .locator(".outreach-card")
      .getByRole("columnheader", { name: "Channel", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Overview", exact: false }).click();
  await page.setViewportSize({ width: 390, height: 844 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: "deliverables/dashboard-mobile.png",
    fullPage: true,
  });
});
