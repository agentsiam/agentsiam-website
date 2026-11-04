import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Nothing is disallowed, and /opengraph-image in particular must not be. It is the
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
