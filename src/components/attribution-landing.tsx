"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { keepLanding } from "@/lib/attribution";

/**
 * Keeps the first page of a visit for the owner form's attribution. Renders nothing, and
 * stores nothing while `KEEP_LANDING` in src/lib/attribution.ts is off, which it is until
 * Paul decides it: see that file for why.
 */
export function AttributionLanding() {
  const pathname = usePathname();
  useEffect(() => {
    keepLanding();
  }, [pathname]);
  return null;
}
