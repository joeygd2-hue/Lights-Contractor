"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/leads", label: "Leads" },
  { href: "/admin/bookings", label: "Consultations" },
  { href: "/admin/availability", label: "Availability" },
];

export function AdminNav(props: { static?: boolean }) {
  return props.static ? <NavList path="" /> : <ActiveNav />;
}

function ActiveNav() {
  return <NavList path={usePathname()} />;
}

function NavList({ path }: { path: string }) {
  return (
    <nav aria-label="Dashboard">
      <ul className="flex flex-wrap gap-1">
        {items.map((i) => {
          const active = i.href === "/admin" ? path === "/admin" : path.startsWith(i.href);
          return (
            <li key={i.href}>
              <Link
                href={i.href}
                aria-current={active ? "page" : undefined}
                className={`inline-flex min-h-10 items-center rounded-sm px-3 text-[0.92rem] font-medium ${
                  active ? "bg-evergreen-800 text-ivory" : "text-ink-muted hover:bg-ivory-deep hover:text-charcoal"
                }`}
              >
                {i.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
