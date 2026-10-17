"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useRef, useState } from "react";
import { isInServiceArea, pricing, quotableServices, serviceAreas, site } from "@/config/site";
import {
  budgets,
  fieldErrors,
  hasLightsOptions,
  homeSizes,
  propertyTypes,
  quoteSchema,
  quoteStep1,
  quoteStep2,
  quoteStep3,
  quoteStep4,
  timeframes,
} from "@/lib/validation";
import { ChoiceGroup, Honeypot, SelectField, TextArea, TextField } from "./fields";
import { focusFirstError, postJson, useFormMeta } from "./submit";

type Values = {
  name: string;
  email: string;
  phone: string;
  preferredContact: string;
  address: string;
  city: string;
  zip: string;
  propertyType: string;
  propertyDetails: string;
  services: string[];
  servicesOther: string;
  specialRequests: string;
  timeframe: string;
  hasLights: string;
  homeSize: string;
  budget: string;
  notes: string;
};

const STEPS = [
  { title: "Your details", schema: quoteStep1 },
  { title: "Your property", schema: quoteStep2 },
  { title: "Services", schema: quoteStep3 },
  { title: "Project details", schema: quoteStep4 },
  { title: "Review & send", schema: null },
] as const;

const FIELD_STEP: Record<keyof Values, number> = {
  name: 0, email: 0, phone: 0, preferredContact: 0,
  address: 1, city: 1, zip: 1, propertyType: 1, propertyDetails: 1,
  services: 2, servicesOther: 2, specialRequests: 2,
  timeframe: 3, hasLights: 3, homeSize: 3, budget: 3, notes: 3,
};

const CONTACT_LABEL: Record<string, string> = { email: "Email", phone: "Phone call", text: "Text message" };

const serviceOptions = [
  ...quotableServices.map((s) => ({ value: s.id, label: s.name })),
  { value: "other", label: "Something else" },
];

function initialValues(params: URLSearchParams): Values {
  const service = params.get("service");
  const zip = params.get("zip");
  return {
    name: "",
    email: "",
    phone: "",
    preferredContact: "",
    address: "",
    city: site.location.city,
    zip: zip && /^\d{5}$/.test(zip) ? zip : "",
    propertyType: "",
    propertyDetails: "",
    services: service && quotableServices.some((s) => s.id === service) ? [service] : [],
    servicesOther: "",
    specialRequests: "",
    timeframe: "",
    hasLights: "",
    homeSize: "",
    budget: "",
    notes: "",
  };
}

/** Optional selects are sent as undefined when left blank. */
function toPayload(v: Values) {
  return {
    ...v,
    homeSize: v.homeSize || undefined,
    budget: v.budget || undefined,
  };
}

