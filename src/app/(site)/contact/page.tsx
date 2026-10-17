import type { Metadata } from "next";
import Link from "next/link";
import { serviceAreas, site } from "@/config/site";
import { ctaBook, ctaQuote } from "@/config/nav";
import { ContactForm } from "@/components/forms/ContactForm";

export const metadata: Metadata = {
  title: "Contact",
  description: `Contact ${site.name} about Christmas light installation in ${serviceAreas[0].name}, ${site.location.city}, TX.`,
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  return (
    <>
      <section className="border-b border-line">
        <div className="container-site py-14 md:py-20">
          <p className="eyebrow">Contact</p>
          <h1 className="mt-5 max-w-3xl text-[2.6rem] font-medium text-evergreen-900 sm:text-5xl lg:text-[3.6rem]">
            Let&rsquo;s talk about your home.
          </h1>
          <p className="mt-6 max-w-xl text-lg text-ink-muted">
            Questions, ideas, or not sure where to start? Send us a note. If you already know you&rsquo;d
            like pricing, the quote form is the quickest way to get one.
          </p>
        </div>
      </section>

      <section className="py-14 md:py-20">
        <div className="container-site grid gap-14 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-7">
            <h2 className="text-3xl text-evergreen-900">Send a message</h2>
            <div className="mt-8">
              <ContactForm />
            </div>
          </div>

          <aside className="lg:col-span-5">
            <div className="space-y-10 lg:sticky lg:top-32">
              <div className="rounded-md bg-evergreen-900 p-7 text-ivory on-dark">
                <h2 className="text-2xl">Want a price for your home?</h2>
                <p className="mt-3 text-ivory/80">
                  The quote form takes a few minutes and gives us everything we need to prepare your
                  proposal.
                </p>
                <div className="mt-6 flex flex-col gap-3">
                  <Link href={ctaQuote.href} className="btn btn-gold">
                    Start a quote request
                  </Link>
                  <Link href={ctaBook.href} className="btn btn-outline-light">
                    {ctaBook.label}
                  </Link>
                </div>
              </div>

              <dl className="divide-y divide-line border-y border-line">
                {site.phone && site.phoneHref && (
                  <div className="py-5">
                    <dt className="text-xs font-semibold uppercase tracking-[0.16em] text-gold-deep">Phone</dt>
                    <dd className="mt-1.5 font-display text-2xl text-evergreen-900">
                      <a href={`tel:${site.phoneHref}`} className="hover:underline">{site.phone}</a>
                    </dd>
                  </div>
                )}
                {site.email && (
                  <div className="py-5">
                    <dt className="text-xs font-semibold uppercase tracking-[0.16em] text-gold-deep">Email</dt>
                    <dd className="mt-1.5 break-all text-lg text-evergreen-900">
                      <a href={`mailto:${site.email}`} className="hover:underline">{site.email}</a>
                    </dd>
                  </div>
                )}
                <div className="py-5">
                  <dt className="text-xs font-semibold uppercase tracking-[0.16em] text-gold-deep">Service area</dt>
                  <dd className="mt-1.5 text-lg text-evergreen-900">
                    {serviceAreas.map((a) => a.name).join(", ")}
                    <span className="block text-base text-ink-muted">
                      {site.location.city}, {site.location.regionName}
                    </span>
                  </dd>
                </div>
                {site.hours && (
                  <div className="py-5">
                    <dt className="text-xs font-semibold uppercase tracking-[0.16em] text-gold-deep">Hours</dt>
                    <dd className="mt-1.5 text-evergreen-900">
                      {site.hours.map((h) => (
                        <span key={h.days} className="block">{h.days}: {h.hours}</span>
                      ))}
                    </dd>
                  </div>
                )}
                {site.responseTime && (
                  <div className="py-5">
                    <dt className="text-xs font-semibold uppercase tracking-[0.16em] text-gold-deep">Response time</dt>
                    <dd className="mt-1.5 text-evergreen-900">We reply {site.responseTime}.</dd>
                  </div>
                )}
              </dl>
            </div>
          </aside>
        </div>
      </section>
    </>
  );
}
