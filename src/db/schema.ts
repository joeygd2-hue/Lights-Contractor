import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  date,
  index,
  integer,
  pgEnum,
  pgTable,
  smallint,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

export const leadKind = pgEnum("lead_kind", ["quote", "contact"]);
export const leadStatus = pgEnum("lead_status", [
  "new",
  "contacted",
  "quote_sent",
  "booked",
  "closed",
]);
export const bookingStatus = pgEnum("booking_status", ["confirmed", "cancelled", "completed"]);
export const notifyStatus = pgEnum("notify_status", ["pending", "sent", "skipped", "failed"]);

export const leads = pgTable(
  "leads",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    reference: text("reference").notNull().unique(),
    kind: leadKind("kind").notNull(),
    status: leadStatus("status").notNull().default("new"),

    name: text("name").notNull(),
    email: text("email").notNull(),
    phone: text("phone"),
    preferredContact: text("preferred_contact"),

    address: text("address"),
    city: text("city"),
    zip: text("zip"),
    propertyType: text("property_type"),
    propertyDetails: text("property_details"),
    inServiceArea: boolean("in_service_area"),

    services: text("services").array().notNull().default(sql`'{}'::text[]`),
    servicesOther: text("services_other"),
    specialRequests: text("special_requests"),
    timeframe: text("timeframe"),
    hasLights: text("has_lights"),
    homeSize: text("home_size"),
    budget: text("budget"),
    notes: text("notes"),

    /** Contact-form message. */
    message: text("message"),

    idempotencyKey: text("idempotency_key").notNull().unique(),
    ipHash: text("ip_hash"),

    ownerNotified: notifyStatus("owner_notified").notNull().default("pending"),
    customerNotified: notifyStatus("customer_notified").notNull().default("pending"),

    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("leads_created_idx").on(t.createdAt), index("leads_status_idx").on(t.status)],
);

export const leadNotes = pgTable("lead_notes", {
  id: uuid("id").primaryKey().defaultRandom(),
  leadId: uuid("lead_id")
    .notNull()
    .references(() => leads.id, { onDelete: "cascade" }),
  body: text("body").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/**
 * Consultation bookings. Double-booking is prevented at the database level by
 * an exclusion constraint (see drizzle/0001_booking_exclusion.sql) over
 * [start_at, blocked_until) for confirmed bookings — so two simultaneous
 * requests for overlapping times can never both succeed.
 */
export const bookings = pgTable(
  "bookings",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    reference: text("reference").notNull().unique(),
    status: bookingStatus("status").notNull().default("confirmed"),
    consultationType: text("consultation_type").notNull(),

    startAt: timestamp("start_at", { withTimezone: true }).notNull(),
    endAt: timestamp("end_at", { withTimezone: true }).notNull(),
    /** end_at + buffer; the range [start_at, blocked_until) is exclusive. */
    blockedUntil: timestamp("blocked_until", { withTimezone: true }).notNull(),

    name: text("name").notNull(),
    email: text("email").notNull(),
    phone: text("phone").notNull(),
    address: text("address"),
    city: text("city"),
    zip: text("zip"),
    notes: text("notes"),

    leadId: uuid("lead_id").references(() => leads.id, { onDelete: "set null" }),
    idempotencyKey: text("idempotency_key").notNull().unique(),
    ipHash: text("ip_hash"),

    ownerNotified: notifyStatus("owner_notified").notNull().default("pending"),
    customerNotified: notifyStatus("customer_notified").notNull().default("pending"),

    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("bookings_start_idx").on(t.startAt),
    check("bookings_time_order", sql`${t.endAt} > ${t.startAt} AND ${t.blockedUntil} >= ${t.endAt}`),
  ],
);

/** Weekly recurring availability, in the business's local time. */
export const availabilityRules = pgTable(
  "availability_rules",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    /** 0 = Sunday … 6 = Saturday */
    weekday: smallint("weekday").notNull(),
    /** Minutes after local midnight, e.g. 540 = 9:00 am */
    startMinute: smallint("start_minute").notNull(),
    endMinute: smallint("end_minute").notNull(),
  },
  (t) => [
    check("availability_weekday", sql`${t.weekday} BETWEEN 0 AND 6`),
    check(
      "availability_range",
      sql`${t.startMinute} >= 0 AND ${t.endMinute} <= 1440 AND ${t.endMinute} > ${t.startMinute}`,
    ),
  ],
);

/** Single-row table of booking settings (id is always 1). */
export const bookingSettings = pgTable("booking_settings", {
  id: smallint("id").primaryKey().default(1),
  durationMinutes: integer("duration_minutes").notNull().default(30),
  bufferMinutes: integer("buffer_minutes").notNull().default(15),
  slotIntervalMinutes: integer("slot_interval_minutes").notNull().default(30),
  minNoticeHours: integer("min_notice_hours").notNull().default(24),
  maxDaysAhead: integer("max_days_ahead").notNull().default(45),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const blackoutDates = pgTable("blackout_dates", {
  /** Local calendar date (America/Chicago). */
  day: date("day", { mode: "string" }).primaryKey(),
  reason: text("reason"),
});

export const rateLimits = pgTable("rate_limits", {
  key: text("key").primaryKey(),
  windowStart: timestamp("window_start", { withTimezone: true }).notNull(),
  count: integer("count").notNull(),
});

export const adminSessions = pgTable("admin_sessions", {
  /** SHA-256 of the session token; the raw token only lives in the cookie. */
  tokenHash: text("token_hash").primaryKey(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
});

export type Lead = typeof leads.$inferSelect;
export type Booking = typeof bookings.$inferSelect;
export type BookingSettings = typeof bookingSettings.$inferSelect;
export type AvailabilityRule = typeof availabilityRules.$inferSelect;
