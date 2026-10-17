"use client";

import { useActionState, useEffect, useRef } from "react";
import { addLeadNote } from "../../../actions";

export function NoteForm({ leadId }: { leadId: string }) {
  const [state, action, pending] = useActionState(addLeadNote, undefined);
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state?.ok) ref.current?.reset();
  }, [state]);
  return (
    <form ref={ref} action={action} className="mt-4 grid gap-3">
      <input type="hidden" name="id" value={leadId} />
      <label htmlFor={`note-${leadId}`} className="sr-only">New note</label>
      <textarea id={`note-${leadId}`} name="body" rows={3} className="input" placeholder="Called, left voicemail…" />
      {state?.error && <p role="alert" className="field-error">{state.error}</p>}
      <p role="status" className="sr-only">{state?.ok}</p>
      <button type="submit" className="btn btn-outline justify-self-start" disabled={pending}>
        {pending ? "Saving…" : "Add note"}
      </button>
    </form>
  );
}
