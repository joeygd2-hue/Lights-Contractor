import Link from "next/link";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";

export default function NotFound() {
  return (
    <>
    <Header />
    <main id="main" className="flex-1">
    <section className="container-site py-24 md:py-32">
      <p className="eyebrow">Page not found</p>
      <h1 className="mt-5 max-w-2xl text-5xl text-evergreen-900">This page has gone dark.</h1>
      <p className="mt-5 max-w-lg text-lg text-ink-muted">
        The page you were looking for doesn&rsquo;t exist or has moved.
      </p>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Link href="/" className="btn btn-primary">Back to the homepage</Link>
        <Link href="/quote" className="btn btn-outline">Get a free quote</Link>
      </div>
    </section>
    </main>
    <Footer />
    </>
  );
}
