import type { MetadataRoute } from "next";
import { ROUTES, SITE_URL } from "@/lib/site";

// Routes are declared once in src/lib/site.ts, so adding a page there puts it in the
// sitemap automatically. Pages flagged `placeholder` are left out: they are also set to
// noindex, and a sitemap that advertises a noindex URL is a contradiction crawlers flag.
export default function sitemap(): MetadataRoute.Sitemap {
  return ROUTES.filter((route) => !route.placeholder).map((route) => ({
    url: `${SITE_URL}${route.path === "/" ? "" : route.path}`,
    lastModified: new Date(),
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));
}
