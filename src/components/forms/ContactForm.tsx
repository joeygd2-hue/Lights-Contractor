"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { contactSchema, fieldErrors } from "@/lib/validation";
import { Honeypot, TextArea, TextField } from "./fields";
import { focusFirstError, postJson, useFormMeta } from "./submit";

const empty = { name: "", email: "", phone: "", zip: "", message: "" };

export function ContactForm() {
  const [values, setValues] = useState(empty);
  const [website, setWebsite] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState<{ reference: string | null } | null>(null);
  const meta = useFormMeta();
  const successRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const set = (k: keyof typeof empty) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setValues((v) => ({ ...v, [k]: e.target.value }));
    if (errors[k]) setErrors(({ [k]: _, ...rest }) => rest);
  };

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;
    setFormError(null);
    const payload = { ...values, website, ...meta.get() };
    const check = contactSchema.safeParse(payload);
    if (!check.success) {
      const f = fieldErrors(check.error);
      setErrors(f);
      focusFirstError(f, formRef.current);
      return;
    }
    setSubmitting(true);
    const res = await postJson("/api/contact", payload);
    setSubmitting(false);
    if (res.ok) {
      setDone({ reference: res.reference });
      requestAnimationFrame(() => successRef.current?.focus());
    } else {
      if (res.fields) {
        setErrors(res.fields);
        focusFirstError(res.fields, formRef.current);
      }
      setFormError(res.error);
    }
  }

  if (done) {
    return (
      <div
        ref={successRef}
        tabIndex={-1}
        role="status"
        className="rounded-md border border-evergreen-700/30 bg-evergreen-100/60 p-7 outline-none"
      >
        <h2 className="text-3xl text-evergreen-900">Message sent — thank you.</h2>
        <p className="mt-3 text-ink-muted">
          We&rsquo;ve received your message and will get back to you soon.
          {done.reference && (
            <>
              {" "}Your reference is <strong className="text-charcoal">{done.reference}</strong>.
            </>
          )}
        </p>
        <p className="mt-5">
          <Link href="/quote" className="link-arrow">
            Ready for a price? Start a quote request <span aria-hidden="true">→</span>
          </Link>
        </p>
      </div>
    );
  }

  return (
    <form ref={formRef} onSubmit={onSubmit} noValidate className="relative grid gap-5" aria-describedby={formError ? "contact-form-error" : undefined}>
      <Honeypot value={website} onChange={setWebsite} />
      <div className="grid gap-5 sm:grid-cols-2">
        <TextField name="name" label="Full name" autoComplete="name" value={values.name} onChange={set("name")} error={errors.name} />
        <TextField name="email" label="Email" type="email" autoComplete="email" value={values.email} onChange={set("email")} error={errors.email} />
        <TextField name="phone" label="Phone" type="tel" autoComplete="tel" optional value={values.phone} onChange={set("phone")} error={errors.phone} />
        <TextField name="zip" label="ZIP code" inputMode="numeric" autoComplete="postal-code" maxLength={5} optional value={values.zip} onChange={set("zip")} error={errors.zip} />
      </div>
      <TextArea name="message" label="How can we help?" rows={5} value={values.message} onChange={set("message")} error={errors.message} />
      {formError && (
        <p id="contact-form-error" role="alert" className="rounded-sm border border-danger/30 bg-danger/5 px-4 py-3 text-[0.95rem] text-danger">
          {formError}
        </p>
      )}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-ink-muted">
          We use your details only to reply to you. See our{" "}
          <Link href="/privacy" className="underline underline-offset-4">privacy policy</Link>.
        </p>
        <button type="submit" className="btn btn-primary shrink-0" disabled={submitting} aria-busy={submitting}>
          {submitting ? "Sending…" : "Send message"}
        </button>
      </div>
    </form>
  );
}
