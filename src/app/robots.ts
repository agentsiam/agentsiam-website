import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // The renter shortlist admin is the one disallowed path. Worth being plain about what
      // this line does and does not do: it publishes the fact that /admin exists, and a
      // crawler that ignores robots.txt ignores it here too. What actually keeps the admin
      // shut is the session check in src/proxy.ts and in every admin page and route; this
      // line only keeps a well-behaved crawler from wasting its time on a sign-in form, and
      // keeps the URL out of a search result. The pages are noindex as well.
      disallow: ["/admin", "/api/admin"],
      // Nothing else is disallowed, and /opengraph-image in particular must not be. It is the
      // og:image URL of nearly every page, and link-preview crawlers (Facebook's and X's
      // report honouring robots.txt) are told by a Disallow that they may not fetch it,
      // which would blank the preview of any link pasted into a group. The old reason, crawl
      // budget, did not hold: an image URL is not indexed as a page, and every per-route
      // card was already crawlable.
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
