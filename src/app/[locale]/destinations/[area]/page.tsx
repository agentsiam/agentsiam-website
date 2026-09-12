import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { IconChip } from "@/components/icon";
import { JsonLd } from "@/components/json-ld";
import { PropertyTile } from "@/components/property-tile";
import { getDictionary } from "@/i18n";
import { isLocale, localePath, LOCALES, type Locale } from "@/i18n/config";
import { AREAS, areaBySlug, CITY_CENTRE, distanceKm } from "@/lib/areas";
import { areaContent, areaLine, guidePlacesInArea } from "@/lib/area-content";
import { categoryIcon } from "@/lib/guide-icons";
import { propertiesInArea } from "@/lib/property";
import { searchToQuery } from "@/lib/search";
import { pageMeta, routeOgImage } from "@/lib/site";
import { breadcrumbSchema, type Crumb } from "@/lib/structured-data";
import { areaVibe } from "@/i18n/area-vibe";
import { alt as ogAlt } from "./opengraph-image";

/**
 * One neighbourhood.
 *
 * Prerendered for every area in every language, because these are the pages organic search
 * is meant to land on -- "where to stay in Nimman" is a question people type, and the
 * answer should be a served HTML page rather than something a crawler has to run
 * JavaScript to see.
 *
 * The page answers four questions in order, and the order is the argument: what the place
 * is like, what is actually there, who it suits, and only then what we manage in it. A page
 * that led with our inventory would be a listings page with a neighbourhood name on it, and
 * seven of the eight would have nothing to lead with.
 *
 * **Every claim on this page has to be sourceable.** Three things carry it. The description
 * comes from `AREA_CONTENT` in src/lib/area-content.ts, written against what the guide data
 * shows; the places section is the guide data itself, rendered with the host's own note and
 * omitted entirely where the area has none; and "Who it suits" is labelled as judgement in
 * the reader's own language rather than dressed up as fact. Where an area has no guide
 * entries at all -- Hang Dong, Mae Rim, San Sai -- the description carries
 * `areaUnsourcedFrom` under it, saying so.
 *
 * **The distance figure names its origin.** It used to read "2.9 km to centre", which was
 * true and unverifiable: it is a straight-line distance from Tha Phae Gate, per CITY_CENTRE
 * in areas.ts, and neither half of that was on the page. Both are now, beside the number.
 *
 * The empty state is still the important part today. Seven of the eight areas have nothing
 * in them, and a page that just stopped would read as broken. So an empty area still says
 * plainly that we manage nothing there yet, and offers the two things that are actually
 * useful: everything we do have, and a way to ask.
 */

/** Six is the point where a list stops being a taste of the guide and becomes the guide. */
const GUIDE_PREVIEW = 6;

export function generateStaticParams() {
  return LOCALES.flatMap((locale) => AREAS.map((area) => ({ locale, area: area.slug })));
}

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/destinations/[area]">): Promise<Metadata> {
  const { locale, area: slug } = await params;
  if (!isLocale(locale)) notFound();
  const t = getDictionary(locale);
  const area = areaBySlug(slug);
  if (!area) notFound();

  return pageMeta({
    title: t.metaAreaTitle.replace("{area}", area.name),
    description: t.metaAreaDesc.replace("{area}", area.name).replace("{vibe}", areaVibe(t, area)),
    path: `/destinations/${area.slug}`,
    locale,
    image: routeOgImage(locale, `/destinations/${area.slug}`, ogAlt),
  });
}

