import { offeredServices, serviceAreas, site } from "@/config/site";

export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}

/**
 * LocalBusiness structured data. Only verified details are included —
 * phone, email and logo are added automatically once set in config.
 * No street address is published (service-area business).
 */
export function LocalBusinessJsonLd() {
  const sameAs = Object.values(site.social).filter(Boolean);
  const data: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "HomeAndConstructionBusiness",
    "@id": `${site.url}/#business`,
    name: site.name,
    slogan: site.tagline,
    description: site.description,
    url: site.url,
    image: `${site.url}/images/og.jpg`,
    address: {
      "@type": "PostalAddress",
      addressLocality: site.location.city,
      addressRegion: site.location.region,
      addressCountry: "US",
    },
    areaServed: serviceAreas.map((a) => ({
      "@type": "Place",
      name: `${a.name}, ${a.city}, ${site.location.region}`,
    })),
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: "Holiday lighting services",
      itemListElement: offeredServices.map((s) => ({
        "@type": "Offer",
        itemOffered: { "@type": "Service", name: s.name, description: s.summary },
      })),
    },
  };
  if (site.phoneHref) data.telephone = site.phoneHref;
  if (site.email) data.email = site.email;
  if (site.logo) data.logo = `${site.url}${site.logo}`;
  if (sameAs.length) data.sameAs = sameAs;
  return <JsonLd data={data} />;
}
