import type { MetadataRoute } from "next";
import { ROUTES, absoluteUrl, assetUrl, languageAlternates } from "@/lib/site";
import { PHOTOS } from "@/lib/photos.generated";
import { LOCALES } from "@/i18n/config";

/**
 * Photo sets advertised per route, keyed by the bare English route and naming a set under
 * src/photos/. A route is listed only where the page renders that whole set, so the
 * sitemap describes what a visitor actually sees: /lotushouse renders every lotushouse
 * frame in its gallery, which is the set Google Images has any reason to crawl.
 *
 * The other pages pick a handful of frames each through pickPhotos(), and those frames are
 * already advertised at /lotushouse, so repeating them would name the same image on pages
 * that show two of it. The team portraits are deliberately absent: they are photographs of
 * people, and there is no reason to push them into image search.
 */
const ROUTE_PHOTO_SET: Record<string, string> = {
  "/lotushouse": "lotushouse",
};

/**
 * Absolute URLs for a photo set, in the manifest's running order. Empty when unset.
 *
 * Through assetUrl, because several of these filenames carry spaces and <image:loc> takes
 * an escaped URL. Next writes whatever it is given into the XML unchanged.
 */
function setImages(set: string | undefined): string[] {
  if (!set) return [];
  return (PHOTOS[set] ?? []).map((photo) => assetUrl(photo.src.src));
}

// Routes are declared once in src/lib/site.ts, so adding a page there puts it in the
// sitemap automatically. Pages flagged `placeholder` are left out: they are also set to
// noindex, and a sitemap that advertises a noindex URL is a contradiction crawlers flag.
//
// No lastmod. It was `new Date()` applied to every entry, so each deploy told a crawler
// that all twenty pages had changed at the same instant, which was never true. Google
// discounts a lastmod it cannot trust, and a date nothing stands behind is the one value
// here not derived from a real source. Omitting it says nothing rather than something
// false. If it comes back, it has to come from the commit that last touched the route.
//
// Every route is listed once per locale, and each entry repeats the full hreflang set --
// that is what Google's sitemap spec asks for, and it has to agree with the <link rel>
// tags the pages themselves emit via pageMeta().
export default function sitemap(): MetadataRoute.Sitemap {
  return ROUTES.filter((route) => !route.placeholder).flatMap((route) => {
    const images = setImages(ROUTE_PHOTO_SET[route.path]);
    return LOCALES.map((locale) => ({
      url: absoluteUrl(locale, route.path),
      changeFrequency: route.changeFrequency,
      priority: route.priority,
      alternates: { languages: languageAlternates(route.path) },
      ...(images.length > 0 ? { images } : {}),
    }));
  });
}
