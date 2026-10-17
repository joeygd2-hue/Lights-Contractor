CREATE TYPE "public"."booking_status" AS ENUM('confirmed', 'cancelled', 'completed');--> statement-breakpoint
CREATE TYPE "public"."lead_kind" AS ENUM('quote', 'contact');--> statement-breakpoint
CREATE TYPE "public"."lead_status" AS ENUM('new', 'contacted', 'quote_sent', 'booked', 'closed');--> statement-breakpoint
CREATE TYPE "public"."notify_status" AS ENUM('pending', 'sent', 'skipped', 'failed');--> statement-breakpoint
CREATE TABLE "admin_sessions" (
	"token_hash" text PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "availability_rules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"weekday" smallint NOT NULL,
	"start_minute" smallint NOT NULL,
	"end_minute" smallint NOT NULL,
	CONSTRAINT "availability_weekday" CHECK ("availability_rules"."weekday" BETWEEN 0 AND 6),
	CONSTRAINT "availability_range" CHECK ("availability_rules"."start_minute" >= 0 AND "availability_rules"."end_minute" <= 1440 AND "availability_rules"."end_minute" > "availability_rules"."start_minute")
);
--> statement-breakpoint
CREATE TABLE "blackout_dates" (
	"day" date PRIMARY KEY NOT NULL,
	"reason" text
);
--> statement-breakpoint
CREATE TABLE "booking_settings" (
	"id" smallint PRIMARY KEY DEFAULT 1 NOT NULL,
	"duration_minutes" integer DEFAULT 30 NOT NULL,
	"buffer_minutes" integer DEFAULT 15 NOT NULL,
	"slot_interval_minutes" integer DEFAULT 30 NOT NULL,
	"min_notice_hours" integer DEFAULT 24 NOT NULL,
	"max_days_ahead" integer DEFAULT 45 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bookings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"reference" text NOT NULL,
	"status" "booking_status" DEFAULT 'confirmed' NOT NULL,
	"consultation_type" text NOT NULL,
	"start_at" timestamp with time zone NOT NULL,
	"end_at" timestamp with time zone NOT NULL,
	"blocked_until" timestamp with time zone NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"phone" text NOT NULL,
	"address" text,
	"city" text,
	"zip" text,
	"notes" text,
	"lead_id" uuid,
	"idempotency_key" text NOT NULL,
	"ip_hash" text,
	"owner_notified" "notify_status" DEFAULT 'pending' NOT NULL,
	"customer_notified" "notify_status" DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "bookings_reference_unique" UNIQUE("reference"),
	CONSTRAINT "bookings_idempotency_key_unique" UNIQUE("idempotency_key"),
	CONSTRAINT "bookings_time_order" CHECK ("bookings"."end_at" > "bookings"."start_at" AND "bookings"."blocked_until" >= "bookings"."end_at")
);
--> statement-breakpoint
CREATE TABLE "lead_notes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"lead_id" uuid NOT NULL,
	"body" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "leads" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"reference" text NOT NULL,
	"kind" "lead_kind" NOT NULL,
	"status" "lead_status" DEFAULT 'new' NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"phone" text,
	"preferred_contact" text,
	"address" text,
	"city" text,
	"zip" text,
	"property_type" text,
	"property_details" text,
	"in_service_area" boolean,
	"services" text[] DEFAULT '{}'::text[] NOT NULL,
	"services_other" text,
	"special_requests" text,
	"timeframe" text,
	"has_lights" text,
	"home_size" text,
	"budget" text,
	"notes" text,
	"message" text,
	"idempotency_key" text NOT NULL,
	"ip_hash" text,
	"owner_notified" "notify_status" DEFAULT 'pending' NOT NULL,
	"customer_notified" "notify_status" DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "leads_reference_unique" UNIQUE("reference"),
	CONSTRAINT "leads_idempotency_key_unique" UNIQUE("idempotency_key")
);
--> statement-breakpoint
CREATE TABLE "rate_limits" (
	"key" text PRIMARY KEY NOT NULL,
	"window_start" timestamp with time zone NOT NULL,
	"count" integer NOT NULL
);
--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lead_notes" ADD CONSTRAINT "lead_notes_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "bookings_start_idx" ON "bookings" USING btree ("start_at");--> statement-breakpoint
CREATE INDEX "leads_created_idx" ON "leads" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "leads_status_idx" ON "leads" USING btree ("status");