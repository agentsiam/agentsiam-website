import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Next's generated OG route is not a page; keeping it out of the crawl budget avoids
      // an image URL being indexed as if it were content.
      disallow: ["/opengraph-image"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
