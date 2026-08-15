// Locale set and URL shape.
//
// English is the source language and lives at the bare path (`/how-it-works`), so the
// URLs the site already publishes do not change. Thai and Chinese get a path prefix
// (`/th/how-it-works`, `/zh/how-it-works`). src/proxy.ts rewrites the bare paths onto
// the `/en` tree internally, which is why every page lives under `src/app/[locale]`.

export const LOCALES = ["en", "th", "zh"] as const;

export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "en";

/** The `lang` attribute and the hreflang code published for each locale. */
export const HTML_LANG: Record<Locale, string> = {
  en: "en",
  th: "th",
  zh: "zh-Hans",
};

/** Label shown in the header's language control. Each is written in its own language. */
export const LOCALE_LABEL: Record<Locale, string> = {
  en: "EN",
  th: "ไทย",
  zh: "中文",
};

export function isLocale(value: string): value is Locale {
  return (LOCALES as readonly string[]).includes(value);
}

/**
 * Turns a bare route into the path for a given locale.
 * `path` is always the English route ("/", "/how-it-works"), which keeps every
 * href in the codebase written one way.
 */
export function localePath(locale: Locale, path: string): string {
  const clean = path === "/" ? "" : path;
  return locale === DEFAULT_LOCALE ? clean || "/" : `/${locale}${clean}`;
}

/** Strips a locale prefix off a pathname, returning the bare English route. */
export function stripLocale(pathname: string): string {
  const segments = pathname.split("/");
  if (segments.length > 1 && isLocale(segments[1])) {
    const rest = "/" + segments.slice(2).join("/");
    return rest === "/" ? "/" : rest.replace(/\/$/, "");
  }
  return pathname;
}
