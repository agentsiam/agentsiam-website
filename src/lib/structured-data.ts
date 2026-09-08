import type { Dictionary } from "@/i18n";
import { HTML_LANG, LOCALES, type Locale } from "@/i18n/config";
import { MANAGEMENT_CITIES } from "@/lib/management-cities";
import type { Photo } from "@/lib/photos.generated";
import { propertyArea, type Property } from "@/lib/property";
import {
  absoluteUrl,
  assetUrl,
  CONTACT_EMAIL,
  POSTAL_ADDRESS,
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_URL,
} from "@/lib/site";

/**
 * Every schema.org object the site publishes, built from the same sources the pages
 * render from. Nothing is written twice: the company address comes from site.ts, the
 * property facts from property.ts, the amenity names from the dictionaries, the photos
 * from the generated manifest.
 *
 * Three things are deliberately absent, and should stay absent until the data exists:
 *
 * - **No aggregateRating and no review count.** There is one quoted Airbnb review and no
 *   verified score behind it. A rating in markup that no page can show is the exact thing
 *   Google's structured-data policy calls out, and it is a claim a reader could not check.
 * - **No streetAddress and no geo on a property.** The exact address and coordinates are
 *   booking-confirmation material, the same rule the property page and the results map
 *   already follow. Structured data is published markup like any other, so it obeys it.
 *   Know the price of this one: geo is a required field for Google's vacation rental rich
 *   result, so withholding it forfeits that result. Confirmed against the Rich Results
 *   Test, which reports the listing invalid on the missing geo alone. The block is still
 *   correct for every other reader, and the property page earns a valid Local business
 *   result regardless.
 * - **No telephone, no sameAs, no logo on the organisation.** No phone number or LINE ID
 *   is published anywhere on the site yet, no social profile is confirmed, and there is no
 *   logo file under public/. Each is a one-line addition on the day it becomes true.
 *
 * Blocks are attached with <JsonLd> from src/components/json-ld.tsx.
 */

/** Stable node identifiers, so a page can point at the organisation instead of repeating it. */
export const ORGANIZATION_ID = `${SITE_URL}/#organization`;
export const WEBSITE_ID = `${SITE_URL}/#website`;

const SCHEMA_CONTEXT = "https://schema.org";

/**
 * The company. Emitted once per page from the root layout, and referenced by @id from
 * everything else, which is what stops three locales of one page from reading as three
 * different companies.
 *
 * The postal address is the one in the footer, from the same constant, because it has to
 * match the Google Business Profile character for character or the two records compete in
 * local search.
 *
 * `LocalBusiness` since 06/09/2026, and only since then. It is the type local search reads
 * and `Organization` is not, but publishing it was wrong while the only address on file
 * was a Bangkok one: a LocalBusiness node is a claim about where a business physically is,
 * and pointing it at the wrong city is worse for local search than not competing. The
 * registered office was corrected to Chiang Mai on the same day, which is what makes the
 * type honest. `Organization` remains in the type array so anything reading for the more
 * general type still resolves.
 *
 * Still absent, and each is a one-line addition on the day it becomes true: `telephone`,
 * because no number is published anywhere on the site; `sameAs`, because no social profile
 * is confirmed; `logo`, because there is no logo file under public/; `geo` and
 * `openingHours`, which are the two fields a LocalBusiness rich result most wants and
 * neither of which has a verified value yet.
 */
export function organizationSchema(): Record<string, unknown> {
  return {
    "@context": SCHEMA_CONTEXT,
    "@type": ["LocalBusiness", "Organization"],
    "@id": ORGANIZATION_ID,
    name: SITE_NAME,
    legalName: POSTAL_ADDRESS.legalName,
    url: SITE_URL,
    email: CONTACT_EMAIL,
    description: SITE_DESCRIPTION,
    address: {
      "@type": "PostalAddress",
      streetAddress: POSTAL_ADDRESS.street,
      addressLocality: POSTAL_ADDRESS.locality,
      postalCode: POSTAL_ADDRESS.postalCode,
      addressCountry: POSTAL_ADDRESS.countryCode,
    },
    // Chiang Mai is the live market; the other two are the markets that have their own
    // /management page. The list follows the pages rather than ambition.
    areaServed: [
      { "@type": "City", name: "Chiang Mai" },
      ...MANAGEMENT_CITIES.map((city) => ({ "@type": "City", name: city.name })),
    ],
  };
}

/**
 * The site itself. inLanguage carries all three codes rather than the locale being
 * rendered, so the node is byte-identical on /,  /th and /zh and the shared @id stays
 * truthful.
 *
 * No SearchAction: that property promises a URL template a crawler can run a query
 * through, and the property filters are not that.
 */
