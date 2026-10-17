import type { Metadata } from "next";
import Link from "next/link";
import { serviceAreas, site } from "@/config/site";
import { BookingFlow } from "@/components/forms/BookingFlow";

export const metadata: Metadata = {
  title: "Book a Free Consultation",
  description: `Book a free phone consultation or on-site walkthrough for Christmas light installation in ${serviceAreas[0].name}, ${site.location.city}, TX.`,
  alternates: { canonical: "/book" },
};

export default function BookPage() {
  return (
    <>
      <section className="border-b border-line">
        <div className="container-site py-12 md:py-16">
          <p className="eyebrow">Free consultation</p>
          <h1 className="mt-5 max-w-3xl text-[2.6rem] font-medium text-evergreen-900 sm:text-5xl">
            Pick a time to talk lights.
          </h1>
          <p className="mt-5 max-w-2xl text-lg text-ink-muted">
            Choose a quick phone call or an on-site walkthrough of your home. It&rsquo;s free and
            there&rsquo;s no obligation. Prefer to send details first?{" "}
            <Link href="/quote" className="font-semibold text-evergreen-800 underline decoration-gold underline-offset-4">
              Request a quote instead
            </Link>
            .
          </p>
        </div>
      </section>
      <section className="py-10 md:py-16">
        <div className="container-site">
          <BookingFlow />
        </div>
      </section>
    </>
  );
}
