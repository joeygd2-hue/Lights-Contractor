import { processSteps } from "@/content/process";

export function ProcessSteps({
  tone = "light",
  detailed = false,
  className = "",
}: {
  tone?: "light" | "dark";
  detailed?: boolean;
  className?: string;
}) {
  const dark = tone === "dark";
  return (
    <ol className={`grid gap-0 md:grid-cols-5 ${className}`}>
      {processSteps.map((step, i) => (
        <li
          key={step.title}
          className={`relative border-l pb-10 pl-7 md:border-l-0 md:border-t md:pb-0 md:pl-0 md:pr-6 md:pt-8 ${
            dark ? "border-line-dark" : "border-line"
          } last:pb-0`}
        >
          <span
            aria-hidden="true"
            className={`absolute -left-[5px] top-1 h-[9px] w-[9px] rounded-full md:-top-[5px] md:left-0 ${
              dark ? "bg-gold-soft shadow-[0_0_0_4px_var(--color-evergreen-900)]" : "bg-gold shadow-[0_0_0_4px_var(--color-ivory)]"
            }`}
          />
          <p className={`font-display text-sm ${dark ? "text-gold-soft" : "text-gold-deep"}`}>
            Step {i + 1}
          </p>
          <h3 className={`mt-2 text-[1.45rem] ${dark ? "text-ivory" : "text-evergreen-900"}`}>
            {step.title}
          </h3>
          <p className={`mt-3 text-[0.96rem] ${dark ? "text-ivory/75" : "text-ink-muted"}`}>
            {detailed ? step.detail : step.short}
          </p>
        </li>
      ))}
    </ol>
  );
}
