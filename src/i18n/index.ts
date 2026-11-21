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

/**
 * Puts a city name into a sentence at `{city}`.
 *
 * Thai, per the native review of 21/11/2026: a full name such as เชียงใหม่ or ภูเก็ต runs
 * straight into a continuing phrase (ในภูเก็ตอยู่ใช่ไหม), while กรุงเทพฯ keeps a space after
 * the ฯ (ในกรุงเทพฯ อยู่ใช่ไหม). So a Thai template carries no space where the phrase
 * continues and a space where a new clause starts, and this adds the one space a name ending
 * in ฯ needs before more Thai text. English and Chinese templates are unaffected: nothing
 * Thai follows the placeholder in them.
 */
export function fillCity(template: string, name: string): string {
  const beforeThai = name.endsWith("ฯ") ? `${name} ` : name;
  return template.replace(/\{city\}(?=[฀-๿])/g, beforeThai).replaceAll("{city}", name);
}
