"use client";

import { useActionState, useId } from "react";
import { rescheduleBookingAction } from "../../actions";

export function RescheduleForm({ id, minDate }: { id: string; minDate: string }) {
  const [state, action, pending] = useActionState(rescheduleBookingAction, undefined);
  const uid = useId();
  return (
    <details className="rounded-sm border border-line bg-ivory p-3">
      <summary className="cursor-pointer text-sm font-semibold text-evergreen-800">Reschedule</summary>
      <form action={action} className="mt-3 grid gap-3">
        <input type="hidden" name="id" value={id} />
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label htmlFor={`${uid}-d`} className="field-label text-xs">New date</label>
            <input id={`${uid}-d`} type="date" name="date" min={minDate} required className="input min-h-10 py-1.5" />
          </div>
          <div>
            <label htmlFor={`${uid}-t`} className="field-label text-xs">Start (Central)</label>
            <input id={`${uid}-t`} type="time" name="time" step={300} required className="input min-h-10 py-1.5" />
          </div>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="notify" defaultChecked className="h-4 w-4 accent-evergreen-800" />
          Email the customer the new time
        </label>
        {state?.error && <p role="alert" className="field-error mt-0">{state.error}</p>}
        {state?.ok && <p role="status" className="text-sm text-success">{state.ok}</p>}
        <button type="submit" className="btn btn-primary min-h-10 py-2 text-sm" disabled={pending}>
          {pending ? "Saving…" : "Move consultation"}
        </button>
      </form>
    </details>
  );
}
