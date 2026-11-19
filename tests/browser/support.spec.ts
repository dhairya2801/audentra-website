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

test("cannot edit a restored draft before the form is ready", async ({ page }) => {
  await page.route("**/api/support", (route) => route.abort());
  await page.goto("/support?portal=staff");
  const summary = page.getByLabel("Issue summary");
  await page.getByLabel("Email address").fill("vm@example.test");
  await summary.fill("Original summary");
  await page.getByLabel("Details").fill("My assigned class is missing.");
  await page.getByRole("button", { name: "Submit report" }).click();
  await expect(page.locator("form").getByRole("alert")).toContainText("could not confirm");

  let resumeScripts!: () => void;
  const scriptsReady = new Promise<void>((resolve) => { resumeScripts = resolve; });
  await page.route(/\/_next\/static\/.*\.js(?:\?.*)?$/, async (route) => {
    await scriptsReady;
    await route.continue();
  });
  try {
    await page.reload({ waitUntil: "commit" });
    const subject = page.locator('input[name="subject"]');
    await subject.waitFor({ state: "attached" });
    const canEdit = await subject.evaluate((input) => {
      input.focus();
      return document.activeElement === input;
    });
    expect(canEdit).toBe(false);
  } finally {
    resumeScripts();
  }
  await expect(summary).toHaveValue("Original summary");
  await summary.fill("Edited summary");
  await expect(summary).toHaveValue("Edited summary");
});


const pngUpload = {
  name: "proof.png",
  mimeType: "image/png",
  buffer: Buffer.from("89504e470d0a1a0a00", "hex"),
};
const webmUpload = {
  name: "proof.webm",
  mimeType: "video/webm",
  buffer: Buffer.from("1a45dfa37765626d", "hex"),
};

test("the upload dropzone opens the picker, highlights a drag, and submits both files", async ({ page }) => {
  await page.goto("/support?portal=staff");
  const dropzone = page.locator(".au-support-dropzone");
  const form = page.locator("form").filter({ has: dropzone });
  await expect(form).not.toHaveAttribute("inert", "");
  await page.getByLabel("Email address").fill("vm@example.test");
  await page.getByLabel("Issue summary").fill("Dragged evidence");
  await page.getByLabel("Details").fill("Both files were dropped onto the support form.");
  const picker = page.waitForEvent("filechooser");
  await dropzone.click();
  await (await picker).setFiles(pngUpload);
  await expect(form.getByRole("status").getByText(pngUpload.name, { exact: true })).toBeVisible();

  const uploads = [pngUpload, webmUpload];
  const dataTransfer = await page.evaluateHandle((files) => {
    const transfer = new DataTransfer();
    for (const { name, mimeType, bytes } of files) {
      transfer.items.add(new File([new Uint8Array(bytes)], name, { type: mimeType }));
    }
    return transfer;
  }, uploads.map(({ name, mimeType, buffer }) => ({ name, mimeType, bytes: [...buffer] })));

  const readShadow = () => dropzone.evaluate((element) => getComputedStyle(element).boxShadow);
  const restingShadow = await readShadow();
  await dropzone.dispatchEvent("dragenter", { dataTransfer });
  await dropzone.dispatchEvent("dragover", { dataTransfer });
  await expect(dropzone.getByText("Drop files here")).toBeVisible();
  await expect.poll(readShadow).not.toBe(restingShadow);
  await expect.poll(readShadow).toContain("inset");
  await dropzone.dispatchEvent("dragleave", { dataTransfer });
  await expect(dropzone.getByText("Upload a file")).toBeVisible();
  await dropzone.dispatchEvent("dragover", { dataTransfer });
  await dropzone.dispatchEvent("drop", { dataTransfer });
  await expect(dropzone).toHaveAttribute("data-dragging", "false");
  for (const { name } of uploads) {
    await expect(form.getByRole("status").getByText(name, { exact: true })).toBeVisible();
  }

  const request = page.waitForRequest("**/api/support");
  await page.route("**/api/support", (route) => route.fulfill({
    status: 202,
    json: { state: "queued", reference: route.request().postDataJSON().reference },
  }));
  await form.getByRole("button", { name: "Submit report" }).click();
  expect((await request).postDataJSON().evidence).toEqual(uploads.map(({ name, mimeType, buffer }) => ({
    name,
    mime: mimeType,
    data: buffer.toString("base64"),
  })));
  await expect(page.getByRole("heading", { name: "Report received" })).toBeVisible();
  await dataTransfer.dispose();
});

async function openReport(page: import("@playwright/test").Page) {
  await page.goto("/support?portal=staff");
  await page.getByLabel("Email address").fill("vm@example.test");
  await page.getByLabel("Issue summary").fill("Evidence verification");
  await page
    .getByLabel("Details")
    .fill("The attached files describe this problem.");
}

