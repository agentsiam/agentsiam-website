import { en, type Dictionary } from "./dictionaries/en";
import { th } from "./dictionaries/th";
import { zh } from "./dictionaries/zh";
import { DEFAULT_LOCALE, type Locale } from "./config";

// The dictionaries are small enough (a few kB each) that loading them synchronously is
// cheaper than the dynamic import the Next docs suggest -- that pattern exists to keep
// large dictionaries out of the bundle, and these are server-rendered anyway.
const dictionaries: Record<Locale, Dictionary> = { en, th, zh };

/**
 * Per-key fallback to English, so a missing translation degrades to readable rather than
 * blank. The types make a missing key impossible today, but the fallback stays: it is
 * also what makes a *blank* string (a translator's placeholder) fall back.
 */
export function getDictionary(locale: Locale): Dictionary {
  const base = dictionaries[DEFAULT_LOCALE];
  const target = dictionaries[locale] ?? base;
  const merged = {} as Record<string, string>;
  for (const key of Object.keys(base)) {
    merged[key] = target[key as keyof Dictionary] || base[key as keyof Dictionary];
  }
  return merged as Dictionary;
}

export type { Dictionary };
export * from "./config";
