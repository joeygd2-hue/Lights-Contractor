import { expect, test } from "@playwright/test";
import { pool, resetDb } from "./helpers";

test.beforeEach(resetDb);

async function seedLead() {
  await pool.query(
    `INSERT INTO leads (reference, kind, name, email, phone, services, zip, in_service_area, idempotency_key)
     VALUES ('Q-TEST22', 'quote', 'Taylor Brooks', 'taylor@example.com', '2815550177', '{roofline}', '77498', true, gen_random_uuid()::text)`,
  );
}

async function login(page: import("@playwright/test").Page, password = "e2e-owner-password") {
  await page.goto("/admin/login");
  await page.getByLabel("Email").fill("owner@example.com");
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
  if (password === "e2e-owner-password") await expect(page).toHaveURL(/\/admin$/);
}

test("admin pages and data require authentication", async ({ page, request, context }) => {
  for (const path of ["/admin", "/admin/leads", "/admin/bookings", "/admin/availability"]) {
    await page.goto(path);
    await expect(page).toHaveURL(/\/admin\/login$/);
  }
  // A forged cookie gets past the proxy's presence check but not real auth.
  await context.addCookies([{ name: "slls_admin", value: "forged", url: "http://localhost:3200" }]);
  await page.goto("/admin/leads");
  await expect(page).toHaveURL(/\/admin\/login$/);
  const csv = await page.request.get("/api/admin/export");
  expect(csv.status()).toBe(401);
  expect((await request.get("/api/admin/export", { maxRedirects: 0 })).status()).toBe(307);
});

test("wrong password is rejected", async ({ page }) => {
  await login(page, "not-the-password");
  await expect(page.getByText("That email and password combination isn't right.")).toBeVisible();
  await expect(page).toHaveURL(/\/admin\/login$/);
});

test("owner can sign in, manage a lead, export, manage availability and sign out", async ({ page }) => {
  await seedLead();
  await login(page);
  await expect(page.getByRole("heading", { name: "Overview" })).toBeVisible();
  await expect(page.getByText("Email notifications are off.")).toBeVisible();

  await page.getByRole("navigation", { name: "Dashboard" }).getByRole("link", { name: "Leads" }).click();
  await page.getByRole("link", { name: "Taylor Brooks" }).click();
  await expect(page.getByRole("heading", { name: "Taylor Brooks" })).toBeVisible();

  await page.getByLabel("Lead status").selectOption("contacted");
  await page.getByRole("button", { name: "Update" }).click();
  await expect.poll(async () => (await pool.query("SELECT status FROM leads")).rows[0].status).toBe("contacted");

  await page.getByLabel("New note").fill("Left a voicemail.");
  await page.getByRole("button", { name: "Add note" }).click();
  await expect(page.getByText("Left a voicemail.")).toBeVisible();

  const csv = await page.request.get("/api/admin/export");
  expect(csv.status()).toBe(200);
  expect(await csv.text()).toContain("Q-TEST22");

  await page.goto("/admin/availability");
  await page.getByLabel("Date to block").fill("2030-01-15");
  await page.getByRole("button", { name: "Block date" }).click();
  await expect(page.getByText("Date blocked.")).toBeVisible();
  await expect.poll(async () => (await pool.query("SELECT count(*)::int n FROM blackout_dates")).rows[0].n).toBe(1);

  await page.getByRole("button", { name: "Sign out" }).click();
  await expect(page).toHaveURL(/\/admin\/login$/);
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/admin\/login$/);
});

test("owner can cancel a consultation, freeing the slot", async ({ page, request }) => {
  const avail = await (await request.get("/api/availability")).json();
  const start = avail.days.find((d: { slots: unknown[] }) => d.slots.length).slots[0].start;
  const res = await request.post("/api/bookings", {
    data: { consultationType: "phone", startAt: start, name: "Lee Park", email: "lee@example.com", phone: "2815550155", website: "", startedAt: Date.now() - 60_000, idempotencyKey: crypto.randomUUID() },
  });
  expect(res.status()).toBe(201);

  await login(page);
  await page.goto("/admin/bookings");
  await expect(page.getByText("Lee Park")).toBeVisible();
  await page.getByRole("button", { name: "Cancel consultation" }).click();
  await expect.poll(async () => (await pool.query("SELECT status FROM bookings")).rows[0].status).toBe("cancelled");

  const after = await (await request.get("/api/availability")).json();
  const offered = after.days.flatMap((d: { slots: { start: string }[] }) => d.slots.map((s) => s.start));
  expect(offered).toContain(start);
});
