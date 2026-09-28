import { test, expect, type Page } from "@playwright/test";
import { conference, conferenceQrUrl } from "../../lib/conference/config";
async function setup(page: Page, consent = "denied", path: string = conference.path) {
  await page.addInitScript(
    (choice) => localStorage.setItem("au-analytics-consent", choice),
    consent,
  );
  await page.route(
    /hs-scripts\.com|hs-analytics\.net|hubspot\.com|clarity\.ms|_vercel\/insights/,
    (r) => r.abort(),
  );
  await page.route("**/api/analytics/event", (r) => r.fulfill({ status: 204 }));
  await page.goto(path);
}
async function fill(page: Page) {
  await page.getByLabel("First name", { exact: true }).fill("CONFERENCE TEST");
  await page.getByLabel("Last name", { exact: true }).fill("DO NOT CONTACT");
  await page
    .getByLabel("Work email", { exact: true })
    .fill("conference-test@example.com");
  await page
    .getByLabel("Institution / organization", { exact: true })
    .fill("TEST Institution");
}
test("small phones: focused layout, accessible inputs and no horizontal overflow", async ({
  page,
}) => {
  for (const width of [320, 390]) {
    await page.setViewportSize({ width, height: 844 });
    await setup(page);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await expect(page.locator(".au-header,.au-footer")).toHaveCount(0);
    await expect(
      page.locator('form[data-hs-do-not-collect="true"]'),
    ).toHaveCount(1);
    await expect(page.locator("form")).toHaveAttribute("method", "post");
    await expect(page.locator("form")).toHaveAttribute("action", "/api/contact");
    await expect(page.getByRole("checkbox")).not.toBeChecked();
    await expect(
      page.getByLabel("Work email", { exact: true }),
    ).toHaveAttribute("inputmode", "email");
    await expect(
      page.getByLabel("First name", { exact: true }),
    ).toHaveAttribute("autocomplete", "given-name");
    expect(
      await page
        .getByLabel("Work email", { exact: true })
        .evaluate((e) => getComputedStyle(e).fontSize),
    ).toBe("16px");
  }
});
test("declined/blocker flow: double tap accepts once and focuses honest confirmation", async ({
  page,
}) => {
  await setup(page);
  await fill(page);
  let calls = 0,
    body = "";
  await page.route("**/api/contact", async (r) => {
    calls++;
    body = r.request().postData() || "";
    await new Promise((r) => setTimeout(r, 200));
    await r.fulfill({
      status: 202,
      json: { accepted: true, delivery: "queued" },
    });
  });
  await page.getByRole("button", { name: "Join us for coffee" }).dblclick();
  await expect(page.getByRole("status")).toBeFocused();
  await expect(page.getByRole("status")).toContainText(
    "Your details are safely saved",
  );
  expect(calls).toBe(1);
  expect(body).toContain('"consent":false');
  expect(body).not.toContain('"hutk"');
  expect(body).not.toContain('name="demoRequested"');
});
test("uncertain connection retry keeps ID; failure preserves entries; selected demo is explicit", async ({
  page,
}) => {
  await setup(page, "granted");
  await fill(page);
  await page.getByRole("checkbox").check();
  const ids: string[] = [];
  await page.route("**/api/contact", async (r) => {
    const body = r.request().postData() || "";
    expect(body).toContain('name="demoRequested"');
    ids.push(body.match(/name="submissionId"\r\n\r\n([^\r]+)/)?.[1] || "");
    if (ids.length === 1) await r.abort();
    else
      await r.fulfill({
        status: 202,
        json: { accepted: true, delivery: "queued" },
      });
  });
  await page.getByRole("button", { name: "Join us for coffee" }).click();
  await expect(page.locator(".conference-error[role=alert]")).toBeVisible();
  await expect(page.getByLabel("First name", { exact: true })).toHaveValue(
    "CONFERENCE TEST",
  );
  await page.getByRole("button", { name: "Join us for coffee" }).click();
  await expect(page.getByRole("status")).toBeVisible();
  expect(ids[0]).toBe(ids[1]);
  expect(ids[0]).toMatch(/^[a-f0-9-]{36}$/);
});
test("QR context is private and retained with consent; legacy navigation returns", async ({
  page,
}) => {
  const u = new URL(conferenceQrUrl("booth-signage"));
  // A QR scan is the first visit: an earlier direct visit must retain its first touch.
  await setup(page, "granted", u.pathname + u.search);
  await fill(page);
  let body = "";
  await page.route("**/api/contact", (r) => {
    body = r.request().postData() || "";
    return r.fulfill({
      status: 202,
      json: { accepted: true, delivery: "queued" },
    });
  });
  await page.getByRole("button", { name: "Join us for coffee" }).click();
  await expect(page.getByRole("status")).toBeFocused();
  const ctx = JSON.parse(
    body.match(/name="leadContext"\r\n\r\n([^\r]+)/)?.[1] || "{}",
  );
  expect(ctx.utm_campaign).toBe("aacrao-baltimore");
  expect(ctx.utm_content).toBe("booth-signage");
  await page.getByRole("link", { name: "Audentra home" }).click();
  await expect(page.locator(".au-header")).toBeVisible();
  await expect(page.locator(".au-footer")).toBeVisible();
});
