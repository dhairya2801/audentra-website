import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";
import { parseEnv } from "node:util";
import { randomUUID } from "node:crypto";
import { neon } from "@neondatabase/serverless";
import ExcelJS from "exceljs";
const local = parseEnv(readFileSync(".env.local", "utf8"));
const password = readFileSync("deliverables/dashboard-access.local.txt", "utf8")
  .trim()
  .replace("Dashboard password: ", "");
test("database-backed referral CRUD, opaque public metadata, durable deduplication, private exports, and least privilege", async ({
  page,
  request,
}) => {
  test.setTimeout(90000);
  test.skip(
    !local.DATABASE_URL || !local.OUTREACH_DATABASE_URL,
    "Database credentials required",
  );
  const admin = neon(local.DATABASE_URL!),
    restricted = neon(local.OUTREACH_DATABASE_URL!);
  let code = "";
  try {
    await expect(
      restricted`SELECT contact_name FROM outreach_referrals LIMIT 1`,
    ).rejects.toThrow();
    await page.goto("/login");
    await page.getByLabel("Team password").fill(password);
    await page.getByRole("button", { name: "Open workspace" }).click();
    await expect(page.locator(".report-status")).toContainText("Updated");
    await page
      .getByRole("button", { name: "Referral links", exact: false })
      .click();
    await page
      .getByRole("button", { name: "New referral link", exact: false })
      .click();
    await page
      .getByLabel("Contact name", { exact: true })
      .fill("Private Test Contact");
    await page
      .getByLabel("Organization", { exact: true })
      .fill("Private Test Organization");
    await page
      .getByRole("combobox", { name: /^Channel \/ source/ })
      .selectOption("linkedin-dm");
    await page
      .getByRole("combobox", { name: /^Campaign/ })
      .selectOption("founder-outreach");
    await page.getByRole("combobox", { name: /^Status/ }).selectOption("sent");
    await page.getByLabel("Notes", { exact: true }).fill("=PRIVATE_TEST_NOTE");
    await page
      .getByRole("button", { name: "Generate link", exact: true })
      .click();
    const row = page
      .locator(".referral-table tbody tr")
      .filter({ hasText: "Private Test Contact" });
    await expect(row).toBeVisible();
    code = await row.locator("code").innerText();
    expect(code).toMatch(/^[a-f0-9]{10}$/);
    const publicResponse = await request.get(
      `http://localhost:3100/api/referral?r=${code}`,
    );
    expect(publicResponse.status()).toBe(200);
    const publicData = await publicResponse.json();
    expect(Object.keys(publicData).sort()).toEqual([
      "campaign",
      "channel",
      "code",
    ]);
    expect(JSON.stringify(publicData)).not.toContain("Private");
    expect(publicData.channel).toBe("linkedin-dm");
    const visit = randomUUID();
    for (const event_name of [
      "visit_started",
      "visit_started",
      "engaged_visit",
      "product_interest",
      "demo_submitted",
    ]) {
      const response = await request.post(
        "http://localhost:3100/api/analytics/event",
        {
          headers: { Origin: "http://localhost:3100" },
          data: {
            code,
            visit_id: visit,
            event_name,
            page: "/",
            detail: event_name === "product_interest" ? "edward" : "none",
          },
        },
      );
      expect(response.status()).toBe(204);
    }
    await page.getByRole("button", { name: "Refresh", exact: false }).click();
    await row.getByRole("button", { name: "Edit", exact: true }).click();
    await expect(page.getByText("1 visits", { exact: true })).toBeVisible();
    await expect(page.getByText("Products explored: edward")).toBeVisible();
    await page
      .getByRole("combobox", { name: /^Status/ })
      .selectOption("replied");
    await page.getByRole("button", { name: "Save changes" }).click();
    await expect(row).toContainText("replied");
    await page
      .getByRole("searchbox", { name: "Search referrals" })
      .fill("Private Test Organization");
    await expect(page.locator(".referral-table tbody tr")).toHaveCount(1);
    const csv = await page.request.get("/api/outreach/export?format=csv");
    expect(csv.status()).toBe(200);
    expect(csv.headers()["cache-control"]).toContain("no-store");
    expect(await csv.text()).toContain("'=PRIVATE_TEST_NOTE");
    const xlsx = await page.request.get("/api/outreach/export?format=xlsx");
    expect(xlsx.status()).toBe(200);
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(new Uint8Array(await xlsx.body()).buffer);
    expect(workbook.worksheets).toHaveLength(3);
    expect(workbook.worksheets[0].rowCount).toBeGreaterThanOrEqual(22);
    const publicPrivate = await request.get(
      "http://localhost:3100/api/outreach",
    );
    expect(publicPrivate.status()).toBe(404);
  } finally {
    if (code) {
      await admin`DELETE FROM outreach_events WHERE code=${code}`;
      await admin`DELETE FROM outreach_referrals WHERE code=${code} AND contact_name='Private Test Contact'`;
    }
  }
});
