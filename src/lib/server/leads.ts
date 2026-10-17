import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { leads, type Lead } from "@/db/schema";
import { isInServiceArea, services, site } from "@/config/site";
import type { ContactData, QuoteData } from "@/lib/validation";
import { makeReference, pgCode, pgConstraint } from "./request";
import { ownerEmail, renderEmail, sendEmail } from "./email";

type NewLead = typeof leads.$inferInsert;

/**
 * Inserts a lead, deduplicating on the client's idempotency key so a double
 * click or network retry never creates two leads. Returns the stored lead
 * and whether it was newly created.
 */
async function insertLead(values: Omit<NewLead, "reference">, prefix: "Q" | "C") {
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      const [row] = await db
        .insert(leads)
        .values({ ...values, reference: makeReference(prefix) })
        .onConflictDoNothing({ target: leads.idempotencyKey })
        .returning();
      if (row) return { lead: row, created: true };
      const [existing] = await db
        .select()
        .from(leads)
        .where(eq(leads.idempotencyKey, values.idempotencyKey));
      if (existing) return { lead: existing, created: false };
    } catch (err) {
      // Astronomically unlikely reference collision — just try a new one.
      if (pgCode(err) === "23505" && pgConstraint(err) === "leads_reference_unique") continue;
      throw err;
    }
  }
  throw new Error("Could not allocate a unique lead reference");
}

const serviceName = (id: string) =>
  id === "other" ? "Other" : (services.find((s) => s.id === id)?.name ?? id);

export async function createQuoteLead(data: QuoteData, ipHash: string) {
  return insertLead(
    {
      kind: "quote",
      name: data.name,
      email: data.email.toLowerCase(),
      phone: data.phone,
      preferredContact: data.preferredContact,
      address: data.address,
      city: data.city,
      zip: data.zip,
      propertyType: data.propertyType,
      propertyDetails: data.propertyDetails || null,
      inServiceArea: Boolean(isInServiceArea(data.zip)),
      services: data.services,
      servicesOther: data.servicesOther || null,
      specialRequests: data.specialRequests || null,
      timeframe: data.timeframe,
      hasLights: data.hasLights,
      homeSize: data.homeSize ?? null,
      budget: data.budget ?? null,
      notes: data.notes || null,
      idempotencyKey: data.idempotencyKey,
      ipHash,
    },
    "Q",
  );
}

export async function createContactLead(data: ContactData, ipHash: string) {
  return insertLead(
    {
      kind: "contact",
      name: data.name,
      email: data.email.toLowerCase(),
      phone: data.phone || null,
      zip: data.zip || null,
      inServiceArea: data.zip ? Boolean(isInServiceArea(data.zip)) : null,
      message: data.message,
      idempotencyKey: data.idempotencyKey,
      ipHash,
    },
    "C",
  );
}

export function formatPhone(p: string | null | undefined): string {
  if (!p) return "";
  const d = p.replace(/\D/g, "").replace(/^1(?=\d{10}$)/, "");
  return d.length === 10 ? `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}` : p;
}

function leadRows(lead: Lead): [string, string | null | undefined][] {
  return [
    ["Reference", lead.reference],
    ["Name", lead.name],
    ["Email", lead.email],
    ["Phone", formatPhone(lead.phone)],
    ["Preferred contact", lead.preferredContact],
    ["Address", [lead.address, lead.city, lead.zip].filter(Boolean).join(", ")],
    ["In service area", lead.inServiceArea === null ? null : lead.inServiceArea ? "Yes" : "No — check ZIP"],
    ["Property type", lead.propertyType],
    ["Property details", lead.propertyDetails],
    ["Services", lead.services.map(serviceName).join(", ")],
    ["Other services", lead.servicesOther],
    ["Special requests", lead.specialRequests],
    ["Timeframe", lead.timeframe],
    ["Has own lights", lead.hasLights],
    ["Home size", lead.homeSize],
    ["Budget", lead.budget],
    ["Notes", lead.notes],
    ["Message", lead.message],
  ];
}

/**
 * Sends the owner notification and customer confirmation, then records the
 * outcome on the lead. Never throws — a failed email must not lose a lead.
 */
export async function notifyLead(lead: Lead): Promise<void> {
  const isQuote = lead.kind === "quote";
  const owner = ownerEmail();
  const adminUrl = `${site.url}/admin/leads/${lead.id}`;

  const ownerMsg = renderEmail({
    siteName: site.name,
    heading: isQuote ? `New quote request — ${lead.name}` : `New message — ${lead.name}`,
    intro: [`A new ${isQuote ? "quote request" : "contact message"} came in from the website.`],
    rows: leadRows(lead),
    outro: [`View and update it in the dashboard: ${adminUrl}`],
  });
  const ownerResult = owner
    ? await sendEmail({
        to: owner,
        subject: `${isQuote ? "Quote request" : "Message"} ${lead.reference} — ${lead.name}`,
        replyTo: lead.email,
        ...ownerMsg,
      })
    : "skipped";

  const customerMsg = renderEmail({
    siteName: site.name,
    heading: isQuote ? "We received your quote request" : "We received your message",
    intro: [
      `Hi ${lead.name.split(" ")[0]},`,
      isQuote
        ? `Thanks for asking us about holiday lighting for your home. Your request reference is ${lead.reference}.`
        : `Thanks for getting in touch. Your reference is ${lead.reference}.`,
      isQuote
        ? `We'll review your details and contact you${site.responseTime ? ` ${site.responseTime}` : ""} to talk through the design and schedule a look at your home if needed. Your quote is free and there's no obligation.`
        : `We'll get back to you${site.responseTime ? ` ${site.responseTime}` : " as soon as we can"}.`,
    ],
    rows: isQuote
      ? [
          ["Address", [lead.address, lead.city, lead.zip].filter(Boolean).join(", ")],
          ["Services", lead.services.map(serviceName).join(", ")],
          ["Timeframe", lead.timeframe],
        ]
      : [],
    outro: [
      "If you have photos of your home or of looks you like, just reply to this email and attach them.",
    ],
  });
  const customerResult = await sendEmail({
    to: lead.email,
    subject: isQuote
      ? `Your quote request (${lead.reference}) — ${site.name}`
      : `We got your message (${lead.reference}) — ${site.name}`,
    replyTo: owner ?? undefined,
    ...customerMsg,
  });

  try {
    await db
      .update(leads)
      .set({ ownerNotified: ownerResult, customerNotified: customerResult })
      .where(eq(leads.id, lead.id));
  } catch (err) {
    console.error("[leads] could not record notification status:", (err as Error).message);
  }
}
