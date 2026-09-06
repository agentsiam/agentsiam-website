"use client";

import { useSyncExternalStore } from "react";
import type { Dictionary } from "@/i18n";
import { appleDirections, googleDirections, prefersAppleMaps, type Point, type TravelMode } from "@/lib/directions";

/**
 * The two ways out of a card, ordered by what the guest is holding.
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
  from,
  to,
  mode,
  t,
  /**
   * Where the link goes, for the accessible name.
   *
   * The visible label stays "Apple Maps" because it sits beside the place it belongs to and
   * a longer one would wrap the row. A screen reader's link list has no such context: on the
   * local guide it was 109 entries reading "Apple Maps" and 109 reading "Directions · Google
   * Maps", in a list whose only job is to let someone pick one.
   *
   * Optional, because call sites outside this workstream cannot pass it yet. Without it the
   * links render exactly as they did before, unnamed but unbroken.
   */
  place,
}: {
  from: Point;
  to: Point;
  mode: TravelMode;
  t: Dictionary;
  place?: string;
}) {
  // Which maps app the device prefers is external state that never changes, so it is read
  // rather than stored. useSyncExternalStore gives React a server value (false) and a
  // client value, which is exactly the hydration-safe shape; setState in an effect would
  // render once, then immediately render again.
  const apple = useSyncExternalStore(
    () => () => {},
    () => prefersAppleMaps(),
    () => false,
  );

  const links = [
    { href: googleDirections(from, to, mode), label: t.guideDirectionsGoogle, key: "google" },
    { href: appleDirections(from, to, mode), label: t.guideDirectionsApple, key: "apple" },
  ];
  if (apple) links.reverse();

  return (
    <span className="flex flex-wrap items-center gap-2">
      {links.map((link, i) => (
        <a
          key={link.key}
          href={link.href}
          target="_blank"
          rel="noreferrer"
          // The new tab is announced here rather than printed. Both links open one, so a
          // visible marker on every one of them would be 218 pieces of the same notice on
          // the guide, and the people it is a warning for are the ones this reaches.
          aria-label={
            place
              ? `${t.directionsTo.replace("{app}", link.label).replace("{place}", place)}, ${t.newTab}`
              : undefined
          }
          className={
            i === 0
              ? "inline-flex min-h-9 items-center rounded-full bg-ink px-3.5 py-1.5 text-[12px] font-semibold text-bg transition-opacity hover:opacity-85"
              : "inline-flex min-h-9 items-center rounded-full border border-hairline px-3.5 py-1.5 text-[12px] font-semibold transition-colors hover:border-ink"
          }
        >
          {i === 0 ? `${t.guideDirections} · ${link.label}` : link.label}
        </a>
      ))}
    </span>
  );
}
