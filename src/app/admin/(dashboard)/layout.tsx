import Link from "next/link";
import { Suspense } from "react";
import { Wordmark } from "@/components/site/Wordmark";
import { AdminNav } from "@/components/admin/AdminNav";
import { logout } from "../actions";

export default function DashboardLayout({ children }: LayoutProps<"/admin">) {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="border-b border-line bg-paper">
        <div className="container-site flex min-h-16 flex-wrap items-center justify-between gap-4 py-3">
          <div className="flex items-center gap-6">
            <Link href="/admin" aria-label="Dashboard home">
              <Wordmark />
            </Link>
            <Suspense fallback={<AdminNav static />}>
              <AdminNav />
            </Suspense>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <Link href="/" className="text-ink-muted hover:text-charcoal">View site</Link>
            <form action={logout}>
              <button type="submit" className="btn btn-outline min-h-10 py-2 text-sm">Sign out</button>
            </form>
          </div>
        </div>
      </header>
      <main className="container-site flex-1 py-10">{children}</main>
    </div>
  );
}
