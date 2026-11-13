import Image from "next/image";
import Link from "next/link";
import { DirectionsLinks } from "@/components/directions-links";
import { ResultsMap, type Pin } from "@/components/results-map";
import { WhatsAppCta } from "@/components/whatsapp-cta";
import { getDictionary } from "@/i18n";
import { localePath, type Locale } from "@/i18n/config";
import { areaName } from "@/lib/area-content";
import { categoryIcon, categoryLabel, tagLabel, tagsInFamily } from "@/lib/guide-vocabulary";
import { PHOTOS } from "@/lib/photos.generated";
import { GUIDE_CATEGORIES, GUIDE_DISTANCES, GUIDE_PLACES, GUIDE_TAGS } from "@/lib/guide.generated";
import { JsonLd } from "@/components/json-ld";
import { PrintButton } from "@/components/print-button";
import { CRISP_WEBSITE_ID, SITE_NAME, WHATSAPP_NUMBER } from "@/lib/site";
import { breadcrumbSchema, type Crumb } from "@/lib/structured-data";
import { guideStart, guideStartLabel } from "@/lib/guide-start";

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
 * **Distances come from the property's start point, not the sheet and not the house.** The
 * sheet's own walk and drive columns are hardcoded to Lotus House and are deliberately not
 * imported. GUIDE_DISTANCES is keyed by property and measured from the public place named in
 * src/lib/guide-start.ts. The house's own coordinate never reaches this page: not in a
 * route, not on the map, not in the payload. Paul, 08/11/2026.
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

/** The house the guide is for. No coordinate: the guide is measured from its start point. */
export type GuideProperty = { slug: string; title: string };

