import { sql } from "drizzle-orm";
import { db } from "@/db";

export async function resetDb() {
  await db.execute(sql`TRUNCATE leads, lead_notes, bookings, blackout_dates, rate_limits, admin_sessions RESTART IDENTITY CASCADE`);
  await db.execute(sql`DELETE FROM availability_rules`);
  await db.execute(sql`
    INSERT INTO booking_settings (id, duration_minutes, buffer_minutes, slot_interval_minutes, min_notice_hours, max_days_ahead)
    VALUES (1, 30, 15, 30, 24, 45)
    ON CONFLICT (id) DO UPDATE SET duration_minutes = 30, buffer_minutes = 15, slot_interval_minutes = 30, min_notice_hours = 24, max_days_ahead = 45`);
}
