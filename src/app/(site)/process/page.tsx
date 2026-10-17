import type { Metadata } from "next";
import Link from "next/link";
import { site } from "@/config/site";
import { ctaBook, ctaQuote } from "@/config/nav";
import { PageHeader } from "@/components/site/PageHeader";
import { ProcessSteps } from "@/components/site/ProcessSteps";
import { FinalCta } from "@/components/site/FinalCta";

export const metadata: Metadata = {
  title: "Our Process",
  description:
    "How professional Christmas light installation works with us — from quote and design to installation, upkeep, takedown and storage.",
  alternates: { canonical: "/process" },
};

export default function ProcessPage() {
  return (
    <>
      <PageHeader
        eyebrow="Our process"
        title="One season, start to finish."
        intro={
          <p>
            Here&rsquo;s exactly what happens after you reach out — and what you can expect from us
            at each step, from the first conversation to the day the lights come down.
          </p>
        }
        photo="entryDoor"
      />

      <section className="py-16 md:py-24" aria-label="Steps">
        <div className="container-site">
          <ProcessSteps detailed />
        </div>
      </section>

      <section className="border-y border-line bg-paper py-16 md:py-20" aria-labelledby="timeline-h">
        <div className="container-site grid gap-10 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <p className="eyebrow">Season timing</p>
            <h2 id="timeline-h" className="mt-5 text-4xl text-evergreen-900">
              When things happen.
            </h2>
          </div>
          <dl className="divide-y divide-line border-y border-line lg:col-span-7">
            {[
              { t: "Quotes & consultations", d: "Any time — the earlier, the more install dates to choose from." },
              { t: "Installation", d: `Typically ${site.season.installWindow}.` },
              { t: "During the season", d: "Lights on every evening. Contact us if anything stops working." },
              { t: "Takedown & storage", d: `Typically ${site.season.takedownWindow}.` },
            ].map((row) => (
              <div key={row.t} className="grid gap-1 py-5 sm:grid-cols-[14rem_1fr] sm:gap-6">
                <dt className="font-display text-xl text-evergreen-900">{row.t}</dt>
                <dd className="text-ink-muted">{row.d}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section className="py-16 md:py-20">
        <div className="container-site flex flex-col items-start gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-3xl text-evergreen-900 md:text-4xl">Ready for step one?</h2>
            <p className="mt-3 text-ink-muted">Request a quote online, or book a time to talk it through.</p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link href={ctaQuote.href} className="btn btn-primary">
              {ctaQuote.label}
            </Link>
            <Link href={ctaBook.href} className="btn btn-outline">
              {ctaBook.label}
            </Link>
          </div>
        </div>
      </section>

      <FinalCta />
    </>
  );
}
