/**
 * One emoji per guide category.
 *
 * A map of 109 identical pins is a map you have to read rather than scan. An emoji is
 * legible at pin size where a word is not, survives being shrunk to nothing, and needs no
 * icon set, no sprite sheet and no licence. It also crosses languages, which matters on a
 * page served in English, Thai and Chinese.
 *
 * Chosen to be distinguishable from each other at a glance rather than to be literal: the
 * test is whether two of them can be told apart at 16px on a phone, not whether the picture
 * is the best possible depiction of "Basics & Utilities".
 *
 * Keys must match GUIDE_CATEGORIES in guide.generated.ts exactly. Anything unmatched gets
 * the fallback rather than an empty space, so a new category in the sheet degrades to a
 * plain pin instead of a broken one.
 */

export const CATEGORY_ICONS: Record<string, string> = {
  Bars: "🍸",
  "Basics & Utilities": "🧰",
  Breakfast: "🥐",
  Club: "🎧",
  Coffee: "☕",
  "Convenience & Grocery": "🛒",
  "Massage/Spa": "💆",
  "Museum/Gallery": "🖼️",
  "Nature & Viewpoint": "🌿",
  Restaurant: "🍽️",
  "Shop/Bazaar": "🛍️",
  "Sports & Pool": "🏊",
  "Street Food": "🍜",
  Temple: "🛕",
  Workshop: "🎨",
};

/** Deliberately a dot and not a question mark: an unknown category is not an error. */
export const FALLBACK_ICON = "📍";

export function categoryIcon(category: string): string {
  return CATEGORY_ICONS[category] ?? FALLBACK_ICON;
}
