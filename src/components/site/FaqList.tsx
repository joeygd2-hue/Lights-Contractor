import type { Faq } from "@/content/faqs";

/**
 * Accessible accordion built on native <details>/<summary>: keyboard and
 * screen-reader support come from the browser, and it works without JS.
 */
export function FaqList({ items }: { items: Faq[] }) {
  return (
    <div className="divide-y divide-line border-y border-line">
      {items.map((f) => (
        <details key={f.q} className="group">
          <summary className="flex min-h-16 cursor-pointer list-none items-center justify-between gap-6 py-5 text-left [&::-webkit-details-marker]:hidden">
            <span className="font-display text-xl text-evergreen-900 md:text-[1.4rem]">{f.q}</span>
            <span
              aria-hidden="true"
              className="relative h-4 w-4 shrink-0 before:absolute before:left-0 before:top-1/2 before:h-px before:w-4 before:bg-gold-deep after:absolute after:left-1/2 after:top-0 after:h-4 after:w-px after:bg-gold-deep after:transition-transform group-open:after:scale-y-0"
            />
          </summary>
          <div className="prose-site max-w-2xl pb-6 text-ink-muted">
            {f.a.map((p) => (
              <p key={p.slice(0, 24)}>{p}</p>
            ))}
          </div>
        </details>
      ))}
    </div>
  );
}
