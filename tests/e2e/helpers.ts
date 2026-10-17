import { Pool } from "pg";
import { E2E_DATABASE_URL } from "../../playwright.config";

export const pool = new Pool({ connectionString: E2E_DATABASE_URL, max: 2 });

export async function resetDb() {
  await pool.query("TRUNCATE leads, lead_notes, bookings, blackout_dates, rate_limits, admin_sessions CASCADE");
  await pool.query("DELETE FROM availability_rules");
  // Open every day 9am–5pm so there are always bookable slots.
  for (let d = 0; d < 7; d++) {
    await pool.query("INSERT INTO availability_rules (weekday, start_minute, end_minute) VALUES ($1, 540, 1020)", [d]);
  }
  await pool.query(
    "UPDATE booking_settings SET duration_minutes = 30, buffer_minutes = 15, slot_interval_minutes = 30, min_notice_hours = 24, max_days_ahead = 45 WHERE id = 1",
  );
}
