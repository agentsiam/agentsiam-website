import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DirectionsLinks } from "@/components/directions-links";
import { ResultsMap, type Pin } from "@/components/results-map";
import { WhatsAppCta } from "@/components/whatsapp-cta";
import { getDictionary } from "@/i18n";
import { isLocale, localePath, LOCALES, type Locale } from "@/i18n/config";
import { areaBySlug } from "@/lib/areas";
import { categoryIcon } from "@/lib/guide-icons";
import { PHOTOS } from "@/lib/photos.generated";
import { GUIDE_CATEGORIES, GUIDE_DISTANCES, GUIDE_PLACES } from "@/lib/guide.generated";
import { LOTUS_HOUSE } from "@/lib/property";
import { pageMeta, WHATSAPP_NUMBER } from "@/lib/site";

/**
 * The guest local guide.
 *
 * Carried over from the Wix site at the same URL, which is why there is no redirect for it:
 * published links and anything indexed keep working.
 *
 * **Filters are URL state, not React state.** Same argument as the property search: a
 * filtered list that only exists after JavaScript runs is invisible to a crawler and
 * impossible to send to someone. Every filter here is a link, the page is server-rendered,
 * and "coffee within walking distance" is a URL you can paste into a message.
 *
 * **Distances come from the property, not the sheet.** The sheet's own walk and drive
 * columns are hardcoded to Lotus House and are deliberately not imported. GUIDE_DISTANCES
 * is keyed by property, so when there is a second property this page serves it by looking
 * up a different key rather than by being rewritten.
 */

const NEARBY_MINUTES = 20;

export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/lotushouse/local-guide">): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = getDictionary(locale);

  return pageMeta({
    title: t.metaGuideTitle.replace("{property}", LOTUS_HOUSE.title),
    description: t.metaGuideDesc
      .replace("{n}", String(GUIDE_PLACES.length))
      .replace("{property}", LOTUS_HOUSE.title),
    path: "/lotushouse/local-guide",
    locale,
  });
}

