import vocabulary from "./guide-vocabulary.json";

/**
 * Typed access to the guide's tag vocabulary.
 *
 * The JSON beside this file is shared with scripts/build-guide.mjs, which validates every
 * assignment in scripts/guide-tags.json against it. This file gives the app types and a map
 * lookup rather than a scan per card, and holds the reasoning the JSON cannot carry.
 *
 * **Labels live here, not in guide.generated.ts.** That file describes *places* and is
 * rebuilt by a script that talks to Google Sheets, Google Maps and a routing service.
 * Re-wording a tag or fixing a translation should not mean running any of that.
 *
 * **Tags are translated and categories are not**, which is not an oversight. A category
 * comes from the guide's English source and the page tells guests as much, so translating
 * one would contradict a note a guest can read. A tag is vocabulary we author ourselves,
 * in three languages from the start, so there is nothing to disclose.
 */

export type TagFamily = "food" | "dietary" | "practical";

export type TagDef = {
  slug: string;
  family: TagFamily;
  en: string;
  th: string;
  zh: string;
};

export const TAGS: TagDef[] = vocabulary.tags as TagDef[];

const BY_SLUG = new Map(TAGS.map((tag) => [tag.slug, tag]));

export function tagBySlug(slug: string): TagDef | undefined {
  return BY_SLUG.get(slug);
}

/**
 * The tag's label in the guest's language, falling back to English.
 *
 * A missing translation renders the English rather than the slug: "Dim sum" is a worse
 * answer than "点心" and a much better one than "dim-sum".
 */
export function tagLabel(slug: string, locale: string): string {
  const tag = BY_SLUG.get(slug);
  if (!tag) return slug;
  if (locale === "th") return tag.th || tag.en;
  if (locale === "zh") return tag.zh || tag.en;
  return tag.en;
}

/** Vocabulary order, not the order a place happens to list them, so chips never reshuffle. */
export function sortTags(slugs: readonly string[]): string[] {
  const order = new Map(TAGS.map((tag, i) => [tag.slug, i]));
  return [...slugs].sort((a, b) => (order.get(a) ?? 999) - (order.get(b) ?? 999));
}

export function tagsInFamily(slugs: readonly string[], family: TagFamily): string[] {
  return sortTags(slugs.filter((slug) => BY_SLUG.get(slug)?.family === family));
}
