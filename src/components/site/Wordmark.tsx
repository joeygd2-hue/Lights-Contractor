import Image from "next/image";
import { site } from "@/config/site";

/**
 * Typeset wordmark used until a real logo is supplied in `site.logo`.
 * The small arc of bulbs nods to a roofline without resorting to clip-art.
 */
export function Wordmark({ tone = "dark" }: { tone?: "dark" | "light" }) {
  if (site.logo) {
    return (
      <Image src={site.logo} alt={site.name} width={220} height={56} className="h-11 w-auto" />
    );
  }
  const ink = tone === "dark" ? "text-evergreen-900" : "text-ivory";
  const sub = tone === "dark" ? "text-gold-deep" : "text-gold-soft";
  return (
    <span className={`flex items-center gap-3 ${ink}`}>
      <svg
        aria-hidden="true"
        viewBox="0 0 40 40"
        className="h-9 w-9 shrink-0"
        fill="none"
      >
        <path d="M4 22 20 8l16 14" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
        <path d="M9 22v12h22V22" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
        {[
          [7.5, 22.5],
          [12, 18.6],
          [16.2, 14.9],
          [20, 11.6],
          [23.8, 14.9],
          [28, 18.6],
          [32.5, 22.5],
        ].map(([cx, cy]) => (
          <circle key={`${cx}-${cy}`} cx={cx} cy={cy + 2.4} r="1.35" className="fill-gold" />
        ))}
      </svg>
      <span className="flex flex-col leading-none">
        <span className="font-display text-[1.32rem] font-semibold tracking-[-0.01em]">
          {site.wordmark.primary}
        </span>
        <span className={`mt-1 text-[0.66rem] font-semibold uppercase tracking-[0.24em] ${sub}`}>
          {site.wordmark.secondary}
        </span>
      </span>
    </span>
  );
}
