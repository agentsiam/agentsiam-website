/**
 * The properties AgentSiam manages, as one source.
 *
 * The design handoff insists the host and review data behind the homepage rail and the
 * property page come from a single source so the two cannot drift apart. This is that
 * source. It ships with real data for the one property that exists; the handoff's 50
 * Chiang Mai listings are invented and are deliberately not imported -- the design's whole
 * argument is that nothing on the site is a claim a reader could not check.
 *
 * Nothing here is a rating, a price or a photograph, because none of those exist yet as
 * verified data. Add them when they do, rather than filling the shape.
 */

import { AREAS, type Area } from "@/lib/areas";
import type { Dictionary } from "@/i18n";

export type Property = {
  slug: string;
  title: string;
  /** Area slug, resolved against src/lib/areas.ts. One spelling of a neighbourhood. */
  areaSlug: string;
  /**
   * Which city, so search can filter without guessing from the address. Only Chiang Mai
   * is live; see CITIES.
   */
  citySlug: string;
  /** Where the pin goes, and what the distance-to-centre badge is measured from. */
  lat: number;
  lng: number;
  /**
   * Property type, from the handoff's filter vocabulary: apartment, townhouse, house or
   * villa. English is the key, so filtering stays language-independent.
   */
  type: "apartment" | "townhouse" | "house" | "villa";
  bedrooms: number;
  bathrooms: number;
  /**
   * Nightly rate floor, for the "from ฿x" on a tile. A guide only: the real number for a
   * real stay comes from Beds24 via /api/booking/quote, and nothing here is ever shown as
   * a total.
   */
  fromPrice: number | null;
  /** Filterable amenities, English keys for the same reason as `type`. */
  features: string[];
  /**
   * Beds24's own identifiers for this property. Not secrets -- the property ID is in the
   * public booking-page URL -- so they live here with the rest of the property's facts
   * rather than in an env var. The refresh token is the secret, and that is the only
   * Beds24 value that is one.
   */
  beds24: { propertyId: number; roomId: number };
  /** ISO 4217, as configured on the Beds24 property. Prices are quoted in it. */
  currency: string;
  /** Occupancy and stay rules, mirroring the Beds24 room so the UI can validate early. */
  maxGuests: number;
  minStay: number;
  /**
   * Longest stay bookable online. Not a limit on what we will accept: longer stays are
   * priced by hand and go through enquiry, and this is what stops one request from
   * holding a year of nights.
   */
  maxStay: number;
  /** Tailwind background class for the tile fill. Solid brand colour, not a photo. */
  fill: string;
  /** Text colour that meets contrast on `fill`. */
  onFill: string;
  /**
   * The facts strip. Labels are dictionary keys and so are the values that are words
   * rather than numbers, because until 06/09/2026 both were English literals here and
   * rendered "Guests / Bedrooms / Beds / 2 king" on /th and /zh, on two pages.
   */
  facts: { labelKey: keyof Dictionary; value?: string; valueKey?: keyof Dictionary }[];
  /** Dictionary keys, one per paragraph. Same reason as `facts`. */
  descriptionKeys: (keyof Dictionary)[];
  /** Dictionary key for the one-line pitch under the title. */
  taglineKey: keyof Dictionary;
  address: string;
  checkIn: string;
  checkOut: string;
  /** Dictionary keys. These sit in the same list as the localised safety line, so an
   *  English literal here rendered the list half Thai and half English. */
  houseRuleKeys: (keyof Dictionary)[];
  /**
   * A guest's own words, in the language they wrote them. Deliberately NOT a dictionary
   * key: a review translated is no longer the review, and a quote a reader cannot trace
   * to a platform is worth nothing. It carries `lang` at the point of use instead.
   */
  reviews: { quote: string; lang: string; source: string }[];
};

