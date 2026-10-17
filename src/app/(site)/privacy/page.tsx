import type { Metadata } from "next";
import { site } from "@/config/site";
import { LegalPage } from "@/components/site/LegalPage";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: `How ${site.name} collects and uses information submitted through this website.`,
  alternates: { canonical: "/privacy" },
};

// OWNER: This is a plain-language starting point, not legal advice.
// Have it reviewed before launch, and update it if you add analytics or other tools.
export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy policy" updated="October 2026">
      <p>
        This policy explains what information {site.name} (&ldquo;we&rdquo;) collects through this
        website and how we use it.
      </p>
      <h2>What we collect</h2>
      <ul>
        <li>
          Information you give us in our quote, consultation and contact forms — such as your name,
          email, phone number, property address and details about the services you&rsquo;re
          interested in.
        </li>
        <li>
          Limited technical information needed to run the site securely, such as a one-way hashed
          form of your IP address used to prevent spam and abuse. We don&rsquo;t store your raw IP
          address with your request.
        </li>
      </ul>
      <h2>How we use it</h2>
      <ul>
        <li>To respond to your request, prepare quotes and proposals, and schedule consultations and installations.</li>
        <li>To send you confirmations and messages about your request or service.</li>
        <li>To keep the website secure and prevent spam.</li>
      </ul>
      <p>We don&rsquo;t sell your information, and we don&rsquo;t use it for unrelated marketing.</p>
      <h2>Who we share it with</h2>
      <p>
        We use a small number of service providers to operate this website — for example, our
        hosting provider, database provider and email delivery service. They process information
        only on our behalf. We may also disclose information if required by law.
      </p>
      <h2>How long we keep it</h2>
      <p>
        We keep request and customer records for as long as needed to provide our services and for
        reasonable business records. You can ask us to delete your information at any time.
      </p>
      <h2>Your choices</h2>
      <p>
        To access, correct or delete your information, contact us through the{" "}
        <a href="/contact" className="underline underline-offset-4">contact page</a>
        {site.email ? <> or at {site.email}</> : null}.
      </p>
    </LegalPage>
  );
}