export function LocalGuide({
  locale,
  query,
  property,
  bookable,
}: {
  locale: Locale;
  query: Record<string, string | string[] | undefined>;
  property: GuideProperty;
  /** False until the house takes bookings: the "book direct" prompts are dropped, not faked. */
  bookable: boolean;
}) {
  const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

  const t = getDictionary(locale);
  const href = (path: string) => localePath(locale as Locale, path);

  const category = GUIDE_CATEGORIES.includes(one(query.for) ?? "") ? one(query.for)! : null;
  const area = one(query.area) ?? null;
  // Checked against GUIDE_TAGS rather than the vocabulary, so ?tag= with a real but unused
  // slug reads as no filter instead of an empty page.
  const tag = GUIDE_TAGS.includes(one(query.tag) ?? "") ? one(query.tag)! : null;
  const nearby = one(query.near) === "1";
  const picks = one(query.picks) === "1";

  const distances = GUIDE_DISTANCES[property.slug] ?? {};
  const start = guideStart(property.slug);
  const startLabel = start ? guideStartLabel(start.name) : "";
  const isStart = (name: string) => name === start?.name;

  const places = GUIDE_PLACES.filter((place) => {
    const d = distances[place.name];
    if (d?.metres != null && d.metres > MAX_DISTANCE_M) return false;
    if (category && place.category !== category) return false;
    if (area && (area === "outside" ? place.area !== null : place.area !== area)) return false;
    if (tag && !place.tags.includes(tag)) return false;
    if (nearby && !(d?.walk !== null && d?.walk !== undefined && d.walk <= NEARBY_MINUTES)) return false;
    if (picks && !place.highlight) return false;
    return true;
  }).sort((a, b) => {
    // Nearest first by routed distance, so the order holds however the guest travels. Until
    // 06/11/2026 this sorted by walking time; Paul: in Thailand driving (Grab, scooter, car) is
    // more common than walking, so the drive time now leads on every card.
    return (distances[a.name]?.metres ?? Infinity) - (distances[b.name]?.metres ?? Infinity);
  });

  // The default view, before any filter: the five blocks added 06/11/2026 (consulting repo,
  // as-work/2026-11-06-local-guide/), each derived from the generated guide and nothing else.
  const isDefault = !category && !area && !tag && !nearby && !picks && !one(query.n);
  const walkOf = (name: string) => distances[name]?.walk ?? null;
  const driveOf = (name: string) => distances[name]?.drive ?? null;
  // "3 min drive · 14 min walk": drive first, walk where there is one.
  const howFar = (name: string) =>
    isStart(name) ? t.guideStartHere : [
      driveOf(name) != null ? t.guideDrive.replace("{n}", String(driveOf(name))) : null,
      walkOf(name) != null ? t.guideWalk.replace("{n}", String(walkOf(name))) : null,
    ]
      .filter(Boolean)
      .join(" · ");
  const inRange = GUIDE_PLACES.filter((p) => {
    const d = distances[p.name];
    return !(d?.metres != null && d.metres > MAX_DISTANCE_M);
  });
  const walkable = (list: typeof GUIDE_PLACES) =>
    list.filter((p) => walkOf(p.name) != null).sort((a, b) => walkOf(a.name)! - walkOf(b.name)!);
  const reach = [
    inRange.filter((p) => (driveOf(p.name) ?? Infinity) <= 5).length,
    inRange.filter((p) => (driveOf(p.name) ?? Infinity) <= 10).length,
    inRange.filter((p) => (walkOf(p.name) ?? Infinity) <= 15).length,
  ];
  const favourites = inRange
    .filter((p) => p.highlight && distances[p.name])
    .sort((a, b) => distances[a.name].metres - distances[b.name].metres)
    .slice(0, 6);
  // One of each thing a guest needs on arrival, nearest first: a shop, cash, a pharmacy,
  // then laundry where the guide has one. Matched on the guide's own names and categories.
  const firstOf = (test: (p: (typeof GUIDE_PLACES)[number]) => boolean) =>
    walkable(inRange.filter(test))[0];
  const basics = [
    firstOf((p) => p.category === "Convenience & Grocery"),
    firstOf((p) => /\bATM\b/i.test(p.name)),
    firstOf((p) => /pharmac/i.test(p.name)),
    firstOf((p) => /laundr/i.test(p.name) || /laundr/i.test(p.comment)),
  ]
    .filter((p): p is (typeof GUIDE_PLACES)[number] => Boolean(p))
    .sort((a, b) => walkOf(a.name)! - walkOf(b.name)!);
  // Two per part of the day, leaving out the favourites already shown above: a host pick
  // first where one is walkable, then the nearest.
  const dayPick = (cats: string[]) => {
    const shown = new Set(favourites.map((p) => p.name));
    const pool = walkable(
      inRange.filter(
        (p) => cats.includes(p.category) && !shown.has(p.name) && (walkOf(p.name) ?? Infinity) <= NEARBY_MINUTES,
      ),
    );
    const hl = pool.filter((p) => p.highlight);
    return [...hl, ...pool.filter((p) => !p.highlight)]
      .slice(0, 2)
      .sort((a, b) => walkOf(a.name)! - walkOf(b.name)!);
  };
  const day = [
    { label: t.guideMorning, places: dayPick(["Breakfast", "Coffee"]) },
    { label: t.guideAfternoon, places: dayPick(["Temple", "Museum/Gallery", "Shop/Bazaar", "Nature & Viewpoint", "Massage/Spa", "Workshop"]) },
    { label: t.guideEvening, places: dayPick(["Restaurant", "Street Food", "Bars"]) },
  ].filter((slot) => slot.places.length > 0);

  // Only the neighbourhoods that actually contain something, so the filter never offers a
  // choice that leads to an empty page.
  const areasPresent = [...new Set(GUIDE_PLACES.map((p) => p.area).filter((a): a is string => a !== null))];
  const foodTags = tagsInFamily(GUIDE_TAGS, "food");
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

  // The start point, not the house. Paul, 08/11/2026, reversing 11/09/2026 when this pin was
  // the house: every route and time here starts at a public place a few minutes away, so
  // neither a guest nor a bot can work back to the door. A property with no start point
  // gets no pin and no directions rather than a fallback to the house.
  const home = start ? { lat: start.lat, lng: start.lng, label: t.guideStartPin.replace("{place}", startLabel) } : null;
  const propertyPhoto = (PHOTOS[property.slug] ?? [])[0];
  const walkableNow = places.filter((place) => {
    const walk = distances[place.name]?.walk;
    return walk != null && walk <= NEARBY_MINUTES;
  });
  const frameOn = [...(home ? [home] : []), ...(walkableNow.length ? walkableNow : places).map((p) => ({ lat: p.lat, lng: p.lng }))];

  const filterHref = (patch: Record<string, string | null>) => {
    const next = new URLSearchParams();
    const current: Record<string, string | null> = {
      for: category,
      area,
      tag,
      near: nearby ? "1" : null,
      picks: picks ? "1" : null,
      ...patch,
    };
    for (const [k, v] of Object.entries(current)) if (v) next.set(k, v);
    const qs = next.toString();
    return href(`/${property.slug}/local-guide${qs ? `?${qs}` : ""}`);
  };

  // How many cards are on the page right now. `n` rides the same URL-state pattern as
  // every filter here (filterHref above already forwards an arbitrary patch, `n` included,
  // so this needed no new plumbing) -- which also means changing a filter chip drops back
  // to PAGE_SIZE for free, since filterHref only ever sets the five filter keys it knows
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
    `inline-flex min-h-11 shrink-0 items-center whitespace-nowrap rounded-full border px-3.5 py-1.5 text-[13px] transition-colors ${
      active ? "border-ink bg-ink text-bg font-semibold" : "border-hairline hover:border-ink"
    }`;

  // aria-current, because the active chip was distinguished by colour alone. The chips are
  // links rather than buttons -- every filter here is a URL, deliberately -- so "current"
  // is the right word for the one whose destination is the page you are on.
  const chipCurrent = (active: boolean) => (active ? ("true" as const) : undefined);

  const crumbs: Crumb[] = [
    { name: SITE_NAME, path: "/" },
    { name: property.title, path: `/${property.slug}` },
    { name: t.guideTitle },
  ];


  return (
    <div className="mx-auto max-w-(--container-chrome) px-5 pb-18 pt-9">
      {locale !== "en" ? (
        <p className="mb-6 rounded-panel bg-wash-gold px-5 py-3 text-[12.5px] leading-relaxed text-body">
          {t.guidePendingNote}
        </p>
      ) : null}
      {/* One trail, rendered twice from the same array: the nav a reader sees and the
          BreadcrumbList a crawler reads. The page already carried the Lotus House link as a
          bare eyebrow paragraph, which gave the trail no landmark role and no markup, so a
          valid breadcrumb result on a page two levels deep was being left on the table. The
          final crumb is this page and carries no URL. Every name here already exists:
          nothing new was written for it. */}
      <JsonLd data={breadcrumbSchema(locale, crumbs)} />
      <nav aria-label={t.breadcrumbLabel} className="eyebrow">
        <Link href={href("/")} className="hit hover:underline">
          {SITE_NAME}
        </Link>{" "}
        ·{" "}
        <Link href={href(`/${property.slug}`)} className="hit hover:underline">
          {property.title}
        </Link>{" "}
        · {t.guideTitle}
      </nav>
      <h1 className="mt-2 font-headline text-[clamp(28px,6vw,42px)] font-extrabold leading-[1.08] tracking-[-0.03em]">
        {t.guideTitleFor.replace("{property}", property.title)}
      </h1>
      <p className="mt-3 max-w-2xl text-body">{t.guideIntro}</p>
      {start ? (
        <p className="mt-2 max-w-2xl text-[14px] text-muted">{t.guideStartNote.replace("{place}", startLabel)}</p>
      ) : null}
      <div className="mt-4 flex flex-wrap items-center gap-3">
        {/* The reach summary: how much is within a short walk, counted from the guide. */}
        <p className="rounded-full bg-surface px-4 py-2 text-[13.5px] font-semibold">
          {t.guideReach.replace("{a}", String(reach[0])).replace("{b}", String(reach[1])).replace("{c}", String(reach[2]))}
        </p>
        <PrintButton label={t.guidePrint} />
      </div>

      {isDefault && favourites.length > 0 ? (
        <nav
          aria-label={t.guideJump}
          className="mt-5 -mx-5 flex gap-2 overflow-x-auto px-5 pb-1 [scrollbar-width:none] print:hidden"
        >
          {[
            ["#guide-favourites", t.guidePicks],
            ["#guide-first-night", t.guideBasicsTitle],
            ["#guide-day", t.guideDayTitle],
            ["#guide-everything", t.guideEverything],
          ].map(([target, label]) => (
            <a
              key={target}
              href={target}
              className="shrink-0 whitespace-nowrap rounded-full bg-surface px-3.5 py-2 text-[13px] font-semibold hover:bg-wash-gold"
            >
              {label}
            </a>
          ))}
        </nav>
      ) : null}

      {isDefault && favourites.length > 0 ? (
        <>
          {/* The hosts' own picks first, with their notes: the page's proof that the hosts
              know the street. Before this they sat mid-list behind the 7-Eleven. */}
          <section id="guide-favourites" className="mt-10 scroll-anchor">
            <h2 className="font-display text-2xl font-bold tracking-[-0.015em]">
              <span aria-hidden="true" className="mr-1.5 text-deep-red">★</span>
              {t.guidePicks}
            </h2>
            <p className="mt-1 text-[14px] text-muted">{t.guideFavSub}</p>
            {/* A swipeable row on a phone, snapping card by card, so six picks do not push the
                rest of the page six screens down; a grid from 640px and in print. */}
            <ul className="mt-5 -mx-5 flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 pb-2 [scrollbar-width:none] sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 sm:pb-0 lg:grid-cols-3 print:grid print:grid-cols-2">
              {favourites.map((p) => (
                <li key={p.name} className="flex w-[82%] shrink-0 snap-start flex-col rounded-panel border border-hairline border-l-4 border-l-deep-red p-5 sm:w-auto print:w-auto">
                  <p className="font-display text-[16.5px] font-bold leading-snug">
                    <span aria-hidden="true" className="mr-1.5">{categoryIcon(p.category)}</span>
                    {p.name}
                  </p>
                  <p className="eyebrow mt-1">{categoryLabel(p.category, locale)}</p>
                  {p.comment ? <p className="mt-2 line-clamp-3 text-[13.5px] text-body">{p.comment}</p> : null}
                  <div className="mt-auto flex flex-wrap items-center gap-x-3 gap-y-2 pt-3">
                    <span className="text-[12.5px] text-muted">
                      {isStart(p.name) ? t.guideStartHere : null}
                      {!isStart(p.name) && driveOf(p.name) != null ? (
                        <span className="mr-1.5 rounded-full bg-wash-gold px-2.5 py-1 font-semibold text-ink">
                          {t.guideDrive.replace("{n}", String(driveOf(p.name)))}
                        </span>
                      ) : null}
                      {!isStart(p.name) && walkOf(p.name) != null ? t.guideWalk.replace("{n}", String(walkOf(p.name))) : null}
                    </span>
                    {start && !isStart(p.name) ? (
                      <span className="print:hidden">
                        <DirectionsLinks
                          from={{ lat: start.lat, lng: start.lng }}
                          to={{ lat: p.lat, lng: p.lng }}
                          mode={(walkOf(p.name) ?? Infinity) <= NEARBY_MINUTES ? "walking" : "driving"}
                          place={p.name}
                          labels={directionsLabels}
                        />
                      </span>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          </section>

          <div className="mt-10 grid gap-6 lg:grid-cols-[1fr_2fr]">
            {/* First night: what a guest needs within an hour of arriving. */}
            <section id="guide-first-night" className="scroll-anchor rounded-panel bg-surface p-6">
              <h2 className="font-display text-xl font-bold tracking-[-0.015em]">{t.guideBasicsTitle}</h2>
              <p className="mt-1 text-[13.5px] text-muted">{t.guideBasicsSub}</p>
              <ul className="mt-4">{basics.map((p: (typeof GUIDE_PLACES)[number]) => (
                <li key={p.name} className="border-b border-hairline py-2.5 last:border-0">
                  <span className="block text-[14px]">
                    <span aria-hidden="true" className="mr-1.5">{categoryIcon(p.category)}</span>
                    {p.name}
                  </span>
                  <span className="mt-0.5 block text-[12.5px] text-muted">{howFar(p.name)}</span>
                </li>
              ))}</ul>
            </section>

            {/* A day from the door: two walkable places per part of the day, host picks first. */}
            <section id="guide-day" className="scroll-anchor rounded-panel border border-hairline p-6">
              <h2 className="font-display text-xl font-bold tracking-[-0.015em]">{t.guideDayTitle}</h2>
              <p className="mt-1 text-[13.5px] text-muted">{t.guideDaySub}</p>
              <div className="mt-4 grid gap-5 sm:grid-cols-3">
                {day.map((slot) => (
                  <div key={slot.label}>
                    <h3 className="eyebrow">{slot.label}</h3>
                    <ul className="mt-1">{slot.places.map((p: (typeof GUIDE_PLACES)[number]) => (
                <li key={p.name} className="border-b border-hairline py-2.5 last:border-0">
                  <span className="block text-[14px]">
                    <span aria-hidden="true" className="mr-1.5">{categoryIcon(p.category)}</span>
                    {p.name}
                  </span>
                  <span className="mt-0.5 block text-[12.5px] text-muted">{howFar(p.name)}</span>
                </li>
              ))}</ul>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <h2 id="guide-everything" className="mt-12 scroll-anchor font-display text-2xl font-bold tracking-[-0.015em]">{t.guideEverything}</h2>
        </>
      ) : null}


      <div
        role="group"
        aria-label={t.guideFilterPicks}
        className="mt-7 flex flex-wrap gap-2 print:hidden"
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
        className="mt-3 -mx-5 flex gap-2 overflow-x-auto px-5 pb-1 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 print:hidden"
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
            <span aria-hidden="true" className="mr-1.5">{categoryIcon(name)}</span>
            {categoryLabel(name, locale)}
          </Link>
        ))}
      </div>

      {/* Food tags only. Dietary and practical tags show on the card but are never offered
          as a filter: narrowing the whole guide to the places that take only cash is not a
          question a guest asks, and every extra row of chips costs the rows above it
          attention. GUIDE_TAGS is already in vocabulary order, so these never reshuffle. */}
      {foodTags.length ? (
        <div
          role="group"
          aria-label={t.guideFilterTags}
          className="mt-3 -mx-5 flex gap-2 overflow-x-auto px-5 pb-1 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 print:hidden"
        >
          <Link
            aria-current={chipCurrent(!tag)}
            href={filterHref({ tag: null })}
            className={chip(!tag)}
          >
            {t.guideFilterTags}: {t.guideAll}
          </Link>
          {foodTags.map((slug) => (
            <Link
              key={slug}
              aria-current={chipCurrent(tag === slug)}
              href={filterHref({ tag: slug })}
              className={chip(tag === slug)}
            >
              {tagLabel(slug, locale)}
            </Link>
          ))}
        </div>
      ) : null}

      <div
        role="group"
        aria-label={t.guideFilterArea}
        className="mt-3 -mx-5 flex gap-2 overflow-x-auto px-5 pb-1 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 print:hidden"
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
            {areaName(t, slug)}
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
          <Link href={href(`/${property.slug}/local-guide`)} className="mt-3 inline-block font-semibold underline">
            {t.guideClear}
          </Link>
        </div>
      ) : (
        <div className="mt-6 grid gap-6 lg:grid-cols-2 lg:items-start">
          <div className="grid gap-6">
            <ul className="grid gap-3">
              {visiblePlaces.map((place, index) => {
                const d = distances[place.name];
                // Shadowing the imported helper would be a silent bug, so the local
                // keeps the longer name.
                const placeArea = place.area ? areaName(t, place.area) : null;
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
                      {categoryLabel(place.category, locale)}
                      {placeArea ? ` · ${placeArea}` : ` · ${t.guideOutsideAreas}`}
                    </p>

                    {/* Food tags are links, because the filter above accepts them and a
                        guest who sees "Northern Thai" on one card wants the others. Dietary
                        and practical tags are plain text: there is no filter to send them
                        to, and a chip that looks like a link and is not is worse than a
                        label. */}
                    {place.tags.length ? (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {tagsInFamily(place.tags, "food").map((slug) => (
                          <Link
                            key={slug}
                            href={filterHref({ tag: slug })}
                            className="rounded-full border border-hairline px-2 py-0.5 text-[11px] text-muted transition-colors hover:border-ink hover:text-ink print:hidden"
                          >
                            {tagLabel(slug, locale)}
                          </Link>
                        ))}
                        {[
                          ...tagsInFamily(place.tags, "dietary"),
                          ...tagsInFamily(place.tags, "practical"),
                        ].map((slug) => (
                          <span
                            key={slug}
                            className="rounded-full bg-wash-gold px-2 py-0.5 text-[11px] text-muted"
                          >
                            {tagLabel(slug, locale)}
                          </span>
                        ))}
                      </div>
                    ) : null}

                    {place.comment ? (
                      <p className="mt-2 text-[14px] text-body">{place.comment}</p>
                    ) : null}

                    <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-[13px] text-muted">
                      {isStart(place.name) ? (
                        <span className="font-semibold text-ink">{t.guideStartHere}</span>
                      ) : (
                        <span>
                          {d?.drive != null ? (
                            <span className="rounded-full bg-wash-gold px-2.5 py-1 font-semibold text-ink">
                              {t.guideDrive.replace("{n}", String(d.drive))}
                            </span>
                          ) : null}
                          {` · ${d?.walk != null ? t.guideWalk.replace("{n}", String(d.walk)) : t.guideNoWalk}`}
                        </span>
                      )}
                      {start && !isStart(place.name) ? (
                        <DirectionsLinks
                          from={{ lat: start.lat, lng: start.lng }}
                          to={{ lat: place.lat, lng: place.lng }}
                          mode={d?.walk != null ? "walking" : "driving"}
                          place={place.name}
                          labels={directionsLabels}
                        />
                      ) : null}
                      {/* Quieter than the directions buttons on purpose. Where a guest is
                          standing is the question this page answers; a menu or an opening
                          time is the question the business's own page answers, and only a
                          seventh of the guide has one. Named for a screen reader the same
                          way the directions links are, because a list of twenty-two links
                          all reading "Website" is not a list anyone can pick from. */}
                      {place.website ? (
                        <a
                          href={place.website}
                          target="_blank"
                          rel="noreferrer"
                          aria-label={`${t.guideWebsiteOf.replace("{place}", place.name)}, ${t.newTab}`}
                          className="underline underline-offset-2 transition-colors hover:text-ink print:hidden"
                        >
                          {t.guideWebsite}
                        </a>
                      ) : null}
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
          <div className="grid gap-3 min-[900px]:sticky min-[900px]:top-[150px] print:hidden">
            <Link
              href={href(`/${property.slug}`)}
              className="grid grid-cols-[76px_1fr] items-center gap-3 rounded-panel border border-hairline p-3 transition-colors hover:border-ink"
            >
              {propertyPhoto ? (
                <div className="relative aspect-square overflow-hidden rounded-box">
                  <Image
                    src={propertyPhoto.src}
                    alt={propertyPhoto.alt || property.title}
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
                  {property.title}
                </p>
                <p className="mt-0.5 text-[12px] text-muted">
                  {t.guideFrom.replace("{property}", property.title)}
                </p>
                {bookable ? (
                  <span className="mt-2 inline-block rounded-full bg-ink px-3 py-1.5 text-[12px] font-semibold text-bg">
                    {t.guideBookDirect}
                  </span>
                ) : null}
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

      {bookable && places.length > 0 ? (
        <div className="mt-10 rounded-panel bg-surface px-7 py-9">
          <p className="font-display text-xl font-bold tracking-[-0.015em]">
            {t.guideBookDirect}
          </p>
          <p className="mt-1 text-[14px] text-muted">{t.guideBookDirectSub}</p>
          <Link
            href={href(`/${property.slug}`)}
            className="pill-primary mt-4"
          >
            {property.title}
          </Link>
        </div>
      ) : null}

      {bookable ? (
        <>
          {/* Below 900px, the house is one tap away at any scroll depth. Held left so the
              WhatsApp button keeps its corner, as on the homepage. */}
          <div className="h-20 min-[900px]:hidden" aria-hidden="true" />
          <div className="fixed inset-x-0 bottom-0 z-30 border-t border-hairline bg-bg/97 py-3 pl-5 pr-20 backdrop-blur min-[900px]:hidden print:hidden">
            <Link href={href(`/${property.slug}`)} className="pill-primary py-3 text-[14px]">
              {t.guideBookDirect} · {property.title}
            </Link>
          </div>
        </>
      ) : null}

      <WhatsAppCta
        number={WHATSAPP_NUMBER}
        chatConfigured={Boolean(CRISP_WEBSITE_ID)}
        labels={askLabels}
        context={property.title}
      />
    </div>
  );
}
