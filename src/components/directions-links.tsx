"use client";

import { useSyncExternalStore } from "react";
import type { Dictionary } from "@/i18n";
import { prefersAppleMaps } from "@/lib/directions";

/**
 * The two ways out of a card, ordered by what the guest is holding.
 *
 * The hrefs are the place's own Maps links, passed in by the caller. They open the business
 * itself, so the guest gets its hours, its photos and a Directions button that starts from
 * where they are actually standing. `directions.ts` builds a route from coordinates as the
 * fallback for a place with no link of its own.
 *
 * Both links are rendered on the server so the page works with no JavaScript and a crawler
 * sees them. The only thing that happens on the client is the *order*: an iPhone user
 * tapping a Google Maps link gets a page nagging them to install an app, and an Android
 * user tapping an Apple link gets one that cannot route at all. Neither is a preference we
 * should express for them.
 *
 * Server-side detection was the alternative and is worse here: reading the user-agent
 * header opts the whole page out of static rendering, which is a real cost for a page that
 * is otherwise entirely static, in exchange for reordering two links.
 *
 * Google renders first before hydration because it is the safer default: it works on every
 * platform, where Apple Maps links do not.
 */
export function DirectionsLinks({
  google,
  apple,
  t,
}: {
  google: string;
  apple: string;
  t: Dictionary;
}) {
  // Which maps app the device prefers is external state that never changes, so it is read
  // rather than stored. useSyncExternalStore gives React a server value (false) and a
  // client value, which is exactly the hydration-safe shape; setState in an effect would
  // render once, then immediately render again.
  const preferApple = useSyncExternalStore(
    () => () => {},
    () => prefersAppleMaps(),
    () => false,
  );

  const links = [
    { href: google, label: t.guideDirectionsGoogle, key: "google" },
    { href: apple, label: t.guideDirectionsApple, key: "apple" },
  ];
  if (preferApple) links.reverse();

  return (
    <span className="flex flex-wrap items-center gap-2">
      {links.map((link, i) => (
        <a
          key={link.key}
          href={link.href}
          target="_blank"
          rel="noreferrer"
          className={
            i === 0
              ? "rounded-full bg-ink px-3 py-1.5 text-[12px] font-semibold text-bg transition-opacity hover:opacity-85"
              : "rounded-full border border-hairline px-3 py-1.5 text-[12px] font-semibold transition-colors hover:border-ink"
          }
        >
          {i === 0 ? t.guideOpenIn.replace("{app}", link.label) : link.label}
        </a>
      ))}
    </span>
  );
}