export default async function LocalGuidePage({
  params,
  searchParams,
}: PageProps<"/[locale]/lotushouse/local-guide">) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const query = await searchParams;
  const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

  const t = getDictionary(locale);
  const href = (path: string) => localePath(locale as Locale, path);

  const category = GUIDE_CATEGORIES.includes(one(query.for) ?? "") ? one(query.for)! : null;
  const area = one(query.area) ?? null;
  const nearby = one(query.near) === "1";
  const picks = one(query.picks) === "1";

  const distances = GUIDE_DISTANCES[LOTUS_HOUSE.slug] ?? {};

  const places = GUIDE_PLACES.filter((place) => {
    const d = distances[place.name];
    if (category && place.category !== category) return false;
    if (area && (area === "outside" ? place.area !== null : place.area !== area)) return false;
    if (nearby && !(d?.walk !== null && d?.walk !== undefined && d.walk <= NEARBY_MINUTES)) return false;
    if (picks && !place.highlight) return false;
    return true;
  }).sort((a, b) => {
    // Closest on foot first, because that is the question a guest standing in the hallway
    // is actually asking. Anything unwalkable sorts to the end by drive time.
    const wa = distances[a.name]?.walk ?? null;
    const wb = distances[b.name]?.walk ?? null;
    if (wa !== null && wb !== null) return wa - wb;
    if (wa !== null) return -1;
    if (wb !== null) return 1;
    return (distances[a.name]?.drive ?? 0) - (distances[b.name]?.drive ?? 0);
  });

  // Only the neighbourhoods that actually contain something, so the filter never offers a
  // choice that leads to an empty page.
  const areasPresent = [...new Set(GUIDE_PLACES.map((p) => p.area).filter((a): a is string => a !== null))];
  const hasOutside = GUIDE_PLACES.some((p) => p.area === null);

  const pins: Pin[] = places.map((place) => ({
    slug: place.name,
    title: place.name,
    lat: place.lat,
    lng: place.lng,
    price: null,
    currency: "",
    icon: categoryIcon(place.category),
    highlight: place.highlight,
  }));

  // Opens at the scale a guest is standing in. Framing on all 109 would include Doi
  // Inthanon 86km away and crush the fifty-odd places around the house into a smudge.
  const home = { lat: LOTUS_HOUSE.lat, lng: LOTUS_HOUSE.lng, label: LOTUS_HOUSE.title };
  const propertyPhoto = (PHOTOS[LOTUS_HOUSE.slug] ?? [])[0];
  const walkable = places.filter((place) => {
    const walk = distances[place.name]?.walk;
    return walk != null && walk <= NEARBY_MINUTES;
  });
  const frameOn = [home, ...(walkable.length ? walkable : places).map((p) => ({ lat: p.lat, lng: p.lng }))];

  const filterHref = (patch: Record<string, string | null>) => {
    const next = new URLSearchParams();
    const current: Record<string, string | null> = {
      for: category,
      area,
      near: nearby ? "1" : null,
      picks: picks ? "1" : null,
      ...patch,
    };
    for (const [k, v] of Object.entries(current)) if (v) next.set(k, v);
    const qs = next.toString();
    return href(`/lotushouse/local-guide${qs ? `?${qs}` : ""}`);
  };

  const chip = (active: boolean) =>
    `rounded-full border px-3 py-1.5 text-[13px] transition-colors ${
      active ? "border-ink bg-ink text-bg font-semibold" : "border-hairline hover:border-ink"
    }`;


  return (
    <div className="mx-auto max-w-(--container-chrome) px-5 pb-18 pt-9">
      <p className="eyebrow">
        <Link href={href("/lotushouse")} className="hover:underline">
          {LOTUS_HOUSE.title}
        </Link>
      </p>
      <h1 className="mt-2 font-headline text-3xl font-extrabold tracking-[-0.03em] sm:text-4xl">
        {t.guideTitle}
      </h1>
      <p className="mt-3 max-w-2xl text-body">{t.guideIntro}</p>


      <div className="mt-7 flex flex-wrap gap-2">
        <Link
          href={filterHref({ picks: picks ? null : "1" })}
          className={
            picks
              ? "inline-flex items-center gap-1.5 rounded-full border border-secondary bg-secondary px-3 py-1.5 text-[13px] font-semibold text-white"
              : "inline-flex items-center gap-1.5 rounded-full border border-secondary px-3 py-1.5 text-[13px] font-semibold text-secondary transition-colors hover:bg-wash-red"
          }
        >
          <span aria-hidden="true">★</span>
          {t.guidePicks}
        </Link>
        <Link href={filterHref({ near: nearby ? null : "1" })} className={chip(nearby)}>
          {t.guideNearby}
        </Link>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <Link href={filterHref({ for: null })} className={chip(!category)}>
          {t.guideAll}
        </Link>
        {GUIDE_CATEGORIES.map((name) => (
          <Link key={name} href={filterHref({ for: name })} className={chip(category === name)}>
            {name}
          </Link>
        ))}
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <Link href={filterHref({ area: null })} className={chip(!area)}>
          {t.guideFilterArea}: {t.guideAll}
        </Link>
        {areasPresent.map((slug) => (
          <Link key={slug} href={filterHref({ area: slug })} className={chip(area === slug)}>
            {areaBySlug(slug)?.name ?? slug}
          </Link>
        ))}
        {hasOutside ? (
          <Link href={filterHref({ area: "outside" })} className={chip(area === "outside")}>
            {t.guideOutsideAreas}
          </Link>
        ) : null}
      </div>

      <p className="mt-6 text-[13px] text-muted">
        {places.length === 1 ? t.guideCountOne : t.guideCount.replace("{n}", String(places.length))}
      </p>

      {places.length === 0 ? (
        <div className="mt-6 rounded-panel border border-hairline p-8 text-center">
          <p>{t.guideEmpty}</p>
          <Link href={href("/lotushouse/local-guide")} className="mt-3 inline-block font-semibold underline">
            {t.guideClear}
          </Link>
        </div>
      ) : (
        <div className="mt-6 grid gap-6 lg:grid-cols-2 lg:items-start">
          <ul className="grid gap-3">
            {places.map((place) => {
              const d = distances[place.name];
              const areaName = place.area ? areaBySlug(place.area)?.name : null;
              return (
                <li
                  key={place.name}
                  data-map-key={place.name}
                  className="rounded-panel border border-hairline p-4 transition-colors hover:border-ink"
                >
                  <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                    <h2 className="font-display text-[17px] font-bold tracking-[-0.015em]">
                      {/* Decorative: the category is written out immediately below, so a
                          screen reader announcing the emoji would just repeat it. */}
                      <span aria-hidden="true" className="mr-1.5">
                        {categoryIcon(place.category)}
                      </span>
                      {place.name}
                    </h2>
                    {place.highlight ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-[0.04em] text-white">
                        <span aria-hidden="true">★</span>
                        {t.guidePicks}
                      </span>
                    ) : null}
                  </div>

                  <p className="eyebrow mt-1">
                    {place.category}
                    {areaName ? ` · ${areaName}` : ` · ${t.guideOutsideAreas}`}
                  </p>

                  {place.comment ? (
                    <p className="mt-2 text-[14px] text-body">{place.comment}</p>
                  ) : null}

                  <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-[13px] text-muted">
                    <span>
                      {d?.walk != null
                        ? `${d.walk} ${t.guideWalk}`
                        : t.guideNoWalk}
                      {d?.drive != null ? ` · ${d.drive} ${t.guideDrive}` : ""}
                    </span>
                    <DirectionsLinks
                      from={{ lat: LOTUS_HOUSE.lat, lng: LOTUS_HOUSE.lng }}
                      to={{ lat: place.lat, lng: place.lng }}
                      mode={d?.walk != null ? "walking" : "driving"}
                      t={t}
                    />
                  </div>
                </li>
              );
            })}
          </ul>

          {/* The property, as context rather than as an interruption.
              It sat above the title before, where it competed with the filters, which are
              the actual control on a browsing page. Here it stays beside the guide the
              whole way down, carries the note explaining what the times are measured from,
              and gives the map column a reason to start with something human. */}
          <div className="grid gap-3 min-[900px]:sticky min-[900px]:top-[150px]">
            <Link
              href={href("/lotushouse")}
              className="grid grid-cols-[76px_1fr] items-center gap-3 rounded-panel border border-hairline p-3 transition-colors hover:border-ink"
            >
              {propertyPhoto ? (
                <div className="relative aspect-square overflow-hidden rounded-box">
                  <Image
                    src={propertyPhoto.src}
                    alt={propertyPhoto.alt || LOTUS_HOUSE.title}
                    placeholder="blur"
                    fill
                    sizes="76px"
                    className="object-cover"
                  />
                </div>
              ) : null}
              <div>
                <p className="font-display text-[15px] font-bold tracking-[-0.015em]">
                  {LOTUS_HOUSE.title}
                </p>
                <p className="mt-0.5 text-[12px] text-muted">
                  {t.guideFrom.replace("{property}", LOTUS_HOUSE.title)}
                </p>
                <span className="mt-2 inline-block rounded-full bg-ink px-3 py-1.5 text-[12px] font-semibold text-bg">
                  {t.guideBookDirect}
                </span>
              </div>
            </Link>

            <ResultsMap
              pins={pins}
              t={t}
              panOnCardClick
              collapsible={false}
              cluster
              home={home}
              frameOn={frameOn}
              sticky={false}
              mapHeightClass="min-[900px]:h-[calc(100vh-320px)]"
            />
          </div>
        </div>
      )}

      {places.length > 0 ? (
        <div className="mt-10 rounded-panel border border-hairline bg-surface p-6 text-center">
          <p className="font-display text-lg font-bold tracking-[-0.015em]">
            {t.guideBookDirect}
          </p>
          <p className="mt-1 text-[14px] text-muted">{t.guideBookDirectSub}</p>
          <Link
            href={href("/lotushouse")}
            className="mt-4 inline-block rounded-full bg-ink px-5 py-2.5 text-[14px] font-semibold text-bg transition-opacity hover:opacity-85"
          >
            {LOTUS_HOUSE.title}
          </Link>
        </div>
      ) : null}

      <WhatsAppCta number={WHATSAPP_NUMBER} t={t} context={LOTUS_HOUSE.title} />
    </div>
  );
}