test("a saved report brings its confirmation above the fold and focuses it", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 700 });
  await page.goto("/support?portal=staff");
  const form = page.locator("form").filter({ has: page.getByRole("heading", { name: "Report an issue" }) });
  await expect(form).not.toHaveAttribute("inert", "");
  await form.getByLabel("Email address").fill("vm@example.test");
  await form.getByLabel("Issue summary").fill("Confirmation position");
  await form.getByLabel("Details").fill("The confirmation should appear after submitting from the bottom of the form.");
  await page.route("**/api/support", (route) => route.fulfill({
    status: 202,
    json: { state: "queued", reference: route.request().postDataJSON().reference },
  }));
  const submit = form.getByRole("button", { name: "Submit report" });
  await submit.scrollIntoViewIfNeeded();
  expect(await page.evaluate(() => window.scrollY)).toBeGreaterThan(300);
  await submit.click();
  const receipt = page.getByRole("heading", { name: "Report received" });
  await expect(receipt).toBeFocused();
  await expect(receipt).toBeInViewport();
  const bounds = await receipt.evaluate((heading) => ({
    top: heading.getBoundingClientRect().top,
    headerBottom: document.querySelector(".au-header")?.getBoundingClientRect().bottom ?? 0,
  }));
  expect(bounds.top).toBeGreaterThanOrEqual(bounds.headerBottom - 1);
  expect(bounds.top).toBeLessThan(250);
});

for (const state of ["invalid", "invalid_evidence"]) {
  test("correcting a rejected report after " + state, async ({ page }) => {
    const refs: string[] = [];
    await page.route("**/api/support", async (route) => {
      const { reference } = route.request().postDataJSON();
      refs.push(reference);
      return refs.length === 1
        ? route.fulfill({ status: 400, json: { state } })
        : route.fulfill({ status: 202, json: { state: "queued", reference } });
    });
    await openReport(page);
    const files = page.locator("input[type=file]");
    await files.setInputFiles(
      state === "invalid_evidence"
        ? { ...pngUpload, buffer: Buffer.from("corrupt") }
        : pngUpload,
    );
    const submit = page.getByRole("button", { name: "Submit report" });
    await submit.click();
    await expect(page.locator("form").getByRole("alert")).toContainText(
      state === "invalid_evidence" ? "file format" : "Check the fields",
    );
    if (state === "invalid_evidence") await files.setInputFiles(pngUpload);
    else await page.getByLabel("Issue summary").fill("Corrected details");
    await submit.click();
    await expect(
      page.getByRole("heading", { name: "Report received" }),
    ).toBeVisible();
    expect(refs).toHaveLength(2);
  });
}

test("the API distinguishes unsupported evidence from invalid ticket fields", async ({
  request,
}) => {
  const report = {
    portal: "student",
    email: "vm@example.test",
    subject: "Evidence test",
    description: "Verify server-side errors.",
    reference: "fd818a61-2ba9-41e9-9d91-7ee17b2f9922",
    checkOnly: false,
  };
  const badFile = {
    name: "proof.png",
    mime: "image/png",
    data: Buffer.from("corrupt").toString("base64"),
  };
  for (const [data, state] of [
    [{ ...report, evidence: [badFile] }, "invalid_evidence"],
    [{ ...report, email: "bad", evidence: [badFile] }, "invalid"],
  ] as const) {
    const response = await request.post("/api/support", { data });
    expect(response.status()).toBe(400);
    expect(await response.json()).toEqual({ state });
  }
});

test("restored report retries both files with the original reference", async ({
  page,
}) => {
  const refs: string[] = [];
  await page.route("**/api/support", async (route) => {
    const { reference, evidence } = route.request().postDataJSON();
    expect(evidence.map((f: { name: string }) => f.name)).toEqual([
      pngUpload.name,
      webmUpload.name,
    ]);
    refs.push(reference);
    return refs.length === 1
      ? route.abort("connectionreset")
      : route.fulfill({ status: 202, json: { state: "queued", reference } });
  });
  await openReport(page);
  const files = page.locator("input[type=file]");
  const submit = page.getByRole("button", { name: "Submit report" });
  await files.setInputFiles([pngUpload, webmUpload]);
  await submit.click();
  const alert = page.locator("form").getByRole("alert");
  await expect(alert).toContainText("could not confirm");
  await page.reload();
  await expect(alert).toContainText("proof.png, proof.webm");
  await submit.click();
  await expect(alert).toContainText("original files in this order");
  await page.getByRole("button", { name: "Restore original report" }).click();
  await expect(alert).toContainText("proof.png, proof.webm");
  await files.setInputFiles([pngUpload, webmUpload]);
  await submit.click();
  await expect(
    page.getByRole("heading", { name: "Report received" }),
  ).toBeVisible();
  expect(refs).toHaveLength(2);
  expect(refs[1]).toBe(refs[0]);
});

test("the support form masks sensitive information and explains evidence privacy", async ({
  page,
}) => {
  await page.goto("/support");
  const form = page.locator("form", { has: page.getByLabel("Issue summary") });
  await expect(form).toHaveAttribute("data-clarity-mask", "true");
  await expect(form).toHaveAttribute("data-hs-do-not-collect", "true");
  await expect(form).toContainText("Crop or blur student information");
});