export default async function AreaPage({
  params,
}: PageProps<"/[locale]/destinations/[area]">) {
  const { locale, area: slug } = await params;
  if (!isLocale(locale)) notFound();
  const area = areaBySlug(slug);
  if (!area) notFound();

  const t = getDictionary(locale);
  const href = (path: string) => localePath(locale as Locale, path);
  const properties = propertiesInArea(area.slug);
  const km = distanceKm(CITY_CENTRE, { lat: area.lat, lng: area.lng });
  const content = areaContent(area.slug);
  const guidePlaces = guidePlacesInArea(area.slug);
  const shown = guidePlaces.slice(0, GUIDE_PREVIEW);

  // One trail, rendered and marked up from the same array so the two cannot drift apart.
  //
  // The trail used to end on "Chiang Mai" while the markup ended on the neighbourhood. It
  // now ends on the neighbourhood in both, which is this page. The city is not a crumb:
  // every crumb but the last needs a URL, and there is no Chiang Mai page to give it one.
  const crumbs: Crumb[] = [
    { name: t.navDestinations, path: "/destinations" },
    { name: area.name },
  ];

  return (
    /* container-prose, not container-chrome. This is a reading page rather than a grid of
       tiles, and /how-it-works already settles what a reading page is measured at. At
       chrome width the panels ran to 1,400px under paragraphs that stop at 680, which
       reads as two pages stacked. */
    <div className="mx-auto max-w-(--container-prose) px-5 pb-18 pt-9">
      <JsonLd data={breadcrumbSchema(locale, crumbs)} />
      <nav aria-label="Breadcrumb" className="eyebrow">
        <Link href={href("/destinations")} className="hit hover:text-primary">
          {t.navDestinations}
        </Link>{" "}
        · {area.name}
      </nav>

      {/* shape: page-header -- Name, vibe, and the distance with its method beside it. */}
      <h1 className="mt-3 font-headline text-[clamp(28px,5vw,40px)] font-extrabold leading-[1.1] tracking-[-0.03em]">
        {area.name}
      </h1>
      <p className="mt-2.5 max-w-[560px] text-base leading-relaxed text-body">
        {areaVibe(t, area)}
      </p>
      {/* The figure and the two things that make it checkable, in one box. Separating them
          is how "2.9 km to centre" happened: a number with no origin and no method. */}
      <div className="mt-5 inline-flex items-center gap-3 rounded-box border border-hairline py-2.5 pl-2.5 pr-4">
        <IconChip name="pin" />
        <span>
          <span className="block text-[14px] font-semibold">
            {t.areaKmFromGate.replace(
              "{n}",
              km < 10 ? km.toFixed(1) : String(Math.round(km)),
            )}
          </span>
          <span className="mt-0.5 block text-[12.5px] text-muted">{t.areaKmNote}</span>
        </span>
      </div>

      {/* shape: prose -- What it is like. Two or three paragraphs, at a reading measure. */}
      {content ? (
        <section className="mt-12">
          <div className="flex items-center gap-3">
            <IconChip name="document" />
            <h2 className="font-display text-xl font-bold tracking-[-0.015em]">
              {t.areaWhatTitle}
            </h2>
          </div>
          <div className="mt-4 max-w-[680px] space-y-3.5">
            {content.what.map((key) => (
              <p key={key} className="text-[15.5px] leading-relaxed text-body">
                {areaLine(t, key)}
              </p>
            ))}
          </div>
          {/* Said out loud where we have nothing first-hand, rather than left for the
              reader to work out from an absent section. */}
          {guidePlaces.length === 0 ? (
            <p className="mt-5 max-w-[680px] rounded-box bg-surface px-5 py-4 text-[14px] leading-relaxed text-muted">
              {areaLine(t, "areaUnsourcedFrom")}
            </p>
          ) : null}
        </section>
      ) : null}

      {/* shape: guide-list -- The guide's own entries for this area. Omitted, not emptied,
          where the area has none: an empty section is a claim that there is nothing there,
          and what is true is that we have not been. */}
      {shown.length > 0 ? (
        <section className="mt-12">
          <div className="flex items-center gap-3">
            <IconChip name="walk" />
            <h2 className="font-display text-xl font-bold tracking-[-0.015em]">
              {t.areaGuideTitle}
            </h2>
          </div>
          <p className="mt-3 max-w-[680px] text-[14px] leading-relaxed text-muted">
            {t.areaGuideSub}
          </p>
          <ul className="mt-5 grid gap-3 lg:grid-cols-2">
            {shown.map((place) => (
              <li
                key={place.name}
                className="rounded-panel border border-hairline p-4 sm:p-5"
              >
                <h3 className="font-display text-[16px] font-bold leading-snug tracking-[-0.015em]">
                  {/* Decorative: the category is written out on the next line, so a screen
                      reader announcing the emoji would only repeat it. */}
                  <span aria-hidden="true" className="mr-1.5">
                    {categoryIcon(place.category)}
                  </span>
                  <span lang={locale === "en" ? undefined : "en"}>{place.name}</span>
                </h3>
                {/* The place name, its category and the host's note all come from the
                    generated guide, which is built from an English sheet and is never
                    hand-edited, so all three stay English on /th and /zh. lang="en" is
                    the honest markup for that: a Thai voice engine reading English aloud
                    in Thai is the failure this attribute exists to prevent. The section
                    intro already says the notes are the hosts' own. */}
                <p
                  className="eyebrow mt-1.5"
                  lang={locale === "en" ? undefined : "en"}
                >
                  {place.category}
                </p>
                {place.comment ? (
                  <p
                    lang={locale === "en" ? undefined : "en"}
                    className="mt-2 text-[14px] leading-relaxed text-body"
                  >
                    {place.comment}
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
          <Link
            /* `area` is the local guide's own filter param, checked against that page
               rather than guessed: a wrong name would render an unfiltered guide and
               look like it worked. */
            href={`${href("/lotushouse/local-guide")}?area=${area.slug}`}
            className="hit mt-5 inline-block text-[14px] font-semibold underline underline-offset-[3px] hover:text-primary"
          >
            {t.areaGuideAll.replace("{n}", String(guidePlaces.length))}
          </Link>
        </section>
      ) : null}

      {/* shape: judgement-list -- Who it suits, and the line that says who it does not.
          The fourth line is not an afterthought: a block of three reasons to book and no
          reason not to is an advert, and the site's argument is that we say the awkward
          part first. */}
      {content ? (
        <section className="mt-12">
          <div className="flex items-center gap-3">
            <IconChip name="talk" />
            <h2 className="font-display text-xl font-bold tracking-[-0.015em]">
              {t.areaWhoTitle}
            </h2>
          </div>
          <p className="mt-3 max-w-[680px] text-[14px] leading-relaxed text-muted">
            {t.areaWhoNote}
          </p>
          <ul className="mt-5 max-w-[680px] space-y-2.5">
            {content.suits.map((key) => (
              <li
                key={key}
                className="flex gap-3 text-[15px] leading-relaxed text-body"
              >
                <span aria-hidden="true" className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-teal" />
                <span>{areaLine(t, key)}</span>
              </li>
            ))}
            <li className="flex gap-3 text-[15px] leading-relaxed text-body">
              <span aria-hidden="true" className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-secondary" />
              <span>{areaLine(t, content.notFor)}</span>
            </li>
          </ul>
        </section>
      ) : null}

      {/* shape: inventory -- What we manage here. Unchanged: the empty copy is the most
          load-bearing paragraph on the page and is not softened. */}
      {properties.length > 0 ? (
        <section className="mt-12">
          <div className="flex items-center gap-3">
            <IconChip name="house" />
            <h2 className="font-display text-xl font-bold tracking-[-0.015em]">
              {properties.length === 1
                ? t.oneProperty
                : t.nProperties.replace("{n}", String(properties.length))}
            </h2>
          </div>
          <div className="mt-5 grid gap-6 sm:grid-cols-[repeat(auto-fill,minmax(300px,1fr))]">
            {properties.map((property) => (
              <PropertyTile
                key={property.slug}
                property={property}
                t={t}
                href={href(`/${property.slug}`)}
              />
            ))}
          </div>
        </section>
      ) : (
        /* Honest, not apologetic, and never a dead end. */
        <section className="mt-12 rounded-panel bg-wash-gold px-7 py-9">
          <h2 className="font-display text-xl font-bold tracking-[-0.015em]">
            {t.areaEmptyTitle.replace("{area}", area.name)}
          </h2>
          <p className="mt-2.5 max-w-[520px] text-[15px] leading-relaxed text-body">
            {t.areaEmptyBody}
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link href={href("/properties")} className="pill-primary">
              {t.seeEverything}
            </Link>
            <Link
              href={href("/contact")}
              className="rounded-full border-[1.5px] border-ink px-6 py-3.5 text-[15px] font-semibold hover:bg-ink hover:text-white"
            >
              {t.tellUsWhatYouNeed}
            </Link>
          </div>
        </section>
      )}

      {/* shape: closing-cta -- The pair. Ask a person, or read the guide. */}
      <section className="mt-12 rounded-panel bg-surface px-7 py-9">
        <h2 className="font-display text-xl font-bold tracking-[-0.015em]">
          {t.areaCloseTitle}
        </h2>
        <p className="mt-2.5 max-w-[560px] text-[15px] leading-relaxed text-body">
          {t.areaCloseBody}
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link href={href("/contact")} className="pill-primary">
            {t.tellUsWhatYouNeed}
          </Link>
          <Link href={href("/lotushouse/local-guide")} className="pill-outline">
            {t.areaCloseGuide}
          </Link>
        </div>
      </section>

      {/* The other neighbourhoods, so this page is a junction rather than a cul-de-sac. */}
      <section className="mt-14 border-t border-hairline pt-8">
        <h2 className="font-display text-lg font-bold tracking-[-0.015em]">
          {t.otherAreas}
        </h2>
        <ul className="mt-3.5 flex flex-wrap gap-2">
          {AREAS.filter((other) => other.slug !== area.slug).map((other) => (
            <li key={other.slug}>
              <Link
                href={href(`/destinations/${other.slug}`)}
                className="inline-block rounded-full border-[1.5px] border-hairline px-3.5 py-2 text-[12.5px] hover:border-ink"
              >
                {other.name}
              </Link>
            </li>
          ))}
          <li>
            <Link
              href={href("/properties") + searchToQuery({ areas: [area.slug] })}
              className="inline-block rounded-full bg-surface px-3.5 py-2 text-[12.5px] hover:bg-surface-2"
            >
              {t.searchThisArea.replace("{area}", area.name)}
            </Link>
          </li>
        </ul>
      </section>
    </div>
  );
}
