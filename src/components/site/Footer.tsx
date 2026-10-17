import Link from "next/link";
import { cacheLife } from "next/cache";
import { offeredServices, serviceAreas, site } from "@/config/site";
import { ctaBook, ctaQuote, mainNav } from "@/config/nav";
import { Wordmark } from "./Wordmark";

async function CopyrightYear() {
  "use cache";
  cacheLife("days");
  return <>{new Date().getFullYear()}</>;
}

export function Footer() {
  const socials = Object.entries(site.social).filter(([, url]) => Boolean(url)) as [string, string][];

  return (
    <footer className="on-dark mt-auto border-t border-line-dark bg-evergreen-950 text-ivory/75">
      <div className="container-site grid gap-12 py-16 md:grid-cols-12">
        <div className="md:col-span-4">
          <Wordmark tone="light" />
          <p className="mt-5 max-w-xs font-display text-xl text-ivory">{site.tagline}</p>
          <p className="mt-4 max-w-sm text-[0.95rem]">
            A small local crew installing, maintaining and taking down holiday lighting for homes
            in {site.location.city}, {site.location.regionName}.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href={ctaQuote.href} className="btn btn-gold">
              {ctaQuote.label}
            </Link>
          </div>
        </div>

        <nav aria-label="Footer" className="grid grid-cols-2 gap-8 md:col-span-5 md:grid-cols-2">
          <div>
            <h2 className="font-sans text-xs font-semibold uppercase tracking-[0.18em] text-gold-soft">
              Company
            </h2>
            <ul className="mt-4 space-y-2.5 text-[0.95rem]">
              {mainNav.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="hover:text-ivory">
                    {item.label}
                  </Link>
                </li>
              ))}
              <li>
                <Link href={ctaBook.href} className="hover:text-ivory">
                  {ctaBook.label}
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h2 className="font-sans text-xs font-semibold uppercase tracking-[0.18em] text-gold-soft">
              Services
            </h2>
            <ul className="mt-4 space-y-2.5 text-[0.95rem]">
              {offeredServices.map((s) => (
                <li key={s.id}>
                  <Link href={`/services#${s.id}`} className="hover:text-ivory">
                    {s.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </nav>

        <div className="md:col-span-3">
          <h2 className="font-sans text-xs font-semibold uppercase tracking-[0.18em] text-gold-soft">
            Get in touch
          </h2>
          <ul className="mt-4 space-y-2.5 text-[0.95rem]">
            {site.phone && site.phoneHref && (
              <li>
                <a href={`tel:${site.phoneHref}`} className="hover:text-ivory">
                  {site.phone}
                </a>
              </li>
            )}
            {site.email && (
              <li>
                <a href={`mailto:${site.email}`} className="break-all hover:text-ivory">
                  {site.email}
                </a>
              </li>
            )}
            <li>
              <Link href="/contact" className="hover:text-ivory">
                Send us a message
              </Link>
            </li>
          </ul>

          <h2 className="mt-8 font-sans text-xs font-semibold uppercase tracking-[0.18em] text-gold-soft">
            Service area
          </h2>
          <p className="mt-4 text-[0.95rem]">
            {serviceAreas.map((a) => a.name).join(", ")} · {site.location.city},{" "}
            {site.location.region}
          </p>

          {site.hours && (
            <>
              <h2 className="mt-8 font-sans text-xs font-semibold uppercase tracking-[0.18em] text-gold-soft">
                Hours
              </h2>
              <dl className="mt-4 space-y-1 text-[0.95rem]">
                {site.hours.map((h) => (
                  <div key={h.days} className="flex gap-3">
                    <dt className="text-ivory">{h.days}</dt>
                    <dd>{h.hours}</dd>
                  </div>
                ))}
              </dl>
            </>
          )}

          {socials.length > 0 && (
            <ul className="mt-8 flex flex-wrap gap-4 text-[0.95rem]">
              {socials.map(([name, url]) => (
                <li key={name}>
                  <a href={url} className="capitalize hover:text-ivory" rel="noopener noreferrer" target="_blank">
                    {name}
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="border-t border-line-dark">
        <div className="container-site flex flex-col gap-3 py-6 text-[0.85rem] text-ivory/60 md:flex-row md:items-center md:justify-between">
          <p>
            © <CopyrightYear /> {site.name}. All rights reserved.
          </p>
          <ul className="flex flex-wrap gap-x-6 gap-y-2">
            <li>
              <Link href="/privacy" className="hover:text-ivory">
                Privacy policy
              </Link>
            </li>
            <li>
              <Link href="/terms" className="hover:text-ivory">
                Terms
              </Link>
            </li>
            <li>
              <Link href="/photo-credits" className="hover:text-ivory">
                Photo credits
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </footer>
  );
}
