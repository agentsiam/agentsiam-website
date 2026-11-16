/**
 * The cities that get an owner-facing management page.
 *
 * Chiang Mai is deliberately absent. The homepage already carries "Short-term rental
 * management in Chiang Mai" in its title and targets that query today, so a
 * `/management/chiang-mai` page would compete with the homepage for the same search and
 * split the signal. The home market is served by `/` and `/how-it-works`.
 *
 * These two are opportunistic markets under decision #29 (24/08/2026). AgentSiam has no
 * market file, no benchmarks and no compliance route written for either, so the pages
 * carry no local area knowledge, no case study and no city photography. They say what the
 * service is and where it is delivered from, which is true, and they leave the gap visible
 * rather than filling it with copy.
 */

import type { Dictionary } from "@/i18n";

export type ManagementCity = {
  slug: string;
  name: string;
  /**
   * The city's name in the reader's language, as a dictionary key.
   *
   * `name` above is the English spelling and stays, because the slug, the sitemap and
   * llms.txt are English surfaces. But every string on the page interpolated `name`, so
   * /th and /zh printed "Phuket" and "Bangkok" in Latin script beside Thai and Chinese
   * copy, and the rules section below, written in Thai and Chinese, then named the city a
   * second way on the same page.
   *
   * `areaName` in `src/lib/area-content.ts` is the pattern and says why it is a key rather
   * than three strings: the dictionary owns how a place is spelled in each language, and a
   * second spelling inside a paragraph is how one name ends up transliterated two ways.
   * Chiang Mai's key is `homeCity` and predates this. It is not repeated here, because
   * Chiang Mai deliberately has no page in this list.
   *
   * Required, not optional, so a third city cannot arrive without its name. Every string
   * that mentions the city interpolates `{city}`, the per-city paragraphs included, which
   * is also where the spacing around the name lives: Thai binds a preposition to its
   * object, and กรุงเทพฯ ends in the paiyannoi and takes a space before the next word.
   */
  nameKey: keyof Dictionary;
  /**
   * The city's own two paragraphs of rules copy: where a notification is filed and whether
   * the exemption route fits the local stock, then how the rule is actually enforced.
   *
   * Dictionary keys rather than strings, for the reason property taglines are keys: a
   * reader reads these, so they have to exist in all three languages, and a string sitting
   * in a `lib/` array because it felt like data is the recurring i18n bug on this site.
   *
   * These are what stop the two city pages being the same page with the name swapped. The
   * copy behind them traces to the "By city" section of
   * `as-context/04-industry-research/regulations-compliance/thailand/str-legal-overview.md`
   * in agentsiam-consulting, approved 15/11/2026, and to nothing else. Two claims the
   * research turned up are deliberately absent from both the overview and these keys
   * because one source each could not be corroborated; that file's working folder names
   * them. Adding a third city means adding its section there first.
   */
  rulesRouteKey: keyof Dictionary;
  rulesEnforceKey: keyof Dictionary;
};

export const MANAGEMENT_CITIES: ManagementCity[] = [
  {
    slug: "phuket",
    name: "Phuket",
    nameKey: "cityPhuket",
    rulesRouteKey: "mgmt2PhuketRoute",
    rulesEnforceKey: "mgmt2PhuketEnforce",
  },
  {
    slug: "bangkok",
    name: "Bangkok",
    nameKey: "cityBangkok",
    rulesRouteKey: "mgmt2BangkokRoute",
    rulesEnforceKey: "mgmt2BangkokEnforce",
  },
];

export function managementCityBySlug(slug: string): ManagementCity | undefined {
  return MANAGEMENT_CITIES.find((city) => city.slug === slug);
}
