import { expect, test } from "@playwright/test";
import { pool, resetDb } from "./helpers";

test.beforeEach(resetDb);

test("book a consultation end to end, then the slot disappears", async ({ page, request }) => {
  await page.goto("/book");
  await page.getByRole("button", { name: /Continue/ }).click();
  await expect(page.getByText("Please choose a consultation type.")).toBeVisible();
  await page.getByLabel(/On-site walkthrough/).check();
  await page.getByRole("button", { name: /Continue/ }).click();

  // First date with availability, first time.
  const day = page.getByRole("button", { name: /times? available/ }).first();
  await day.click();
  const slot = page.getByRole("radio").first();
  const slotLabel = (await slot.textContent())!;
  await slot.click();
  await expect(slot).toHaveAttribute("aria-checked", "true");
  await page.getByRole("button", { name: /Continue/ }).click();

  // On-site requires an address.
  await page.getByLabel("Full name").fill("Morgan Diaz");
  await page.getByLabel("Email").fill("morgan@example.com");
  await page.getByLabel("Phone").fill("2815550123");
  await page.getByRole("button", { name: /Continue/ }).click();
  await expect(page.getByText("We need the property address for an on-site visit.")).toBeVisible();
  await page.getByLabel("Property address").fill("9 Sample Dr");
  await page.getByLabel("ZIP code").fill("77498");
  await page.getByRole("button", { name: /Continue/ }).click();

  await expect(page.getByRole("heading", { name: "Review & confirm" })).toBeVisible();
  await page.waitForTimeout(3000);
  await page.getByRole("button", { name: "Confirm booking" }).click();
  await expect(page.getByRole("heading", { name: /You.re booked, Morgan\./ })).toBeVisible();
  await expect(page.getByText(/^B-[A-Z0-9]{6}$/)).toBeVisible();

  const { rows } = await pool.query("SELECT consultation_type, status, start_at, address FROM bookings");
  expect(rows).toHaveLength(1);
  expect(rows[0]).toMatchObject({ consultation_type: "onsite", status: "confirmed", address: "9 Sample Dr" });

  // The booked slot is no longer offered.
  const avail = await (await request.get("/api/availability")).json();
  const booked = new Date(rows[0].start_at).toISOString();
  const offered = avail.days.flatMap((d: { slots: { start: string }[] }) => d.slots.map((s) => s.start));
  expect(offered).not.toContain(booked);
  expect(slotLabel).toBeTruthy();
});

test("booking an already-taken slot returns 409 and the UI recovers", async ({ page, request }) => {
  const avail = await (await request.get("/api/availability")).json();
  const start = avail.days.find((d: { slots: unknown[] }) => d.slots.length).slots[0].start;
  const base = { consultationType: "phone", startAt: start, name: "A Person", email: "a@example.com", phone: "2815550100", website: "", startedAt: Date.now() - 60_000 };

  // Two different people race for the same slot.
  const [r1, r2] = await Promise.all([
    request.post("/api/bookings", { data: { ...base, idempotencyKey: crypto.randomUUID() } }),
    request.post("/api/bookings", { data: { ...base, email: "b@example.com", idempotencyKey: crypto.randomUUID() } }),
  ]);
  expect([r1.status(), r2.status()].sort()).toEqual([201, 409]);

  // A user who had that slot selected gets sent back to pick another.
  await page.goto("/book");
  await page.getByLabel(/Phone consultation/).check();
  await page.getByRole("button", { name: /Continue/ }).click();
  await page.getByRole("button", { name: /times? available/ }).first().click();
  await expect(page.getByRole("radio").first()).not.toHaveText(new Date(start).toLocaleTimeString("en-US", { timeZone: "America/Chicago", hour: "numeric", minute: "2-digit" }));
});

test("availability API never offers blocked dates", async ({ request }) => {
  const before = await (await request.get("/api/availability")).json();
  const day = before.days.find((d: { slots: unknown[] }) => d.slots.length).date;
  await pool.query("INSERT INTO blackout_dates (day, reason) VALUES ($1, 'test')", [day]);
  const after = await (await request.get("/api/availability")).json();
  expect(after.days.find((d: { date: string }) => d.date === day).slots).toEqual([]);
});
