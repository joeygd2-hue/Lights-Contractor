"use client";

import Link from "next/link";
import { useId, useState } from "react";
import { isInServiceArea } from "@/config/site";

type Result = { kind: "in"; area: string } | { kind: "out" } | { kind: "invalid" } | null;

export function ZipChecker({ className = "" }: { className?: string }) {
  const id = useId();
  const [zip, setZip] = useState("");
  const [result, setResult] = useState<Result>(null);

  function check(e: React.FormEvent) {
    e.preventDefault();
    const z = zip.trim();
    if (!/^\d{5}$/.test(z)) {
      setResult({ kind: "invalid" });
      return;
    }
    const area = isInServiceArea(z);
    setResult(area ? { kind: "in", area: area.name } : { kind: "out" });
  }

  return (
    <div className={className}>
      <form onSubmit={check} className="flex flex-col gap-3 sm:flex-row" noValidate>
        <div className="flex-1">
          <label htmlFor={`${id}-zip`} className="sr-only">
            ZIP code
          </label>
          <input
            id={`${id}-zip`}
            inputMode="numeric"
            autoComplete="postal-code"
            maxLength={5}
            placeholder="ZIP code, e.g. 77498"
            className="input"
            value={zip}
            onChange={(e) => {
              setZip(e.target.value.replace(/\D/g, ""));
              setResult(null);
            }}
            aria-describedby={`${id}-result`}
            aria-invalid={result?.kind === "invalid" || undefined}
          />
        </div>
        <button type="submit" className="btn btn-primary">
          Check ZIP
        </button>
      </form>
      <div id={`${id}-result`} role="status" aria-live="polite" className="mt-4 min-h-6 text-[0.98rem]">
        {result?.kind === "invalid" && (
          <p className="text-danger">Please enter a 5-digit ZIP code.</p>
        )}
        {result?.kind === "in" && (
          <p className="text-success">
            <strong>Good news — {zip} is in our {result.area} service area.</strong>{" "}
            <Link href={`/quote?zip=${zip}`} className="underline underline-offset-4">
              Start your quote
            </Link>
            .
          </p>
        )}
        {result?.kind === "out" && (
          <p className="text-ink-muted">
            {zip} is outside the area we currently serve. We&rsquo;re adding neighborhoods over time
            — <Link href="/contact" className="font-semibold text-evergreen-800 underline underline-offset-4">send us a note</Link>{" "}
            and we&rsquo;ll let you know if we can help.
          </p>
        )}
      </div>
    </div>
  );
}
