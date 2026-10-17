"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ctaBook, ctaQuote, mainNav } from "@/config/nav";
import { site } from "@/config/site";

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const panelRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Close whenever the route changes.
  const [lastPath, setLastPath] = useState(pathname);
  if (pathname !== lastPath) {
    setLastPath(pathname);
    setOpen(false);
  }

  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const first = panelRef.current?.querySelector<HTMLElement>("a, button");
    first?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
      if (e.key === "Tab" && panelRef.current) {
        const focusables = panelRef.current.querySelectorAll<HTMLElement>("a, button");
        const firstEl = focusables[0];
        const lastEl = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === firstEl) {
          e.preventDefault();
          lastEl.focus();
        } else if (!e.shiftKey && document.activeElement === lastEl) {
          e.preventDefault();
          firstEl.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="lg:hidden">
      <button
        ref={buttonRef}
        type="button"
        className="flex h-12 w-12 items-center justify-center rounded-sm text-evergreen-900 hover:bg-ivory-deep"
        aria-expanded={open}
        aria-controls="mobile-menu"
        onClick={() => setOpen((o) => !o)}
      >
        <span className="sr-only">{open ? "Close menu" : "Open menu"}</span>
        <svg aria-hidden="true" viewBox="0 0 24 24" className="h-6 w-6" fill="none">
          {open ? (
            <path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeWidth="1.6" />
          ) : (
            <path d="M3 7h18M3 12h18M3 17h18" stroke="currentColor" strokeWidth="1.6" />
          )}
        </svg>
      </button>

      {open && (
        <div
          id="mobile-menu"
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-label="Site menu"
          className="fixed inset-x-0 bottom-0 top-[4.5rem] z-40 overflow-y-auto border-t border-line bg-ivory"
        >
          <nav aria-label="Mobile" className="container-site py-6">
            <ul className="divide-y divide-line border-y border-line">
              <li>
                <Link href="/" className="flex min-h-14 items-center font-display text-2xl text-evergreen-900">
                  Home
                </Link>
              </li>
              {mainNav.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={pathname === item.href ? "page" : undefined}
                    className="flex min-h-14 items-center justify-between font-display text-2xl text-evergreen-900"
                  >
                    {item.label}
                    <span aria-hidden="true" className="text-base text-gold-deep">→</span>
                  </Link>
                </li>
              ))}
            </ul>
            <div className="mt-8 grid gap-3">
              <Link href={ctaQuote.href} className="btn btn-primary w-full">
                {ctaQuote.label}
              </Link>
              <Link href={ctaBook.href} className="btn btn-outline w-full">
                {ctaBook.label}
              </Link>
              {site.phone && site.phoneHref && (
                <a href={`tel:${site.phoneHref}`} className="btn btn-outline w-full">
                  Call {site.phone}
                </a>
              )}
            </div>
          </nav>
        </div>
      )}
    </div>
  );
}
