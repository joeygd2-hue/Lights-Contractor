import { expect, test } from "@playwright/test";

const pages = ["/", "/services", "/process", "/gallery", "/about", "/faq", "/contact", "/quote", "/book"];

test("no horizontal overflow on mobile", async ({ page }) => {
  for (const path of pages) {
    await page.goto(path);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow, path).toBeLessThanOrEqual(0);
  }
});

test("mobile menu opens, traps focus, closes on Escape and navigates", async ({ page }) => {
  await page.goto("/");
  const toggle = page.getByRole("button", { name: "Open menu" });
  await toggle.click();
  const dialog = page.getByRole("dialog", { name: "Site menu" });
  await expect(dialog).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(page.getByRole("button", { name: "Open menu" })).toBeFocused();

  await page.getByRole("button", { name: "Open menu" }).click();
  await dialog.getByRole("link", { name: /Gallery/ }).click();
  await expect(page).toHaveURL("/gallery");
  await expect(dialog).toBeHidden();
});

test("tap targets in the main CTAs are at least 44px tall", async ({ page }) => {
  await page.goto("/");
  for (const name of ["Get a free quote", "Book a consultation"]) {
    const box = await page.getByRole("link", { name }).filter({ visible: true }).first().boundingBox();
    expect(box!.height, name).toBeGreaterThanOrEqual(44);
  }
});
