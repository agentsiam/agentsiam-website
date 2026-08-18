import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getDictionary } from "@/i18n";
import { isLocale, localePath, type Locale } from "@/i18n/config";
import { AREAS } from "@/lib/areas";
import { propertiesInArea } from "@/lib/property";
import { pageMeta } from "@/lib/site";

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
      <p className="eyebrow">{t.navDestinations}</p>
      <h1 className="mt-3 font-headline text-[clamp(28px,5vw,40px)] font-extrabold leading-[1.1] tracking-[-0.03em]">
        {t.destinationsTitle}
      </h1>
      <p className="mt-3.5 max-w-[560px] text-base leading-relaxed text-body">
        {t.destinationsIntro}
      </p>

      <ul className="mt-9 grid gap-5 sm:grid-cols-[repeat(auto-fill,minmax(280px,1fr))]">
        {AREAS.map((area) => {
          const count = propertiesInArea(area.slug).length;
          return (
            <li key={area.slug}>
              <Link
                href={href(`/destinations/${area.slug}`)}
                className="flex h-full flex-col rounded-panel border border-hairline p-6 hover:border-ink"
              >
                <h2 className="font-display text-xl font-bold tracking-[-0.015em]">
                  {area.name}
                </h2>
                <p className="mt-2 flex-1 text-[14.5px] leading-relaxed text-body">
                  {area.vibe}
                </p>
                <p className="mt-4 text-[13px] text-muted">
                  {count === 0
                    ? t.areaNoneYet
                    : count === 1
                      ? t.oneProperty
                      : t.nProperties.replace("{n}", String(count))}
                </p>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
