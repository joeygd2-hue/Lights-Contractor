import type { Metadata } from "next";
import Link from "next/link";
import { offeredServices, pricing, site } from "@/config/site";
import { ctaBook, ctaQuote } from "@/config/nav";
import { PageHeader } from "@/components/site/PageHeader";
import { Photo } from "@/components/site/Photo";
import { FinalCta } from "@/components/site/FinalCta";
import { JsonLd } from "@/components/site/JsonLd";

export const metadata: Metadata = {
  title: "Christmas Light Installation Services",
  description: `Roofline lighting, architectural outlines, tree wraps, wreaths, garland and entryway lighting for homes in ${site.location.city}, TX — installed, maintained, taken down and stored for you.`,
  alternates: { canonical: "/services" },
};

export default function ServicesPage() {
  return (
    <>
      <PageHeader
        eyebrow="Services"
        title="Holiday lighting, handled from design to takedown."
        intro={
          <p>
            Choose one service or combine several. Every install uses our own lights and includes
            upkeep through the season, takedown in the new year and storage — so you never buy,
            untangle or store a thing.
          </p>
        }
        photo="victorianDusk"
      >
        <nav aria-label="Services on this page">
          <ul className="flex flex-wrap gap-x-5 gap-y-2 text-[0.95rem]">
            {offeredServices.map((s) => (
              <li key={s.id}>
                <a href={`#${s.id}`} className="text-evergreen-800 underline decoration-gold underline-offset-4 hover:decoration-evergreen-800">
                  {s.name}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </PageHeader>

      <div className="container-site">
        {offeredServices.map((s, i) => (
          <section
            key={s.id}
            id={s.id}
            aria-labelledby={`${s.id}-title`}
            className="grid scroll-mt-28 gap-10 border-b border-line py-16 last:border-b-0 md:py-20 lg:grid-cols-12 lg:gap-16"
          >
            <div className={`lg:col-span-5 ${i % 2 === 1 ? "lg:order-2 lg:col-start-8" : ""}`}>
              <Photo
                photo={s.image}
                fill
                sizes="(min-width: 1024px) 40vw, 100vw"
                className="aspect-[4/3] rounded-md lg:aspect-[4/5]"
              />
            </div>
            <div className={`lg:col-span-7 lg:self-center ${i % 2 === 1 ? "lg:order-1 lg:col-start-1" : ""}`}>
              <p className="font-display text-sm text-gold-deep">
                {String(i + 1).padStart(2, "0")} / {String(offeredServices.length).padStart(2, "0")}
              </p>
              <h2 id={`${s.id}-title`} className="mt-3 text-4xl text-evergreen-900">
                {s.name}
              </h2>
              <p className="mt-5 max-w-2xl text-lg text-ink-muted">{s.description}</p>
              <h3 className="mt-8 font-sans text-xs font-semibold uppercase tracking-[0.16em] text-charcoal">
                Good to know
              </h3>
              <ul className="mt-4 max-w-2xl space-y-3">
                {s.considerations.map((c) => (
                  <li key={c} className="flex gap-3 text-[0.98rem] text-ink-muted">
                    <span aria-hidden="true" className="mt-[0.6rem] h-1.5 w-1.5 shrink-0 rounded-full bg-gold" />
                    {c}
                  </li>
                ))}
              </ul>
              {pricing.startingAt[s.id] && (
                <p className="mt-6 font-semibold text-evergreen-900">{pricing.startingAt[s.id]}</p>
              )}
              {s.quotable && (
                <Link href={`${ctaQuote.href}?service=${s.id}`} className="link-arrow mt-8">
                  Get a quote for {s.name.toLowerCase()} <span aria-hidden="true">→</span>
                </Link>
              )}
            </div>
          </section>
        ))}
      </div>

      <section className="border-t border-line bg-paper py-16 md:py-20" aria-labelledby="pricing-heading">
        <div className="container-site grid gap-10 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <p className="eyebrow">Pricing</p>
            <h2 id="pricing-heading" className="mt-5 text-4xl text-evergreen-900">
              How pricing works.
            </h2>
          </div>
          <div className="max-w-2xl text-ink-muted lg:col-span-7">
            {pricing.showRange && (
              <p className="mb-5 text-lg">
                <strong className="font-semibold text-evergreen-900">{pricing.rangeText}</strong>{" "}
                {pricing.rangeDetail}
              </p>
            )}
            <p>
              We price each home individually after looking at it, because two houses on the same
              street can be very different to light. The main factors are:
            </p>
            <ul className="mt-5 grid gap-3 sm:grid-cols-2">
              {[
                "Length of the roofline and number of stories",
                "Roof pitch and how easy it is to reach",
                "Number and size of trees, shrubs and beds",
                "Wreaths, garland and entry details",
                "Power availability and outlet locations",
                "Any custom design elements",
              ].map((f) => (
                <li key={f} className="flex gap-3">
                  <span aria-hidden="true" className="mt-[0.6rem] h-1.5 w-1.5 shrink-0 rounded-full bg-gold" />
                  {f}
                </li>
              ))}
            </ul>
            <p className="mt-6">
              Your written proposal shows exactly what&rsquo;s included and one price for the season.
              Quotes are free and there&rsquo;s no obligation.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href={ctaQuote.href} className="btn btn-primary">
                Request a free quote
              </Link>
              <Link href={ctaBook.href} className="btn btn-outline">
                {ctaBook.label}
              </Link>
            </div>
          </div>
        </div>
      </section>

      <FinalCta />

      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@graph": offeredServices.map((s) => ({
            "@type": "Service",
            name: s.name,
            description: s.description,
            serviceType: "Christmas light installation",
            provider: { "@id": `${site.url}/#business` },
            url: `${site.url}/services#${s.id}`,
          })),
        }}
      />
    </>
  );
}
