import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Pins the workspace root to this project, since a stray package-lock.json in
  // the parent home directory otherwise gets picked up by Turbopack's inference.
  turbopack: {
    root: path.join(__dirname),
  },
  async redirects() {
    return [
      // The design folds the company story into /how-it-works and drops /about. The old
      // page was a noindex stub, but the URL was linkable, so it keeps a permanent
      // redirect rather than turning into a 404. Same for the Thai and Chinese paths,
      // which never shipped but would otherwise 404 asymmetrically.
      { source: "/about", destination: "/how-it-works", permanent: true },
      { source: "/:locale(th|zh)/about", destination: "/:locale/how-it-works", permanent: true },

      // Everything below is a URL the Wix site had indexed, taken from its own
      // pages-sitemap.xml on 15/08/2026 rather than from memory. That sitemap stops
      // existing when the Wix plan lapses on 04/09, so this list is the only record.
      //
      // Wix published 12 URLs. Five need nothing, because /, /contact, /lotushouse,
      // /privacy-policy and /terms-and-conditions keep their paths on the new site.
      // /about is handled above. The remaining six are below.
      //
      // The five service pages all land on /business-services, which is the single page
      // that replaced them. /services was the hub listing the other four, so it is the
      // closest match of the set, not a fallback.
      { source: "/services", destination: "/business-services", permanent: true },
      { source: "/business-consulting", destination: "/business-services", permanent: true },
      { source: "/oem", destination: "/business-services", permanent: true },
      { source: "/ecommerce", destination: "/business-services", permanent: true },
      { source: "/growth", destination: "/business-services", permanent: true },

      // A guest-facing list of places the host had personally visited near Lotus House.
      // The nearest honest equivalent is the neighbourhood the property is actually in,
      // not the property page and not a generic index, so it goes to Chang Khlan. If
      // that area slug ever changes in src/lib/areas.ts, change it here too.
      {
        source: "/lotushouse/local-guide",
        destination: "/destinations/chang-khlan",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
