import type { Metadata } from "next";
import Link from "next/link";
import { site } from "@/config/site";
import { ctaQuote } from "@/config/nav";
import { faqCategories, faqs } from "@/content/faqs";
import { FaqList } from "@/components/site/FaqList";
import { JsonLd } from "@/components/site/JsonLd";

export const metadata: Metadata = {
  title: "Frequently Asked Questions",
  description: `Answers about pricing, installation, lights, weather, takedown and storage for Christmas light installation in ${site.location.city}, TX.`,
  alternates: { canonical: "/faq" },
};

const slug = (s: string) => s.toLowerCase().replace(/[^a-z]+/g, "-");

export default function FaqPage() {
  return (
    <>
      <section className="border-b border-line">
        <div className="container-site py-14 md:py-20">
          <p className="eyebrow">FAQ</p>
          <h1 className="mt-5 max-w-3xl text-[2.6rem] font-medium text-evergreen-900 sm:text-5xl lg:text-[3.6rem]">
            Questions homeowners ask us.
          </h1>
          <p className="mt-6 max-w-xl text-lg text-ink-muted">
            Straight answers about how professional holiday lighting works. Don&rsquo;t see yours?{" "}
            <Link href="/contact" className="font-semibold text-evergreen-800 underline decoration-gold underline-offset-4">
              Ask us directly
            </Link>
            .
          </p>
        </div>
      </section>

      <div className="container-site grid gap-12 py-14 md:py-20 lg:grid-cols-12">
        <nav aria-label="FAQ topics" className="lg:col-span-3">
          <ul className="flex flex-wrap gap-x-5 gap-y-2 lg:sticky lg:top-32 lg:flex-col lg:gap-3">
            {faqCategories.map((c) => (
              <li key={c}>
                <a href={`#${slug(c)}`} className="text-[0.95rem] text-ink-muted hover:text-evergreen-900">
                  {c}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <div className="space-y-14 lg:col-span-9">
          {faqCategories.map((c) => (
            <section key={c} id={slug(c)} aria-labelledby={`${slug(c)}-h`} className="scroll-mt-32">
              <h2 id={`${slug(c)}-h`} className="mb-4 font-sans text-xs font-semibold uppercase tracking-[0.18em] text-gold-deep">
                {c}
              </h2>
              <FaqList items={faqs.filter((f) => f.category === c)} />
            </section>
          ))}
          <div className="flex flex-col items-start gap-4 rounded-md border border-line bg-paper p-7 md:flex-row md:items-center md:justify-between">
            <p className="font-display text-2xl text-evergreen-900">Ready for a price on your home?</p>
            <Link href={ctaQuote.href} className="btn btn-primary">
              {ctaQuote.label}
            </Link>
          </div>
        </div>
      </div>

      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: faqs.map((f) => ({
            "@type": "Question",
            name: f.q,
            acceptedAnswer: { "@type": "Answer", text: f.a.join(" ") },
          })),
        }}
      />
    </>
  );
}
