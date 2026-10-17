import "server-only";
import { and, eq, gt, gte, lt, ne } from "drizzle-orm";
import { db } from "@/db";
import {
  availabilityRules,
  blackoutDates,
  bookingSettings,
  bookings,
  type Booking,
} from "@/db/schema";
import { consultationTypes, site } from "@/config/site";
import {
  addDays,
  availableDays,
  formatSlot,
  localDateString,
  slotsForDate,
  type Settings,
} from "@/lib/booking/availability";
import type { BookingData } from "@/lib/validation";
import { makeReference, pgCode, pgConstraint } from "./request";
import { ownerEmail, renderEmail, sendEmail } from "./email";
import { formatPhone } from "./leads";

const TZ = site.location.timezone;

const DEFAULT_SETTINGS: Settings = {
  durationMinutes: 30,
  bufferMinutes: 15,
  slotIntervalMinutes: 30,
  minNoticeHours: 24,
  maxDaysAhead: 45,
};

export async function getSettings(): Promise<Settings> {
  const [row] = await db.select().from(bookingSettings).where(eq(bookingSettings.id, 1));
  return row ?? DEFAULT_SETTINGS;
}

/** Everything needed to compute availability, loaded in parallel. */
async function loadAvailabilityInputs(now: Date) {
  const settings = await getSettings();
  const windowStart = new Date(now.getTime() - 24 * 3600_000);
  const windowEnd = new Date(now.getTime() + (settings.maxDaysAhead + 2) * 24 * 3600_000);
  const today = localDateString(now, TZ);
  const [rules, blackouts, busy] = await Promise.all([
    db.select().from(availabilityRules),
    db
      .select({ day: blackoutDates.day })
      .from(blackoutDates)
      .where(and(gte(blackoutDates.day, today), lt(blackoutDates.day, addDays(today, settings.maxDaysAhead + 1)))),
    db
      .select({ start: bookings.startAt, end: bookings.blockedUntil })
      .from(bookings)
      .where(
        and(
          eq(bookings.status, "confirmed"),
          lt(bookings.startAt, windowEnd),
          gt(bookings.blockedUntil, windowStart),
        ),
      ),
  ]);
  return { settings, rules, blackouts: new Set(blackouts.map((b) => b.day)), busy };
}

export async function getAvailability(now = new Date()) {
  const inputs = await loadAvailabilityInputs(now);
  const days = availableDays({ ...inputs, tz: TZ, now });
  return {
    timezone: TZ,
    durationMinutes: inputs.settings.durationMinutes,
    days: days.map((d) => ({
      date: d.date,
      slots: d.slots.map((s) => ({ start: s.start.toISOString(), label: formatSlot(s.start, TZ).time })),
    })),
  };
}

export type CreateBookingResult =
  | { ok: true; booking: Booking; created: boolean }
  | { ok: false; reason: "unavailable" };

/**
 * Creates a booking only if the requested start is a currently valid slot.
 * The availability check here gives a friendly answer in the common case;
 * the database exclusion constraint is the real guarantee against two
 * people booking overlapping times at the same moment.
 */
export async function createBooking(data: BookingData, ipHash: string, now = new Date()): Promise<CreateBookingResult> {
  // Same idempotency key = same submission (double click / retry).
  const [existing] = await db.select().from(bookings).where(eq(bookings.idempotencyKey, data.idempotencyKey));
  if (existing) return { ok: true, booking: existing, created: false };

  const start = new Date(data.startAt);
  const inputs = await loadAvailabilityInputs(now);
  const date = localDateString(start, TZ);
  const valid = slotsForDate({ ...inputs, tz: TZ, now, date }).some(
    (s) => s.start.getTime() === start.getTime(),
  );
  if (!valid) return { ok: false, reason: "unavailable" };

  const { durationMinutes, bufferMinutes } = inputs.settings;
  const end = new Date(start.getTime() + durationMinutes * 60_000);
  const blockedUntil = new Date(end.getTime() + bufferMinutes * 60_000);

  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      const [row] = await db
        .insert(bookings)
        .values({
          reference: makeReference("B"),
          consultationType: data.consultationType,
          startAt: start,
          endAt: end,
          blockedUntil,
          name: data.name,
          email: data.email.toLowerCase(),
          phone: data.phone,
          address: data.address || null,
          city: data.city || null,
          zip: data.zip || null,
          notes: data.notes || null,
          idempotencyKey: data.idempotencyKey,
          ipHash,
        })
        .returning();
      return { ok: true, booking: row!, created: true };
    } catch (err) {
      const code = pgCode(err);
      if (code === "23P01") return { ok: false, reason: "unavailable" }; // overlap
      if (code === "23505") {
        const constraint = pgConstraint(err);
        if (constraint === "bookings_reference_unique") continue;
        if (constraint === "bookings_idempotency_key_unique") {
          const [dupe] = await db.select().from(bookings).where(eq(bookings.idempotencyKey, data.idempotencyKey));
          if (dupe) return { ok: true, booking: dupe, created: false };
        }
      }
      throw err;
    }
  }
  throw new Error("Could not allocate a unique booking reference");
}

