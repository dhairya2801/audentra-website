import { test, expect, type Page } from "@playwright/test";

async function setup(page: Page, blocked = false) {
  await page.route("**/api/analytics/event", (r) => r.fulfill({ status: 204 }));
  await page.route(/clarity\.ms|_vercel\/insights|vercel-scripts\.com/, (r) =>
    r.fulfill({ contentType: "application/javascript", body: "" }),
  );
  await page.route("https://js-na1.hs-scripts.com/52074694.js", (r) =>
    blocked
      ? r.abort()
      : r.fulfill({
          contentType: "application/javascript",
          body: `
    window.testHsViews=[]; window.testHsCalls=[];
    let path=location.pathname;
    const q=window._hsq||[];
    function command(c){window.testHsCalls.push(c);if(c[0]==='setPath')path=c[1];if(c[0]==='trackPageView')window.testHsViews.push(path);}
    q.forEach(command); q.push=function(c){command(c);return 0;};
    window.testHsViews.push(path);
    const s=document.createElement('script');s.id='hs-analytics';document.head.append(s);s.dispatchEvent(new Event('load'));
  `,
        }),
  );
}
async function fill(page: Page) {
  await page.getByLabel("First name", { exact: true }).fill("HUBSPOT TEST");
  await page.getByLabel("Last name", { exact: true }).fill("Do not contact");
  await page
    .getByLabel("Work email", { exact: true })
    .first()
    .fill("hubspot-test@example.com");
  await page
    .getByLabel("Institution", { exact: true })
    .fill("TEST Institution");
}
test("one script, one initial pageview, SPA view and withdrawal; forms opt out of automatic capture", async ({
  page,
}) => {
  await setup(page);
  await page.goto("/");
  await expect(page.locator("#hs-script-loader")).toHaveCount(0);
  await page
    .getByRole("button", { name: "Allow analytics", exact: true })
    .click();
  await expect(page.locator("#hs-script-loader")).toHaveCount(1);
  await expect
    .poll(() =>
      page.evaluate(
        () => (window as unknown as { testHsViews: string[] }).testHsViews,
      ),
    )
    .toEqual(["/"]);
  await page.locator('a[href="/demo"]').first().click();
  await expect
    .poll(() =>
      page.evaluate(
        () => (window as unknown as { testHsViews: string[] }).testHsViews,
      ),
    )
    .toEqual(["/", "/demo"]);
  await expect(page.locator('form[data-hs-do-not-collect="true"]')).toHaveCount(
    2,
  );
  await page.context().addCookies([
    {
      name: "hubspotutk",
      value: "a".repeat(32),
      url: "http://localhost:3112",
    },
  ]);
  await page
    .getByRole("button", { name: "Analytics preferences", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Decline analytics", exact: true })
    .click();
  await page.waitForLoadState("domcontentloaded");
  await expect(page.locator("#hs-script-loader")).toHaveCount(0);
  expect(
    (await page.context().cookies()).some((c) => c.name === "hubspotutk"),
  ).toBe(false);
});
test("declined tracking still submits; double-click makes one request; queued UI is accurate", async ({
  page,
}) => {
  await setup(page, true);
  await page.addInitScript(() =>
    localStorage.setItem("au-analytics-consent", "denied"),
  );
  await page.goto("/demo");
  await fill(page);
  let calls = 0,
    body = "";
  await page.route("**/api/contact", async (r) => {
    calls++;
    body = r.request().postData() || "";
    await new Promise((resolve) => setTimeout(resolve, 200));
    await r.fulfill({
      status: 202,
      json: { accepted: true, delivery: "queued" },
    });
  });
  await page.getByRole("button", { name: "Schedule a Walkthrough" }).dblclick();
  await expect(
    page.getByRole("status").filter({ hasText: "awaiting delivery" }),
  ).toBeVisible();
  expect(calls).toBe(1);
  expect(body).toContain('"consent":false');
  expect(body).not.toContain('"hutk"');
  await expect(page.locator("#hs-script-loader")).toHaveCount(0);
});
test("blocked HubSpot script does not block form; network retry keeps submission ID", async ({
  page,
}) => {
  await setup(page, true);
  await page.addInitScript(() =>
    localStorage.setItem("au-analytics-consent", "granted"),
  );
  await page.goto("/demo");
  await fill(page);
  const ids: string[] = [];
  let calls = 0;
  await page.route("**/api/contact", async (r) => {
    const body = r.request().postData() || "";
    ids.push(body.match(/name="submissionId"\r\n\r\n([^\r]+)/)?.[1] || "");
    if (++calls === 1) await r.abort();
    else
      await r.fulfill({
        status: 202,
        json: { accepted: true, delivery: "queued" },
      });
  });
  await page.getByRole("button", { name: "Schedule a Walkthrough" }).click();
  await expect(page.locator('.au-form-message[role="alert"]')).toBeVisible();
  await page.getByRole("button", { name: "Schedule a Walkthrough" }).click();
  await expect(page.getByRole("heading", { name: /Thanks/ })).toBeVisible();
  expect(ids[0]).toMatch(/^[0-9a-f-]{36}$/);
  expect(ids[1]).toEqual(ids[0]);
});
test("first touch and originating CTA survive navigation without leaking form values", async ({
  page,
}) => {
  await setup(page);
  await page.addInitScript(() =>
    localStorage.setItem("au-analytics-consent", "granted"),
  );
  await page.goto("/pilot?utm_source=linkedin&utm_campaign=fall-2026");
  // Unapproved vendor URL prevents tracker startup, but private request attribution is retained.
  await expect(page.locator("#hs-script-loader")).toHaveCount(0);
  await page.locator('a[href="/demo"]').first().click();
  await fill(page);
  let body = "";
  await page.route("**/api/contact", (r) => {
    body = r.request().postData() || "";
    return r.fulfill({
      status: 202,
      json: { accepted: true, delivery: "queued" },
    });
  });
  await page.getByRole("button", { name: "Schedule a Walkthrough" }).click();
  await expect(page.getByRole("heading", { name: /Thanks/ })).toBeVisible();
  const raw = body.match(/name="leadContext"\r\n\r\n([^\r]+)/)?.[1];
  const ctx = JSON.parse(raw || "{}");
  expect(ctx.utm_campaign).toBe("fall-2026");
  expect(ctx.landing_page).toBe("/pilot");
  expect(ctx.cta_page).toBe("/pilot");
  expect(ctx.cta).toBe("header");
  expect(raw).not.toContain("hubspot-test@example.com");
});
