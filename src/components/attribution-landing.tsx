"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { keepLanding } from "@/lib/attribution";

/**
 * Keeps the first page of a visit for the owner form's attribution. Renders nothing. What it
 * stores, when, and why it is admitted: src/lib/attribution.ts.
 */
export function AttributionLanding() {
  const pathname = usePathname();
  useEffect(() => {
    keepLanding();
  }, [pathname]);
  return null;
}
