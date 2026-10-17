import { randomUUID } from "node:crypto";
import { beforeEach, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { leads } from "@/db/schema";
import { createContactLead, createQuoteLead } from "@/lib/server/leads";
import { rateLimit } from "@/lib/server/rate-limit";
import { quoteSchema } from "@/lib/validation";
import { resetDb } from "../support/db";

function quote(overrides: Record<string, unknown> = {}) {
  return quoteSchema.parse({
    name: "Pat Rivera",
    email: "Pat@Example.com",
    phone: "281-555-0142",
    preferredContact: "text",
    address: "123 Sample Ln",
    city: "Sugar Land",
    zip: "77498",
    propertyType: "Single-family home",
    services: ["roofline", "wreaths"],
    timeframe: "Flexible",
    hasLights: "Not sure",
    budget: "$800 – $1,200",
    website: "",
    startedAt: Date.now() - 60_000,
    idempotencyKey: randomUUID(),
    ...overrides,
  });
}

beforeEach(resetDb);

describe("lead persistence", () => {
  it("stores a quote request with a reference and normalized fields", async () => {
    const { lead, created } = await createQuoteLead(quote(), "iphash");
    expect(created).toBe(true);
    expect(lead.reference).toMatch(/^Q-[2-9A-HJ-NP-Z]{6}$/);
    const [row] = await db.select().from(leads).where(eq(leads.id, lead.id));
    expect(row).toMatchObject({
      kind: "quote",
      status: "new",
      email: "pat@example.com",
      phone: "2815550142",
      inServiceArea: true,
      services: ["roofline", "wreaths"],
      budget: "$800 – $1,200",
      ownerNotified: "pending",
    });
  });

  it("flags addresses outside the service area", async () => {
    const { lead } = await createQuoteLead(quote({ zip: "77001" }), "iphash");
    expect(lead.inServiceArea).toBe(false);
  });

  it("deduplicates repeat submissions with the same idempotency key", async () => {
    const data = quote();
    const [a, b] = await Promise.all([createQuoteLead(data, "h"), createQuoteLead(data, "h")]);
    expect(a.lead.id).toBe(b.lead.id);
    expect([a.created, b.created].filter(Boolean)).toHaveLength(1);
    expect(await db.$count(leads)).toBe(1);
  });

  it("stores contact messages", async () => {
    const { lead } = await createContactLead(
      { name: "Sam Lee", email: "sam@example.com", phone: "", zip: "", message: "Do you do commercial?", website: "", startedAt: 1, idempotencyKey: randomUUID() },
      "h",
    );
    expect(lead.reference).toMatch(/^C-/);
    expect(lead.kind).toBe("contact");
    expect(lead.inServiceArea).toBeNull();
  });
});

describe("rate limiting", () => {
  it("allows up to the limit, then blocks", async () => {
    const results = [];
    for (let i = 0; i < 4; i++) results.push(await rateLimit("t:1", 3, 600));
    expect(results).toEqual([true, true, true, false]);
    expect(await rateLimit("t:other", 3, 600)).toBe(true);
  });
});
