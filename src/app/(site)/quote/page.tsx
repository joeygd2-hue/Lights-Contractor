import type { Metadata } from "next";
import { Suspense } from "react";
import { serviceAreas, site } from "@/config/site";
import { QuoteWizard } from "@/components/forms/QuoteWizard";

export const metadata: Metadata = {
  title: "Get a Free Quote",
  description: `Request a free, no-obligation quote for professional Christmas light installation in ${serviceAreas[0].name}, ${site.location.city}, TX.`,
  alternates: { canonical: "/quote" },
};

export default function QuotePage() {
  return (
    <>
      <section className="border-b border-line">
        <div className="container-site py-12 md:py-16">
          <p className="eyebrow">Free quote</p>
          <h1 className="mt-5 max-w-3xl text-[2.6rem] font-medium text-evergreen-900 sm:text-5xl">
            Tell us about your home.
          </h1>
          <p className="mt-5 max-w-2xl text-lg text-ink-muted">
            Five short steps, about three minutes. We&rsquo;ll use your answers to prepare a design
            and a written price for the season — free, with no obligation.
          </p>
        </div>
      </section>
      <section className="py-10 md:py-16">
        <div className="container-site">
          <Suspense fallback={<div className="h-[36rem] rounded-md border border-line bg-paper" aria-busy="true" />}>
            <QuoteWizard />
          </Suspense>
        </div>
      </section>
    </>
  );
}
