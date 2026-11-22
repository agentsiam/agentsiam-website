import { GUIDE_PLACES } from "./guide.generated";

/**
 * Where a property's guide starts: a public guide place a few minutes from the house, never
 * the house itself. Every route, walking time and driving time a guest sees is measured from
 * here, on the guide, the property page and the homepage.
 *
 * Paul, 08/11/2026: neither a guest nor a bot should be able to pin down where a house is.
 * Times measured from the door, printed beside each place's exact coordinate, can be worked
 * back to the door, so nothing public is measured from it. The exact address and how to
 * find the door stay in the booking confirmation.
 *
 * Keyed by `unitKey()` in src/lib/property.ts: the Beds24 property ID once Beds24 has the
 * house, its URL slug until then (decision 110). The value is a `GuidePlace.name`.
 * scripts/build-guide.mjs reads this object to route from it, so keep one
 * `"key": "Place name",` per line.
 */
export const GUIDE_START: Record<string, string> = {
  "275645": "7 Eleven",
  cosmoshouse: "7 Eleven",
};

export type GuideStart = { name: string; lat: number; lng: number };

/** The start point for a property, by its `unitKey()`, or null when it has none and so no
 * public times. */
export function guideStart(key: string): GuideStart | null {
  const name = GUIDE_START[key];
  const place = name ? GUIDE_PLACES.find((p) => p.name === name) : undefined;
  return place ? { name: place.name, lat: place.lat, lng: place.lng } : null;
}

/** How a start point is named to a guest, where the guide row's own name reads badly. */
const START_LABELS: Record<string, string> = { "7 Eleven": "7-Eleven" };

export function guideStartLabel(name: string): string {
  return START_LABELS[name] ?? name;
}
