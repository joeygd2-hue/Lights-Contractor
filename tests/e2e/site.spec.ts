import { expect, test } from "@playwright/test";

const pages = ["/", "/services", "/process", "/gallery", "/about", "/faq", "/contact", "/quote", "/book", "/privacy", "/terms", "/photo-credits"];

test("every public page renders with one h1, a title and a description", async ({ page }) => {
  for (const path of pages) {
    const res = await page.goto(path);
    expect(res?.status(), path).toBe(200);
    await expect(page.locator("h1"), path).toHaveCount(1);
    expect(await page.title(), path).toContain("Sugar Land Lighting Solutions");
    expect(await page.locator('meta[name="description"]').getAttribute("content"), path).toBeTruthy();
  }
});

test("all internal links resolve", async ({ page, request }) => {
  await page.goto("/");
  const seen = new Set<string>();
  for (const path of pages) {
    await page.goto(path);
    const hrefs = await page.locator('a[href^="/"]').evaluateAll((as) => as.map((a) => a.getAttribute("href")!));
    hrefs.forEach((h) => seen.add(h.split("#")[0]!.split("?")[0]!));
  }
  seen.delete("/api/admin/export");
  for (const href of seen) {
    const res = await request.get(href, { maxRedirects: 0 });
    expect(res.status(), href).toBeLessThan(400);
  }
});

test("main navigation reaches each section", async ({ page }) => {
  await page.goto("/");
  const nav = page.getByRole("navigation", { name: "Main" });
  for (const [label, path] of [["Services", "/services"], ["Our Process", "/process"], ["Gallery", "/gallery"], ["About", "/about"], ["FAQ", "/faq"], ["Contact", "/contact"]]) {
    await nav.getByRole("link", { name: label, exact: true }).click();
    await expect(page).toHaveURL(path);
    await expect(nav.getByRole("link", { name: label, exact: true })).toHaveAttribute("aria-current", "page");
  }
  await page.getByRole("link", { name: "Get a free quote" }).first().click();
  await expect(page).toHaveURL("/quote");
});

test("stock photos are labeled as representative", async ({ page }) => {
  await page.goto("/gallery");
  const labels = page.getByText("Representative photo");
  expect(await labels.count()).toBeGreaterThan(5);
});

test("gallery lightbox opens, navigates with arrows and closes with Escape", async ({ page }) => {
  await page.goto("/gallery");
  const first = page.getByRole("button", { name: /View larger/ }).first();
  await first.click();
  const dialog = page.getByRole("dialog", { name: "Photo viewer" });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByText(/^1 of \d+$/)).toBeVisible();
  await page.keyboard.press("ArrowRight");
  await expect(dialog.getByText(/^2 of \d+$/)).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(first).toBeFocused();
});

test("gallery filters by category", async ({ page }) => {
  await page.goto("/gallery");
  const all = await page.getByRole("button", { name: /View larger/ }).count();
  await page.getByRole("button", { name: "Wreaths & garland" }).click();
  await expect(page.getByRole("button", { name: "Wreaths & garland" })).toHaveAttribute("aria-pressed", "true");
  const filtered = await page.getByRole("button", { name: /View larger/ }).count();
  expect(filtered).toBeGreaterThan(0);
  expect(filtered).toBeLessThan(all);
});

test("ZIP checker reports in and out of area", async ({ page }) => {
  await page.goto("/");
  const input = page.getByLabel("ZIP code");
  await input.fill("77498");
  await page.getByRole("button", { name: "Check ZIP" }).click();
  await expect(page.getByText(/is in our New Territory service area/)).toBeVisible();
  await input.fill("78701");
  await page.getByRole("button", { name: "Check ZIP" }).click();
  await expect(page.getByText(/outside the area we currently serve/)).toBeVisible();
});

test("FAQ accordion is keyboard operable", async ({ page }) => {
  await page.goto("/faq");
  const summary = page.locator("summary").first();
  await summary.focus();
  await page.keyboard.press("Enter");
  await expect(page.locator("details").first()).toHaveAttribute("open", "");
});

test("structured data and SEO files are present", async ({ page, request }) => {
  await page.goto("/");
  const ld = await page.locator('script[type="application/ld+json"]').first().textContent();
  const data = JSON.parse(ld!);
  expect(data.name).toBe("Sugar Land Lighting Solutions");
  expect(data.telephone).toBeUndefined(); // not invented while unset
  expect((await request.get("/sitemap.xml")).status()).toBe(200);
  const robots = await (await request.get("/robots.txt")).text();
  expect(robots).toContain("Disallow: /admin");
});
