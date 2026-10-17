import type { Metadata } from "next";
import Link from "next/link";
import { serviceAreas, site } from "@/config/site";
import { ctaBook, ctaQuote } from "@/config/nav";
import { PageHeader } from "@/components/site/PageHeader";
import { Photo } from "@/components/site/Photo";
import { FinalCta } from "@/components/site/FinalCta";

export const metadata: Metadata = {
  title: "About Us",
  description: `${site.name} is a small local crew installing professional Christmas lights for homes in ${serviceAreas[0].name}, ${site.location.city}, TX.`,
  alternates: { canonical: "/about" },
};

/**
 * OWNER: replace the copy in `story` with your own words — how you started,
 * why you do this, anything that makes you you. Keep it true; don't add
 * years in business, credentials or insurance claims unless they're verified.
 */
const story = [
  `${site.name} is a small local crew of ${site.team.size} based in ${site.location.city}. We started this business to give neighbors a better way to light their homes for the holidays: a display that looks professionally designed, without buying lights, climbing ladders or storing boxes all year.`,
  `We focus on ${serviceAreas.map((a) => a.name).join(", ")} on purpose. Staying close to home means we can keep install dates, get back quickly if something needs attention, and take the time to do each house properly.`,
];

const standards = [
  {
    t: "We show up when we say we will",
    d: "You'll get a confirmed date for your install and your takedown, and we'll tell you early if weather moves things.",
  },
  {
    t: "We treat your home carefully",
    d: "Clips instead of nails or staples, cords kept out of walkways, and a clean yard when we leave.",
  },
  {
    t: "We'd rather do less, better",
    d: "We'll recommend what will look good on your home — and tell you when something isn't worth adding.",
  },
  {
    t: "Clear prices, in writing",
    d: "One proposal, one price for the season, with everything that's included spelled out before you approve.",
  },
];

export default function AboutPage() {
  return (
    <>
      <PageHeader
        eyebrow="About us"
        title="Neighbors who light up the neighborhood."
        intro={<p>A small {site.location.city} crew, focused on doing a few streets really well.</p>}
        photo="porchTree"
      />

      <section className="py-16 md:py-24">
        <div className="container-site grid gap-12 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-4">
            <p className="eyebrow">Our story</p>
            <h2 className="mt-5 text-4xl text-evergreen-900">Why we do this.</h2>
          </div>
          <div className="prose-site max-w-2xl text-lg text-ink-muted lg:col-span-8">
            {story.map((p) => (
              <p key={p.slice(0, 20)}>{p}</p>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-line bg-paper py-16 md:py-24" aria-labelledby="standards-heading">
        <div className="container-site">
          <p className="eyebrow">How we work</p>
          <h2 id="standards-heading" className="mt-5 max-w-2xl text-4xl text-evergreen-900 md:text-5xl">
            The standards we hold ourselves to.
          </h2>
          <dl className="mt-12 grid gap-x-12 gap-y-10 md:grid-cols-2">
            {standards.map((s, i) => (
              <div key={s.t} className="grid grid-cols-[3rem_1fr] gap-x-2 border-t border-line pt-6">
                <span className="font-display text-lg text-gold-deep">0{i + 1}</span>
                <div>
                  <dt className="font-display text-2xl text-evergreen-900">{s.t}</dt>
                  <dd className="mt-2 text-ink-muted">{s.d}</dd>
                </div>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section className="py-16 md:py-24">
        <div className="container-site grid gap-12 lg:grid-cols-12 lg:items-center lg:gap-16">
          <div className="lg:col-span-6">
            <Photo photo="brickDoorWreath" fill sizes="(min-width: 1024px) 45vw, 100vw" className="aspect-[4/3] rounded-md" />
          </div>
          <div className="lg:col-span-6">
            <p className="eyebrow">Local focus</p>
            <h2 className="mt-5 text-4xl text-evergreen-900">Based in {site.location.city}.</h2>
            <p className="mt-5 max-w-lg text-lg text-ink-muted">
              We currently install in {serviceAreas.map((a) => a.name).join(", ")} and plan to add
              more {site.location.city} neighborhoods over time. If you&rsquo;re nearby, ask — we&rsquo;ll
              tell you honestly whether we can fit you in.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href={ctaQuote.href} className="btn btn-primary">
                {ctaQuote.label}
              </Link>
              <Link href={ctaBook.href} className="btn btn-outline">
                {ctaBook.label}
              </Link>
            </div>
          </div>
        </div>
      </section>

      <FinalCta />
    </>
  );
}