export function consultationName(id: string) {
  return consultationTypes.find((c) => c.id === id)?.name ?? id;
}

export function describeBooking(b: Pick<Booking, "startAt" | "endAt">) {
  const { date, time } = formatSlot(b.startAt, TZ);
  const endTime = formatSlot(b.endAt, TZ).time;
  return { date, time, endTime, label: `${date}, ${time} – ${endTime} (Central Time)` };
}

/** Confirmation + owner notification. Never throws. */
export async function notifyBooking(b: Booking, kind: "created" | "cancelled" | "rescheduled" = "created") {
  const when = describeBooking(b).label;
  const type = consultationName(b.consultationType);
  const owner = ownerEmail();
  const rows: [string, string | null][] = [
    ["Reference", b.reference],
    ["When", when],
    ["Type", type],
    ["Name", b.name],
    ["Email", b.email],
    ["Phone", formatPhone(b.phone)],
    ["Address", [b.address, b.city, b.zip].filter(Boolean).join(", ") || null],
    ["Notes", b.notes],
  ];

  const ownerHeading =
    kind === "created" ? `New consultation booked — ${b.name}` : kind === "cancelled" ? `Consultation cancelled — ${b.name}` : `Consultation rescheduled — ${b.name}`;
  const ownerResult = owner
    ? await sendEmail({
        to: owner,
        subject: `${ownerHeading} (${b.reference})`,
        replyTo: b.email,
        ...renderEmail({
          siteName: site.name,
          heading: ownerHeading,
          intro: [`${type} on ${when}.`],
          rows,
          outro: [`Manage it in the dashboard: ${site.url}/admin/bookings`],
        }),
      })
    : "skipped";

  const first = b.name.split(" ")[0];
  const customer = {
    created: {
      subject: `Your consultation is booked — ${when}`,
      heading: "Your consultation is booked",
      intro: [
        `Hi ${first},`,
        `Your ${type.toLowerCase()} with ${site.name} is confirmed for ${when}. Your booking reference is ${b.reference}.`,
        b.consultationType === "onsite"
          ? "We'll meet you at the property. We'll walk around the outside of the home together, talk through ideas and take measurements — it usually takes about half an hour."
          : "We'll call you at the number you gave us at the scheduled time.",
      ],
    },
    cancelled: {
      subject: `Your consultation on ${describeBooking(b).date} has been cancelled`,
      heading: "Your consultation has been cancelled",
      intro: [`Hi ${first},`, `Your consultation (${b.reference}) on ${when} has been cancelled. If this is unexpected, please reply to this email or book a new time on our website.`],
    },
    rescheduled: {
      subject: `Your consultation has moved to ${when}`,
      heading: "Your consultation has a new time",
      intro: [`Hi ${first},`, `Your consultation (${b.reference}) is now scheduled for ${when}.`],
    },
  }[kind];

  const customerResult = await sendEmail({
    to: b.email,
    subject: customer.subject,
    replyTo: owner ?? undefined,
    ...renderEmail({
      siteName: site.name,
      heading: customer.heading,
      intro: customer.intro,
      rows: kind === "cancelled" ? [] : [["When", when], ["Type", type], ["Reference", b.reference]],
      outro: kind === "cancelled" ? [] : ["Need to change the time? Just reply to this email."],
    }),
  });

  try {
    await db
      .update(bookings)
      .set({ ownerNotified: ownerResult, customerNotified: customerResult })
      .where(eq(bookings.id, b.id));
  } catch (err) {
    console.error("[bookings] could not record notification status:", (err as Error).message);
  }
}

/** Used by the admin to move a booking; re-validated by the DB constraint. */
export async function rescheduleBooking(id: string, newStart: Date) {
  const settings = await getSettings();
  const end = new Date(newStart.getTime() + settings.durationMinutes * 60_000);
  const blockedUntil = new Date(end.getTime() + settings.bufferMinutes * 60_000);
  try {
    const [row] = await db
      .update(bookings)
      .set({ startAt: newStart, endAt: end, blockedUntil, status: "confirmed", updatedAt: new Date() })
      .where(and(eq(bookings.id, id), ne(bookings.status, "completed")))
      .returning();
    return row ? ({ ok: true, booking: row } as const) : ({ ok: false, reason: "not_found" } as const);
  } catch (err) {
    if (pgCode(err) === "23P01") return { ok: false, reason: "conflict" } as const;
    throw err;
  }
}
