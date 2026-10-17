"use client";

import { forwardRef, useId } from "react";

type Base = {
  name: string;
  label: string;
  error?: string;
  hint?: string;
  optional?: boolean;
  className?: string;
};

function describedBy(id: string, error?: string, hint?: string) {
  return [error && `${id}-error`, hint && `${id}-hint`].filter(Boolean).join(" ") || undefined;
}

/**
 * IDs must be unique per mounted form: Next.js keeps recently visited pages
 * mounted (hidden), so two forms with a "name" field can coexist in the DOM.
 * Fields are located for focus via `data-field` within their own form.
 */
function useFieldId(name: string) {
  return `${useId()}${name}`;
}

function Label({ id, label, optional }: { id: string; label: string; optional?: boolean }) {
  return (
    <label htmlFor={id} className="field-label">
      {label}
      {optional && <span className="ml-1.5 font-normal text-ink-muted">(optional)</span>}
    </label>
  );
}

function Messages({ id, error, hint }: { id: string; error?: string; hint?: string }) {
  return (
    <>
      {hint && (
        <p id={`${id}-hint`} className="field-hint">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className="field-error">
          {error}
        </p>
      )}
    </>
  );
}

export const TextField = forwardRef<
  HTMLInputElement,
  Base & Omit<React.InputHTMLAttributes<HTMLInputElement>, "name">
>(function TextField({ name, label, error, hint, optional, className = "", ...rest }, ref) {
  const id = useFieldId(name);
  return (
    <div className={className}>
      <Label id={id} label={label} optional={optional} />
      <input
        ref={ref}
        id={id}
        name={name}
        data-field={name}
        className="input"
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, error, hint)}
        aria-required={!optional || undefined}
        {...rest}
      />
      <Messages id={id} error={error} hint={hint} />
    </div>
  );
});

export function TextArea({
  name,
  label,
  error,
  hint,
  optional,
  className = "",
  ...rest
}: Base & Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, "name">) {
  const id = useFieldId(name);
  return (
    <div className={className}>
      <Label id={id} label={label} optional={optional} />
      <textarea
        id={id}
        name={name}
        data-field={name}
        className="input"
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, error, hint)}
        aria-required={!optional || undefined}
        {...rest}
      />
      <Messages id={id} error={error} hint={hint} />
    </div>
  );
}

export function SelectField({
  name,
  label,
  error,
  hint,
  optional,
  className = "",
  options,
  placeholder = "Select…",
  ...rest
}: Base &
  Omit<React.SelectHTMLAttributes<HTMLSelectElement>, "name"> & {
    options: readonly string[];
    placeholder?: string;
  }) {
  const id = useFieldId(name);
  return (
    <div className={className}>
      <Label id={id} label={label} optional={optional} />
      <select
        id={id}
        name={name}
        data-field={name}
        className="input"
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, error, hint)}
        aria-required={!optional || undefined}
        {...rest}
      >
        <option value="">{placeholder}</option>
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
      <Messages id={id} error={error} hint={hint} />
    </div>
  );
}

/** Group of radio buttons or checkboxes rendered as selectable tiles. */
export function ChoiceGroup({
  name,
  label,
  error,
  hint,
  optional,
  className = "",
  type,
  options,
  value,
  onChange,
  columns = 2,
}: Base & {
  type: "radio" | "checkbox";
  options: { value: string; label: string; description?: string }[];
  value: string | string[];
  onChange: (value: string | string[]) => void;
  columns?: 1 | 2 | 3;
}) {
  const id = useFieldId(name);
  const selected = Array.isArray(value) ? value : [value];
  const cols = columns === 1 ? "" : columns === 2 ? "sm:grid-cols-2" : "sm:grid-cols-2 lg:grid-cols-3";
  return (
    <fieldset
      className={className}
      aria-describedby={describedBy(id, error, hint)}
      aria-invalid={error ? true : undefined}
      id={id}
      data-field={name}
      tabIndex={-1}
    >
      <legend className="field-label">
        {label}
        {optional && <span className="ml-1.5 font-normal text-ink-muted">(optional)</span>}
      </legend>
      {hint && (
        <p id={`${id}-hint`} className="field-hint -mt-1 mb-3">
          {hint}
        </p>
      )}
      <div className={`grid gap-3 ${cols}`}>
        {options.map((o) => (
          <label key={o.value} className="choice">
            <input
              type={type}
              name={name}
              value={o.value}
              checked={selected.includes(o.value)}
              onChange={(e) => {
                if (type === "radio") onChange(o.value);
                else
                  onChange(
                    e.target.checked
                      ? [...selected.filter(Boolean), o.value]
                      : selected.filter((v) => v !== o.value),
                  );
              }}
            />
            <span>
              <span className="block font-medium text-charcoal">{o.label}</span>
              {o.description && (
                <span className="mt-0.5 block text-[0.88rem] text-ink-muted">{o.description}</span>
              )}
            </span>
          </label>
        ))}
      </div>
      {error && (
        <p id={`${id}-error`} className="field-error">
          {error}
        </p>
      )}
    </fieldset>
  );
}

/** Hidden honeypot. Real people never see or fill it. */
export function Honeypot({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div aria-hidden="true" className="absolute -left-[10000px] top-auto h-px w-px overflow-hidden">
      <label>
        Website
      <input
        name="website"
        type="text"
        tabIndex={-1}
        autoComplete="off"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      </label>
    </div>
  );
}