export function websiteSchema(): Record<string, unknown> {
  return {
    "@context": SCHEMA_CONTEXT,
    "@type": "WebSite",
    "@id": WEBSITE_ID,
    url: SITE_URL,
    name: SITE_NAME,
    description: SITE_DESCRIPTION,
    inLanguage: LOCALES.map((locale) => HTML_LANG[locale]),
    publisher: { "@id": ORGANIZATION_ID },
  };
}

export type Crumb = {
  name: string;
  /** Bare English route. Omitted on the final crumb, which is the page itself. */
  path?: string;
};

/**
 * A breadcrumb trail. Only emitted on pages that render a visible breadcrumb, because
 * markup describing navigation a reader cannot see is a mismatch a crawler is entitled to
 * distrust. /management/[city] has no visible trail and deliberately gets no list.
 */
export function breadcrumbSchema(locale: Locale, trail: Crumb[]): Record<string, unknown> {
  return {
    "@context": SCHEMA_CONTEXT,
    "@type": "BreadcrumbList",
    itemListElement: trail.map((crumb, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: crumb.name,
      ...(crumb.path ? { item: absoluteUrl(locale, crumb.path) } : {}),
    })),
  };
}

/**
 * A property listing.
 *
 * VacationRental is schema.org's own type for a whole unit let short term, which is what
 * this is. It is a kind of LodgingBusiness, meaning it describes the letting rather than
 * the rooms, so the room counts, the occupancy and the amenities hang off an Accommodation
 * underneath it and not off the listing itself. schema.org rejects them on the listing, and
 * Google asks for the same nesting under the name containsPlace.
 *
 * No provider and no inLanguage. Both were rejected on this type, and neither has an
 * honest replacement: schema.org has no "managed by", and calling AgentSiam the property's
 * parent organisation would state a relationship that does not exist. The company is
 * already declared once per page from the root layout, and the page's language is already
 * on the html element, so nothing is lost by leaving them out.
 *
 * Amenities are named from the dictionary, so they read in the page's own language and are
 * spelled once. A feature with no dictionary label is skipped rather than shown as its
 * slug: the site does not name it either.
 */
export function propertySchema({
  locale,
  t,
  property,
  photos,
}: {
  locale: Locale;
  t: Dictionary;
  property: Property;
  photos: Photo[];
}): Record<string, unknown> {
  const path = `/${property.slug}`;
  const url = absoluteUrl(locale, path);
  const area = propertyArea(property);

  const amenities = property.features
    .map((feature) => {
      const key = `feature_${feature.replace(/-/g, "_")}` as keyof Dictionary;
      return t[key];
    })
    .filter((name): name is string => Boolean(name))
    .map((name) => ({
      "@type": "LocationFeatureSpecification",
      name,
      value: true,
    }));

  return {
    "@context": SCHEMA_CONTEXT,
    "@type": "VacationRental",
    "@id": `${url}#listing`,
    // The slug, because it is the one name for this property that is stable across the
    // site, the sitemap and the URL. Not the Beds24 id: that is a third party's key and
    // Beds24 is never named in the front end.
    identifier: property.slug,
    name: property.title,
    description: t.metaLotusDesc,
    url,
    // Neighbourhood, city, country. No street and no coordinates, on purpose: see the
    // note at the top of this file.
    address: {
      "@type": "PostalAddress",
      ...(area ? { addressLocality: area.name } : {}),
      addressRegion: "Chiang Mai",
      addressCountry: "TH",
    },
    checkinTime: property.checkIn,
    checkoutTime: property.checkOut,
    // The unit itself, carrying everything that describes the space rather than the
    // letting. It keeps the #accommodation id, because it is the accommodation.
    containsPlace: {
      "@type": "Accommodation",
      "@id": `${url}#accommodation`,
      numberOfBedrooms: property.bedrooms,
      numberOfBathroomsTotal: property.bathrooms,
      occupancy: {
        "@type": "QuantitativeValue",
        // C62 is the UN/CEFACT code for a plain count, which is what "guests" is here.
        unitCode: "C62",
        // value, not maxValue. schema.org defines occupancy as the number of people the
        // accommodation takes, so the figure is already a ceiling and needs no second word
        // for it. Google reads value and ignores maxValue outright: with maxValue alone the
        // Rich Results Test reported occupancy as having no value at all.
        value: property.maxGuests,
      },
      ...(amenities.length > 0 ? { amenityFeature: amenities } : {}),
    },
    ...(photos.length > 0
      ? { image: photos.slice(0, 12).map((photo) => assetUrl(photo.src.src)) }
      : {}),
  };
}

/**
 * The owner page's questions. The answers are the design's own long-form English and are
 * not translated, so this block is English on all three locales, which is exactly what the
 * page renders. Markup and visible text agree, which is the only rule that matters here.
 */
export function faqSchema(items: { q: string; a: string }[]): Record<string, unknown> {
  return {
    "@context": SCHEMA_CONTEXT,
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  };
}
