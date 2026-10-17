import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { and, desc, eq, ilike, or, type SQL } from "drizzle-orm";
import { db } from "@/db";
import { leads, leadStatus } from "@/db/schema";
import { services } from "@/config/site";
import { requireAdmin } from "@/lib/server/auth";
import { formatPhone } from "@/lib/server/leads";
import { Badge, Empty, Loading, PageTitle, STATUS_LABEL, fmtDateTime } from "@/components/admin/ui";

export const metadata: Metadata = { title: "Leads" };

export default function LeadsPage({ searchParams }: PageProps<"/admin/leads">) {
  return (
    <>
      <PageTitle title="Leads">
        <a href="/api/admin/export" className="btn btn-outline min-h-10 py-2 text-sm">
          Export CSV
        </a>
      </PageTitle>
      <Suspense fallback={<Loading />}>
        <LeadsTable searchParams={searchParams} />
      </Suspense>
    </>
  );
}

const serviceName = (id: string) => services.find((s) => s.id === id)?.name ?? (id === "other" ? "Other" : id);

async function LeadsTable({ searchParams }: { searchParams: PageProps<"/admin/leads">["searchParams"] }) {
  await requireAdmin();
  const sp = await searchParams;
  const status = typeof sp.status === "string" && (leadStatus.enumValues as string[]).includes(sp.status) ? (sp.status as (typeof leadStatus.enumValues)[number]) : undefined;
  const q = typeof sp.q === "string" ? sp.q.trim().slice(0, 100) : "";

  const where: SQL[] = [];
  if (status) where.push(eq(leads.status, status));
  if (q) {
    const like = `%${q.replace(/[%_]/g, "\\$&")}%`;
    where.push(or(ilike(leads.name, like), ilike(leads.email, like), ilike(leads.reference, like), ilike(leads.address, like))!);
  }
  const rows = await db
    .select()
    .from(leads)
    .where(where.length ? and(...where) : undefined)
    .orderBy(desc(leads.createdAt))
    .limit(200);

  return (
    <div className="grid gap-6">
      <form className="flex flex-col gap-3 sm:flex-row sm:items-end" role="search">
        <div className="flex-1">
          <label htmlFor="lead-search" className="field-label">Search</label>
          <input id="lead-search" name="q" defaultValue={q} placeholder="Name, email, reference or address" className="input" />
        </div>
        <div>
          <label htmlFor="status-filter" className="field-label">Status</label>
          <select id="status-filter" name="status" defaultValue={status ?? ""} className="input min-w-44">
            <option value="">All statuses</option>
            {leadStatus.enumValues.map((s) => (
              <option key={s} value={s}>{STATUS_LABEL[s]}</option>
            ))}
          </select>
        </div>
        <button type="submit" className="btn btn-primary">Filter</button>
        {(q || status) && <Link href="/admin/leads" className="btn btn-outline">Clear</Link>}
      </form>

      {rows.length === 0 ? (
        <Empty>{q || status ? "No leads match those filters." : "No leads yet."}</Empty>
      ) : (
        <div className="overflow-x-auto rounded-md border border-line bg-paper">
          <table className="w-full min-w-[46rem] text-left text-[0.92rem]">
            <thead className="border-b border-line bg-ivory text-xs uppercase tracking-wide text-ink-muted">
              <tr>
                <th scope="col" className="px-4 py-3 font-semibold">Received</th>
                <th scope="col" className="px-4 py-3 font-semibold">Name</th>
                <th scope="col" className="px-4 py-3 font-semibold">Type</th>
                <th scope="col" className="px-4 py-3 font-semibold">Services / message</th>
                <th scope="col" className="px-4 py-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {rows.map((l) => (
                <tr key={l.id} className="align-top hover:bg-ivory">
                  <td className="whitespace-nowrap px-4 py-3 text-ink-muted">
                    {fmtDateTime(l.createdAt)}
                    <span className="block text-xs">{l.reference}</span>
                  </td>
                  <td className="px-4 py-3">
                    <Link href={`/admin/leads/${l.id}`} className="font-semibold text-evergreen-800 underline decoration-gold underline-offset-4">
                      {l.name}
                    </Link>
                    <span className="block text-xs text-ink-muted">{l.email} · {formatPhone(l.phone)}</span>
                    {l.inServiceArea === false && <span className="mt-1 block text-xs font-semibold text-danger">Outside service area</span>}
                  </td>
                  <td className="px-4 py-3">{l.kind === "quote" ? "Quote" : "Message"}</td>
                  <td className="max-w-xs px-4 py-3 text-ink-muted">
                    {l.kind === "quote" ? l.services.map(serviceName).join(", ") : <span className="line-clamp-2">{l.message}</span>}
                  </td>
                  <td className="px-4 py-3"><Badge status={l.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
