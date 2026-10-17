"use client";

import { useActionState } from "react";
import type { Settings } from "@/lib/booking/availability";
import { addBlackout, saveBookingSettings, saveWeeklyHours, type ActionState } from "../../actions";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function Feedback({ state }: { state: ActionState }) {
  if (state?.error) return <p role="alert" className="field-error">{state.error}</p>;
  if (state?.ok) return <p role="status" className="text-sm text-success">{state.ok}</p>;
  return null;
}

export function WeeklyHoursForm({
  week,
}: {
  week: { weekday: number; enabled: boolean; start: string; end: string }[];
}) {
  const [state, action, pending] = useActionState(saveWeeklyHours, undefined);
  return (
    <form action={action} className="mt-6 grid gap-1">
      {week.map((d) => (
        <fieldset key={d.weekday} className="grid grid-cols-[8.5rem_1fr] items-center gap-3 border-b border-line py-3 last:border-b-0 sm:grid-cols-[9rem_1fr_1fr]">
          <legend className="sr-only">{DAYS[d.weekday]}</legend>
          <label className="flex items-center gap-2 font-medium">
            <input type="checkbox" name={`day${d.weekday}`} defaultChecked={d.enabled} className="h-4 w-4 accent-evergreen-800" />
            {DAYS[d.weekday]}
          </label>
          <label className="flex items-center gap-2 text-sm text-ink-muted">
            <span className="w-8">From</span>
            <input type="time" name={`start${d.weekday}`} defaultValue={d.start} step={900} className="input min-h-10 py-1.5" />
          </label>
          <label className="col-start-2 flex items-center gap-2 text-sm text-ink-muted sm:col-start-auto">
            <span className="w-8">To</span>
            <input type="time" name={`end${d.weekday}`} defaultValue={d.end} step={900} className="input min-h-10 py-1.5" />
          </label>
        </fieldset>
      ))}
      <div className="mt-4 flex flex-wrap items-center gap-4">
        <button type="submit" className="btn btn-primary" disabled={pending}>{pending ? "Saving…" : "Save hours"}</button>
        <Feedback state={state} />
      </div>
    </form>
  );
}

export function SettingsForm({ settings }: { settings: Settings }) {
  const [state, action, pending] = useActionState(saveBookingSettings, undefined);
  const fields: [keyof Settings, string, string][] = [
    ["durationMinutes", "Appointment length", "minutes"],
    ["bufferMinutes", "Buffer after each", "minutes"],
    ["slotIntervalMinutes", "Start times every", "minutes"],
    ["minNoticeHours", "Minimum notice", "hours"],
    ["maxDaysAhead", "Book up to", "days ahead"],
  ];
  return (
    <form action={action} className="mt-5 grid gap-4">
      {fields.map(([name, label, unit]) => (
        <div key={name} className="grid grid-cols-[1fr_6rem_5.5rem] items-center gap-3">
          <label htmlFor={name} className="text-[0.95rem]">{label}</label>
          <input id={name} name={name} type="number" min={0} defaultValue={settings[name]} className="input min-h-10 py-1.5" />
          <span className="text-sm text-ink-muted">{unit}</span>
        </div>
      ))}
      <div className="flex flex-wrap items-center gap-4">
        <button type="submit" className="btn btn-primary" disabled={pending}>{pending ? "Saving…" : "Save rules"}</button>
        <Feedback state={state} />
      </div>
    </form>
  );
}

export function BlackoutForm({ minDate }: { minDate: string }) {
  const [state, action, pending] = useActionState(addBlackout, undefined);
  return (
    <form action={action} className="mt-5 grid gap-3 sm:grid-cols-[auto_1fr_auto] sm:items-end">
      <div>
        <label htmlFor="bo-day" className="field-label">Date to block</label>
        <input id="bo-day" type="date" name="day" min={minDate} required className="input" />
      </div>
      <div>
        <label htmlFor="bo-reason" className="field-label">Reason <span className="font-normal text-ink-muted">(optional)</span></label>
        <input id="bo-reason" name="reason" maxLength={200} className="input" placeholder="Install day" />
      </div>
      <button type="submit" className="btn btn-outline" disabled={pending}>Block date</button>
      <div className="sm:col-span-3"><Feedback state={state} /></div>
    </form>
  );
}
