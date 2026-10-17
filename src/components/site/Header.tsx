import Link from "next/link";
import { site, serviceAreaNames } from "@/config/site";
import { ctaBook, ctaQuote, mainNav } from "@/config/nav";
import { Wordmark } from "./Wordmark";
import { MobileNav } from "./MobileNav";
import { NavLink } from "./NavLink";

export function Header() {
  return (
    <header className="sticky top-0 z-40">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-3 focus:z-50 focus:bg-paper focus:px-4 focus:py-2 focus:text-evergreen-900"
      >
        Skip to content
      </a>

      <div className="on-dark hidden bg-evergreen-950 text-[0.82rem] text-ivory/80 md:block">
        <div className="container-site flex h-9 items-center justify-between">
          <p>
            Christmas light installation in{" "}
            <span className="text-ivory">{serviceAreaNames.join(", ")}</span> ·{" "}
            {site.location.city}, {site.location.region}
          </p>
          <div className="flex items-center gap-6">
            {site.phone && site.phoneHref && (
              <a href={`tel:${site.phoneHref}`} className="hover:text-ivory">
                Call or text {site.phone}
              </a>
            )}
            <Link href={ctaBook.href} className="text-gold-soft hover:text-ivory">
              {ctaBook.label} →
            </Link>
          </div>
        </div>
      </div>

      <div className="border-b border-line bg-ivory">
        <div className="container-site flex h-[4.5rem] items-center justify-between gap-6">
          <Link href="/" className="shrink-0" aria-label={`${site.name} — home`}>
            <Wordmark />
          </Link>

          <nav aria-label="Main" className="hidden lg:block">
            <ul className="flex items-center gap-7">
              {mainNav.map((item) => (
                <li key={item.href}>
                  <NavLink href={item.href}>{item.label}</NavLink>
                </li>
              ))}
            </ul>
          </nav>

          <div className="flex items-center gap-3">
            <Link href={ctaQuote.href} className="btn btn-primary hidden sm:inline-flex">
              {ctaQuote.label}
            </Link>
            <MobileNav />
          </div>
        </div>
      </div>
    </header>
  );
}
