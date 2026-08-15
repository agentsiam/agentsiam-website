/**
 * Turning a place into a route the guest can actually follow.
 *
 * A pin on a map is where something is. What a guest standing in the hallway wants is
 * how to get there from *here*, and "here" is the property they are staying in, whose
 * coordinates we know. So every link below is built as an origin-to-destination route
 * with the travel mode already set, not as a dropped marker they then have to route from
 * themselves.
 *
 * The travel mode matches whichever time the card is showing. Handing someone a driving
 * route under a label that said "6 min walk" is a small lie that gets found out on the
 * pavement.
 *
 * WHY THE APP IS CHOSEN BY DEVICE AND NOT BY US
 *
 * Guests arrive from everywhere. An iPhone user tapping a Google Maps link gets a browser
 * page nagging them to install an app; an Android user tapping an Apple link gets a page
 * that cannot route at all. Neither is a preference we should be expressing on their
 * behalf, so the primary button follows the device and the other app stays one tap away.
 *
 * The sheet's own links are kept as that secondary path, because they point at the exact
 * business Nils chose, including cases where a name is ambiguous or the pin sits in a
 * building with several entrances. Coordinates are the fallback, never the first choice.
 */

export type TravelMode = "walking" | "driving";

export type Point = { lat: number; lng: number };

/** True for iOS, iPadOS and macOS, where Apple Maps is the installed default. */
export function prefersAppleMaps(userAgent: string | undefined = typeof navigator === "undefined" ? undefined : navigator.userAgent): boolean {
  if (!userAgent) return false;
  // iPadOS reports as Macintosh, which is fine: both want Apple Maps.
  return /iPhone|iPad|iPod|Macintosh/i.test(userAgent) && !/Android/i.test(userAgent);
}

/**
 * Google's documented universal URL. Works on the web, and hands off to the installed
 * app on both platforms.
 */
export function googleDirections(from: Point, to: Point, mode: TravelMode): string {
  const params = new URLSearchParams({
    api: "1",
    origin: `${from.lat},${from.lng}`,
    destination: `${to.lat},${to.lng}`,
    travelmode: mode,
  });
  return `https://www.google.com/maps/dir/?${params}`;
}

/**
 * Apple's scheme. `dirflg` takes w for walking and d for driving, and `saddr` must be
 * given explicitly: omitting it means "from wherever the device thinks it is", which is
 * not the same promise as the time shown on the card.
 */
export function appleDirections(from: Point, to: Point, mode: TravelMode): string {
  const params = new URLSearchParams({
    saddr: `${from.lat},${from.lng}`,
    daddr: `${to.lat},${to.lng}`,
    dirflg: mode === "walking" ? "w" : "d",
  });
  return `https://maps.apple.com/?${params}`;
}

/**
 * The pair a card renders: the app the device prefers first, the other one after it.
 * Both are always present, so the choice is never taken away from the guest.
 */
export function directionsFor(
  from: Point,
  to: Point,
  mode: TravelMode,
  userAgent?: string,
): { primary: { href: string; app: "apple" | "google" }; secondary: { href: string; app: "apple" | "google" } } {
  const apple = { href: appleDirections(from, to, mode), app: "apple" as const };
  const google = { href: googleDirections(from, to, mode), app: "google" as const };
  return prefersAppleMaps(userAgent) ? { primary: apple, secondary: google } : { primary: google, secondary: apple };
}
