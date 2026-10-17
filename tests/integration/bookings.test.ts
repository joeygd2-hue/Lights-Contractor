import { randomUUID } from "node:crypto";
import { beforeEach, describe, expect, it } from "vitest";
import { sql } from "drizzle-orm";
import { db } from "@/db";
import { availabilityRules, blackoutDates, bookings } from "@/db/schema";
import { createBooking, getAvailability, rescheduleBooking } from "@/lib/server/bookings";
import { bookingSchema } from "@/lib/validation";
import { resetDb } from "../support/db";

// Friday Oct 30 2026, 10:00 am Central. Monday Nov 2 has 5–7 pm availability.
const now = new Date("2026-10-30T15:00:00Z");
const FIVE_PM = "2026-11-02T23:00:00.000Z";
const FIVE_THIRTY = "2026-11-02T23:30:00.000Z";
const SIX_PM = "2026-11-03T00:00:00.000Z";

function request(startAt: string, overrides: Record<string, unknown> = {}) {
  return bookingSchema.parse({
    consultationType: "phone",
    startAt,
    name: "Pat Rivera",
    email: "pat@example.com",
    phone: "2815550142",
    website: "",
    startedAt: 1,
    idempotencyKey: randomUUID(),
    ...overrides,
  });
}

beforeEach(async () => {
  await resetDb();
  await db.insert(availabilityRules).values({ weekday: 1, startMinute: 17 * 60, endMinute: 19 * 60 });
});

describe("availability", () => {
  it("lists real slots from the database", async () => {
    const a = await getAvailability(now);
    const monday = a.days.find((d) => d.date === "2026-11-02")!;
    expect(monday.slots.map((s) => s.start)).toEqual([FIVE_PM, FIVE_THIRTY, SIX_PM, "2026-11-03T00:30:00.000Z"]);
    expect(monday.slots[0]!.label).toBe("5:00 PM");
    expect(a.days.filter((d) => d.slots.length).every((d) => d.date >= "2026-11-02")).toBe(true);
  });

  it("removes booked and buffered slots", async () => {
    await createBooking(request(FIVE_THIRTY), "h", now);
    const monday = (await getAvailability(now)).days.find((d) => d.date === "2026-11-02")!;
    // 5:00 (+15 buffer → 5:45) overlaps 5:30; 6:00 overlaps 5:30's buffer (6:15).
    expect(monday.slots.map((s) => s.start)).toEqual(["2026-11-03T00:30:00.000Z"]);
  });

  it("hides blacked-out dates", async () => {
    await db.insert(blackoutDates).values({ day: "2026-11-02", reason: "Install day" });
    const monday = (await getAvailability(now)).days.find((d) => d.date === "2026-11-02")!;
    expect(monday.slots).toEqual([]);
  });
});

describe("createBooking", () => {
  it("books an available slot", async () => {
    const r = await createBooking(request(FIVE_PM), "h", now);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.booking.reference).toMatch(/^B-/);
    expect(r.booking.endAt.toISOString()).toBe(FIVE_THIRTY);
    expect(r.booking.blockedUntil.toISOString()).toBe("2026-11-02T23:45:00.000Z");
  });

  it("rejects times that aren't offered", async () => {
    expect((await createBooking(request("2026-11-02T23:10:00.000Z"), "h", now)).ok).toBe(false); // off-grid
    expect((await createBooking(request("2026-11-03T23:00:00.000Z"), "h", now)).ok).toBe(false); // Tuesday
    expect((await createBooking(request("2026-10-30T22:00:00.000Z"), "h", now)).ok).toBe(false); // too soon
  });

  it("rejects a slot that was already taken", async () => {
    expect((await createBooking(request(FIVE_PM), "h", now)).ok).toBe(true);
    expect((await createBooking(request(FIVE_PM), "h", now)).ok).toBe(false);
    expect((await createBooking(request(FIVE_THIRTY), "h", now)).ok).toBe(false); // inside buffer
  });

  it("is idempotent for the same submission", async () => {
    const data = request(FIVE_PM);
    const a = await createBooking(data, "h", now);
    const b = await createBooking(data, "h", now);
    expect(a.ok && b.ok && a.booking.id === b.booking.id).toBe(true);
    expect(b.ok && b.created).toBe(false);
  });

  it("allows exactly one of many simultaneous requests for the same time", async () => {
    const results = await Promise.all(
      Array.from({ length: 12 }, (_, i) => createBooking(request(FIVE_PM, { email: `p${i}@example.com` }), "h", now)),
    );
    expect(results.filter((r) => r.ok)).toHaveLength(1);
    expect(await db.$count(bookings)).toBe(1);
  });

  it("allows only one of simultaneous overlapping (different) times", async () => {
    const results = await Promise.all([
      createBooking(request(FIVE_PM), "h", now),
      createBooking(request(FIVE_THIRTY), "h", now),
    ]);
    expect(results.filter((r) => r.ok)).toHaveLength(1);
  });

  it("frees the time again when a booking is cancelled", async () => {
    const r = await createBooking(request(FIVE_PM), "h", now);
    if (!r.ok) throw new Error("expected booking");
    await db.update(bookings).set({ status: "cancelled" }).where(sql`id = ${r.booking.id}`);
    expect((await createBooking(request(FIVE_PM), "h", now)).ok).toBe(true);
  });

  it("enforces no-overlap at the database level even when bypassing checks", async () => {
    const r = await createBooking(request(FIVE_PM), "h", now);
    if (!r.ok) throw new Error("expected booking");
    const other = await createBooking(request("2026-11-03T00:30:00.000Z"), "h", now);
    if (!other.ok) throw new Error("expected booking");
    const moved = await rescheduleBooking(other.booking.id, new Date(FIVE_THIRTY));
    expect(moved).toEqual({ ok: false, reason: "conflict" });
  });
});
