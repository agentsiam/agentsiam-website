"use client";

import Link from "next/link";
import type { ComponentProps } from "react";
import { type AnalyticsEvent, trackEvent } from "@/lib/analytics";

/**
 * A link that tells analytics it was clicked, by event name only (see src/lib/analytics.ts
 * for what may and may not be sent). Navigation is untouched: the event fires and the
 * link goes where it was going, and with no consent the event is a silent no-op.
 */
export function TrackedLink({
  event,
  onClick,
  ...props
}: ComponentProps<typeof Link> & { event: AnalyticsEvent }) {
  return (
    <Link
      {...props}
      onClick={(e) => {
        trackEvent(event);
        onClick?.(e);
      }}
    />
  );
}
