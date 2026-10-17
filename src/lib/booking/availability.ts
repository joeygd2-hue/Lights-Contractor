import { TZDate } from "@date-fns/tz";

/**
 * Pure slot-generation logic (no database access) so it can be unit tested
 * and reused by both the availability endpoint and booking validation.
 */

export type Rule = { weekday: number; startMinute: number; endMinute: number };
export type Settings = {
  durationMinutes: number;
  bufferMinutes: number;
  slotIntervalMinutes: number;
  minNoticeHours: number;
  maxDaysAhead: number;
};
/** An occupied interval [start, end) — for bookings, end = blocked_until. */
export type Busy = { start: Date; end: Date };

export type Slot = { start: Date; end: Date };
export type Day = { date: string; slots: Slot[] };

const MINUTE = 60_000;

/** "YYYY-MM-DD" for an instant, as seen in the business's time zone. */
export function localDateString(instant: Date, tz: string): string {
  const d = new TZDate(instant.getTime(), tz);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function parseDate(date: string): [number, number, number] {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  if (!m) throw new Error(`Invalid date: ${date}`);
  return [Number(m[1]), Number(m[2]), Number(m[3])];
}

/** Adds whole calendar days to a "YYYY-MM-DD" string. */
export function addDays(date: string, days: number): string {
  const [y, m, d] = parseDate(date);
  const dt = new Date(Date.UTC(y, m - 1, d + days));
  return dt.toISOString().slice(0, 10);
}

/** The UTC instant for a local wall-clock time (handles DST correctly). */
export function localTimeToInstant(date: string, minuteOfDay: number, tz: string): Date {
  const [y, m, d] = parseDate(date);
  const local = new TZDate(y, m - 1, d, Math.floor(minuteOfDay / 60), minuteOfDay % 60, tz);
  return new Date(local.getTime());
}

export function weekdayOf(date: string, tz: string): number {
  const [y, m, d] = parseDate(date);
  return new TZDate(y, m - 1, d, 12, 0, tz).getDay();
}

function overlaps(aStart: number, aEnd: number, bStart: number, bEnd: number) {
  return aStart < bEnd && bStart < aEnd;
}

/**
 * Bookable slots for one local date. A slot is offered only if:
 *  - it falls inside an availability rule for that weekday,
 *  - the date isn't blacked out and is within the booking window,
 *  - it starts at least `minNoticeHours` from now,
 *  - [start, end + buffer) doesn't overlap any existing booking's
 *    [start, blocked_until) — the same rule the database constraint enforces.
 */
export function slotsForDate(opts: {
  date: string;
  tz: string;
  now: Date;
  rules: Rule[];
  settings: Settings;
  blackouts: Set<string>;
  busy: Busy[];
}): Slot[] {
  const { date, tz, now, rules, settings, blackouts, busy } = opts;
  const today = localDateString(now, tz);
  const lastDay = addDays(today, settings.maxDaysAhead);
  if (date < today || date > lastDay || blackouts.has(date)) return [];

  const weekday = weekdayOf(date, tz);
  const earliest = now.getTime() + settings.minNoticeHours * 60 * MINUTE;
  const duration = settings.durationMinutes * MINUTE;
  const buffer = settings.bufferMinutes * MINUTE;
  const step = Math.max(5, settings.slotIntervalMinutes);

  const seen = new Set<number>();
  const slots: Slot[] = [];
  for (const rule of rules.filter((r) => r.weekday === weekday)) {
    for (let m = rule.startMinute; m + settings.durationMinutes <= rule.endMinute; m += step) {
      const start = localTimeToInstant(date, m, tz).getTime();
      if (seen.has(start)) continue;
      if (start < earliest) continue;
      const blockedUntil = start + duration + buffer;
      if (busy.some((b) => overlaps(start, blockedUntil, b.start.getTime(), b.end.getTime()))) continue;
      seen.add(start);
      slots.push({ start: new Date(start), end: new Date(start + duration) });
    }
  }
  return slots.sort((a, b) => a.start.getTime() - b.start.getTime());
}

/** All dates in the booking window with their available slots. */
export function availableDays(opts: Omit<Parameters<typeof slotsForDate>[0], "date">): Day[] {
  const today = localDateString(opts.now, opts.tz);
  const days: Day[] = [];
  for (let i = 0; i <= opts.settings.maxDaysAhead; i++) {
    const date = addDays(today, i);
    days.push({ date, slots: slotsForDate({ ...opts, date }) });
  }
  return days;
}

export function formatSlot(instant: Date, tz: string) {
  return {
    date: new Intl.DateTimeFormat("en-US", {
      timeZone: tz,
      weekday: "long",
      month: "long",
      day: "numeric",
    }).format(instant),
    time: new Intl.DateTimeFormat("en-US", {
      timeZone: tz,
      hour: "numeric",
      minute: "2-digit",
    }).format(instant),
  };
}

export function minutesToLabel(minute: number): string {
  const h = Math.floor(minute / 60);
  const m = minute % 60;
  const suffix = h >= 12 ? "pm" : "am";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, "0")} ${suffix}`;
}