export const LOTUS_HOUSE: Property = {
  slug: "lotushouse",
  title: "Lotus House",
  taglineKey: "lotusTagline",
  areaSlug: "chang-khlan",
  citySlug: "chiang-mai",
  // The Beds24 property record carries these; copied here so a map pin and a distance
  // badge do not need an API call.
  lat: 18.769995,
  lng: 98.992787,
  type: "townhouse",
  bedrooms: 2,
  bathrooms: 2,
  fromPrice: 3400,
  features: ["rooftop", "kitchen", "wifi", "smart-tv", "parking", "safe", "soaking-tub"],
  // Room "2 Bed Room / 3-floor Entire Townhouse". One room type, one unit.
  beds24: { propertyId: 275645, roomId: 576144 },
  currency: "THB",
  // Both read off the Beds24 room. They are duplicated here so the panel can reject an
  // impossible stay before spending an API call, not so the site can decide the rules:
  // Beds24 still has the final say on every quote and every request.
  maxGuests: 4,
  minStay: 2,
  maxStay: 90,
  fill: "bg-primary",
  onFill: "text-white",
  facts: [
    { labelKey: "guests", value: "4" },
    { labelKey: "bedrooms", value: "2" },
    { labelKey: "beds", valueKey: "twoKingBeds" },
    { labelKey: "bathrooms", value: "2" },
    { labelKey: "factKitchen", value: "1" },
    { labelKey: "factRooftop", value: "1" },
  ],
  descriptionKeys: ["lotusDesc1", "lotusDesc2"],
  /**
   * The exact street address. NOT for the listing: it is released at
   * booking-confirmation, like Airbnb's and Booking's. The property page shows the
   * neighbourhood only. Kept here because the post-booking path needs it.
   */
  address:
    "42 Soi 1, Tambon Chang Khlan, Amphoe Mueang Chiang Mai, Chang Wat Chiang Mai 50100, Thailand",
  checkIn: "15:00",
  checkOut: "12:00",
  houseRuleKeys: ["ruleNoPets", "ruleLimitedMobility", "ruleWheelchair"],
  reviews: [
    {
      quote:
        "This was hands down one of the best Airbnbs my husband and I have ever stayed in. From the moment we walked in, it felt like home…",
      lang: "en",
      source: "Airbnb guest review",
    },
  ],
};

export const PROPERTIES: Property[] = [LOTUS_HOUSE];

/**
 * An approximate point for a property, for any public map.
 *
 * Exact coordinates are `booking-confirmation` material under the visibility rule in
 * as-context/03-systems/property-profile-schema.md, the same as the street address. A pin
 * on a public results map is the address in another form: zoom in far enough and it names
 * the building.
 *
 * So public maps get a point offset by roughly 250 to 400 metres in a direction derived
 * from the slug. Deterministic on purpose -- the same property lands in the same wrong
 * place on every render, so the pin does not shimmer between page loads, and the offset
 * cannot be averaged away by reloading. Close enough to answer "is this the right part of
 * town", far enough that it does not answer "which house".
 *
 * Not a substitute for zooming out. It is one of two defences, the other being that the
 * exact address is not published either.
 */
export function approxLocation(property: Property): { lat: number; lng: number } {
  let hash = 0;
  for (const character of property.slug) {
    hash = (hash * 31 + character.charCodeAt(0)) >>> 0;
  }
  // ~0.0027 degrees latitude is about 300m; longitude is scaled by the cosine of the
  // latitude so the offset is round in metres rather than in degrees.
  const angle = (hash % 360) * (Math.PI / 180);
  const metres = 250 + (hash % 150);
  const dLat = (metres * Math.cos(angle)) / 111_320;
  const dLng =
    (metres * Math.sin(angle)) / (111_320 * Math.cos((property.lat * Math.PI) / 180));
  return { lat: property.lat + dLat, lng: property.lng + dLng };
}

/**
 * The area a property sits in.
 *
 * Returns the Area object rather than a name so callers get the vibe line, the
 * coordinates and the slug together -- and so a neighbourhood is spelled in exactly one
 * place. Undefined only if a property names an area that does not exist, which is a data
 * error worth surfacing rather than papering over with a fallback string.
 */
export function propertyArea(property: Property): Area | undefined {
  return AREAS.find((area) => area.slug === property.areaSlug);
}

/** Properties in a given area. Empty is a normal answer, not an error. */
export function propertiesInArea(areaSlug: string): Property[] {
  return PROPERTIES.filter((property) => property.areaSlug === areaSlug);
}

/** The facts strip, resolved against a dictionary. */
export function propertyFacts(
  t: Dictionary,
  property: Property,
): { label: string; value: string }[] {
  return property.facts.map((fact) => ({
    label: t[fact.labelKey],
    value: fact.valueKey ? t[fact.valueKey] : (fact.value ?? ""),
  }));
}

/** The house rules, resolved. The safety line is added by the caller, not here: it is a
 *  standing recommendation rather than a rule, and only the property page shows it. */
export function propertyHouseRules(t: Dictionary, property: Property): string[] {
  return property.houseRuleKeys.map((key) => t[key]);
}
