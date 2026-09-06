/**
 * The handful of places a guest measures a house against before booking.
 *
 * Every figure on the property page's "Getting around" block resolves to a field, per the
 * guest-copy rule that two facts never make a third: these are real rows in
 * `guide.generated.ts`, and the minutes are `GUIDE_DISTANCES[property][place]`, routed per
 * property by `scripts/build-guide.mjs`. Nothing here is measured, estimated or rounded in
 * this file. If a name below stops matching a row in the sheet, the anchor drops off the
 * page rather than rendering a blank, which is the failure mode worth having.
 *
 * The six were picked to answer six different questions, not to be the six nearest:
 * where do I buy milk, where is the local market, where is the famous night market, where
 * is the Sunday street, where is the Old City, and how far is the airport. Adding a
 * seventh that answers a question already answered makes the block longer and no more
 * useful.
 *
 * `label` is a dictionary key rather than the row's own name, because the rows carry the
 * business's full registered name ("Baggage storage, AIRPORTELs (airport terminal)") which
 * is right in a directory of 109 places and wrong in a six-line orientation list. The
 * place is still the place; only the words above it are shorter.
 */

export type Anchor = {
  /** Exact `GuidePlace.name`, which is also the key into GUIDE_DISTANCES. */
  place: string;
  /** Dictionary key for the short label shown to the reader. */
  label: string;
  /** Icon name from src/components/icon.tsx. */
  icon: string;
};

export const ORIENTATION_ANCHORS: Anchor[] = [
  { place: "7 Eleven", label: "anchorShop", icon: "kitchen" },
  { place: "Kad Kom Market", label: "anchorMarket", icon: "globe" },
  {
    place: "Chiang Mai Night Bazar & Kalare Night Bazaar",
    label: "anchorNightBazaar",
    icon: "tag",
  },
  { place: "Sunday Night Market", label: "anchorWalkingStreet", icon: "walk" },
  { place: "Wat Phra Singh Woramahawihan", label: "anchorOldCity", icon: "pin" },
  {
    place: "Baggage storage, AIRPORTELs (airport terminal)",
    label: "anchorAirport",
    icon: "transfer",
  },
];

/**
 * Amenity to glyph. Only the features a property actually declares are drawn, so a key
 * with no entry here renders its label without an icon rather than a hole in the grid.
 */
export const FEATURE_ICONS: Record<string, string> = {
  rooftop: "terrace",
  kitchen: "kitchen",
  wifi: "wifi",
  "smart-tv": "screen",
  parking: "parking",
  safe: "safe",
  "soaking-tub": "bath",
  pool: "bath",
  workspace: "screen",
  washer: "broom",
  "pet-friendly": "house",
};
