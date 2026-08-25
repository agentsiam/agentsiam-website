/**
 * Turning a place into something the guest's map app can open.
 *
 * WHY THESE ARE PIN LINKS AND NOT ROUTES
 *
 * A route needs an origin, and on a public page there is no honest one. The property's
 * exact coordinates are booking-confirmation material, and the neighbourhood centre that
 * stood in for them put the start of the walk 1.4km from the house, on a car park. Both
 * map apps then reverse-geocoded that point and told the guest to set off from an address
 * nobody had ever been to.
 *
 * So nothing here asserts where the guest is. These open the destination; the map app
 * routes from wherever the phone actually is, which is both correct and more useful. The
 * walking and driving times on the card are still measured from the property, and stay
 * true: how far a place is does not depend on where the guest is standing right now.
 *
 * These are only the fallback. A place's own Maps link is preferred wherever it has one,
 * because it opens the business rather than a bare coordinate.
 */

export type Point = { lat: number; lng: number };

/** True for iOS, iPadOS and macOS, where Apple Maps is the installed default. */
export function prefersAppleMaps(userAgent: string | undefined = typeof navigator === "undefined" ? undefined : navigator.userAgent): boolean {
  if (!userAgent) return false;
  // iPadOS reports as Macintosh, which is fine: both want Apple Maps.
  return /iPhone|iPad|iPod|Macintosh/i.test(userAgent) && !/Android/i.test(userAgent);
}

/**
 * Google's documented universal URL. Works on the web and hands off to the installed app.
 *
 * The query is the coordinate pair rather than the name: a name is ambiguous and resolves
 * against the searcher's location, which is how a Chiang Mai rooftop bar ends up being a
 * bar in Cyprus. A coordinate cannot be misread.
 */
export function googlePlace(to: Point): string {
  const params = new URLSearchParams({ api: "1", query: `${to.lat},${to.lng}` });
  return `https://www.google.com/maps/search/?${params}`;
}

/** Apple's scheme. `q` labels the pin, `ll` places it. */
export function applePlace(to: Point, name: string): string {
  const params = new URLSearchParams({ ll: `${to.lat},${to.lng}` });
  if (name) params.set("q", name);
  return `https://maps.apple.com/?${params}`;
}
