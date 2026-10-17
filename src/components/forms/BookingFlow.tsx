"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { consultationTypes, site } from "@/config/site";
import { bookingSchema, fieldErrors } from "@/lib/validation";
import { Honeypot, TextArea, TextField } from "./fields";
import { focusFirstError, postJson, useFormMeta } from "./submit";

type Availability = {
  timezone: string;
  durationMinutes: number;
  days: { date: string; slots: { start: string; label: string }[] }[];
};

async function fetchAvailability(): Promise<Availability> {
  const res = await fetch("/api/availability", { cache: "no-store" });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

const offered = consultationTypes.filter((c) => c.offered);
const STEPS = ["Consultation type", "Date & time", "Your details", "Review & confirm"];

const longDate = (date: string) =>
  new Intl.DateTimeFormat("en-US", { weekday: "long", month: "long", day: "numeric", timeZone: "UTC" }).format(
    new Date(`${date}T12:00:00Z`),
  );

export function BookingFlow() {
  const [step, setStep] = useState(0);
  const [type, setType] = useState(offered.length === 1 ? offered[0]!.id : "");
  const [availability, setAvailability] = useState<Availability | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [date, setDate] = useState<string | null>(null);
  const [slot, setSlot] = useState<{ start: string; label: string } | null>(null);
  const [details, setDetails] = useState<Record<"name" | "email" | "phone" | "address" | "city" | "zip" | "notes", string>>({
    name: "",
    email: "",
    phone: "",
    address: "",
    city: site.location.city,
    zip: "",
    notes: "",
  });
  const [website, setWebsite] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [confirmed, setConfirmed] = useState<{ reference: string | null; when?: string; emailed: boolean } | null>(null);
  const meta = useFormMeta();
  const headingRef = useRef<HTMLHeadingElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const load = useCallback(() => {
    return fetchAvailability().then(
      (data) => {
        setLoadError(null);
        setAvailability(data);
      },
      () => setLoadError("We couldn't load available times. Please refresh the page or try again shortly."),
    );
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const daysWithSlots = useMemo(
    () => new Map((availability?.days ?? []).filter((d) => d.slots.length).map((d) => [d.date, d.slots])),
    [availability],
  );

  function goTo(n: number) {
    setStep(n);
    setErrors({});
    setFormError(null);
    requestAnimationFrame(() => {
      headingRef.current?.focus();
      headingRef.current?.scrollIntoView({ block: "start", behavior: "smooth" });
    });
  }

  const payload = () => ({
    consultationType: type,
    startAt: slot?.start ?? "",
    ...details,
    website,
    ...meta.get(),
  });

  function next() {
    if (step === 0) {
      if (!type) return setErrors({ consultationType: "Please choose a consultation type." });
      return goTo(1);
    }
    if (step === 1) {
      if (!slot) return setErrors({ startAt: "Please choose a date and time." });
      return goTo(2);
    }
    if (step === 2) {
      const r = bookingSchema.safeParse(payload());
      if (!r.success) {
        const f = fieldErrors(r.error);
        setErrors(f);
        focusFirstError(f, formRef.current);
        return;
      }
      return goTo(3);
    }
    void confirm();
  }

  async function confirm() {
    if (submitting) return;
    setSubmitting(true);
    setFormError(null);
    const res = await postJson("/api/bookings", payload());
    setSubmitting(false);
    if (res.ok) {
      setConfirmed({
        reference: res.reference,
        when: res.data?.when as string | undefined,
        emailed: Boolean(res.data?.confirmationEmail),
      });
      requestAnimationFrame(() => headingRef.current?.focus());
      return;
    }
    if (res.status === 409) {
      // Someone else took the slot: refresh times and send them back to pick again.
      setSlot(null);
      await load();
      setStep(1);
      setFormError(res.error);
      requestAnimationFrame(() => headingRef.current?.focus());
      return;
    }
    if (res.fields) setErrors(res.fields);
    setFormError(res.error);
  }

  /* ───────────── Confirmed ───────────── */
  if (confirmed) {
    return (
      <div className="rounded-md border border-line bg-paper p-7 shadow-card md:p-12" role="status">
        <p className="eyebrow">Booking confirmed</p>
        <h2 ref={headingRef} tabIndex={-1} className="mt-4 text-4xl text-evergreen-900 outline-none md:text-5xl">
          You&rsquo;re booked, {details.name.split(" ")[0]}.
        </h2>
        <dl className="mt-8 divide-y divide-line border-y border-line">
          {[
            ["When", confirmed.when ?? `${date ? longDate(date) : ""}, ${slot?.label ?? ""}`],
            ["Type", offered.find((o) => o.id === type)?.name ?? type],
            ["Reference", confirmed.reference ?? "—"],
          ].map(([k, v]) => (
            <div key={k} className="grid gap-1 py-4 sm:grid-cols-[10rem_1fr]">
              <dt className="text-ink-muted">{k}</dt>
              <dd className="font-medium text-charcoal">{v}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-6 max-w-xl text-ink-muted">
          {confirmed.emailed
            ? `We've sent a confirmation to ${details.email}. `
            : "Please keep your booking reference for your records. "}
          {type === "onsite"
            ? "We'll meet you at the property at the time above."
            : "We'll call you at the number you gave us at the time above."}
        </p>
        <div className="mt-10 flex flex-col gap-3 sm:flex-row">
          <Link href="/quote" className="btn btn-primary">
            Add details with a quote request
          </Link>
          <Link href="/gallery" className="btn btn-outline">
            Browse styles before we meet
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-12 lg:gap-12">
      <aside className="lg:col-span-4">
        <div className="lg:sticky lg:top-32">
          <p className="text-sm font-medium text-ink-muted">
            Step {step + 1} of {STEPS.length}: <span className="text-charcoal">{STEPS[step]}</span>
          </p>
          <div
            className="mt-3 h-1 overflow-hidden rounded-full bg-line"
            role="progressbar"
            aria-label="Booking progress"
            aria-valuemin={1}
            aria-valuemax={STEPS.length}
            aria-valuenow={step + 1}
          >
            <div className="h-full bg-evergreen-700 transition-all" style={{ width: `${((step + 1) / STEPS.length) * 100}%` }} />
          </div>
          {(type || slot) && (
            <dl className="mt-8 hidden space-y-4 border-t border-line pt-6 text-[0.95rem] lg:block">
              {type && (
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-gold-deep">Type</dt>
                  <dd className="mt-1 text-charcoal">{offered.find((o) => o.id === type)?.name}</dd>
                </div>
              )}
              {slot && date && (
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-gold-deep">When</dt>
                  <dd className="mt-1 text-charcoal">
                    {longDate(date)}
                    <br />
                    {slot.label} · {availability?.durationMinutes} min
                  </dd>
                </div>
              )}
            </dl>
          )}
          <p className="mt-8 hidden text-sm text-ink-muted lg:block">
            Times are shown in Central Time and come straight from our live schedule. Your
            appointment is confirmed only once you see a booking reference.
          </p>
        </div>
      </aside>

      <form
        ref={formRef}
        noValidate
        className="relative rounded-md border border-line bg-paper p-6 shadow-card sm:p-8 md:p-10 lg:col-span-8"
        onSubmit={(e) => {
          e.preventDefault();
          next();
        }}
      >
        <Honeypot value={website} onChange={setWebsite} />
        <h2 ref={headingRef} tabIndex={-1} className="scroll-mt-32 text-3xl text-evergreen-900 outline-none">
          {STEPS[step]}
        </h2>

        {formError && (
          <p role="alert" className="mt-6 rounded-sm border border-danger/30 bg-danger/5 px-4 py-3 text-[0.95rem] text-danger">
            {formError}
          </p>
        )}

        <div className="mt-8">
          {step === 0 && (
            <fieldset data-field="consultationType" tabIndex={-1} aria-describedby={errors.consultationType ? "booking-type-error" : undefined}>
              <legend className="sr-only">Consultation type</legend>
              <div className="grid gap-3 sm:grid-cols-2">
                {offered.map((c) => (
                  <label key={c.id} className="choice">
                    <input type="radio" name="consultationType" value={c.id} checked={type === c.id} onChange={() => { setType(c.id); setErrors({}); }} />
                    <span>
                      <span className="block font-display text-xl text-evergreen-900">{c.name}</span>
                      <span className="mt-1 block text-[0.92rem] text-ink-muted">{c.description}</span>
                    </span>
                  </label>
                ))}
              </div>
              {errors.consultationType && <p id="booking-type-error" className="field-error">{errors.consultationType}</p>}
            </fieldset>
          )}

          {step === 1 && (
            <div data-field="startAt" tabIndex={-1}>
              {loadError && (
                <div role="alert" className="rounded-sm border border-danger/30 bg-danger/5 px-4 py-3 text-danger">
                  {loadError}{" "}
                  <button type="button" onClick={() => void load()} className="font-semibold underline">Try again</button>
                </div>
              )}
              {!availability && !loadError && (
                <p className="text-ink-muted" aria-busy="true">Loading available times…</p>
              )}
              {availability && daysWithSlots.size === 0 && (
                <div className="rounded-sm bg-ivory-deep p-5 text-ink-muted">
                  There are no consultation times open right now. Please{" "}
                  <Link href="/quote" className="font-semibold text-evergreen-800 underline">request a quote</Link>{" "}
                  instead and we&rsquo;ll contact you to arrange a time.
                </div>
              )}
              {availability && daysWithSlots.size > 0 && (
                <div className="grid gap-8 md:grid-cols-[1fr_14rem]">
                  <Calendar
                    days={availability.days}
                    selected={date}
                    onSelect={(d) => {
                      setDate(d);
                      setSlot(null);
                      setErrors({});
                    }}
                  />
                  <div>
                    <h3 className="font-sans text-sm font-semibold text-charcoal">
                      {date ? longDate(date) : "Choose a date"}
                    </h3>
                    {date ? (
                      <div role="radiogroup" aria-label={`Available times on ${longDate(date)}`} className="mt-3 grid grid-cols-2 gap-2 md:grid-cols-1">
                        {(daysWithSlots.get(date) ?? []).map((s) => {
                          const active = slot?.start === s.start;
                          return (
                            <button
                              key={s.start}
                              type="button"
                              role="radio"
                              aria-checked={active}
                              onClick={() => { setSlot(s); setErrors({}); setFormError(null); }}
                              className={`min-h-11 rounded-sm border px-3 text-[0.95rem] font-medium transition-colors ${
                                active ? "border-evergreen-800 bg-evergreen-800 text-ivory" : "border-line bg-ivory text-charcoal hover:border-evergreen-700"
                              }`}
                            >
                              {s.label}
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="mt-3 text-sm text-ink-muted">Dates with open times are shown in bold.</p>
                    )}
                    <p className="mt-4 text-xs text-ink-muted">Central Time · {availability.durationMinutes}-minute appointment</p>
                  </div>
                </div>
              )}
              {errors.startAt && <p className="field-error mt-4" role="alert">{errors.startAt}</p>}
            </div>
          )}

          {step === 2 && (
            <div className="grid gap-6">
              <TextField name="name" label="Full name" autoComplete="name" value={details.name} onChange={(e) => setDetails({ ...details, name: e.target.value })} error={errors.name} />
              <div className="grid gap-6 sm:grid-cols-2">
                <TextField name="email" label="Email" type="email" autoComplete="email" value={details.email} onChange={(e) => setDetails({ ...details, email: e.target.value })} error={errors.email} />
                <TextField name="phone" label="Phone" type="tel" autoComplete="tel" value={details.phone} onChange={(e) => setDetails({ ...details, phone: e.target.value })} error={errors.phone} />
              </div>
              <TextField
                name="address"
                label="Property address"
                autoComplete="street-address"
                optional={type !== "onsite"}
                hint={type === "onsite" ? "Where we'll meet you." : undefined}
                value={details.address}
                onChange={(e) => setDetails({ ...details, address: e.target.value })}
                error={errors.address}
              />
              <div className="grid gap-6 sm:grid-cols-[1fr_10rem]">
                <TextField name="city" label="City" autoComplete="address-level2" optional={type !== "onsite"} value={details.city} onChange={(e) => setDetails({ ...details, city: e.target.value })} error={errors.city} />
                <TextField name="zip" label="ZIP code" inputMode="numeric" autoComplete="postal-code" maxLength={5} optional={type !== "onsite"} value={details.zip} onChange={(e) => setDetails({ ...details, zip: e.target.value })} error={errors.zip} />
              </div>
              <TextArea name="notes" label="Anything we should know?" optional rows={3} value={details.notes} onChange={(e) => setDetails({ ...details, notes: e.target.value })} error={errors.notes} />
            </div>
          )}

          {step === 3 && slot && date && (
            <div className="grid gap-5">
              <dl className="divide-y divide-line rounded-sm border border-line">
                {[
                  ["Consultation", offered.find((o) => o.id === type)?.name ?? "", 0],
                  ["Date & time", `${longDate(date)}, ${slot.label} (Central)`, 1],
                  ["Name", details.name, 2],
                  ["Email", details.email, 2],
                  ["Phone", details.phone, 2],
                  ["Address", [details.address, details.city, details.zip].filter(Boolean).join(", "), 2],
                  ["Notes", details.notes, 2],
                ]
                  .filter(([, v]) => v)
                  .map(([k, v, s]) => (
                    <div key={k as string} className="grid gap-1 px-4 py-3 text-[0.95rem] sm:grid-cols-[9rem_1fr_auto] sm:items-baseline">
                      <dt className="text-ink-muted">{k}</dt>
                      <dd className="break-words text-charcoal">{v}</dd>
                      <dd>
                        <button type="button" onClick={() => goTo(s as number)} className="text-sm font-semibold text-evergreen-800 underline decoration-gold underline-offset-4">
                          Change<span className="sr-only"> {String(k).toLowerCase()}</span>
                        </button>
                      </dd>
                    </div>
                  ))}
              </dl>
              <p className="text-sm text-ink-muted">
                Your appointment is reserved only after you press <strong>Confirm booking</strong> and
                see your booking reference.
              </p>
            </div>
          )}
        </div>

        <div className="mt-10 flex flex-col-reverse gap-3 border-t border-line pt-6 sm:flex-row sm:items-center sm:justify-between">
          {step > 0 ? (
            <button type="button" className="btn btn-outline" onClick={() => goTo(step - 1)} disabled={submitting}>
              <span aria-hidden="true">←</span> Back
            </button>
          ) : (
            <span />
          )}
          <button type="submit" className="btn btn-primary" disabled={submitting || (step === 1 && !availability)} aria-busy={submitting}>
            {step < 3 ? (
              <>Continue <span aria-hidden="true">→</span></>
            ) : submitting ? (
              "Confirming…"
            ) : (
              "Confirm booking"
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

/* ───────────────────────── Calendar ───────────────────────── */

function Calendar({
  days,
  selected,
  onSelect,
}: {
  days: Availability["days"];
  selected: string | null;
  onSelect: (date: string) => void;
}) {
  const byDate = new Map(days.map((d) => [d.date, d.slots.length]));
  const months = Array.from(new Set(days.map((d) => d.date.slice(0, 7))));
  const firstOpen = days.find((d) => d.slots.length)?.date.slice(0, 7) ?? months[0]!;
  const [monthIdx, setMonthIdx] = useState(Math.max(0, months.indexOf(firstOpen)));
  const month = months[monthIdx]!;
  const [y, m] = month.split("-").map(Number) as [number, number];
  const firstWeekday = new Date(Date.UTC(y, m - 1, 1)).getUTCDay();
  const daysInMonth = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const label = new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(Date.UTC(y, m - 1, 1)));

  const cells: (string | null)[] = [
    ...Array.from({ length: firstWeekday }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => `${month}-${String(i + 1).padStart(2, "0")}`),
  ];

  return (
    <div>
      <div className="flex items-center justify-between">
        <button type="button" onClick={() => setMonthIdx((i) => i - 1)} disabled={monthIdx === 0} className="flex h-11 w-11 items-center justify-center rounded-sm hover:bg-ivory-deep disabled:opacity-30" aria-label="Previous month">
          ←
        </button>
        <p className="font-display text-xl text-evergreen-900" aria-live="polite">{label}</p>
        <button type="button" onClick={() => setMonthIdx((i) => i + 1)} disabled={monthIdx >= months.length - 1} className="flex h-11 w-11 items-center justify-center rounded-sm hover:bg-ivory-deep disabled:opacity-30" aria-label="Next month">
          →
        </button>
      </div>
      <div className="mt-3">
        <div aria-hidden="true" className="grid grid-cols-7 text-center text-xs font-semibold uppercase tracking-wide text-ink-muted">
          {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
            <span key={d} className="py-2">{d}</span>
          ))}
        </div>
        <div role="group" aria-label={`Dates in ${label}`} className="grid grid-cols-7 gap-1">
          {cells.map((date, i) => {
            if (!date) return <span key={`e${i}`} />;
            const count = byDate.get(date) ?? 0;
            const isSel = selected === date;
            return (
              <span key={date}>
                <button
                  type="button"
                  disabled={count === 0}
                  onClick={() => onSelect(date)}
                  aria-pressed={isSel}
                  aria-label={`${longDate(date)}${count ? `, ${count} time${count > 1 ? "s" : ""} available` : ", unavailable"}`}
                  className={`aspect-square w-full min-h-10 rounded-sm text-[0.95rem] transition-colors ${
                    isSel
                      ? "bg-evergreen-800 font-semibold text-ivory"
                      : count
                        ? "font-semibold text-evergreen-900 hover:bg-evergreen-100"
                        : "text-ink-muted/40"
                  }`}
                >
                  {Number(date.slice(8))}
                </button>
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
}
