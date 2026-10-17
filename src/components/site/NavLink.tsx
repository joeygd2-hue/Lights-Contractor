"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  const pathname = usePathname();
  const active = pathname === href || pathname.startsWith(`${href}/`);
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`relative py-2 text-[0.95rem] font-medium transition-colors hover:text-evergreen-900 ${
        active
          ? "text-evergreen-900 after:absolute after:inset-x-0 after:-bottom-0.5 after:h-px after:bg-gold"
          : "text-ink-muted"
      }`}
    >
      {children}
    </Link>
  );
}
