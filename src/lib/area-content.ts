/**
 * The editorial layer on top of `src/lib/areas.ts`.
 *
 * `areas.ts` carries what a neighbourhood *is*: slug, name, one-line vibe, coordinates.
 * That file is read by the map, the search filters and the property records, so a page's
 * prose does not belong in it. This file is the prose, and it is deliberately separate:
 * adding four paragraphs per area to the type that the map imports would make every
 * consumer of `Area` carry copy it never renders.
 *
 * Nothing here is a string. Every user-visible word on the neighbourhood pages comes from
 * the dictionaries, which is the only place a translation can be checked; this file holds
 * the KEY NAMES, typed against `Dictionary`, so a key that is renamed or dropped fails the
 * typecheck rather than rendering an empty paragraph in Thai.
 *
 * What the copy may say is constrained by what we can actually source. Five of the eight
 * areas have entries in `guide.generated.ts`, written first-hand by the host of the one
 * house we manage; those five can be described from notes. The other three -- Hang Dong,
 * Mae Rim, San Sai -- have none, so their pages carry `areaUnsourcedFrom` under the
 * description, which says in the reader's own language that what they just read is general
 * rather than checked. That marker is not decoration: it is the difference between a page
 * that is honest about its limits and one that quietly reads as local knowledge.
 */
import type { Dictionary } from "@/i18n/dictionaries/en";
import { GUIDE_PLACES, type GuidePlace } from "@/lib/guide.generated";

export type AreaContent = {
  /** Two or three paragraph keys, rendered in order under "What it is like". */
  what: (keyof Dictionary)[];
  /** Three lines on the kind of stay the neighbourhood works for. Judgement, and labelled as such. */
  suits: (keyof Dictionary)[];
  /** The fourth line, and the one that has to be there: what it does NOT work for. */
  notFor: keyof Dictionary;
};

/**
 * The neighbourhood name, in the reader's language.
 *
 * `src/i18n/area-vibe.ts` does exactly this for the vibe line and is the pattern being
 * followed; it is not extended because a name is wanted here and a vibe is wanted there,
 * and the dictionary already carries `areaNimman`, `areaOldCity` and the rest for the
 * contact form and the owner qualifier. A slug with no key falls back to the English name
 * in `areas.ts`, which is readable rather than blank.
 */
const NAME_KEYS: Record<string, keyof Dictionary> = {
  nimman: "areaNimman",
  "old-city": "areaOldCity",
  santitham: "areaSantitham",
  "chang-khlan": "areaChangKhlan",
  riverside: "areaRiverside",
  "hang-dong": "areaHangDong",
  "mae-rim": "areaMaeRim",
  "san-sai": "areaSanSai",
};

/**
 * The copy keys that name a neighbourhood inside the sentence, and which one.
 *
 * The name is interpolated rather than written into the string, because the dictionary
 * already owns how each neighbourhood is spelled in each language and a second spelling
 * inside a paragraph is how "Chang Khlan" ends up transliterated two ways in Chinese.
 * One value, one place.
 */
const AREA_REFS: Partial<Record<keyof Dictionary, string>> = {
  areaUnsourcedFrom: "chang-khlan",
  areaNimmanGuide: "chang-khlan",
  areaOldCityGuide: "chang-khlan",
  areaChangKhlanRoad: "chang-khlan",
  areaSantithamWhere: "santitham",
  areaSanSaiLiving: "san-sai",
};

export function areaName(t: Dictionary, slug: string): string {
  const key = NAME_KEYS[slug];
  return key ? t[key] : slug;
}

/** One line of area copy, with any neighbourhood name in it resolved for this locale. */
export function areaLine(t: Dictionary, key: keyof Dictionary): string {
  const ref = AREA_REFS[key];
  return ref ? t[key].replace("{area}", areaName(t, ref)) : t[key];
}

export const AREA_CONTENT: Record<string, AreaContent> = {
  nimman: {
    what: ["areaNimmanP1", "areaNimmanP2", "areaNimmanGuide"],
    suits: ["areaNimmanSuitA", "areaNimmanSuitB", "areaNimmanSuitC"],
    notFor: "areaNimmanNot",
  },
  "old-city": {
    what: ["areaOldCityP1", "areaOldCityP2", "areaOldCityGuide"],
    suits: ["areaOldCitySuitA", "areaOldCitySuitB", "areaOldCitySuitC"],
    notFor: "areaOldCityNot",
  },
  santitham: {
    what: ["areaSantithamWhere", "areaSantithamP2"],
    suits: ["areaSantithamSuitA", "areaSantithamSuitB", "areaSantithamSuitC"],
    notFor: "areaSantithamNot",
  },
  "chang-khlan": {
    what: ["areaChangKhlanP1", "areaChangKhlanP2", "areaChangKhlanP3"],
    suits: ["areaChangKhlanSuitA", "areaChangKhlanSuitB", "areaChangKhlanSuitC"],
    notFor: "areaChangKhlanRoad",
  },
  riverside: {
    what: ["areaRiversideP1", "areaRiversideP2", "areaRiversideP3"],
    suits: ["areaRiversideSuitA", "areaRiversideSuitB", "areaRiversideSuitC"],
    notFor: "areaRiversideNot",
  },
  "hang-dong": {
    what: ["areaHangDongP1", "areaHangDongP2"],
    suits: ["areaHangDongSuitA", "areaHangDongSuitB", "areaHangDongSuitC"],
    notFor: "areaHangDongNot",
  },
  "mae-rim": {
    what: ["areaMaeRimP1", "areaMaeRimP2"],
    suits: ["areaMaeRimSuitA", "areaMaeRimSuitB", "areaMaeRimSuitC"],
    notFor: "areaMaeRimNot",
  },
  "san-sai": {
    what: ["areaSanSaiP1", "areaSanSaiLiving"],
    suits: ["areaSanSaiSuitA", "areaSanSaiSuitB", "areaSanSaiSuitC"],
    notFor: "areaSanSaiNot",
  },
};

export function areaContent(slug: string): AreaContent | undefined {
  return AREA_CONTENT[slug];
}

/**
 * Every guide place sitting in one neighbourhood, host picks first.
 *
 * Host picks lead because the diamond in the source sheet is the one signal in the data
 * that someone chose rather than recorded: a page showing six of fifty-five entries should
 * show the six that were picked out, not the six that happen to sit at the top of a sheet
 * sorted by nothing in particular. Order within each group is the sheet's own.
 *
 * Empty is a normal answer, and the caller renders nothing rather than an empty section.
 */
export function guidePlacesInArea(slug: string): GuidePlace[] {
  const inArea = GUIDE_PLACES.filter((place) => place.area === slug);
  return [
    ...inArea.filter((place) => place.highlight),
    ...inArea.filter((place) => !place.highlight),
  ];
}

/**
 * The gradient grounds, in the order the cards use them.
 *
 * Assigned by index position and never by meaning. Teal is the positive-verdict token in
 * this system and vermilion the negative one, so a hue chosen to match how good a
 * neighbourhood is would read as a rating we are not giving. The design system defines
 * five; the eight cards cycle through them.
 */
export const AREA_GRADIENTS = [
  "grad-blue",
  "grad-sand",
  "grad-pink",
  "grad-teal",
  "grad-vermilion",
] as const;

export function areaGradient(index: number): string {
  return AREA_GRADIENTS[index % AREA_GRADIENTS.length];
}
