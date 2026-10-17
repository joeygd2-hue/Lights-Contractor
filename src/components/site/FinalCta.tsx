import Link from "next/link";
import { site } from "@/config/site";
import { ctaBook, ctaQuote } from "@/config/nav";
import { Photo } from "./Photo";

export function FinalCta() {
  return (
    <section className="on-dark relative isolate overflow-hidden bg-evergreen-950 text-ivory">
      <Photo
        photo="wrappedOaks"
        fill
        sizes="100vw"
        alt=""
        hideNote
        className="absolute inset-0 -z-10 opacity-35"
      />
      <div className="absolute inset-0 -z-10 bg-gradient-to-r from-evergreen-950 via-evergreen-950/85 to-evergreen-950/40" />
      <div className="container-site py-20 md:py-28">
        <div className="max-w-2xl">
          <p className="eyebrow">{site.season.year} season</p>
          <h2 className="mt-5 text-4xl md:text-6xl">Start planning your lights.</h2>
          <p className="mt-6 max-w-xl text-lg text-ivory/80">
            Tell us a little about your home and we&rsquo;ll put together a design and a clear
            price for the season. Install dates fill in order of approved proposals, so earlier is
            easier to schedule.
          </p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Link href={ctaQuote.href} className="btn btn-gold">
              Get your free quote
            </Link>
            <Link href={ctaBook.href} className="btn btn-outline-light">
              {ctaBook.label}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
