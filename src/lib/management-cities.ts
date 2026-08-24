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

export type ManagementCity = {
  slug: string;
  name: string;
};

export const MANAGEMENT_CITIES: ManagementCity[] = [
  { slug: "phuket", name: "Phuket" },
  { slug: "bangkok", name: "Bangkok" },
];

export function managementCityBySlug(slug: string): ManagementCity | undefined {
  return MANAGEMENT_CITIES.find((city) => city.slug === slug);
}
