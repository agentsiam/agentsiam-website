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
import { CRISP_WEBSITE_ID, pageMeta, routeOgImage, WHATSAPP_NUMBER } from "@/lib/site";
import { alt as ogAlt } from "./opengraph-image";

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

/**
 * Beyond this, a place stops reading as "local". Paul's call, 11/09/2026: Ferment Space
 * came in at roughly 12km via the massage and wellness sheet rows, which is honest data but
 * not a "local guide" claim, so places past this radius are dropped from the guide entirely
 * rather than sorted into an "outside" filter the way the sheet's own neighbourhood-area cap
 * already handles the nearer case. Measured from GUIDE_DISTANCES' routed metres, so it is
 * per property once a second one exists, same as the walk and drive times themselves.
 */
const MAX_DISTANCE_M = 12_000;

/** How many cards render before "Show more". Keeps the default view from reading as one
 * endless list; the map still gets every filtered pin regardless, only the text list pages. */
const PAGE_SIZE = 24;

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
    // The guide's own card, not the site-wide owner pitch. See
    // src/app/[locale]/lotushouse/local-guide/opengraph-image.tsx for why.
    image: routeOgImage(locale, "/lotushouse/local-guide", ogAlt),
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
    if (d?.metres != null && d.metres > MAX_DISTANCE_M) return false;
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

  // The house itself, not the neighbourhood centre. Paul's call, 11/09/2026, reversing the
  // page's earlier position: the pin here used to be the area centroid, roughly 1.4km from
  // the real house for Lotus House's own area, which read as a broken pin rather than a
  // deliberately fuzzed one. Exact street address still stays booking-confirmation-only
  // (property.ts, `address`) -- only the coordinate is published here, same as the plain
  // lat/lng pair a Google Maps link already carries.
  const origin = { lat: LOTUS_HOUSE.lat, lng: LOTUS_HOUSE.lng, label: LOTUS_HOUSE.title };
  const home = origin;
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

  // How many cards are on the page right now. `n` rides the same URL-state pattern as
  // every filter here (filterHref above already forwards an arbitrary patch, `n` included,
  // so this needed no new plumbing) -- which also means changing a filter chip drops back
  // to PAGE_SIZE for free, since filterHref only ever sets the four filter keys it knows
  // about and never carries `n` over from the current URL. A guest who pastes a guide link
  // mid-scroll still gets the fuller list back, because the count travels in the URL too.
  const requestedCount = Number(one(query.n));
  const shown = Number.isFinite(requestedCount) && requestedCount > PAGE_SIZE
    ? Math.min(Math.floor(requestedCount), places.length)
    : Math.min(PAGE_SIZE, places.length);
  const visiblePlaces = places.slice(0, shown);
  const moreCount = Math.min(PAGE_SIZE, places.length - shown);
  const showMoreHref = filterHref({ n: String(shown + PAGE_SIZE) });

  // Where this batch's new cards start, so the "show more" anchor lands on the first one
  // rather than the list's end. The right column is short and sticky, so by the time a
  // guest has scrolled through a long list it has long since scrolled out of its own sticky
  // range -- an anchor at the very bottom of the list lands past it, on the CTA and footer,
  // with the cards that just loaded sitting above the viewport instead of in it.
  const newBatchIndex = shown > PAGE_SIZE ? shown - PAGE_SIZE : null;

  // Narrow label objects rather than the whole dictionary. React dedupes a prop object to
  // one copy per document, so passing `t` to three components cost one serialized
  // dictionary -- 778 keys, about 21KB gzipped, on the heaviest page of the site, for
  // eleven strings between them. The pattern is PhotoGallery's, which already did this.
  const directionsLabels = {
    directions: t.guideDirections,
    google: t.guideDirectionsGoogle,
    apple: t.guideDirectionsApple,
    directionsTo: t.directionsTo,
    newTab: t.newTab,
  };
  const askLabels = {
    title: t.guideAskTitle,
    body: t.guideAskBody,
    cta: t.guideAskCta,
    dismiss: t.guideAskDismiss,
    prefill: t.guideAskPrefill,
  };

  const chip = (active: boolean) =>
    `inline-flex min-h-11 items-center rounded-full border px-3.5 py-1.5 text-[13px] transition-colors ${
      active ? "border-ink bg-ink text-bg font-semibold" : "border-hairline hover:border-ink"
    }`;

  // aria-current, because the active chip was distinguished by colour alone. The chips are
  // links rather than buttons -- every filter here is a URL, deliberately -- so "current"
  // is the right word for the one whose destination is the page you are on.
  const chipCurrent = (active: boolean) => (active ? ("true" as const) : undefined);


  return (
    <div className="mx-auto max-w-(--container-chrome) px-5 pb-18 pt-9">
      {locale !== "en" ? (
        <p className="mb-6 rounded-panel bg-wash-gold px-5 py-3 text-[12.5px] leading-relaxed text-body">
          {t.guidePendingNote}
        </p>
      ) : null}
      <p className="eyebrow">
        <Link href={href("/lotushouse")} className="hit hover:underline">
          {LOTUS_HOUSE.title}
        </Link>
      </p>
      <h1 className="mt-2 font-headline text-3xl font-extrabold tracking-[-0.03em] sm:text-4xl">
        {t.guideTitle}
      </h1>
      <p className="mt-3 max-w-2xl text-body">{t.guideIntro}</p>


      <div
        role="group"
        aria-label={t.guideFilterPicks}
        className="mt-7 flex flex-wrap gap-2"
      >
        <Link
          aria-current={chipCurrent(picks)}
          href={filterHref({ picks: picks ? null : "1" })}
          className={
            picks
              ? "inline-flex min-h-11 items-center gap-1.5 rounded-full border border-deep-red bg-deep-red px-3.5 py-1.5 text-[13px] font-semibold text-white"
              : "inline-flex min-h-11 items-center gap-1.5 rounded-full border border-secondary px-3.5 py-1.5 text-[13px] font-semibold text-deep-red transition-colors hover:bg-wash-red"
          }
        >
          <span aria-hidden="true">★</span>
          {t.guidePicks}
        </Link>
        <Link
          aria-current={chipCurrent(nearby)}
          href={filterHref({ near: nearby ? null : "1" })}
          className={chip(nearby)}
        >
          {t.guideNearby}
        </Link>
      </div>

      <div
        role="group"
        aria-label={t.guideFilterCategory}
        className="mt-3 flex flex-wrap gap-2"
      >
        <Link
          aria-current={chipCurrent(!category)}
          href={filterHref({ for: null })}
          className={chip(!category)}
        >
          {t.guideAll}
        </Link>
        {GUIDE_CATEGORIES.map((name) => (
          <Link
            key={name}
            aria-current={chipCurrent(category === name)}
            href={filterHref({ for: name })}
            className={chip(category === name)}
          >
            {name}
          </Link>
        ))}
      </div>

      <div
        role="group"
        aria-label={t.guideFilterArea}
        className="mt-3 flex flex-wrap gap-2"
      >
        <Link
          aria-current={chipCurrent(!area)}
          href={filterHref({ area: null })}
          className={chip(!area)}
        >
          {t.guideFilterArea}: {t.guideAll}
        </Link>
        {areasPresent.map((slug) => (
          <Link
            key={slug}
            aria-current={chipCurrent(area === slug)}
            href={filterHref({ area: slug })}
            className={chip(area === slug)}
          >
            {areaBySlug(slug)?.name ?? slug}
          </Link>
        ))}
        {hasOutside ? (
          <Link
            aria-current={chipCurrent(area === "outside")}
            href={filterHref({ area: "outside" })}
            className={chip(area === "outside")}
          >
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
          <div className="grid gap-6">
            <ul className="grid gap-3">
              {visiblePlaces.map((place, index) => {
                const d = distances[place.name];
                const areaName = place.area ? areaBySlug(place.area)?.name : null;
                return (
                  <li
                    key={place.name}
                    id={index === newBatchIndex ? "guide-list-more" : undefined}
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
                        <span className="inline-flex items-center gap-1 rounded-full bg-deep-red px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-[0.04em] text-white">
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
                          ? t.guideWalk.replace("{n}", String(d.walk))
                          : t.guideNoWalk}
                        {d?.drive != null
                          ? ` · ${t.guideDrive.replace("{n}", String(d.drive))}`
                          : ""}
                      </span>
                      <DirectionsLinks
                        from={{ lat: origin.lat, lng: origin.lng }}
                        to={{ lat: place.lat, lng: place.lng }}
                        mode={d?.walk != null ? "walking" : "driving"}
                        place={place.name}
                        labels={directionsLabels}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>

            {moreCount > 0 ? (
              <Link
                href={`${showMoreHref}#guide-list-more`}
                className="justify-self-start rounded-full border border-hairline px-4 py-2 text-[13px] font-semibold transition-colors hover:border-ink"
              >
                {t.guideShowMore.replace("{n}", String(moreCount))}
              </Link>
            ) : null}
          </div>

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
                    lang="en"
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
              mapLabel={t.mapLabel}
              locale={locale}
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
        <div className="mt-10 rounded-panel bg-surface px-7 py-9">
          <p className="font-display text-xl font-bold tracking-[-0.015em]">
            {t.guideBookDirect}
          </p>
          <p className="mt-1 text-[14px] text-muted">{t.guideBookDirectSub}</p>
          <Link
            href={href("/lotushouse")}
            className="pill-primary mt-4"
          >
            {LOTUS_HOUSE.title}
          </Link>
        </div>
      ) : null}

      <WhatsAppCta
        number={WHATSAPP_NUMBER}
        chatConfigured={Boolean(CRISP_WEBSITE_ID)}
        labels={askLabels}
        context={LOTUS_HOUSE.title}
      />
    </div>
  );
}
