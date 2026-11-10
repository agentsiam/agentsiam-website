import vocabulary from "./guide-vocabulary.json";

/**
 * Typed access to the guide's vocabulary: its categories and its tags.
 *
 * The JSON beside this file is shared with scripts/build-guide.mjs, which validates the
 * built guide against it. This file gives the app types and a map lookup rather than a scan
 * per card, and holds the reasoning the JSON cannot carry.
 *
 * **Labels live here, not in guide.generated.ts.** That file describes *places* and is
 * rebuilt by a script that talks to Google Sheets, Google Maps and a routing service.
 * Re-wording a label or fixing a translation should not mean running any of that.
 *
 * **A category's `name` is its key, never its label.** It must match the guide's Category
 * cell exactly, it is what travels in a ?for= URL, and it stays English in every locale so
 * a filtered guide link means the same thing whoever it is sent to. What a guest reads
 * comes from categoryLabel.
 *
 * Replaces guide-icons.ts, which held the same fifteen icons and no labels.
 */

export type TagFamily = "food" | "dietary" | "practical";

export type CategoryDef = {
  /** The key. Must match the guide's Category cell exactly. */
  name: string;
  icon: string;
  th: string;
  zh: string;
};

export type TagDef = {
  slug: string;
  family: TagFamily;
  en: string;
  th: string;
  zh: string;
};

export const CATEGORIES: CategoryDef[] = vocabulary.categories as CategoryDef[];
export const TAGS: TagDef[] = vocabulary.tags as TagDef[];

const BY_NAME = new Map(CATEGORIES.map((category) => [category.name, category]));
const BY_SLUG = new Map(TAGS.map((tag) => [tag.slug, tag]));

/**
 * Deliberately a dot and not a question mark: an unknown category is not an error.
 *
 * A category the guide carries and this file does not still renders, with a plain pin and
 * its English name, and the build warns. A new category should degrade on a guest's page,
 * not break it.
 */
export const FALLBACK_ICON = "\u{1F4CD}";

/**
 * One emoji per category.
 *
 * A map of 149 identical pins is a map you have to read rather than scan. An emoji is
 * legible at pin size where a word is not, survives being shrunk to nothing, and needs no
 * icon set, no sprite sheet and no licence. It also crosses languages, which matters on a
 * page served in English, Thai and Chinese.
 *
 * Chosen to be distinguishable from each other at a glance rather than to be literal: the
 * test is whether two of them can be told apart at 16px on a phone, not whether the picture
 * is the best possible depiction of "Basics & Utilities".
 */
export function categoryIcon(name: string): string {
  return BY_NAME.get(name)?.icon ?? FALLBACK_ICON;
}

/** What a guest reads, falling back to the English key when a translation is missing. */
export function categoryLabel(name: string, locale: string): string {
  const category = BY_NAME.get(name);
  if (!category) return name;
  if (locale === "th") return category.th || category.name;
  if (locale === "zh") return category.zh || category.name;
  return category.name;
}

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
