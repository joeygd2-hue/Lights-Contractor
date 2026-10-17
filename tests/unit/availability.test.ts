import { describe, expect, it } from "vitest";
import {
  addDays,
  availableDays,
  localDateString,
  localTimeToInstant,
  slotsForDate,
  type Settings,
} from "@/lib/booking/availability";

const tz = "America/Chicago";
const settings: Settings = {
  durationMinutes: 30,
  bufferMinutes: 15,
  slotIntervalMinutes: 30,
  minNoticeHours: 24,
  maxDaysAhead: 30,
};
// Monday 5:00–7:00 pm
const rules = [{ weekday: 1, startMinute: 17 * 60, endMinute: 19 * 60 }];
// "Now" = Friday Oct 30 2026, 10:00 am Central (15:00Z, CDT)
const now = new Date("2026-10-30T15:00:00Z");
const monday = "2026-11-02"; // after DST ends Nov 1 → CST (UTC-6)

const base = { tz, now, rules, settings, blackouts: new Set<string>(), busy: [] };

describe("time zone helpers", () => {
  it("converts local wall time to UTC across DST", () => {
    expect(localTimeToInstant("2026-10-30", 17 * 60, tz).toISOString()).toBe("2026-10-30T22:00:00.000Z"); // CDT
    expect(localTimeToInstant(monday, 17 * 60, tz).toISOString()).toBe("2026-11-02T23:00:00.000Z"); // CST
  });
  it("computes local dates and adds days", () => {
    expect(localDateString(new Date("2026-11-03T04:30:00Z"), tz)).toBe("2026-11-02");
    expect(addDays("2026-12-30", 3)).toBe("2027-01-02");
  });
});

describe("slotsForDate", () => {
  it("generates slots inside the rule that fit the duration", () => {
    const slots = slotsForDate({ ...base, date: monday });
    expect(slots.map((s) => s.start.toISOString())).toEqual([
      "2026-11-02T23:00:00.000Z",
      "2026-11-02T23:30:00.000Z",
      "2026-11-03T00:00:00.000Z",
      "2026-11-03T00:30:00.000Z",
    ]);
    expect(slots[0]!.end.getTime() - slots[0]!.start.getTime()).toBe(30 * 60_000);
  });

  it("returns nothing on days without rules", () => {
    expect(slotsForDate({ ...base, date: "2026-11-03" })).toEqual([]);
  });

  it("respects blackout dates", () => {
    expect(slotsForDate({ ...base, date: monday, blackouts: new Set([monday]) })).toEqual([]);
  });

  it("respects minimum notice", () => {
    const lateNow = new Date("2026-11-01T23:45:00Z"); // Sun 5:45pm CST → earliest Mon 5:45pm
    const slots = slotsForDate({ ...base, now: lateNow, date: monday });
    expect(slots.map((s) => s.start.toISOString())).toEqual([
      "2026-11-03T00:00:00.000Z",
      "2026-11-03T00:30:00.000Z",
    ]);
  });

  it("does not offer dates outside the booking window or in the past", () => {
    expect(slotsForDate({ ...base, date: "2026-10-26" })).toEqual([]);
    expect(slotsForDate({ ...base, date: addDays("2026-10-30", 31) })).toEqual([]);
  });

  it("excludes slots overlapping an existing booking including its buffer", () => {
    // Existing 5:30–6:00 pm booking, blocked until 6:15 pm.
    const busy = [{ start: new Date("2026-11-02T23:30:00Z"), end: new Date("2026-11-03T00:15:00Z") }];
    const slots = slotsForDate({ ...base, date: monday, busy });
    // 5:00 slot blocks until 5:45 → overlaps; 6:00 overlaps 6:15; 6:30 is free.
    expect(slots.map((s) => s.start.toISOString())).toEqual(["2026-11-03T00:30:00.000Z"]);
  });

  it("deduplicates overlapping rules", () => {
    const doubled = [...rules, { weekday: 1, startMinute: 18 * 60, endMinute: 19 * 60 }];
    expect(slotsForDate({ ...base, rules: doubled, date: monday })).toHaveLength(4);
  });
});

describe("availableDays", () => {
  it("covers today through maxDaysAhead", () => {
    const days = availableDays(base);
    expect(days).toHaveLength(31);
    expect(days[0]!.date).toBe("2026-10-30");
    expect(days.filter((d) => d.slots.length).every((d) => new Date(`${d.date}T12:00:00Z`).getUTCDay() === 1)).toBe(true);
  });
});
