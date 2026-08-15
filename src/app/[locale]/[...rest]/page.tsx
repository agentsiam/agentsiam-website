import type { Metadata } from "next";
import { notFound } from "next/navigation";

/**
 * Catch-all that exists only to 404 properly.
 *
 * Without it, an unmatched URL never reaches this segment: Next serves its own bare
 * `/_not-found` page, so a visitor who mistypes a Thai URL gets an unstyled English "404 —
 * This page could not be found" with no header, no footer and no way back. Static segments
 * win over a catch-all in the app router, so every real route is unaffected; anything left
 * over lands here, calls notFound(), and renders [locale]/not-found.tsx inside the normal
 * layout, in the right language, with a 404 status.
 */

export const metadata: Metadata = {
  title: "Page not found",
  // A 404 should never be indexed, and should never be the canonical for a real URL.
  robots: { index: false, follow: false },
};

export default function CatchAllNotFound(): never {
  notFound();
}
