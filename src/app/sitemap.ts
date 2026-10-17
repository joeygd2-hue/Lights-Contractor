import type { MetadataRoute } from "next";
import { site } from "@/config/site";

const routes = ["", "/services", "/process", "/gallery", "/about", "/faq", "/contact", "/quote", "/book", "/privacy", "/terms"];

export default function sitemap(): MetadataRoute.Sitemap {
  return routes.map((path) => ({
    url: `${site.url}${path}`,
    changeFrequency: "monthly",
    priority: path === "" ? 1 : ["/quote", "/services"].includes(path) ? 0.9 : 0.6,
  }));
}
