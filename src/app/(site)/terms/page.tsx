import type { Metadata } from "next";
import { site } from "@/config/site";
import { LegalPage } from "@/components/site/LegalPage";

export const metadata: Metadata = {
  title: "Terms of Use",
  description: `Terms for using the ${site.name} website.`,
  alternates: { canonical: "/terms" },
};

// OWNER: This covers use of the website only. Your service agreement for installs
// (what's included, payment, damage, cancellations) should be a separate document
// reviewed by a professional.
export default function TermsPage() {
  return (
    <LegalPage title="Terms of use" updated="October 2026">
      <p>
        By using this website you agree to these terms. If you don&rsquo;t agree, please don&rsquo;t use
        the site.
      </p>
      <h2>Information on this site</h2>
      <p>
        We try to keep everything on this site accurate, but descriptions of services, timing and
        any prices shown are general information — not an offer or a binding quote. Your written
        proposal sets out the actual services, price and terms for your home.
      </p>
      <h2>Quotes and bookings</h2>
      <p>
        Submitting a quote request doesn&rsquo;t create an agreement for service. A consultation
        booking is confirmed only when you see a confirmation with a booking reference. We may need
        to reschedule appointments because of weather or other circumstances; we&rsquo;ll contact
        you if that happens.
      </p>
      <h2>Photography</h2>
      <p>
        Some photos on this site are licensed stock images used to illustrate styles we offer. They
        are marked &ldquo;Representative photo&rdquo; and are not photos of our own installations.
      </p>
      <h2>Acceptable use</h2>
      <p>
        Please don&rsquo;t misuse the site — for example by submitting false information, spam or
        attempting to interfere with its operation.
      </p>
      <h2>Contact</h2>
      <p>
        Questions about these terms? <a href="/contact" className="underline underline-offset-4">Contact us</a>.
      </p>
    </LegalPage>
  );
}
