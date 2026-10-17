import { expect, test } from "@playwright/test";
import { pool, resetDb } from "./helpers";

test.beforeEach(resetDb);

test("quote request: validation, review, edit, submit and persist", async ({ page }) => {
  await page.goto("/quote?service=roofline");

  // Step 1 — validation errors
  await page.getByRole("button", { name: /Continue/ }).click();
  await expect(page.getByText("Please enter your full name.")).toBeVisible();
  await expect(page.getByLabel("Full name")).toBeFocused();
  await page.getByLabel("Full name").fill("Jordan Avery");
  await page.getByRole("textbox", { name: "Email" }).fill("jordan@example");
  await page.getByRole("textbox", { name: "Phone" }).fill("281 555 0199");
  await page.getByLabel("Text message").check();
  await page.getByRole("button", { name: /Continue/ }).click();
  await expect(page.getByText("Please enter a valid email address.")).toBeVisible();
  await page.getByRole("textbox", { name: "Email" }).fill("jordan@example.com");
  await page.getByRole("button", { name: /Continue/ }).click();

  // Step 2
  await expect(page.getByRole("heading", { name: "Your property" })).toBeVisible();
  await page.getByLabel("Street address").fill("42 Example Ct");
  await page.getByLabel("ZIP code").fill("77498");
  await expect(page.getByText("You're in our New Territory service area.")).toBeVisible();
  await page.getByLabel("Single-family home").check();
  await page.getByRole("button", { name: /Continue/ }).click();

  // Step 3 — prefilled from ?service=roofline
  await expect(page.getByLabel("Roofline lighting")).toBeChecked();
  await page.getByLabel("Tree & landscape lighting").check();
  await page.getByLabel("Something else").check();
  await page.getByRole("button", { name: /Continue/ }).click();
  await expect(page.getByText("Tell us a little about what else you have in mind.")).toBeVisible();
  await page.getByLabel("What else did you have in mind?").fill("Lit mailbox post");
  await page.getByRole("button", { name: /Continue/ }).click();

  // Step 4
  await page.getByLabel("Preferred installation timing").selectOption("Early November");
  await page.getByLabel("Do you have your own lights?").selectOption("Not sure");
  await page.getByLabel("Budget range").selectOption("$800 – $1,200");
  await page.getByRole("button", { name: /Continue/ }).click();

  // Step 5 — review, edit a section, come back
  await expect(page.getByRole("heading", { name: "Review & send" })).toBeVisible();
  await expect(page.getByText("42 Example Ct, Sugar Land 77498")).toBeVisible();
  await page.getByRole("button", { name: "Edit your details" }).click();
  await page.getByLabel("Full name").fill("Jordan A. Avery");
  for (let i = 0; i < 4; i++) await page.getByRole("button", { name: /Continue/ }).click();
  await expect(page.getByText("Jordan A. Avery")).toBeVisible();

  await page.waitForTimeout(4000); // anti-bot minimum fill time
  const submit = page.getByRole("button", { name: "Send quote request" });
  await submit.click();
  await expect(page.getByRole("heading", { name: "Thank you, Jordan." })).toBeVisible();
  const ref = await page.getByText(/^Q-[A-Z0-9]{6}$/).textContent();

  const { rows } = await pool.query("SELECT * FROM leads");
  expect(rows).toHaveLength(1);
  expect(rows[0]).toMatchObject({
    reference: ref,
    kind: "quote",
    name: "Jordan A. Avery",
    phone: "2815550199",
    preferred_contact: "text",
    zip: "77498",
    in_service_area: true,
    services: ["roofline", "trees", "other"],
    services_other: "Lit mailbox post",
    budget: "$800 – $1,200",
    customer_notified: "skipped",
  });
});

test("quote API rejects invalid input and deduplicates retries", async ({ request }) => {
  const bad = await request.post("/api/quote", { data: { name: "x" } });
  expect(bad.status()).toBe(422);
  const body = await bad.json();
  expect(body.ok).toBe(false);
  expect(body.fields.email).toBeTruthy();

  const payload = {
    name: "Casey Kim", email: "casey@example.com", phone: "2815550111", preferredContact: "email",
    address: "1 Test Way", city: "Sugar Land", zip: "77498", propertyType: "Townhome",
    services: ["wreaths"], timeframe: "Flexible", hasLights: "Not sure",
    website: "", startedAt: Date.now() - 60_000, idempotencyKey: crypto.randomUUID(),
  };
  const a = await request.post("/api/quote", { data: payload });
  const b = await request.post("/api/quote", { data: payload });
  expect(a.status()).toBe(201);
  expect(b.status()).toBe(200);
  expect((await a.json()).reference).toBe((await b.json()).reference);
  const { rows } = await pool.query("SELECT count(*)::int AS n FROM leads");
  expect(rows[0].n).toBe(1);
});

test("honeypot submissions are accepted silently but not stored", async ({ request }) => {
  const res = await request.post("/api/contact", {
    data: { name: "Bot", email: "bot@example.com", message: "Buy cheap stuff now", website: "http://spam", startedAt: Date.now() - 60_000, idempotencyKey: crypto.randomUUID() },
  });
  expect(res.status()).toBe(200);
  const { rows } = await pool.query("SELECT count(*)::int AS n FROM leads");
  expect(rows[0].n).toBe(0);
});

test("public endpoints are rate limited", async ({ request }) => {
  const statuses: number[] = [];
  for (let i = 0; i < 7; i++) {
    const r = await request.post("/api/contact", { data: { name: "R" } });
    statuses.push(r.status());
  }
  expect(statuses.slice(0, 5).every((s) => s === 422)).toBe(true);
  expect(statuses.at(-1)).toBe(429);
});

test("contact form submits and stores the message", async ({ page }) => {
  await page.goto("/contact");
  await page.getByRole("button", { name: "Send message" }).click();
  await expect(page.getByText("Please enter your full name.")).toBeVisible();
  await page.getByLabel("Full name").fill("Robin Shah");
  await page.getByLabel("Email").fill("robin@example.com");
  await page.getByLabel("How can we help?").fill("Do you install on two-story homes in Telfair?");
  await page.waitForTimeout(2600);
  await page.getByRole("button", { name: "Send message" }).click();
  await expect(page.getByRole("heading", { name: /Message sent/ })).toBeVisible();
  const { rows } = await pool.query("SELECT kind, name, message FROM leads");
  expect(rows).toEqual([{ kind: "contact", name: "Robin Shah", message: "Do you install on two-story homes in Telfair?" }]);
});
