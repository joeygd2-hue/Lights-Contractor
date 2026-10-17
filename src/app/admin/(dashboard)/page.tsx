import Link from "next/link";
import { Suspense } from "react";
import { and, asc, count, desc, eq, gte } from "drizzle-orm";
import { db } from "@/db";
import { bookings, leads } from "@/db/schema";
import { requireAdmin } from "@/lib/server/auth";
import { emailConfigured, ownerEmail } from "@/lib/server/email";
import { consultationName } from "@/lib/server/bookings";
import { Badge, Empty, Loading, PageTitle, fmtDate, fmtDateTime, fmtTime } from "@/components/admin/ui";

export default function OverviewPage() {
  return (
    <>
      <PageTitle title="Overview" />
      <Suspense fallback={<Loading />}>
        <Overview />
      </Suspense>
    </>
  );
}

async function Overview() {
  await requireAdmin();
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 86400_000);
  const [[newCount], [weekCount], upcoming, recent] = await Promise.all([
    db.select({ n: count() }).from(leads).where(eq(leads.status, "new")),
    db.select({ n: count() }).from(leads).where(gte(leads.createdAt, weekAgo)),
    db
      .select()
      .from(bookings)
      .where(and(eq(bookings.status, "confirmed"), gte(bookings.startAt, now)))
      .orderBy(asc(bookings.startAt))
      .limit(6),
    db.select().from(leads).orderBy(desc(leads.createdAt)).limit(6),
  ]);

  const emailReady = emailConfigured() && Boolean(ownerEmail());

  return (
    <div className="grid gap-10">
      {!emailReady && (
        <div role="note" className="rounded-md border border-gold bg-gold-soft/30 p-5 text-[0.95rem]">
          <strong className="text-evergreen-950">Email notifications are off.</strong>{" "}
          New leads and bookings are still saved here, but no emails are sent until{" "}
          <code>RESEND_API_KEY</code>, <code>EMAIL_FROM</code> and <code>OWNER_NOTIFICATION_EMAIL</code> are set.
          Check this dashboard regularly until then.
        </div>
      )}

      <dl className="grid gap-4 sm:grid-cols-3">
        {[
          { label: "New leads to follow up", value: newCount?.n ?? 0, href: "/admin/leads?status=new" },
          { label: "Leads in the last 7 days", value: weekCount?.n ?? 0, href: "/admin/leads" },
          { label: "Upcoming consultations", value: upcoming.length, href: "/admin/bookings" },
        ].map((s) => (
          <Link key={s.label} href={s.href} className="rounded-md border border-line bg-paper p-6 hover:border-evergreen-700">
            <dt className="text-sm text-ink-muted">{s.label}</dt>
            <dd className="mt-2 font-display text-4xl text-evergreen-900">{s.value}</dd>
          </Link>
        ))}
      </dl>

      <div className="grid gap-10 lg:grid-cols-2">
        <section aria-labelledby="up-h">
          <div className="flex items-baseline justify-between">
            <h2 id="up-h" className="text-2xl text-evergreen-900">Next consultations</h2>
            <Link href="/admin/bookings" className="text-sm font-semibold text-evergreen-800 underline">All</Link>
          </div>
          {upcoming.length === 0 ? (
            <div className="mt-4"><Empty>No upcoming consultations.</Empty></div>
          ) : (
            <ul className="mt-4 divide-y divide-line rounded-md border border-line bg-paper">
              {upcoming.map((b) => (
                <li key={b.id} className="flex flex-wrap items-baseline justify-between gap-2 px-5 py-4">
                  <span>
                    <span className="font-semibold text-charcoal">{fmtDate(b.startAt)}, {fmtTime(b.startAt)}</span>
                    <span className="block text-sm text-ink-muted">{b.name} · {consultationName(b.consultationType)}</span>
                  </span>
                  <span className="text-xs text-ink-muted">{b.reference}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section aria-labelledby="recent-h">
          <div className="flex items-baseline justify-between">
            <h2 id="recent-h" className="text-2xl text-evergreen-900">Latest leads</h2>
            <Link href="/admin/leads" className="text-sm font-semibold text-evergreen-800 underline">All</Link>
          </div>
          {recent.length === 0 ? (
            <div className="mt-4"><Empty>No leads yet. Quote requests and contact messages will appear here.</Empty></div>
          ) : (
            <ul className="mt-4 divide-y divide-line rounded-md border border-line bg-paper">
              {recent.map((l) => (
                <li key={l.id}>
                  <Link href={`/admin/leads/${l.id}`} className="flex flex-wrap items-baseline justify-between gap-2 px-5 py-4 hover:bg-ivory">
                    <span>
                      <span className="font-semibold text-charcoal">{l.name}</span>
                      <span className="block text-sm text-ink-muted">
                        {l.kind === "quote" ? "Quote request" : "Message"} · {fmtDateTime(l.createdAt)}
                      </span>
                    </span>
                    <Badge status={l.status} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
