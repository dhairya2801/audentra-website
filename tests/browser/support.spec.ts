import { test, expect } from "@playwright/test";
import { readFile } from "node:fs/promises";
test.use({ channel: "chromium" });

test("an unconfirmed report survives reload and uses its original reference", async ({
  page,
}) => {
  const attempts: { reference: string; checkOnly: boolean }[] = [];
  await page.route("**/api/support", async (route) => {
    attempts.push(route.request().postDataJSON());
    if (attempts.length === 1)
      return route.fulfill({ status: 503, json: { state: "retry" } });
    if (attempts.length === 2) return route.abort("connectionreset");
    return route.fulfill({
      status: 200,
      json: { state: "received", key: "TECH-9001" },
    });
  });
  await page.goto("/support?portal=staff");
  await page.getByLabel("Email address").fill("vm@example.test");
  await page.getByLabel("Issue summary").fill("Missing class");
  await page.getByLabel("Details").fill("My assigned class is missing.");
  const submit = page.getByRole("button", { name: "Submit report" });
  await submit.click();
  await expect(page.locator("form").getByRole("alert")).toContainText(
    "could not be saved",
  );
  await submit.click();
  await expect(page.locator("form").getByRole("alert")).toContainText(
    "could not confirm receipt",
  );
  await page.reload();
  await expect(page.getByLabel("Issue summary")).toHaveValue("Missing class");
  await expect(page.getByLabel("Details")).toHaveValue(
    "My assigned class is missing.",
  );
  const download = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Save a copy of this report" })
    .click();
  const file = await (await download).path();
  expect(JSON.parse(await readFile(file!, "utf8"))).toMatchObject({
    reference: attempts[0].reference,
    subject: "Missing class",
    status: "unconfirmed",
  });
  await submit.click();
  await expect(page.getByText("TECH-9001")).toBeVisible();
  expect(attempts.map((a) => a.checkOnly)).toEqual([false, false, false]);
  expect(new Set(attempts.map((a) => a.reference)).size).toBe(1);
  await page.reload();
  await expect(page.getByLabel("Issue summary")).toHaveValue("");
});
for (const choice of ["original", "new"] as const) {
  test(
    "saved report loses response, then student chooses " + choice,
    async ({ page }) => {
      const saved = new Map<string, string>();
      const sends: string[] = [];
      await page.route("**/api/support", async (route) => {
        const { reference, subject } = route.request().postDataJSON();
        if (saved.has(reference)) expect(saved.get(reference)).toBe(subject);
        saved.set(reference, subject);
        sends.push(reference);
        if (sends.length === 1) return route.abort("connectionreset");
        return route.fulfill({
          status: 202,
          json: { state: "queued", reference },
        });
      });
      await page.goto("/support?portal=staff");
      await page.getByLabel("Email address").fill("vm@example.test");
      const summary = page.getByLabel("Issue summary");
      await summary.fill("Original summary");
      await page.getByLabel("Details").fill("My assigned class is missing.");
      const submit = page.getByRole("button", { name: "Submit report" });
      await submit.click();
      await expect(page.locator("form").getByRole("alert")).toContainText(
        "could not confirm",
      );
      await page.reload();
      await summary.fill("Edited summary");
      await submit.click();
      await expect(
        page.getByText(/Your original report may already be saved/),
      ).toBeVisible();
      await summary.press("Enter");
      expect(sends).toHaveLength(1);
      if (choice === "original") {
        await page
          .getByRole("button", { name: "Restore original report" })
          .click();
        await expect(summary).toHaveValue("Original summary");
        await submit.click();
      } else {
        await page
          .getByRole("button", { name: "Send edits as a new report" })
          .click();
      }
      await expect(
        page.getByRole("heading", { name: "Report received" }),
      ).toBeVisible();
      await expect(page.getByText(sends[1], { exact: true })).toBeVisible();
      expect(sends).toHaveLength(2);
      expect(saved.size).toBe(choice === "original" ? 1 : 2);
      expect(saved.get(sends[1])).toBe(
        choice === "original" ? "Original summary" : "Edited summary",
      );
    },
  );
}
