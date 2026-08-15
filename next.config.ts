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
    ];
  },
};

export default nextConfig;
