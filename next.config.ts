import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Pins the workspace root to this project, since a stray package-lock.json in
  // the parent home directory otherwise gets picked up by Turbopack's inference.
  turbopack: {
    root: path.join(__dirname),
  },
};

export default nextConfig;
