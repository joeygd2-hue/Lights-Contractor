-- Prevent overlapping confirmed consultations at the database level.
-- Two concurrent inserts for overlapping [start_at, blocked_until) ranges
-- cannot both commit; the loser gets SQLSTATE 23P01 (exclusion_violation).
ALTER TABLE "bookings"
  ADD CONSTRAINT "bookings_no_overlap"
  EXCLUDE USING gist (tstzrange("start_at", "blocked_until", '[)') WITH &&)
  WHERE ("status" = 'confirmed');
--> statement-breakpoint
-- Default booking settings row.
INSERT INTO "booking_settings" ("id") VALUES (1) ON CONFLICT DO NOTHING;
