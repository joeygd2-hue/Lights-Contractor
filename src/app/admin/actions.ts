"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/db";
import {
  availabilityRules,
  blackoutDates,
  bookingSettings,
  bookings,
  leadNotes,
  leads,
  leadStatus,
} from "@/db/schema";
import { site } from "@/config/site";
import { localTimeToInstant } from "@/lib/booking/availability";
import { checkCredentials, createSession, destroySession, requireAdmin } from "@/lib/server/auth";
import { notifyBooking, rescheduleBooking } from "@/lib/server/bookings";
import { rateLimit } from "@/lib/server/rate-limit";
import { clientIp, hashIp } from "@/lib/server/request";

export type ActionState = { error?: string; ok?: string } | undefined;

const done = () => revalidatePath("/admin", "layout");

/* ───────────────────────────── Auth ───────────────────────────── */

export async function login(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const ip = hashIp(clientIp(await headers()));
  if (!(await rateLimit(`login:${ip}`, 8, 900))) {
    return { error: "Too many sign-in attempts. Please wait 15 minutes and try again." };
  }
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  if (!(await checkCredentials(email, password))) {
    return { error: "That email and password combination isn't right." };
  }
  await createSession();
  redirect("/admin");
}

export async function logout() {
  await destroySession();
  redirect("/admin/login");
}

/* ───────────────────────────── Leads ───────────────────────────── */

export async function updateLeadStatus(formData: FormData) {
  await requireAdmin();
  const parsed = z
    .object({ id: z.uuid(), status: z.enum(leadStatus.enumValues) })
    .safeParse({ id: formData.get("id"), status: formData.get("status") });
  if (!parsed.success) return;
  await db
    .update(leads)
    .set({ status: parsed.data.status, updatedAt: new Date() })
    .where(eq(leads.id, parsed.data.id));
  done();
}

export async function addLeadNote(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const parsed = z
    .object({ id: z.uuid(), body: z.string().trim().min(1, "Write a note first.").max(4000) })
    .safeParse({ id: formData.get("id"), body: formData.get("body") });
  if (!parsed.success) return { error: parsed.error.issues[0]!.message };
  await db.insert(leadNotes).values({ leadId: parsed.data.id, body: parsed.data.body });
  await db.update(leads).set({ updatedAt: new Date() }).where(eq(leads.id, parsed.data.id));
  done();
  return { ok: "Note added." };
}

/* ───────────────────────────── Bookings ───────────────────────────── */

export async function cancelBooking(formData: FormData) {
  await requireAdmin();
  const id = z.uuid().safeParse(formData.get("id"));
  if (!id.success) return;
  const [row] = await db
    .update(bookings)
    .set({ status: "cancelled", updatedAt: new Date() })
    .where(and(eq(bookings.id, id.data), eq(bookings.status, "confirmed")))
    .returning();
  if (row && formData.get("notify") === "on") await notifyBooking(row, "cancelled");
  done();
}

export async function completeBooking(formData: FormData) {
  await requireAdmin();
  const id = z.uuid().safeParse(formData.get("id"));
  if (!id.success) return;
  await db
    .update(bookings)
    .set({ status: "completed", updatedAt: new Date() })
    .where(and(eq(bookings.id, id.data), eq(bookings.status, "confirmed")));
  done();
}

export async function rescheduleBookingAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const parsed = z
    .object({
      id: z.uuid(),
      date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Choose a date."),
      time: z.string().regex(/^\d{2}:\d{2}$/, "Choose a time."),
    })
    .safeParse({ id: formData.get("id"), date: formData.get("date"), time: formData.get("time") });
  if (!parsed.success) return { error: parsed.error.issues[0]!.message };
  const [h, m] = parsed.data.time.split(":").map(Number) as [number, number];
  const start = localTimeToInstant(parsed.data.date, h * 60 + m, site.location.timezone);
  const result = await rescheduleBooking(parsed.data.id, start);
  if (!result.ok) {
    return {
      error:
        result.reason === "conflict"
          ? "That time overlaps another confirmed consultation (including the buffer). Pick another time."
          : "Booking not found.",
    };
  }
  if (formData.get("notify") === "on") await notifyBooking(result.booking, "rescheduled");
  done();
  return { ok: "Booking moved." };
}

/* ───────────────────────────── Availability ───────────────────────────── */

const timeToMinutes = (t: string) => {
  const [h, m] = t.split(":").map(Number) as [number, number];
  return h * 60 + m;
};

export async function saveWeeklyHours(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const rules: { weekday: number; startMinute: number; endMinute: number }[] = [];
  for (let d = 0; d < 7; d++) {
    if (formData.get(`day${d}`) !== "on") continue;
    const start = String(formData.get(`start${d}`) ?? "");
    const end = String(formData.get(`end${d}`) ?? "");
    if (!/^\d{2}:\d{2}$/.test(start) || !/^\d{2}:\d{2}$/.test(end)) {
      return { error: "Enter a start and end time for each open day." };
    }
    const s = timeToMinutes(start);
    const e = timeToMinutes(end);
    if (e <= s) return { error: "End time must be after start time." };
    rules.push({ weekday: d, startMinute: s, endMinute: e });
  }
  await db.transaction(async (tx) => {
    await tx.delete(availabilityRules);
    if (rules.length) await tx.insert(availabilityRules).values(rules);
  });
  done();
  return { ok: "Weekly hours saved." };
}

export async function saveBookingSettings(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const num = (min: number, max: number) => z.coerce.number().int().min(min).max(max);
  const parsed = z
    .object({
      durationMinutes: num(10, 240),
      bufferMinutes: num(0, 240),
      slotIntervalMinutes: num(5, 240),
      minNoticeHours: num(0, 24 * 14),
      maxDaysAhead: num(1, 180),
    })
    .safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "Please check the numbers — one is out of range." };
  await db
    .insert(bookingSettings)
    .values({ id: 1, ...parsed.data })
    .onConflictDoUpdate({ target: bookingSettings.id, set: { ...parsed.data, updatedAt: new Date() } });
  done();
  return { ok: "Settings saved. Existing bookings keep their original length." };
}

export async function addBlackout(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const parsed = z
    .object({
      day: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Choose a date."),
      reason: z.string().trim().max(200).optional(),
    })
    .safeParse({ day: formData.get("day"), reason: formData.get("reason") || undefined });
  if (!parsed.success) return { error: parsed.error.issues[0]!.message };
  await db
    .insert(blackoutDates)
    .values({ day: parsed.data.day, reason: parsed.data.reason ?? null })
    .onConflictDoUpdate({ target: blackoutDates.day, set: { reason: parsed.data.reason ?? null } });
  done();
  return { ok: "Date blocked." };
}

export async function removeBlackout(formData: FormData) {
  await requireAdmin();
  const day = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).safeParse(formData.get("day"));
  if (!day.success) return;
  await db.delete(blackoutDates).where(eq(blackoutDates.day, day.data));
  done();
}
