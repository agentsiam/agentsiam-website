import type { Dictionary } from "@/i18n/dictionaries/en";

/**
 * The neighbourhood one-liner, in the reader's language.
 *
 * `AREAS[].vibe` in `src/lib/areas.ts` is English and stays English: it is the source the
 * copy was written from, and it is what an English reader sees. This maps an area slug onto
 * its dictionary key so the Thai and Chinese pages do not print an English line under a
 * translated heading. Added 26/08/2026, when a sweep found the vibe rendering in English on
 * /th and /zh in five places, one of them the `{vibe}` slot inside the page's own meta
 * description.
 *
 * A slug with no key returns the English, which is the honest fallback: a new area added to
 * areas.ts renders readably rather than blank, and shows up in the next language sweep.
 */
const VIBE_KEYS: Record<string, keyof Dictionary> = {
  nimman: "vibeNimman",
  "old-city": "vibeOldCity",
  santitham: "vibeSantitham",
  "chang-khlan": "vibeChangKhlan",
  riverside: "vibeRiverside",
  "hang-dong": "vibeHangDong",
  "mae-rim": "vibeMaeRim",
  "san-sai": "vibeSanSai",
};

export function areaVibe(
  t: Dictionary,
  area: { slug: string; vibe: string } | undefined | null,
): string {
  if (!area) return "";
  const key = VIBE_KEYS[area.slug];
  return key ? t[key] : area.vibe;
}
