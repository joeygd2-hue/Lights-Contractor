import type { Metadata } from "next";
import { photos, type Photo } from "@/config/site";
import { LegalPage } from "@/components/site/LegalPage";

export const metadata: Metadata = {
  title: "Photo Credits",
  robots: { index: false },
  alternates: { canonical: "/photo-credits" },
};

export default function PhotoCreditsPage() {
  const stock = (Object.values(photos) as Photo[]).filter((p) => p.source === "stock");
  return (
    <LegalPage title="Photo credits" updated="October 2026">
      <p>
        Photos marked &ldquo;Representative photo&rdquo; are licensed stock images that illustrate
        styles of holiday lighting we offer. They are not photos of our own installations. They are
        used under the <a href="https://unsplash.com/license" className="underline underline-offset-4" rel="noopener noreferrer">Unsplash License</a>.
      </p>
      <ul>
        {stock.map((p) => (
          <li key={p.src}>
            {p.alt} — {p.credit}
          </li>
        ))}
      </ul>
    </LegalPage>
  );
}
