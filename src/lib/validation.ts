import { z } from "zod";
import { consultationTypes, quotableServices } from "@/config/site";

/** Shared by client and server so validation rules never drift apart. */

const trimmed = (max: number) => z.string().trim().max(max, `Please keep this under ${max} characters.`);

export const nameField = trimmed(120).min(2, "Please enter your full name.");
export const emailField = z
  .string()
  .trim()
  .max(254)
  .pipe(z.email("Please enter a valid email address."));
/** US phone: accepts common formats, normalizes to digits. */
export const phoneField = z
  .string()
  .trim()
  .transform((v) => v.replace(/[^\d+]/g, ""))
  .refine((v) => /^(\+?1)?\d{10}$/.test(v), "Please enter a 10-digit phone number.");
export const optionalPhoneField = z
  .string()
  .trim()
  .transform((v) => v.replace(/[^\d+]/g, ""))
  .refine((v) => v === "" || /^(\+?1)?\d{10}$/.test(v), "Please enter a 10-digit phone number.");
export const zipField = z
  .string()
  .trim()
  .regex(/^\d{5}(-\d{4})?$/, "Please enter a 5-digit ZIP code.");

/** Anti-spam fields every public form includes. */
const antiSpam = {
  /** Honeypot: hidden from people, bots tend to fill it. Must be empty. */
  website: z.string().max(500).optional().default(""),
  /** ms timestamp when the form was first rendered. */
  startedAt: z.number().int().positive(),
  /** Client-generated UUID; repeat submissions with the same key are deduplicated. */
  idempotencyKey: z.uuid(),
};

/* ───────────────────────────── Quote ───────────────────────────── */

export const contactMethods = ["email", "phone", "text"] as const;
export const propertyTypes = [
  "Single-family home",
  "Townhome",
  "Other",
] as const;
export const timeframes = [
  "As soon as possible",
  "Early November",
  "Mid to late November",
  "Early December",
  "Flexible",
] as const;
export const hasLightsOptions = ["No — use yours", "Yes, but I'd rather use yours", "Not sure"] as const;
export const homeSizes = ["One story", "Two stories", "Three or more stories", "Not sure"] as const;
export const budgets = [
  "Prefer not to say",
  "Under $800",
  "$800 – $1,200",
  "$1,200 – $2,000",
  "$2,000+",
] as const;

const serviceIds = ["other", ...quotableServices.map((s) => s.id as string)] as [string, ...string[]];

export const quoteStep1 = z.object({
  name: nameField,
  email: emailField,
  phone: phoneField,
  preferredContact: z.enum(contactMethods, { error: "Please choose how we should contact you." }),
});

export const quoteStep2 = z.object({
  address: trimmed(200).min(4, "Please enter the property's street address."),
  city: trimmed(80).min(2, "Please enter the city."),
  zip: zipField,
  propertyType: z.enum(propertyTypes, { error: "Please choose a property type." }),
  propertyDetails: trimmed(1000).optional().default(""),
});

const otherNeedsDetail = {
  check: (v: { services: string[]; servicesOther: string }) =>
    !v.services.includes("other") || v.servicesOther.length > 0,
  params: {
    path: ["servicesOther"],
    message: "Tell us a little about what else you have in mind.",
  },
};

const quoteStep3Base = z.object({
  services: z
    .array(z.enum(serviceIds))
    .min(1, "Please choose at least one service.")
    .max(serviceIds.length),
  servicesOther: trimmed(300).optional().default(""),
  specialRequests: trimmed(1500).optional().default(""),
});

export const quoteStep3 = quoteStep3Base.refine(otherNeedsDetail.check, otherNeedsDetail.params);

export const quoteStep4 = z.object({
  timeframe: z.enum(timeframes, { error: "Please choose a timeframe." }),
  hasLights: z.enum(hasLightsOptions, { error: "Please choose an option." }),
  homeSize: z.enum(homeSizes).optional(),
  budget: z.enum(budgets).optional(),
  notes: trimmed(2000).optional().default(""),
});

export const quoteSchema = z
  .object({
    ...quoteStep1.shape,
    ...quoteStep2.shape,
    ...quoteStep3Base.shape,
    ...quoteStep4.shape,
    ...antiSpam,
  })
  .refine(otherNeedsDetail.check, otherNeedsDetail.params);

export type QuoteInput = z.input<typeof quoteSchema>;
export type QuoteData = z.output<typeof quoteSchema>;

/* ───────────────────────────── Contact ───────────────────────────── */

export const contactSchema = z.object({
  name: nameField,
  email: emailField,
  phone: optionalPhoneField.optional().default(""),
  zip: z
    .string()
    .trim()
    .refine((v) => v === "" || /^\d{5}$/.test(v), "Please enter a 5-digit ZIP code.")
    .optional()
    .default(""),
  message: trimmed(3000).min(10, "Please include a short message (at least 10 characters)."),
  ...antiSpam,
});
export type ContactData = z.output<typeof contactSchema>;

/* ───────────────────────────── Booking ───────────────────────────── */

const consultationIds = consultationTypes.filter((c) => c.offered).map((c) => c.id) as [
  string,
  ...string[],
];

export const bookingSchema = z.object({
  consultationType: z.enum(consultationIds, { error: "Please choose a consultation type." }),
  /** ISO-8601 instant of the chosen slot start (UTC). */
  startAt: z.iso.datetime({ message: "Please choose a time." }),
  name: nameField,
  email: emailField,
  phone: phoneField,
  address: trimmed(200).optional().default(""),
  city: trimmed(80).optional().default(""),
  zip: z
    .string()
    .trim()
    .refine((v) => v === "" || /^\d{5}$/.test(v), "Please enter a 5-digit ZIP code.")
    .optional()
    .default(""),
  notes: trimmed(1500).optional().default(""),
  ...antiSpam,
}).refine((v) => v.consultationType !== "onsite" || (v.address.length >= 4 && /^\d{5}$/.test(v.zip)), {
  path: ["address"],
  message: "We need the property address for an on-site visit.",
});
export type BookingData = z.output<typeof bookingSchema>;

/** Flatten zod issues into { field: message } (first message per field). */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "_form";
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}
