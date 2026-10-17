import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { LocalBusinessJsonLd } from "@/components/site/JsonLd";

export default function SiteLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <Header />
      <main id="main" className="flex-1">
        {children}
      </main>
      <Footer />
      <LocalBusinessJsonLd />
    </>
  );
}
