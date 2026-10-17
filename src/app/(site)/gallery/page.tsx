import type { Metadata } from "next";
import Link from "next/link";
import { galleryCategories, galleryOrder, photos } from "@/config/site";
import { ctaQuote } from "@/config/nav";
import { Gallery } from "@/components/site/Gallery";
import { FinalCta } from "@/components/site/FinalCta";

export const metadata: Metadata = {
  title: "Gallery",
  description:
    "Roofline outlines, wrapped trees, wreaths, garland and lit entryways — the styles of Christmas lighting we install in Sugar Land, TX.",
  alternates: { canonical: "/gallery" },
};

export default function GalleryPage() {
  const items = galleryOrder.map((key) => ({ key, ...photos[key] }));
  const hasStock = items.some((i) => i.source === "stock");

  return (
    <>
      <section className="border-b border-line">
        <div className="container-site py-14 md:py-20">
          <p className="eyebrow">Gallery</p>
          <div className="mt-5 grid gap-8 lg:grid-cols-12 lg:items-end">
            <h1 className="text-[2.6rem] font-medium text-evergreen-900 sm:text-5xl lg:col-span-7 lg:text-[3.6rem]">
              Styles we install.
            </h1>
            <div className="text-ink-muted lg:col-span-5">
              <p>
                Browse by roofline, entry, trees or greenery to find the look you like, then mention
                it in your quote request.
              </p>
              {hasStock && (
                <p className="mt-3 text-sm">
                  Photos marked &ldquo;Representative photo&rdquo; are licensed stock images that show
                  the styles we offer — they aren&rsquo;t our installs. We&rsquo;ll replace them with
                  our own New Territory projects this season.
                </p>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="py-12 md:py-16">
        <div className="container-site">
          <Gallery items={items} categories={galleryCategories} />
          <div className="mt-12 flex flex-col items-start gap-4 border-t border-line pt-10 md:flex-row md:items-center md:justify-between">
            <p className="font-display text-2xl text-evergreen-900">Seen a look you like?</p>
            <Link href={ctaQuote.href} className="btn btn-primary">
              Tell us about your home
            </Link>
          </div>
        </div>
      </section>

      <FinalCta />
    </>
  );
}
