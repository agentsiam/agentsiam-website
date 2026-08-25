import vocabulary from "./guide-vocabulary.json";

/**
 * Typed access to the guide's vocabulary.
 *
 * The JSON is shared with scripts/build-guide.mjs, which validates the library against it.
 * This file gives the app types and a map lookup rather than a scan per card.
 *
 * Labels live here rather than in guide.generated.ts because that file describes *places*
 * and this describes the *vocabulary*: re-wording a tag or fixing a translation should not
 * mean rerunning a script that talks to three network services.
 */

export type TagFamily = "food" | "dietary" | "practical";

export type CategoryDef = {
  /** Must match the sheet's Category cell exactly. */
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

export const TAGS: TagDef[] = vocabulary.tags as TagDef[];
export const CATEGORIES: CategoryDef[] = vocabulary.categories as CategoryDef[];

const BY_SLUG = new Map(TAGS.map((tag) => [tag.slug, tag]));
const BY_CATEGORY = new Map(CATEGORIES.map((c) => [c.name, c]));

/**
 * Deliberately a dot and not a question mark: an unknown category is not an error.
 *
 * A category the library has and this file does not still renders, with a plain pin and its
 * English name, and the build warns. A new category should degrade, not break a guest's page.
 */
export const FALLBACK_ICON = "\u{1F4CD}";

export function categoryIcon(name: string): string {
  return BY_CATEGORY.get(name)?.icon ?? FALLBACK_ICON;
}

export function categoryLabel(name: string, locale: string): string {
  const category = BY_CATEGORY.get(name);
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

/** Vocabulary order, not sheet order, so chips are stable across rebuilds. */
export function sortTags(slugs: readonly string[]): string[] {
  const order = new Map(TAGS.map((tag, i) => [tag.slug, i]));
  return [...slugs].sort((a, b) => (order.get(a) ?? 999) - (order.get(b) ?? 999));
}

export function tagsInFamily(slugs: readonly string[], family: TagFamily): string[] {
  return sortTags(slugs.filter((slug) => BY_SLUG.get(slug)?.family === family));
}
