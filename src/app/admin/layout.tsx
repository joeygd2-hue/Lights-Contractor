import type { Metadata } from "next";
import { site } from "@/config/site";

export const metadata: Metadata = {
  title: { default: `Dashboard | ${site.name}`, template: `%s | Dashboard` },
  robots: { index: false, follow: false },
};

export default function AdminRootLayout({ children }: LayoutProps<"/admin">) {
  return <div className="min-h-dvh bg-ivory">{children}</div>;
}
