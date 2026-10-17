import Link from "next/link";
import {
  offeredServices,
  pricing,
  serviceAreas,
  site,
  testimonials,
} from "@/config/site";
import { ctaBook, ctaQuote } from "@/config/nav";
import { Photo } from "@/components/site/Photo";
import { ProcessSteps } from "@/components/site/ProcessSteps";
import { ZipChecker } from "@/components/site/ZipChecker";
import { FaqList } from "@/components/site/FaqList";
import { faqs } from "@/content/faqs";
import { FinalCta } from "@/components/site/FinalCta";

export default function HomePage() {
  const previewFaqs = faqs.filter((f) => f.featured).slice(0, 5);

  return (
    <>
      {/* ───────────── Hero ───────────── */}
      <section className="on-dark relative overflow-hidden bg-evergreen-900 text-ivory">
        <div className="grid lg:min-h-[640px] lg:grid-cols-12">
          <div className="relative z-10 flex flex-col justify-center px-5 pb-14 pt-12 md:px-8 lg:col-span-6 lg:py-20 lg:pl-[max(2rem,calc((100vw-78rem)/2+2rem))] lg:pr-14">
            <p className="eyebrow">
              {serviceAreas[0].name} · {site.location.city}, {site.location.region}
            </p>
            <h1 className="mt-6 text-[2.6rem] font-medium leading-[1.02] sm:text-6xl lg:text-[4.1rem]">
              Your home, lit for the season.
              <span className="mt-3 block font-display text-[0.5em] font-normal italic leading-snug text-gold-soft">
                Designed, installed and taken down for you.
              </span>
            </h1>
            <p className="mt-7 max-w-[34rem] text-lg leading-relaxed text-ivory/80">
              We design and install professional Christmas lighting for homes in{" "}
              {serviceAreas.map((a) => a.name).join(", ")} using our own commercial-grade lights.
              We keep everything working through the holidays, then take it all down and store it
              — there&rsquo;s nothing to buy and no ladder for you to climb.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link href={ctaQuote.href} className="btn btn-gold">
                Get a free quote
              </Link>
              <Link href={ctaBook.href} className="btn btn-outline-light">
                Book a consultation
              </Link>
            </div>
            {site.season.accepting && (
              <p className="mt-8 flex items-center gap-3 text-sm text-ivory/70">
                <span aria-hidden="true" className="inline-block h-2 w-2 rounded-full bg-gold-soft" />
                Now scheduling installs for the {site.season.year} season.
              </p>
            )}
          </div>

          <div className="relative min-h-[320px] sm:min-h-[420px] lg:col-span-6 lg:min-h-0">
            <Photo
              photo="homeOutline"
              fill
              eager
              sizes="(min-width: 1024px) 50vw, 100vw"
              className="absolute inset-0 h-full"
              imgClassName="object-[50%_45%]"
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-y-0 left-0 hidden w-24 bg-gradient-to-r from-evergreen-900 to-transparent lg:block"
            />
          </div>
        </div>
      </section>

      {/* ───────────── The model: rent the look ───────────── */}
      <section className="py-20 md:py-28">
        <div className="container-site grid gap-12 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-5">
            <p className="eyebrow">How we&rsquo;re different</p>
            <h2 className="mt-5 text-4xl text-evergreen-900 md:text-5xl">
              You get the look. We own the lights.
            </h2>
            <p className="mt-6 max-w-md text-ink-muted">
              Most homeowners don&rsquo;t want another box of tangled strands in the garage. With
              us, the lights, clips and cords are ours. You pay for a finished, maintained display
              for the season — and when it&rsquo;s over, it all goes back with us.
            </p>
            <Link href="/process" className="link-arrow mt-8">
              See how a season works <span aria-hidden="true">→</span>
            </Link>
          </div>

          <ol className="grid gap-px overflow-hidden rounded-md border border-line bg-line sm:grid-cols-2 lg:col-span-7">
            {[
              {
                t: "Nothing to buy",
                d: "We supply commercial-grade lights, clips and cords. You don't need your own lights, and there's nothing left over to store.",
              },
              {
                t: "Designed for your home",
                d: "We plan the layout around your roofline, trees and entry — not a one-size package.",
              },
              {
                t: "Looked after all season",
                d: "If a strand or bulb goes out during the season, let us know and we'll come back and fix it.",
              },
              {
                t: "Takedown & storage included",
                d: "In the new year we take everything down and store it. Your home is back to normal without lifting a finger.",
              },
            ].map((item, i) => (
              <li key={item.t} className="bg-paper p-7 md:p-8">
                <span className="font-display text-sm text-gold-deep">0{i + 1}</span>
                <h3 className="mt-3 text-[1.45rem] text-evergreen-900">{item.t}</h3>
                <p className="mt-3 text-[0.98rem] text-ink-muted">{item.d}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ───────────── Services ───────────── */}
      <section className="border-y border-line bg-ivory-deep py-20 md:py-28" aria-labelledby="services-heading">
        <div className="container-site">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <div>
              <p className="eyebrow">Services</p>
              <h2 id="services-heading" className="mt-5 max-w-xl text-4xl text-evergreen-900 md:text-5xl">
                From the roof peak to the front door.
              </h2>
            </div>
            <Link href="/services" className="link-arrow shrink-0">
              Explore all services <span aria-hidden="true">→</span>
            </Link>
          </div>

          <div className="mt-14 grid gap-10 lg:grid-cols-12 lg:gap-14">
            <div className="grid gap-4 sm:grid-cols-2 lg:col-span-5 lg:grid-cols-1">
              <Photo photo="porchOutline" sizes="(min-width: 1024px) 34vw, (min-width: 640px) 50vw, 100vw" className="aspect-[4/3] rounded-md lg:aspect-auto lg:h-full lg:min-h-[28rem]" fill />
              <Photo photo="entryDoor" sizes="(min-width: 1024px) 34vw, (min-width: 640px) 50vw, 100vw" className="aspect-[4/3] rounded-md lg:hidden" fill imgClassName="object-[50%_60%]" />
            </div>
            <ul className="divide-y divide-line border-y border-line lg:col-span-7">
              {offeredServices.map((s) => (
                <li key={s.id}>
                  <Link
                    href={`/services#${s.id}`}
                    className="group grid gap-2 py-6 sm:grid-cols-[minmax(0,15rem)_1fr_auto] sm:items-baseline sm:gap-8"
                  >
                    <h3 className="text-2xl text-evergreen-900 group-hover:underline group-hover:decoration-gold group-hover:decoration-1 group-hover:underline-offset-4">
                      {s.name}
                    </h3>
                    <p className="text-[0.98rem] text-ink-muted">{s.summary}</p>
                    <span aria-hidden="true" className="hidden text-gold-deep transition-transform group-hover:translate-x-1 sm:block">
                      →
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          {pricing.showRange && (
            <p className="mt-10 max-w-2xl text-ink-muted">
              <strong className="font-semibold text-evergreen-900">{pricing.rangeText}</strong>{" "}
              {pricing.rangeDetail}
            </p>
          )}
        </div>
      </section>

      {/* ───────────── Portfolio preview ───────────── */}
      <section className="py-20 md:py-28" aria-labelledby="gallery-heading">
        <div className="container-site">
          <div className="grid gap-6 md:grid-cols-12 md:items-end">
            <div className="md:col-span-7">
              <p className="eyebrow">The look</p>
              <h2 id="gallery-heading" className="mt-5 text-4xl text-evergreen-900 md:text-5xl">
                Clean lines, warm light, nothing overdone.
              </h2>
            </div>
            <p className="text-ink-muted md:col-span-5">
              A few of the styles we install — crisp roofline outlines, wrapped trees, lit garland
              and entries. Photos of our own New Territory installs will be added here as the
              season gets underway.
            </p>
          </div>

          <div className="mt-12 grid grid-cols-2 gap-3 md:grid-cols-12 md:grid-rows-[repeat(2,minmax(0,15rem))] md:gap-4">
            <Photo photo="porchTree" fill sizes="(min-width: 768px) 50vw, 100vw" className="col-span-2 aspect-[4/3] rounded-md md:col-span-6 md:row-span-2 md:aspect-auto" />
            <Photo photo="wrappedOaks" fill sizes="(min-width: 768px) 25vw, 50vw" className="aspect-square rounded-md md:col-span-3 md:aspect-auto" />
            <Photo photo="victorianDusk" fill sizes="(min-width: 768px) 25vw, 50vw" className="aspect-square rounded-md md:col-span-3 md:row-span-2 md:aspect-auto" />
            <Photo photo="garlandDay" fill sizes="(min-width: 768px) 25vw, 50vw" className="col-span-2 aspect-[16/9] rounded-md md:col-span-3 md:aspect-auto" />
          </div>
          <div className="mt-8">
            <Link href="/gallery" className="link-arrow">
              View the full gallery <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>
      </section>

      {/* ───────────── Process ───────────── */}
      <section id="process" className="on-dark bg-evergreen-900 py-20 text-ivory md:py-28" aria-labelledby="process-heading">
        <div className="container-site">
          <div className="grid gap-6 md:grid-cols-12 md:items-end">
            <div className="md:col-span-7">
              <p className="eyebrow">How it works</p>
              <h2 id="process-heading" className="mt-5 text-4xl md:text-5xl">
                Five steps from first call to the first night lit.
              </h2>
            </div>
            <div className="md:col-span-5 md:text-right">
              <Link href="/process" className="link-arrow">
                The full process <span aria-hidden="true">→</span>
              </Link>
            </div>
          </div>
          <ProcessSteps tone="dark" className="mt-14" />
        </div>
      </section>

      {/* ───────────── Why professional install ───────────── */}
      <section className="py-20 md:py-28" aria-labelledby="why-heading">
        <div className="container-site grid gap-12 lg:grid-cols-12 lg:gap-16">
          <div className="relative lg:col-span-5">
            <Photo photo="rooflineCloseup" fill sizes="(min-width: 1024px) 40vw, 100vw" className="aspect-[4/5] rounded-md" imgClassName="object-[30%_50%]" />
          </div>
          <div className="lg:col-span-7 lg:py-6">
            <p className="eyebrow">Why hire it out</p>
            <h2 id="why-heading" className="mt-5 text-4xl text-evergreen-900 md:text-5xl">
              The difference is in the details you notice from the street.
            </h2>
            <dl className="mt-10 grid gap-x-10 gap-y-8 sm:grid-cols-2">
              {[
                {
                  t: "Your weekends back",
                  d: "No ladders, no hunting for the dead bulb, no spending December untangling strands.",
                },
                {
                  t: "Even, consistent lines",
                  d: "Straight runs, matched spacing and hidden cords are what make a display look designed.",
                },
                {
                  t: "Careful installation",
                  d: "We use clips suited to your roof and gutters — no nails, staples or holes — and plan power so circuits aren't overloaded.",
                },
                {
                  t: "A real person to call",
                  d: "We're a small local crew. You'll talk to the people who actually design and install your lights.",
                },
              ].map((item) => (
                <div key={item.t} className="border-t border-line pt-5">
                  <dt className="font-display text-xl text-evergreen-900">{item.t}</dt>
                  <dd className="mt-2 text-[0.98rem] text-ink-muted">{item.d}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </section>

      {/* ───────────── Service area ───────────── */}
      <section className="border-y border-line bg-paper py-20 md:py-24" aria-labelledby="area-heading">
        <div className="container-site grid gap-12 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-6">
            <p className="eyebrow">Service area</p>
            <h2 id="area-heading" className="mt-5 text-4xl text-evergreen-900 md:text-5xl">
              Local to {serviceAreas[0].name}.
            </h2>
            <p className="mt-6 max-w-lg text-ink-muted">
              We&rsquo;re based in {site.location.city} and focus on a small area so we can install
              on schedule and respond quickly when something needs attention during the season.
            </p>
            <ul className="mt-8 divide-y divide-line border-y border-line">
              {serviceAreas.map((a) => (
                <li key={a.name} className="flex flex-col gap-1 py-4 sm:flex-row sm:items-baseline sm:justify-between">
                  <span className="font-display text-xl text-evergreen-900">
                    {a.name}
                    <span className="ml-2 font-sans text-sm text-ink-muted">{a.city}, {site.location.region}</span>
                  </span>
                  {a.note && <span className="text-sm text-ink-muted">{a.note}</span>}
                </li>
              ))}
            </ul>
          </div>
          <div className="lg:col-span-6">
            <div className="rounded-md border border-line bg-ivory p-7 md:p-9">
              <h3 className="text-2xl text-evergreen-900">Check your address</h3>
              <p className="mt-2 text-[0.98rem] text-ink-muted">
                Enter your ZIP code to see whether you&rsquo;re in our current service area.
              </p>
              <ZipChecker className="mt-6" />
            </div>
          </div>
        </div>
      </section>

      {/* ───────────── Testimonials (only when real reviews exist) ───────────── */}
      {testimonials.length > 0 && (
        <section className="py-20 md:py-28" aria-labelledby="reviews-heading">
          <div className="container-site">
            <p className="eyebrow">From our customers</p>
            <h2 id="reviews-heading" className="mt-5 text-4xl text-evergreen-900 md:text-5xl">
              What neighbors say.
            </h2>
            <div className="mt-12 grid gap-8 md:grid-cols-3">
              {testimonials.map((t) => (
                <figure key={t.name + t.quote.slice(0, 12)} className="border-t border-gold pt-6">
                  <blockquote className="font-display text-xl leading-snug text-evergreen-900">
                    &ldquo;{t.quote}&rdquo;
                  </blockquote>
                  <figcaption className="mt-5 text-sm text-ink-muted">
                    <span className="font-semibold text-charcoal">{t.name}</span>
                    {t.neighborhood && <> · {t.neighborhood}</>}
                    {t.source && <> · {t.source}</>}
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ───────────── FAQ preview ───────────── */}
      <section className="py-20 md:py-28" aria-labelledby="faq-heading">
        <div className="container-site grid gap-12 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-4">
            <p className="eyebrow">Questions</p>
            <h2 id="faq-heading" className="mt-5 text-4xl text-evergreen-900 md:text-5xl">
              Good to know before you call.
            </h2>
            <Link href="/faq" className="link-arrow mt-8">
              Read all FAQs <span aria-hidden="true">→</span>
            </Link>
          </div>
          <div className="lg:col-span-8">
            <FaqList items={previewFaqs} />
          </div>
        </div>
      </section>

      <FinalCta />
    </>
  );
}
