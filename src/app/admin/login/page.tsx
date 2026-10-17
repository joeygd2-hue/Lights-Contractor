import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import { Wordmark } from "@/components/site/Wordmark";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = { title: "Sign in" };

export default function LoginPage() {
  return (
    <main className="flex min-h-dvh items-center justify-center px-5 py-16">
      <div className="w-full max-w-sm">
        <Wordmark />
        <div className="mt-8 rounded-md border border-line bg-paper p-7 shadow-card">
          <h1 className="text-3xl text-evergreen-900">Owner sign in</h1>
          <Suspense fallback={null}>
            <LoginBody />
          </Suspense>
        </div>
      </div>
    </main>
  );
}

/** Reads env at request time so changing credentials doesn't need a rebuild. */
async function LoginBody() {
  await connection();
  if (process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD_HASH) return <LoginForm />;
  return (
    <p className="mt-4 text-ink-muted">
      The dashboard isn&rsquo;t set up yet. Set <code>ADMIN_EMAIL</code> and{" "}
      <code>ADMIN_PASSWORD_HASH</code> in your environment (see the README), then reload.
    </p>
  );
}
