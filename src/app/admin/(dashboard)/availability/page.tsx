import type { Metadata } from "next";
import { Suspense } from "react";
import { asc, gte } from "drizzle-orm";
import { db } from "@/db";
import { availabilityRules, blackoutDates } from "@/db/schema";
import { site } from "@/config/site";
import { localDateString } from "@/lib/booking/availability";
import { requireAdmin } from "@/lib/server/auth";
import { getSettings } from "@/lib/server/bookings";
import { Loading, PageTitle } from "@/components/admin/ui";
import { removeBlackout } from "../../actions";
import { BlackoutForm, SettingsForm, WeeklyHoursForm } from "./forms";

export const metadata: Metadata = { title: "Availability" };

export default function AvailabilityPage() {
  return (
    <>
      <PageTitle title="Availability" />
      <Suspense fallback={<Loading />}>
        <Availability />
      </Suspense>
    </>
  );
}

const toHHMM = (m: number) => `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;

async function Availability() {
  await requireAdmin();
  const today = localDateString(new Date(), site.location.timezone);
  const [rules, settings, blackouts] = await Promise.all([
    db.select().from(availabilityRules).orderBy(asc(availabilityRules.weekday), asc(availabilityRules.startMinute)),
    getSettings(),
    db.select().from(blackoutDates).where(gte(blackoutDates.day, today)).orderBy(asc(blackoutDates.day)),
  ]);

  // The editor manages one window per day (the first one, if several exist).
  const week = Array.from({ length: 7 }, (_, d) => {
    const r = rules.find((x) => x.weekday === d);
    return { weekday: d, enabled: Boolean(r), start: r ? toHHMM(r.startMinute) : "17:00", end: r ? toHHMM(r.endMinute) : "19:00" };
  });

  return (
    <div className="grid gap-10 lg:grid-cols-12">
      <section aria-labelledby="hours-h" className="rounded-md border border-line bg-paper p-6 lg:col-span-7">
        <h2 id="hours-h" className="text-2xl text-evergreen-900">Weekly consultation hours</h2>
        <p className="mt-1 text-sm text-ink-muted">
          Central Time. Customers can only book times inside these hours. Existing bookings aren&rsquo;t affected.
        </p>
        <WeeklyHoursForm week={week} />
      </section>

      <div className="grid content-start gap-10 lg:col-span-5">
        <section aria-labelledby="settings-h" className="rounded-md border border-line bg-paper p-6">
          <h2 id="settings-h" className="text-2xl text-evergreen-900">Booking rules</h2>
          <SettingsForm settings={settings} />
        </section>

        <section aria-labelledby="blackout-h" className="rounded-md border border-line bg-paper p-6">
          <h2 id="blackout-h" className="text-2xl text-evergreen-900">Blocked dates</h2>
          <p className="mt-1 text-sm text-ink-muted">No consultations can be booked on these days — use for install days, holidays or time off.</p>
          <BlackoutForm minDate={today} />
          {blackouts.length > 0 && (
            <ul className="mt-5 divide-y divide-line border-t border-line">
              {blackouts.map((b) => (
                <li key={b.day} className="flex items-center justify-between gap-3 py-3 text-[0.95rem]">
                  <span>
                    {new Intl.DateTimeFormat("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric", timeZone: "UTC" }).format(new Date(`${b.day}T12:00:00Z`))}
                    {b.reason && <span className="block text-sm text-ink-muted">{b.reason}</span>}
                  </span>
                  <form action={removeBlackout}>
                    <input type="hidden" name="day" value={b.day} />
                    <button type="submit" className="text-sm font-semibold text-danger underline">Remove</button>
                  </form>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
