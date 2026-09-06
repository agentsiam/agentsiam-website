import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getDictionary } from "@/i18n";
import { isLocale, localePath, type Locale } from "@/i18n/config";
import { AREAS, CITY_CENTRE, distanceKm } from "@/lib/areas";
import { areaGradient, guidePlacesInArea } from "@/lib/area-content";
import { propertiesInArea } from "@/lib/property";
import { pageMeta } from "@/lib/site";
import { areaVibe } from "@/i18n/area-vibe";

/**
 * The neighbourhoods index.
 *
 * These pages exist ahead of inventory on purpose. The areas are real places with real
 * character, so a page about Nimman is useful and true whether or not we manage anything
 * there -- and organic search for "where to stay in Nimman" was always their main job,
 * per the handoff.
 *
 * What they must not do is pretend. Each card says plainly how many places we manage
 * there, including when the answer is none. "We do not manage anything in Mae Rim yet" is
 * a fact a reader can check; a page that quietly implies otherwise is the kind of claim
 * the design's honesty argument exists to prevent.
 *
 * The second number on each card is the guide count, computed from `guide.generated.ts`
 * rather than written down. It is the honest measure of how much we can actually say about
 * a neighbourhood: 55 in Chang Khlan because that is where we operate, none in Mae Rim
 * because we have never worked there. Publishing the shape of our own coverage, including
 * where it is thin, is cheaper than being caught claiming otherwise.
 *
 * The gradient ground on each card is decorative and `aria-hidden`, and its hue is chosen
 * by index position. Never by sentiment: teal is the positive-verdict token in this system
 * and vermilion the negative one, so hue that tracked how good a neighbourhood is would
 * publish a rating we are not making. See `areaGradient` in src/lib/area-content.ts.
 */

export async function generateMetadata({
  params,
}: PageProps<"/[locale]">): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = getDictionary(locale);
  return pageMeta({
    title: t.metaDestinationsTitle,
    description: t.metaDestinationsDesc,
    path: "/destinations",
    locale,
  });
}

export default async function DestinationsPage({ params }: PageProps<"/[locale]">) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = getDictionary(locale);
  const href = (path: string) => localePath(locale as Locale, path);

  return (
    <div className="mx-auto max-w-(--container-chrome) px-5 pb-18 pt-11">
      {/* shape: page-header -- Eyebrow, title and intro. */}
      <p className="eyebrow">{t.navDestinations}</p>
      <h1 className="mt-3 font-headline text-[clamp(28px,5vw,40px)] font-extrabold leading-[1.1] tracking-[-0.03em]">
        {t.destinationsTitle}
      </h1>
      <p className="mt-3.5 max-w-[560px] text-base leading-relaxed text-body">
        {t.destinationsIntro}
      </p>

      {/* shape: area-grid -- Every area, with its two counts and its distance. */}
      <ul className="mt-9 grid gap-5 sm:grid-cols-[repeat(auto-fill,minmax(280px,1fr))]">
        {AREAS.map((area, index) => {
          const count = propertiesInArea(area.slug).length;
          const guideCount = guidePlacesInArea(area.slug).length;
          const km = distanceKm(CITY_CENTRE, { lat: area.lat, lng: area.lng });
          return (
            <li key={area.slug}>
              <Link
                href={href(`/destinations/${area.slug}`)}
                className="flex h-full flex-col overflow-hidden rounded-panel border border-hairline hover:border-ink"
              >
                {/* Decorative ground. No photography exists for any neighbourhood, and the
                    guardrail against stock is absolute, so the gradient IS the treatment
                    rather than a placeholder waiting on a photo. */}
                <div
                  aria-hidden="true"
                  className={`h-[88px] shrink-0 ${areaGradient(index)}`}
                />
                <div className="flex flex-1 flex-col p-6">
                  <h2 className="font-display text-xl font-bold tracking-[-0.015em]">
                    {area.name}
                  </h2>
                  <p className="mt-2 flex-1 text-[14.5px] leading-relaxed text-body">
                    {areaVibe(t, area)}
                  </p>
                  <p className="mt-4 text-[13px] text-muted">
                    {t.areaKmFromGate.replace(
                      "{n}",
                      km < 10 ? km.toFixed(1) : String(Math.round(km)),
                    )}
                  </p>
                  <p className="mt-1 text-[13px] text-muted">
                    {guideCount === 0
                      ? t.areaGuideCountNone
                      : guideCount === 1
                        ? t.areaGuideCountOne
                        : t.areaGuideCount.replace("{n}", String(guideCount))}
                  </p>
                  <p className="mt-1 text-[13px] font-semibold text-text">
                    {count === 0
                      ? t.areaNoneYet
                      : count === 1
                        ? t.oneProperty
                        : t.nProperties.replace("{n}", String(count))}
                  </p>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>

      {/* shape: closing-cta -- The guest ask, for the reader none of the eight fitted. */}
      <section className="mt-12 rounded-panel border border-hairline px-7 py-9">
        <h2 className="font-display text-xl font-bold tracking-[-0.015em]">
          {t.areaIndexCloseTitle}
        </h2>
        <p className="mt-2.5 max-w-[560px] text-[15px] leading-relaxed text-body">
          {t.areaIndexCloseBody}
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link href={href("/contact")} className="pill-primary">
            {t.tellUsWhatYouNeed}
          </Link>
          <Link href={href("/properties")} className="pill-outline">
            {t.seeEverything}
          </Link>
        </div>
      </section>

      {/* shape: closing-cta -- The cross-audience link. Plain text, secondary weight,
          never a second primary CTA. */}
      <p className="mt-10 border-t border-hairline pt-6 text-[13px] text-muted">
        {t.areaOwnerCross}{" "}
        <Link
          href={href("/how-it-works")}
          className="font-semibold text-text underline underline-offset-[3px] hover:text-primary"
        >
          {t.ownerReentryLink}
        </Link>
      </p>
    </div>
  );
}
