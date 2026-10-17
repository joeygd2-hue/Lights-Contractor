import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { desc, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { leadNotes, leads, leadStatus } from "@/db/schema";
import { services } from "@/config/site";
import { requireAdmin } from "@/lib/server/auth";
import { formatPhone } from "@/lib/server/leads";
import { Badge, Loading, STATUS_LABEL, fmtDateTime } from "@/components/admin/ui";
import { updateLeadStatus } from "../../../actions";
import { NoteForm } from "./NoteForm";

export const metadata: Metadata = { title: "Lead" };

export default function LeadPage({ params }: PageProps<"/admin/leads/[id]">) {
  return (
    <Suspense fallback={<Loading />}>
      <LeadDetail params={params} />
    </Suspense>
  );
}

const serviceName = (id: string) => services.find((s) => s.id === id)?.name ?? (id === "other" ? "Other" : id);
const notifyLabel = { pending: "Sending…", sent: "Sent", skipped: "Not sent (email not configured)", failed: "Failed" };

async function LeadDetail({ params }: { params: PageProps<"/admin/leads/[id]">["params"] }) {
  await requireAdmin();
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();
  const [lead] = await db.select().from(leads).where(eq(leads.id, id));
  if (!lead) notFound();
  const notes = await db.select().from(leadNotes).where(eq(leadNotes.leadId, id)).orderBy(desc(leadNotes.createdAt));

  const rows: [string, React.ReactNode][] = [
    ["Email", <a key="e" href={`mailto:${lead.email}`} className="underline">{lead.email}</a>],
    ["Phone", lead.phone ? <a key="p" href={`tel:${lead.phone}`} className="underline">{formatPhone(lead.phone)}</a> : null],
    ["Preferred contact", lead.preferredContact],
    ["Address", [lead.address, lead.city, lead.zip].filter(Boolean).join(", ") || null],
    ["Service area", lead.inServiceArea === null ? null : lead.inServiceArea ? "Inside" : "Outside — confirm before quoting"],
    ["Property type", lead.propertyType],
    ["Property details", lead.propertyDetails],
    ["Services", lead.services.length ? lead.services.map(serviceName).join(", ") : null],
    ["Other services", lead.servicesOther],
    ["Special requests", lead.specialRequests],
    ["Timeframe", lead.timeframe],
    ["Has own lights", lead.hasLights],
    ["Home size", lead.homeSize],
    ["Budget", lead.budget],
    ["Notes", lead.notes],
    ["Message", lead.message],
    ["Owner email", notifyLabel[lead.ownerNotified]],
    ["Customer confirmation", notifyLabel[lead.customerNotified]],
  ];

  return (
    <div>
      <Link href="/admin/leads" className="text-sm font-semibold text-evergreen-800 underline">← All leads</Link>
      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-4xl text-evergreen-900">{lead.name}</h1>
          <p className="mt-2 text-ink-muted">
            {lead.kind === "quote" ? "Quote request" : "Contact message"} · {lead.reference} · received {fmtDateTime(lead.createdAt)}
          </p>
        </div>
        <Badge status={lead.status} />
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-12">
        <dl className="divide-y divide-line rounded-md border border-line bg-paper lg:col-span-7">
          {rows
            .filter(([, v]) => v)
            .map(([k, v]) => (
              <div key={k} className="grid gap-1 px-5 py-3 text-[0.95rem] sm:grid-cols-[11rem_1fr]">
                <dt className="text-ink-muted">{k}</dt>
                <dd className="whitespace-pre-wrap break-words">{v}</dd>
              </div>
            ))}
        </dl>

        <div className="grid content-start gap-8 lg:col-span-5">
          <section aria-labelledby="status-h" className="rounded-md border border-line bg-paper p-5">
            <h2 id="status-h" className="text-xl text-evergreen-900">Status</h2>
            <form action={updateLeadStatus} className="mt-4 flex gap-3">
              <input type="hidden" name="id" value={lead.id} />
              <label htmlFor="lead-status" className="sr-only">Lead status</label>
              <select id="lead-status" name="status" defaultValue={lead.status} className="input">
                {leadStatus.enumValues.map((s) => (
                  <option key={s} value={s}>{STATUS_LABEL[s]}</option>
                ))}
              </select>
              <button type="submit" className="btn btn-primary">Update</button>
            </form>
          </section>

          <section aria-labelledby="notes-h" className="rounded-md border border-line bg-paper p-5">
            <h2 id="notes-h" className="text-xl text-evergreen-900">Internal notes</h2>
            <p className="mt-1 text-sm text-ink-muted">Only visible in this dashboard.</p>
            <NoteForm leadId={lead.id} />
            {notes.length > 0 && (
              <ul className="mt-5 divide-y divide-line border-t border-line">
                {notes.map((n) => (
                  <li key={n.id} className="py-3 text-[0.95rem]">
                    <p className="whitespace-pre-wrap">{n.body}</p>
                    <p className="mt-1 text-xs text-ink-muted">{fmtDateTime(n.createdAt)}</p>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
