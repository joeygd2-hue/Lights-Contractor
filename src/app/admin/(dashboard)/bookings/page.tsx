import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { and, asc, desc, eq, gte, lt, ne } from "drizzle-orm";
import { db } from "@/db";
import { bookings } from "@/db/schema";
import { site } from "@/config/site";
import { localDateString } from "@/lib/booking/availability";
import { requireAdmin } from "@/lib/server/auth";
import { consultationName } from "@/lib/server/bookings";
import { formatPhone } from "@/lib/server/leads";
import { Badge, Empty, Loading, PageTitle, fmtDate, fmtTime } from "@/components/admin/ui";
import { cancelBooking, completeBooking } from "../../actions";
import { RescheduleForm } from "./RescheduleForm";

export const metadata: Metadata = { title: "Consultations" };

const VIEWS = { upcoming: "Upcoming", past: "Past", cancelled: "Cancelled" } as const;
type View = keyof typeof VIEWS;

export default function BookingsPage({ searchParams }: PageProps<"/admin/bookings">) {
  return (
    <>
      <PageTitle title="Consultations" />
      <Suspense fallback={<Loading />}>
        <BookingsList searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function BookingsList({ searchParams }: { searchParams: PageProps<"/admin/bookings">["searchParams"] }) {
  await requireAdmin();
  const sp = await searchParams;
  const view: View = sp.view === "past" || sp.view === "cancelled" ? sp.view : "upcoming";
  const now = new Date();

  const rows = await db
    .select()
    .from(bookings)
    .where(
      view === "upcoming"
        ? and(eq(bookings.status, "confirmed"), gte(bookings.endAt, now))
        : view === "past"
          ? and(ne(bookings.status, "cancelled"), lt(bookings.endAt, now))
          : eq(bookings.status, "cancelled"),
    )
    .orderBy(view === "upcoming" ? asc(bookings.startAt) : desc(bookings.startAt))
    .limit(200);

  const today = localDateString(now, site.location.timezone);

  return (
    <div className="grid gap-6">
      <nav aria-label="Filter consultations" className="flex gap-2">
        {(Object.keys(VIEWS) as View[]).map((v) => (
          <Link
            key={v}
            href={`/admin/bookings?view=${v}`}
            aria-current={v === view ? "page" : undefined}
            className={`inline-flex min-h-10 items-center rounded-sm border px-4 text-sm font-medium ${
              v === view ? "border-evergreen-800 bg-evergreen-800 text-ivory" : "border-line bg-paper hover:border-evergreen-700"
            }`}
          >
            {VIEWS[v]}
          </Link>
        ))}
      </nav>

      {rows.length === 0 ? (
        <Empty>No {VIEWS[view].toLowerCase()} consultations.</Empty>
      ) : (
        <ul className="grid gap-4">
          {rows.map((b) => (
            <li key={b.id} className="rounded-md border border-line bg-paper p-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:justify-between">
                <div>
                  <p className="font-display text-2xl text-evergreen-900">
                    {fmtDate(b.startAt)} · {fmtTime(b.startAt)}–{fmtTime(b.endAt)}
                  </p>
                  <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-ink-muted">
                    <Badge status={b.status} label={b.status[0]!.toUpperCase() + b.status.slice(1)} />
                    {consultationName(b.consultationType)} · {b.reference}
                  </p>
                  <dl className="mt-4 grid gap-x-8 gap-y-1 text-[0.95rem] sm:grid-cols-[7rem_1fr]">
                    <dt className="text-ink-muted">Name</dt>
                    <dd>{b.name}</dd>
                    <dt className="text-ink-muted">Phone</dt>
                    <dd><a href={`tel:${b.phone}`} className="underline">{formatPhone(b.phone)}</a></dd>
                    <dt className="text-ink-muted">Email</dt>
                    <dd><a href={`mailto:${b.email}`} className="break-all underline">{b.email}</a></dd>
                    {b.address && (
                      <>
                        <dt className="text-ink-muted">Address</dt>
                        <dd>{[b.address, b.city, b.zip].filter(Boolean).join(", ")}</dd>
                      </>
                    )}
                    {b.notes && (
                      <>
                        <dt className="text-ink-muted">Notes</dt>
                        <dd className="whitespace-pre-wrap">{b.notes}</dd>
                      </>
                    )}
                  </dl>
                </div>

                {b.status === "confirmed" && (
                  <div className="grid content-start gap-3 lg:w-80">
                    <RescheduleForm id={b.id} minDate={today} />
                    <div className="flex flex-wrap gap-2">
                      {b.endAt < now && (
                        <form action={completeBooking}>
                          <input type="hidden" name="id" value={b.id} />
                          <button type="submit" className="btn btn-outline min-h-10 py-2 text-sm">Mark completed</button>
                        </form>
                      )}
                      <form action={cancelBooking} className="flex flex-wrap items-center gap-3">
                        <input type="hidden" name="id" value={b.id} />
                        <label className="flex items-center gap-2 text-sm">
                          <input type="checkbox" name="notify" defaultChecked className="h-4 w-4 accent-evergreen-800" />
                          Email customer
                        </label>
                        <button type="submit" className="btn btn-outline min-h-10 border-danger/40 py-2 text-sm text-danger">
                          Cancel consultation
                        </button>
                      </form>
                    </div>
                  </div>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
