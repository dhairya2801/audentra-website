import { test, expect, type Page } from "@playwright/test";
import outreach from "../../lib/analytics/outreach.json";
async function setup(page: Page) {
  await page.route("**/api/analytics/event", route => route.fulfill({status:204}));
  await page.route(/clarity\.ms/, (route) =>
    route.fulfill({ contentType: "application/javascript", body: "" }),
  );
  await page.route(/_vercel\/insights|vercel-scripts\.com/, (route) =>
    route.fulfill({ contentType: "application/javascript", body: "" }),
  );
  await page.addInitScript(() => {
    const w = window as unknown as {
      recorded: { name: string; data: Record<string, string> }[];
      va: (name: string, data: unknown) => void;
      beforeSend: (data: unknown) => unknown;
    };
    w.recorded = [];
    w.va = (name, data) => {
      if (name === "event")
        w.recorded.push(data as (typeof w.recorded)[number]);
      if (name === "beforeSend") w.beforeSend = data as typeof w.beforeSend;
    };
  });
}
async function recorded(page: Page) {
  return page.evaluate(
    () =>
      (
        window as unknown as {
          recorded: { name: string; data: Record<string, string> }[];
        }
      ).recorded,
  );
}
test("attribution survives SPA navigation; meaningful events are deduplicated; forms do not leak PII", async ({
  page,
}) => {
  await setup(page);
  const r = outreach.referrals[0];
  await page.goto(`/?r=${r}`);
  await expect
    .poll(async () =>
      (await recorded(page)).some((e) => e.name === "visit_started"),
    )
    .toBe(true);
  await page.getByRole("tab", { name: "Understand", exact: true }).click();
  await page.getByRole("tab", { name: "Understand", exact: true }).click();
  const demo = page.locator('a[href="/demo"]').first();
  await demo.click();
  await expect(page).toHaveURL(/\/demo$/);
  await page.getByLabel("First name", { exact: true }).fill("PrivateName");
  await page.getByLabel("Last name", { exact: true }).fill("PrivateSurname");
  await page
    .getByLabel("Work email", { exact: true })
    .first()
    .fill("private@example.com");
  await page
    .getByLabel("Institution", { exact: true })
    .fill("PrivateInstitution");
  let payload = "";
  await page.route("**/api/contact", async (route) => {
    payload = route.request().postData() || "";
    await route.fulfill({ json: { ok: true, accepted: true } });
  });
  await page.getByRole("button", { name: "Schedule a Walkthrough" }).click();
  await expect(page.getByRole("heading", { name: /Thanks/ })).toBeVisible();
  const rows = await recorded(page);
  expect(rows.filter((e) => e.name === "visit_started")).toHaveLength(1);
  expect(
    rows.filter(
      (e) => e.name === "product_interest" && e.data.detail === "edward",
    ),
  ).toHaveLength(1);
  expect(rows.filter((e) => e.name === "demo_form_started")).toHaveLength(1);
  expect(rows.filter((e) => e.name === "demo_submitted")).toHaveLength(1);
  expect(rows.every((e) => e.data.referral === r)).toBe(true);
  expect(JSON.stringify(rows)).not.toMatch(
    /PrivateName|PrivateSurname|private@example|PrivateInstitution/,
  );
  expect(payload).toContain(r);
});
test("Clarity is consent-gated and decline disables analytics", async ({
  page,
}) => {
  await setup(page);
  await page.goto("/");
  await expect(
    page.getByRole("button", { name: "Allow analytics", exact: true }),
  ).toBeVisible();
  expect(await page.locator("#audentra-clarity").count()).toBe(0);
  await page
    .getByRole("button", { name: "Allow analytics", exact: true })
    .click();
  await expect(page.locator("#audentra-clarity")).toHaveCount(1);
  await page
    .getByRole("button", { name: "Analytics preferences", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Decline analytics", exact: true })
    .click();
  await page.waitForLoadState("domcontentloaded");
  await page.reload();
  await expect(page.locator("#audentra-clarity")).toHaveCount(0);
  expect(await recorded(page)).toHaveLength(0);
});
test("PII query values are redacted for Vercel and prevent recorder startup", async ({
  page,
}) => {
  await setup(page);
  await page.goto("/?email=private@example.com&utm_source=PrivateName#private");
  await page
    .getByRole("button", { name: "Allow analytics", exact: true })
    .click();
  expect(await page.locator("#audentra-clarity").count()).toBe(0);
  const clean = await page.evaluate(() =>
    (window as unknown as { beforeSend: (x: unknown) => unknown }).beforeSend({
      type: "pageview",
      url: location.href,
    }),
  );
  expect(JSON.stringify(clean)).not.toMatch(/private|PrivateName/);
});
test("delivery errors do not become conversions and blocked analytics do not break the site", async ({
  page,
}) => {
  await setup(page);
  await page.goto("/demo");
  await page.getByLabel("First name", { exact: true }).fill("Test");
  await page.getByLabel("Last name", { exact: true }).fill("Test");
  await page
    .getByLabel("Work email", { exact: true })
    .first()
    .fill("test@example.com");
  await page.getByLabel("Institution", { exact: true }).fill("Test");
  await page.route("**/api/contact", (route) =>
    route.fulfill({ status: 502, json: { error: "Delivery failed" } }),
  );
  await page.getByRole("button", { name: "Schedule a Walkthrough" }).click();
  await expect(page.locator(".au-form-message[role=alert]")).toContainText(
    "Delivery failed",
  );
  expect((await recorded(page)).some((e) => e.name === "demo_submitted")).toBe(
    false,
  );
  await page.evaluate(() => {
    window.va = () => {
      throw new Error("blocked");
    };
  });
  await page.getByRole("button", { name: "Schedule a Walkthrough" }).click();
  await expect(page.locator(".au-form-message[role=alert]")).toBeVisible();
});
test("dashboard endpoints are unavailable on the public marketing deployment", async ({
  request,
}) => {
  expect((await request.get("/api/dashboard")).status()).toBe(404);
  expect((await request.get("/login")).status()).toBe(404);
});
test("landing page works at mobile width without horizontal overflow", async ({
  page,
}) => {
  await setup(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expect(page.locator("h1")).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: "deliverables/landing-mobile.png",
    fullPage: true,
  });
});
