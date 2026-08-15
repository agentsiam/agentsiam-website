import type { MetadataRoute } from "next";
import { ROUTES, absoluteUrl, languageAlternates } from "@/lib/site";
import { LOCALES } from "@/i18n/config";

// Routes are declared once in src/lib/site.ts, so adding a page there puts it in the
// sitemap automatically. Pages flagged `placeholder` are left out: they are also set to
// noindex, and a sitemap that advertises a noindex URL is a contradiction crawlers flag.
//
// Every route is listed once per locale, and each entry repeats the full hreflang set --
// that is what Google's sitemap spec asks for, and it has to agree with the <link rel>
// tags the pages themselves emit via pageMeta().
export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return ROUTES.filter((route) => !route.placeholder).flatMap((route) =>
    LOCALES.map((locale) => ({
      url: absoluteUrl(locale, route.path),
      lastModified,
      changeFrequency: route.changeFrequency,
      priority: route.priority,
      alternates: { languages: languageAlternates(route.path) },
    })),
  );
}