export function QuoteWizard() {
  const params = useSearchParams();
  const [values, setValues] = useState<Values>(() => initialValues(params));
  const [website, setWebsite] = useState("");
  const [step, setStep] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [reference, setReference] = useState<string | null | undefined>(undefined);
  const [emailed, setEmailed] = useState(false);
  const meta = useFormMeta();
  const headingRef = useRef<HTMLHeadingElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const update = <K extends keyof Values>(k: K, v: Values[K]) => {
    setValues((prev) => ({ ...prev, [k]: v }));
    if (errors[k]) setErrors(({ [k]: _, ...rest }) => rest);
  };
  const bind = (k: keyof Values) => ({
    value: values[k] as string,
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      update(k, e.target.value as never),
    error: errors[k],
  });

  function goTo(next: number) {
    setStep(next);
    setErrors({});
    setFormError(null);
    requestAnimationFrame(() => {
      headingRef.current?.focus();
      headingRef.current?.scrollIntoView({ block: "start", behavior: "smooth" });
    });
  }

  function validateStep(i: number): boolean {
    const schema = STEPS[i]!.schema;
    if (!schema) return true;
    const result = schema.safeParse(toPayload(values));
    if (result.success) return true;
    const f = fieldErrors(result.error);
    setErrors(f);
    focusFirstError(f, formRef.current);
    return false;
  }

  async function submit() {
    if (submitting) return;
    for (let i = 0; i < 4; i++) {
      if (!validateStep(i)) {
        setStep(i);
        return;
      }
    }
    const payload = { ...toPayload(values), website, ...meta.get() };
    const local = quoteSchema.safeParse(payload);
    if (!local.success) {
      setFormError("Some details need another look. Please review each step.");
      return;
    }
    setSubmitting(true);
    setFormError(null);
    const res = await postJson("/api/quote", payload);
    setSubmitting(false);
    if (res.ok) {
      setReference(res.reference);
      setEmailed(Boolean(res.data?.confirmationEmail));
      requestAnimationFrame(() => headingRef.current?.focus());
      return;
    }
    if (res.fields) {
      // Jump to the first step containing a server-side error.
      const firstField = Object.keys(res.fields)[0] ?? "";
      const target = FIELD_STEP[firstField as keyof Values];
      if (target !== undefined) setStep(target);
      setErrors(res.fields);
    }
    setFormError(res.error);
  }

  const zipArea = values.zip.length === 5 ? isInServiceArea(values.zip) : undefined;

  /* ───────────── Success ───────────── */
  if (reference !== undefined) {
    return (
      <div className="rounded-md border border-line bg-paper p-7 shadow-card md:p-12" role="status">
        <p className="eyebrow">Request received</p>
        <h2 ref={headingRef} tabIndex={-1} className="mt-4 text-4xl text-evergreen-900 outline-none md:text-5xl">
          Thank you, {values.name.split(" ")[0]}.
        </h2>
        <p className="mt-5 max-w-xl text-lg text-ink-muted">
          Your quote request has been saved
          {reference && (
            <>
              {" "}under reference{" "}
              <strong className="whitespace-nowrap font-semibold text-charcoal">{reference}</strong>
            </>
          )}
          .{emailed && <> We&rsquo;ve emailed a confirmation to {values.email}.</>}
        </p>
        <h3 className="mt-10 font-sans text-xs font-semibold uppercase tracking-[0.16em] text-charcoal">
          What happens next
        </h3>
        <ol className="mt-5 grid gap-5 md:grid-cols-3">
          {[
            `We review your details${site.responseTime ? ` and contact you ${site.responseTime}` : " and get in touch"} by ${(CONTACT_LABEL[values.preferredContact] ?? "your preferred method").toLowerCase()}.`,
            "We talk through the design — by phone or with a quick visit to your home.",
            "You receive a written proposal with one price for the season. No obligation.",
          ].map((t, i) => (
            <li key={t} className="border-t border-line pt-4">
              <span className="font-display text-gold-deep">0{i + 1}</span>
              <p className="mt-2 text-[0.98rem] text-ink-muted">{t}</p>
            </li>
          ))}
        </ol>
        <div className="mt-10 flex flex-col gap-3 sm:flex-row">
          <Link href="/book" className="btn btn-primary">
            Book your consultation now
          </Link>
          <Link href="/gallery" className="btn btn-outline">
            Browse styles while you wait
          </Link>
        </div>
      </div>
    );
  }

  /* ───────────── Wizard ───────────── */
  return (
    <div className="grid gap-8 lg:grid-cols-12 lg:gap-12">
      {/* Progress */}
      <nav aria-label="Quote progress" className="lg:col-span-4">
        <div className="lg:sticky lg:top-32">
          <p className="text-sm font-medium text-ink-muted lg:hidden">
            Step {step + 1} of {STEPS.length}: <span className="text-charcoal">{STEPS[step]!.title}</span>
          </p>
          <div
            className="mt-3 h-1 overflow-hidden rounded-full bg-line lg:hidden"
            role="progressbar"
            aria-label="Quote progress"
            aria-valuemin={1}
            aria-valuemax={STEPS.length}
            aria-valuenow={step + 1}
          >
            <div className="h-full bg-evergreen-700 transition-all" style={{ width: `${((step + 1) / STEPS.length) * 100}%` }} />
          </div>
          <ol className="hidden border-l border-line lg:block">
            {STEPS.map((s, i) => {
              const state = i < step ? "done" : i === step ? "current" : "todo";
              return (
                <li key={s.title} className="relative py-3 pl-7">
                  <span
                    aria-hidden="true"
                    className={`absolute -left-[6px] top-[1.15rem] h-[11px] w-[11px] rounded-full border-2 ${
                      state === "done"
                        ? "border-evergreen-700 bg-evergreen-700"
                        : state === "current"
                          ? "border-gold-deep bg-ivory"
                          : "border-line bg-ivory"
                    }`}
                  />
                  {state === "done" ? (
                    <button type="button" onClick={() => goTo(i)} className="text-left text-[0.98rem] text-evergreen-800 underline decoration-gold underline-offset-4">
                      {s.title}
                      <span className="sr-only"> (completed — edit)</span>
                    </button>
                  ) : (
                    <span
                      aria-current={state === "current" ? "step" : undefined}
                      className={`text-[0.98rem] ${state === "current" ? "font-semibold text-charcoal" : "text-ink-muted"}`}
                    >
                      {s.title}
                    </span>
                  )}
                </li>
              );
            })}
          </ol>
          <p className="mt-8 hidden max-w-xs text-sm text-ink-muted lg:block">
            This helps us prepare an accurate quote. It isn&rsquo;t an automatic price — we&rsquo;ll
            follow up with a written proposal for your home.
          </p>
        </div>
      </nav>

      {/* Form */}
      <form
        ref={formRef}
        noValidate
        className="relative rounded-md border border-line bg-paper p-6 shadow-card sm:p-8 md:p-10 lg:col-span-8"
        onSubmit={(e) => {
          e.preventDefault();
          if (step < 4) {
            if (validateStep(step)) goTo(step + 1);
          } else {
            void submit();
          }
        }}
      >
        <Honeypot value={website} onChange={setWebsite} />
        <h2 ref={headingRef} tabIndex={-1} className="scroll-mt-32 text-3xl text-evergreen-900 outline-none">
          {STEPS[step]!.title}
        </h2>

        <div className="mt-8 grid gap-6">
          {step === 0 && (
            <>
              <TextField name="name" label="Full name" autoComplete="name" {...bind("name")} />
              <div className="grid gap-6 sm:grid-cols-2">
                <TextField name="email" label="Email" type="email" autoComplete="email" {...bind("email")} />
                <TextField name="phone" label="Phone" type="tel" autoComplete="tel" hint="We'll only call or text about your quote." {...bind("phone")} />
              </div>
              <ChoiceGroup
                name="preferredContact"
                label="Best way to reach you"
                type="radio"
                columns={3}
                options={[
                  { value: "email", label: "Email" },
                  { value: "phone", label: "Phone call" },
                  { value: "text", label: "Text message" },
                ]}
                value={values.preferredContact}
                onChange={(v) => update("preferredContact", v as string)}
                error={errors.preferredContact}
              />
            </>
          )}

          {step === 1 && (
            <>
              <TextField name="address" label="Street address" autoComplete="street-address" {...bind("address")} />
              <div className="grid gap-6 sm:grid-cols-[1fr_10rem]">
                <TextField name="city" label="City" autoComplete="address-level2" {...bind("city")} />
                <TextField name="zip" label="ZIP code" inputMode="numeric" autoComplete="postal-code" maxLength={10} {...bind("zip")} />
              </div>
              {values.zip.length >= 5 && /^\d{5}/.test(values.zip) && (
                <p role="status" className={`-mt-2 rounded-sm px-4 py-3 text-[0.95rem] ${zipArea ? "bg-evergreen-100/70 text-success" : "bg-ivory-deep text-ink-muted"}`}>
                  {zipArea
                    ? `You're in our ${zipArea.name} service area.`
                    : `This ZIP is outside our current service area (${serviceAreas.map((a) => a.name).join(", ")}). You can still send your request — we'll let you know honestly whether we can help.`}
                </p>
              )}
              <ChoiceGroup
                name="propertyType"
                label="Property type"
                type="radio"
                columns={3}
                options={propertyTypes.map((p) => ({ value: p, label: p }))}
                value={values.propertyType}
                onChange={(v) => update("propertyType", v as string)}
                error={errors.propertyType}
              />
              <TextArea
                name="propertyDetails"
                label="Anything we should know about the property?"
                optional
                rows={3}
                hint="Gate codes, steep roof sections, HOA rules, outlet locations…"
                {...bind("propertyDetails")}
              />
            </>
          )}

          {step === 2 && (
            <>
              <ChoiceGroup
                name="services"
                label="What would you like lit or decorated?"
                hint="Choose all that apply. Takedown and storage are included with every install."
                type="checkbox"
                options={serviceOptions}
                value={values.services}
                onChange={(v) => update("services", v as string[])}
                error={errors.services}
              />
              {values.services.includes("other") && (
                <TextField name="servicesOther" label="What else did you have in mind?" {...bind("servicesOther")} />
              )}
              <TextArea
                name="specialRequests"
                label="Special requests or ideas"
                optional
                rows={4}
                hint="Colors, a look you've seen, features you want highlighted…"
                {...bind("specialRequests")}
              />
            </>
          )}

          {step === 3 && (
            <>
              <div className="grid gap-6 sm:grid-cols-2">
                <SelectField name="timeframe" label="Preferred installation timing" options={timeframes} {...bind("timeframe")} />
                <SelectField name="hasLights" label="Do you have your own lights?" options={hasLightsOptions} hint="Not needed — we supply everything." {...bind("hasLights")} />
                <SelectField name="homeSize" label="Home size" optional options={homeSizes} {...bind("homeSize")} />
                <SelectField name="budget" label="Budget range" optional options={budgets} {...bind("budget")} />
              </div>
              {pricing.showRange && (
                <p className="rounded-sm bg-ivory-deep px-4 py-3 text-[0.95rem] text-ink-muted">
                  For reference: {pricing.rangeText.charAt(0).toLowerCase() + pricing.rangeText.slice(1)}{" "}
                  {pricing.rangeDetail}
                </p>
              )}
              <TextArea
                name="notes"
                label="Anything else?"
                optional
                rows={4}
                hint="Have photos of your home? Reply to your confirmation email and attach them."
                {...bind("notes")}
              />
            </>
          )}

          {step === 4 && <Review values={values} onEdit={goTo} />}
        </div>

        {formError && (
          <p role="alert" className="mt-6 rounded-sm border border-danger/30 bg-danger/5 px-4 py-3 text-[0.95rem] text-danger">
            {formError}
          </p>
        )}

        <div className="mt-10 flex flex-col-reverse gap-3 border-t border-line pt-6 sm:flex-row sm:items-center sm:justify-between">
          {step > 0 ? (
            <button type="button" className="btn btn-outline" onClick={() => goTo(step - 1)} disabled={submitting}>
              <span aria-hidden="true">←</span> Back
            </button>
          ) : (
            <span />
          )}
          <button type="submit" className="btn btn-primary" disabled={submitting} aria-busy={submitting}>
            {step < 4 ? (
              <>
                Continue <span aria-hidden="true">→</span>
              </>
            ) : submitting ? (
              "Sending your request…"
            ) : (
              "Send quote request"
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

function Review({ values, onEdit }: { values: Values; onEdit: (step: number) => void }) {
  const serviceLabel = (id: string) => serviceOptions.find((o) => o.value === id)?.label ?? id;
  const sections: { step: number; title: string; rows: [string, string][] }[] = [
    {
      step: 0,
      title: "Your details",
      rows: [
        ["Name", values.name],
        ["Email", values.email],
        ["Phone", values.phone],
        ["Contact by", CONTACT_LABEL[values.preferredContact] ?? ""],
      ],
    },
    {
      step: 1,
      title: "Your property",
      rows: [
        ["Address", `${values.address}, ${values.city} ${values.zip}`],
        ["Property type", values.propertyType],
        ["Details", values.propertyDetails],
      ],
    },
    {
      step: 2,
      title: "Services",
      rows: [
        ["Services", values.services.map(serviceLabel).join(", ")],
        ["Other", values.servicesOther],
        ["Requests", values.specialRequests],
      ],
    },
    {
      step: 3,
      title: "Project details",
      rows: [
        ["Timing", values.timeframe],
        ["Own lights", values.hasLights],
        ["Home size", values.homeSize],
        ["Budget", values.budget],
        ["Notes", values.notes],
      ],
    },
  ];
  return (
    <div className="grid gap-6">
      <p className="text-ink-muted">
        Please check everything looks right. You can edit any section before sending.
      </p>
      {sections.map((s) => (
        <section key={s.title} className="rounded-sm border border-line" aria-labelledby={`review-${s.step}`}>
          <div className="flex items-center justify-between border-b border-line bg-ivory px-4 py-2.5">
            <h3 id={`review-${s.step}`} className="font-sans text-sm font-semibold text-charcoal">
              {s.title}
            </h3>
            <button type="button" onClick={() => onEdit(s.step)} className="min-h-10 px-2 text-sm font-semibold text-evergreen-800 underline decoration-gold underline-offset-4">
              Edit<span className="sr-only"> {s.title.toLowerCase()}</span>
            </button>
          </div>
          <dl className="divide-y divide-line">
            {s.rows
              .filter(([, v]) => v && v.trim())
              .map(([k, v]) => (
                <div key={k} className="grid gap-1 px-4 py-2.5 text-[0.95rem] sm:grid-cols-[9rem_1fr]">
                  <dt className="text-ink-muted">{k}</dt>
                  <dd className="whitespace-pre-wrap break-words text-charcoal">{v}</dd>
                </div>
              ))}
          </dl>
        </section>
      ))}
      <p className="text-sm text-ink-muted">
        By sending this request you agree that we may contact you about your quote. We don&rsquo;t
        share your information. See our{" "}
        <Link href="/privacy" className="underline underline-offset-4">privacy policy</Link>.
      </p>
    </div>
  );
}
