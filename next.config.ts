import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  images: {
    // AVIF ahead of WebP. Without this block `formats` defaults to WebP only, and the
    // optimizer was answering an AVIF-only Accept header with a JPEG. AVIF is 20 to 30%
    // smaller than WebP at the same quality on these photographs, and every browser that
    // matters has supported it for years; a browser that does not simply gets the WebP
    // that was being served before.
    formats: ["image/avif", "image/webp"],
  },
  // Pins the workspace root to this project, since a stray package-lock.json in
  // the parent home directory otherwise gets picked up by Turbopack's inference.
  turbopack: {
    root: path.join(__dirname),
  },
  async headers() {
    return [
      {
        // The cleaning team's door codes, which are the one thing in that app worth
        // stealing. **This is the path they actually travel on since 17/11/2026**, when
        // the codes stopped being a page and became an answer the schedule asks for: the
        // page they appear on is saved by the service worker with no deadline, and a code
        // in that copy would still be there next week.
        //
        // It used to say /cleaning/codes, and for a few hours after that page was deleted
        // it was guarding a URL that 404s, which is the shape of a protection nobody
        // notices has stopped working. Two mechanisms keep a code off every disk between
        // the store and her eyes and neither depends on the other: this, and the same
        // header set by the route itself. The service worker keeping it only until the end
        // of the day is a third.
        source: "/api/cleaning/codes",
        headers: [{ key: "Cache-Control", value: "no-store, must-revalidate" }],
      },
      {
        // A service worker a browser holds for a day is a day of the app not updating.
        source: "/cleaning-sw.js",
        headers: [
          { key: "Cache-Control", value: "no-cache" },
          { key: "Content-Type", value: "application/javascript; charset=utf-8" },
        ],
      },
    ];
  },
  async redirects() {
    return [
      // The design folds the company story into /how-it-works and drops /about. The old
      // page was a noindex stub, but the URL was linkable, so it keeps a permanent
      // redirect rather than turning into a 404. Same for the Thai and Chinese paths,
      // which never shipped but would otherwise 404 asymmetrically.
      { source: "/about", destination: "/how-it-works", permanent: true },
      { source: "/:locale(th|zh)/about", destination: "/:locale/how-it-works", permanent: true },

      // Riverside was renamed Wat Ket, the name of the old quarter on that bank of the Ping.
      // The old area URL was published, so it redirects rather than 404s.
      { source: "/destinations/riverside", destination: "/destinations/wat-ket", permanent: true },
      { source: "/:locale(th|zh)/destinations/riverside", destination: "/:locale/destinations/wat-ket", permanent: true },

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
    ];
  },
};

export default nextConfig;
