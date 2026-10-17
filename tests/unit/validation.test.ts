import { describe, expect, it } from "vitest";
import { bookingSchema, contactSchema, quoteSchema, quoteStep1, quoteStep3 } from "@/lib/validation";

const meta = { startedAt: Date.now() - 60_000, idempotencyKey: "3f1c2a7e-8a4b-4c1e-9d2f-1a2b3c4d5e6f", website: "" };

const validQuote = {
  name: "Pat Rivera",
  email: "pat@example.com",
  phone: "(281) 555-0142",
  preferredContact: "email",
  address: "123 Sample Ln",
  city: "Sugar Land",
  zip: "77498",
  propertyType: "Single-family home",
  propertyDetails: "",
  services: ["roofline", "trees"],
  servicesOther: "",
  specialRequests: "",
  timeframe: "Early November",
  hasLights: "Not sure",
  notes: "",
  ...meta,
};

describe("quote validation", () => {
  it("accepts a complete request and normalizes the phone", () => {
    const r = quoteSchema.safeParse(validQuote);
    expect(r.success).toBe(true);
    expect(r.data?.phone).toBe("2815550142");
  });

  it("rejects a bad email, phone and ZIP", () => {
    const r = quoteSchema.safeParse({ ...validQuote, email: "pat@", phone: "555", zip: "7749" });
    expect(r.success).toBe(false);
    const paths = r.error!.issues.map((i) => i.path[0]);
    expect(paths).toEqual(expect.arrayContaining(["email", "phone", "zip"]));
  });

  it("requires at least one service", () => {
    expect(quoteStep3.safeParse({ services: [] }).success).toBe(false);
  });

  it("requires a description when 'other' is selected", () => {
    const r = quoteStep3.safeParse({ services: ["other"], servicesOther: "" });
    expect(r.success).toBe(false);
    expect(r.error!.issues[0]!.path).toEqual(["servicesOther"]);
  });

  it("rejects unknown services", () => {
    expect(quoteSchema.safeParse({ ...validQuote, services: ["fireworks"] }).success).toBe(false);
  });

  it("validates step 1 on its own", () => {
    expect(quoteStep1.safeParse({ name: "A", email: "x", phone: "", preferredContact: "" }).success).toBe(false);
  });

  it("requires a valid idempotency key", () => {
    expect(quoteSchema.safeParse({ ...validQuote, idempotencyKey: "nope" }).success).toBe(false);
  });
});

describe("contact validation", () => {
  it("allows optional phone and ZIP to be blank", () => {
    const r = contactSchema.safeParse({ name: "Pat Rivera", email: "pat@example.com", message: "Do you serve Telfair?", ...meta });
    expect(r.success).toBe(true);
  });
  it("requires a meaningful message", () => {
    expect(contactSchema.safeParse({ name: "Pat Rivera", email: "pat@example.com", message: "hi", ...meta }).success).toBe(false);
  });
});

describe("booking validation", () => {
  const base = {
    consultationType: "phone",
    startAt: "2026-11-02T23:00:00.000Z",
    name: "Pat Rivera",
    email: "pat@example.com",
    phone: "2815550142",
    ...meta,
  };
  it("accepts a phone consultation without an address", () => {
    expect(bookingSchema.safeParse(base).success).toBe(true);
  });
  it("requires an address for on-site visits", () => {
    const r = bookingSchema.safeParse({ ...base, consultationType: "onsite" });
    expect(r.success).toBe(false);
    expect(r.error!.issues[0]!.path).toEqual(["address"]);
  });
  it("rejects non-ISO times", () => {
    expect(bookingSchema.safeParse({ ...base, startAt: "tomorrow at 5" }).success).toBe(false);
  });
});
