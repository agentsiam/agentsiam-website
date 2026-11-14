"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import type { Dictionary } from "@/i18n";
import { localePath, type Locale } from "@/i18n/config";
import { AREAS, CITIES } from "@/lib/areas";
import {
  FEATURES,
  GUEST_CHOICES,
  PROPERTY_TYPES,
  searchToQuery,
  SORTS,
  type SearchState,
} from "@/lib/search";

/**
 * The sticky filter bar, and the panel behind its Filters button.
 *
 * Every change is a navigation, not local state. That is deliberate and it is what makes
 * the results page shareable and indexable -- the server does the filtering, and the URL
 * is the only source of truth. The cost is a round trip per change; the benefit is that a
 * filtered list can be linked to and crawled.
 *
 * The panel follows the handoff's commit model exactly: **Close discards, Apply commits**.
 * Draft edits live in local state and only reach the URL on Apply, so half-built filter
 * combinations never hit the server and the back button steps through intentional
 * searches rather than keystrokes. Active filters show as removable chips below the bar,
 * because a panel that hides what it is doing loses people.
 *
 * **The panel is two things at two widths.** At 900px and up it is a dropdown hung off the
 * bar, and the bar stays live behind it so a guest can set a date, tick a neighbourhood and
 * Apply in one pass. Below 900px that shape does not survive contact with a phone: the
 * panel was `absolute` inside a sticky bar, so it was pinned to the bar rather than scrolled
 * with the page, and Apply sat below the fold with no way to reach it. Below 900px it is
 * therefore a full-screen sheet with its own scroll, the page locked behind it, and the
 * Apply row stuck to the bottom of the viewport.
 */

// 44px minimum on every control. Below that a filter bar is a thing you aim at rather than
// tap, and this one is the only way into five of the six filters.
const field =
  "min-h-11 rounded-lg border-[1.5px] border-hairline bg-bg px-3 py-2.5 text-sm outline-none focus-visible:border-ink";

/** Everything inside the panel that can take focus, for the sheet's focus trap. */
const FOCUSABLE = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

/**
 * Intl locale for each of our three, for the dates in the phone summary. Copied from the
 * booking panel rather than imported, as the tile and the results map already are: that
 * module is a client component with a Stripe dependency and this is a thousands separator
 * and a month name. Thai is pinned to the Gregorian calendar there and is kept identical
 * here so the four never disagree about what "th" means.
 */
const INTL_LOCALE: Record<Locale, string> = {
  en: "en-GB",
  th: "th-TH-u-ca-gregory",
  zh: "zh-Hans",
};

/**
 * One date for the summary line: day and short month, no year.
 *
 * Parsed and formatted in UTC on purpose. `new Date("2026-12-24")` is midnight UTC, and a
 * browser in New York formats that as the 23rd. These are calendar days out of a URL, not
 * instants, and a guest who picked the 24th must be shown the 24th wherever they are.
 */
function shortDate(iso: string, locale: Locale): string {
  return new Intl.DateTimeFormat(INTL_LOCALE[locale], {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  }).format(new Date(`${iso}T00:00:00Z`));
}

export function PropertyFilters({
  t,
  locale,
  state,
  resultCount,
}: {
  t: Dictionary;
  locale: Locale;
  state: SearchState;
  resultCount: number;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  /**
   * Whether the panel is currently the full-screen sheet rather than the dropdown.
   *
   * It drives `aria-modal` and the focus trap, and only those: the layout itself is CSS, so
   * this is never what decides how the panel looks. Read on open rather than at render, so
   * there is no media query in the first paint and nothing to mismatch on hydration -- the
   * panel does not exist until someone opens it.
   */
  const [sheet, setSheet] = useState(false);
  /**
   * Whichever control opened the panel, so closing can put focus back on it.
   *
   * There are two now and they are at different widths: the Filters button in the full
   * control row, and, on a phone, the summary pill that is the bar. A single ref could only
   * ever point at one of them, and returning focus to a `display: none` button sends it to
   * the top of the document instead.
   */
  const opener = useRef<HTMLButtonElement | null>(null);
  const panel = useRef<HTMLDivElement>(null);
  const panelId = useId();
  const titleId = useId();
  // The panel's working copy. Discarded on Close, pushed to the URL on Apply.
  const [draft, setDraft] = useState<SearchState>(state);

  function go(next: Partial<SearchState>) {
    const merged = { ...state, ...next };
    router.push(localePath(locale, "/properties") + searchToQuery(merged));
  }

  /**
   * Takes the site header off its sticky perch, on this page and below the breakpoint only.
   *
   * The header is three rows and 142px on a phone, and this bar sat under it, so 462px of a
   * 812px screen was chrome that never moved and the first photograph opened below the fold.
   * On a results page the nav is not what needs pinning: the search is, and that is this
   * bar. The header scrolls away with the page and comes back at the top of it.
   *
   * An attribute on <body> because the header is rendered by the layout, outside this page,
   * and reaching it any other way means making it a client component. The CSS rule is in
   * globals.css beside the map pane's, which is set the same way and for the same reason.
   */
  useEffect(() => {
    document.body.dataset.flatNav = "true";
    return () => {
      delete document.body.dataset.flatNav;
    };
  }, []);

  /**
   * Closes without committing. `restoreFocus` is false only when the guest dismissed the
   * panel by pointing at something else, where sending focus back to the trigger would take
   * it away from whatever they just aimed at.
   */
  const close = useCallback((restoreFocus = true) => {
    setOpen(false);
    if (restoreFocus) opener.current?.focus();
  }, []);

  useEffect(() => {
    if (!open) return;

    const sheetQuery = window.matchMedia("(max-width: 899px)");
    const readWidth = () => setSheet(sheetQuery.matches);
    readWidth();
    sheetQuery.addEventListener("change", readWidth);

    // Focus into the panel. It used to stay on the trigger, which put Apply twenty-six Tab
    // presses away through every control in the panel and then the page behind it.
    panel.current?.focus();

    // The sheet covers the viewport and scrolls itself, so the page behind it must not
    // scroll too -- otherwise reaching the end of the filters hands the scroll to the page
    // and the guest loses the sheet's own end.
    const previousOverflow = document.body.style.overflow;
    if (sheetQuery.matches) document.body.style.overflow = "hidden";

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        close();
        return;
      }
      // A trap only where the panel really is modal. In the dropdown at 900px and up the bar
      // behind it is deliberately still live, and trapping focus would break that.
      if (event.key !== "Tab" || !sheetQuery.matches || !panel.current) return;
      const nodes = Array.from(
        panel.current.querySelectorAll<HTMLElement>(FOCUSABLE),
      ).filter((node) => !node.hasAttribute("disabled"));
      if (nodes.length === 0) return;
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      const active = document.activeElement;
      if (event.shiftKey && (active === first || active === panel.current)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    }

    function onPointerDown(event: PointerEvent) {
      const target = event.target as Node | null;
      if (!target) return;
      // The trigger toggles itself; letting this handler close first would make the click
      // close and reopen in the same gesture.
      if (panel.current?.contains(target) || opener.current?.contains(target)) return;
      close(false);
    }

    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      sheetQuery.removeEventListener("change", readWidth);
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, close]);

  function apply() {
    setOpen(false);
    opener.current?.focus();
    // Only the fields the panel actually owns.
    //
    // The bar stays live while the panel is open -- it sits above it -- so a guest can
    // set a check-in date, then tick a neighbourhood, then Apply. `draft` was seeded when
    // the panel opened and still holds the *old* dates, so pushing all of it silently
    // reverted the date they had just chosen. The panel commits its own five fields and
    // leaves the rest of the committed state alone.
    //
    // Below 900px none of that holds: the bar is a summary, the city, the dates, the guest
    // count and the sort are edited inside the sheet, and there is no live bar behind it to
    // leave alone. The sheet commits the whole draft, which is every field it showed.
    go(
      sheet
        ? draft
        : {
            areas: draft.areas,
            types: draft.types,
            features: draft.features,
            bedrooms: draft.bedrooms,
            bathrooms: draft.bathrooms,
          },
    );
  }

  function openPanel(from: HTMLButtonElement) {
    opener.current = from;
    // Re-seed from the committed state, so reopening never resurrects a discarded draft.
    setDraft(state);
    setOpen(true);
  }

  function toggle(list: string[], value: string): string[] {
    return list.includes(value) ? list.filter((entry) => entry !== value) : [...list, value];
  }

  /** Removes one chip, leaving everything else committed. */
  function remove(key: string, value: string) {
    if (key === "area") go({ areas: state.areas.filter((a) => a !== value) });
    else if (key === "type") go({ types: state.types.filter((v) => v !== value) });
    else if (key === "features") go({ features: state.features.filter((f) => f !== value) });
    else if (key === "beds") go({ bedrooms: 0 });
    else if (key === "baths") go({ bathrooms: 0 });
    else if (key === "guests") go({ guests: 0 });
  }

  /**
   * Drops every filter and keeps the search.
   *
   * The only bulk clear used to be inside the panel, behind Apply, and on a phone the panel
   * could not be reached at all. This one sits on the bar where the chips are. It clears the
   * filters and nothing else: the city, the dates and the sort are the search itself, not a
   * narrowing of it, and throwing them away to undo a bedroom count is not a trade anyone
   * asked for.
   */
  function clearAll() {
    go({ areas: [], types: [], features: [], bedrooms: 0, bathrooms: 0, guests: 0 });
  }

  const chips = [
    ...state.areas.map((v) => ({ key: "area", value: v, label: label(v) })),
    ...state.types.map((v) => ({ key: "type", value: v, label: t[`type_${v}` as keyof Dictionary] ?? v })),
    ...state.features.map((v) => ({
      key: "features",
      value: v,
      label: t[`feature_${v.replace(/-/g, "_")}` as keyof Dictionary] ?? v,
    })),
    ...(state.bedrooms
      ? [{ key: "beds", value: "", label: `${state.bedrooms}+ ${t.bedrooms}` }]
      : []),
    ...(state.bathrooms
      ? [{ key: "baths", value: "", label: `${state.bathrooms}+ ${t.bathrooms}` }]
      : []),
    // Guests belongs here for the same reason the others do. Without it a `?guests=12`
    // arriving from the homepage stepper emptied the page, showed no chip, left the counter
    // blank, and the only escape was a Clear filters link that also threw away the city and
    // the dates.
    ...(state.guests
      ? [{ key: "guests", value: "", label: t.psGuestsN.replace("{n}", String(state.guests)) }]
      : []),
  ];

  function label(slug: string): string {
    return AREAS.find((area) => area.slug === slug)?.name ?? slug;
  }

  // The select offers 1-8 and grows to hold whatever the URL actually says, so the control
  // can never read "Any" while the search is filtering on twelve.
  const guestOptions = [...GUEST_CHOICES] as number[];
  if (state.guests && !guestOptions.includes(state.guests)) {
    guestOptions.push(state.guests);
    guestOptions.sort((a, b) => a - b);
  }

  // The search, as a sentence, for the phone bar. Three facts in the order a guest holds
  // them: where, when, how many. Dates read as an invitation until they are set, because
  // they are the one field that changes what a property page can tell them afterwards.
  const cityName = CITIES.find((city) => city.slug === state.city)?.name ?? state.city;
  const dateLabel =
    state.from && state.to
      ? t.psDateRange
          .replace("{from}", shortDate(state.from, locale))
          .replace("{to}", shortDate(state.to, locale))
      : state.from
        ? shortDate(state.from, locale)
        : t.psAddDates;
  const guestLabel = state.guests
    ? t.psGuestsN.replace("{n}", String(state.guests))
    : t.psAnyGuests;

  return (
    /* The blur sits on the inner wrapper, not here.
       `backdrop-filter` makes its element a containing block for fixed-position
       descendants, so with it on this element the panel's `fixed inset-0` sheet was pinned
       to the bar's own box -- a full-screen sheet the size of the filter bar. The blur
       belongs to the bar's chrome anyway; the panel is a sibling of it. */
    <div
      /* top-0 below the breakpoint, because the header is not sticky there and this bar is
         what holds the top of the screen. At 900px and up the header is back and the bar
         sits under it, at whatever height nav-height.tsx has measured it to be. */
      className={`sticky top-0 border-b border-hairline min-[900px]:top-[var(--nav-h)] ${
        /* The bar's own stacking context contains the sheet, so the sheet cannot rise above
           the site header (z-40) on its own. While the panel is open the bar outranks the
           header and the full-screen sheet covers it; closed, it sits back under it. */
        open ? "z-50" : "z-30"
      }`}
    >
      <div className="bg-bg/95 px-5 backdrop-blur">
      <div className="mx-auto max-w-(--container-chrome) py-3">
        {/* The phone bar. One row, and both things in it open the same sheet.

            It replaced four rows of controls, 319px of a 812px screen, pinned there the
            whole way down the page. Five of the six were touched once a session or not at
            all, and the page spent more of itself describing the search than showing what
            the search found. The summary says what the search is and the sheet is where it
            is changed, which is the trade every phone-sized search makes. */}
        <div className="flex items-center gap-2 min-[900px]:hidden">
          <button
            type="button"
            onClick={(event) => openPanel(event.currentTarget)}
            aria-expanded={open}
            aria-controls={panelId}
            /* The visible text is the search itself and reads as a sentence, not a label,
               so the button needs a name of its own. */
            aria-label={t.psSearchEdit}
            className="flex min-h-11 min-w-0 flex-1 cursor-pointer items-center rounded-full border-[1.5px] border-hairline px-4 py-2 text-left hover:border-ink"
          >
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[13.5px] font-semibold leading-tight">
                {cityName}
              </span>
              <span className="block truncate text-[11.5px] leading-tight text-muted">
                {dateLabel} · {guestLabel}
              </span>
            </span>
          </button>

          <button
            type="button"
            onClick={(event) => (open ? close() : openPanel(event.currentTarget))}
            aria-expanded={open}
            aria-controls={panelId}
            className="min-h-11 shrink-0 cursor-pointer rounded-full border-[1.5px] border-ink px-4 py-2.5 text-[13px] font-semibold"
          >
            {t.filters}
            {chips.length ? ` (${chips.length})` : ""}
          </button>
        </div>

        {/* 900px and up, where there is room for the controls themselves and the bar stays
            live behind the dropdown. Unchanged. */}
        <div className="hidden flex-wrap items-end gap-3 min-[900px]:flex">
          <label className="grid gap-1 text-[11px] font-semibold uppercase tracking-[0.06em] text-muted">
            {t.where}
            <select
              value={state.city}
              onChange={(event) => go({ city: event.target.value })}
              className={`${field} cursor-pointer`}
            >
              {CITIES.map((city) => (
                <option key={city.slug} value={city.slug}>
                  {city.name}
                  {city.live ? "" : ` — ${t.launchingSoon}`}
                </option>
              ))}
            </select>
          </label>

          <label className="grid gap-1 text-[11px] font-semibold uppercase tracking-[0.06em] text-muted">
            {t.checkIn}
            <input
              type="date"
              value={state.from}
              onChange={(event) => go({ from: event.target.value })}
              className={field}
            />
          </label>

          <label className="grid gap-1 text-[11px] font-semibold uppercase tracking-[0.06em] text-muted">
            {t.checkOut}
            <input
              type="date"
              value={state.to}
              min={state.from || undefined}
              onChange={(event) => go({ to: event.target.value })}
              className={field}
            />
          </label>

          <label className="grid gap-1 text-[11px] font-semibold uppercase tracking-[0.06em] text-muted">
            {t.guests}
            <select
              value={state.guests || 0}
              onChange={(event) => go({ guests: Number(event.target.value) })}
              className={`${field} cursor-pointer`}
            >
              <option value={0}>{t.any}</option>
              {guestOptions.map((n) => (
                <option key={n} value={n}>
                  {n}+
                </option>
              ))}
            </select>
          </label>

          <button
            type="button"
            onClick={(event) => (open ? close() : openPanel(event.currentTarget))}
            aria-expanded={open}
            aria-controls={panelId}
            className="min-h-11 cursor-pointer rounded-full border-[1.5px] border-ink px-4 py-2.5 text-[13px] font-semibold hover:bg-ink hover:text-white"
          >
            {t.filters}
            {chips.length ? ` (${chips.length})` : ""}
          </button>

          <span className="flex-1" />

          <label className="grid gap-1 text-[11px] font-semibold uppercase tracking-[0.06em] text-muted">
            {t.sort}
            <select
              value={state.sort}
              onChange={(event) => go({ sort: event.target.value as SearchState["sort"] })}
              className={`${field} cursor-pointer`}
            >
              {SORTS.map((sort) => (
                <option key={sort} value={sort}>
                  {t[`sort_${sort.replace(/-/g, "_")}` as keyof Dictionary] ?? sort}
                </option>
              ))}
            </select>
          </label>
        </div>

        {chips.length > 0 ? (
          <ul className="mt-2.5 flex flex-wrap items-center gap-2">
            {chips.map((chip) => (
              <li key={`${chip.key}-${chip.value}`}>
                <button
                  type="button"
                  onClick={() => remove(chip.key, chip.value)}
                  className="inline-flex min-h-11 cursor-pointer items-center rounded-full bg-surface px-3.5 py-1.5 text-[12px] hover:bg-surface-2"
                >
                  {chip.label} <span aria-hidden="true">&nbsp;×</span>
                  <span className="sr-only">{t.removeFilter}</span>
                </button>
              </li>
            ))}
            <li>
              <button
                type="button"
                onClick={clearAll}
                className="inline-flex min-h-11 cursor-pointer items-center px-1 text-[12px] underline underline-offset-4 text-muted hover:text-ink"
              >
                {t.psClearAll}
              </button>
            </li>
            <li className="text-[12px] text-muted">
              {resultCount === 1
                ? t.oneProperty
                : t.nProperties.replace("{n}", String(resultCount))}
            </li>
          </ul>
        ) : null}
      </div>
      </div>

      {open ? (
        <div
          ref={panel}
          id={panelId}
          role="dialog"
          aria-modal={sheet || undefined}
          aria-labelledby={titleId}
          tabIndex={-1}
          /* Full-screen sheet below 900px, dropdown above it. The scroll container is the
             panel at both widths, which is what lets the Apply row below stick to its
             bottom edge in either shape. */
          className="fixed inset-0 z-50 overflow-y-auto overscroll-contain bg-bg outline-none min-[900px]:absolute min-[900px]:inset-y-auto min-[900px]:top-full min-[900px]:max-h-[70vh] min-[900px]:border-b min-[900px]:border-hairline min-[900px]:shadow-lg"
        >
          <div className="mx-auto max-w-(--container-chrome) px-5 pb-6 pt-5">
            {/* The panel's accessible name, and on a phone its title. Not a heading: this
                sits above the page's h1 in the DOM, and an h2 here would be the first
                heading on the page. */}
            <div className="mb-4 flex items-center justify-between gap-4 min-[900px]:mb-0">
              <p
                id={titleId}
                className="font-display text-lg font-bold tracking-[-0.015em] min-[900px]:sr-only"
              >
                {t.filters}
              </p>
              <button
                type="button"
                onClick={() => close()}
                className="-mr-2 flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-full text-xl leading-none hover:bg-surface min-[900px]:hidden"
              >
                <span aria-hidden="true">×</span>
                <span className="sr-only">{t.close}</span>
              </button>
            </div>

            {/* The search itself, below the breakpoint only.

                These five are the bar at 900px and up, where the bar stays live behind the
                dropdown and the panel deliberately does not own them. On a phone the bar is
                a summary, so this is the only place they can be edited, and Apply commits
                the whole draft rather than the panel's own five fields.

                Hidden rather than conditionally rendered, so what the panel looks like is
                decided by CSS at both widths and there is nothing to mismatch on hydration. */}
            <fieldset className="min-[900px]:hidden">
              <legend className="text-xs font-semibold uppercase tracking-[0.06em] text-muted">
                {t.psSearchGroup}
              </legend>
              <div className="mt-2.5 grid gap-3">
                <label className="grid min-w-0 gap-1 text-[11px] font-semibold uppercase tracking-[0.06em] text-muted">
                  {t.where}
                  <select
                    value={draft.city}
                    onChange={(event) => setDraft({ ...draft, city: event.target.value })}
                    className={`${field} w-full cursor-pointer`}
                  >
                    {CITIES.map((city) => (
                      <option key={city.slug} value={city.slug}>
                        {city.name}
                        {city.live ? "" : ` — ${t.launchingSoon}`}
                      </option>
                    ))}
                  </select>
                </label>

                <div className="grid grid-cols-2 gap-3">
                  <label className="grid min-w-0 gap-1 text-[11px] font-semibold uppercase tracking-[0.06em] text-muted">
                    {t.checkIn}
                    <input
                      type="date"
                      value={draft.from}
                      onChange={(event) => setDraft({ ...draft, from: event.target.value })}
                      className={`${field} w-full`}
                    />
                  </label>
                  <label className="grid min-w-0 gap-1 text-[11px] font-semibold uppercase tracking-[0.06em] text-muted">
                    {t.checkOut}
                    <input
                      type="date"
                      value={draft.to}
                      min={draft.from || undefined}
                      onChange={(event) => setDraft({ ...draft, to: event.target.value })}
                      className={`${field} w-full`}
                    />
                  </label>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <label className="grid min-w-0 gap-1 text-[11px] font-semibold uppercase tracking-[0.06em] text-muted">
                    {t.guests}
                    <select
                      value={draft.guests || 0}
                      onChange={(event) =>
                        setDraft({ ...draft, guests: Number(event.target.value) })
                      }
                      className={`${field} w-full cursor-pointer`}
                    >
                      <option value={0}>{t.any}</option>
                      {guestOptions.map((n) => (
                        <option key={n} value={n}>
                          {n}+
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="grid min-w-0 gap-1 text-[11px] font-semibold uppercase tracking-[0.06em] text-muted">
                    {t.sort}
                    <select
                      value={draft.sort}
                      onChange={(event) =>
                        setDraft({ ...draft, sort: event.target.value as SearchState["sort"] })
                      }
                      className={`${field} w-full cursor-pointer`}
                    >
                      {SORTS.map((sort) => (
                        <option key={sort} value={sort}>
                          {t[`sort_${sort.replace(/-/g, "_")}` as keyof Dictionary] ?? sort}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
              </div>
            </fieldset>

            {/* Neighbourhood first among the filters: it is the strongest signal a Chiang
                Mai guest has, and it lives here rather than in the bar because Where is
                city-level. */}
            <Group title={t.neighbourhood} className="min-[900px]:mt-0">
              {AREAS.map((area) => (
                <Chip
                  key={area.slug}
                  label={area.name}
                  selected={draft.areas.includes(area.slug)}
                  onSelect={() => setDraft({ ...draft, areas: toggle(draft.areas, area.slug) })}
                />
              ))}
            </Group>

            <Group title={t.propertyType}>
              {PROPERTY_TYPES.map((type) => (
                <Chip
                  key={type}
                  label={String(t[`type_${type}` as keyof Dictionary] ?? type)}
                  selected={draft.types.includes(type)}
                  onSelect={() =>
                    setDraft({ ...draft, types: toggle(draft.types, type) as typeof draft.types })
                  }
                />
              ))}
            </Group>

            <Group title={t.features}>
              {FEATURES.map((feature) => (
                <Chip
                  key={feature}
                  label={String(
                    t[`feature_${feature.replace(/-/g, "_")}` as keyof Dictionary] ?? feature,
                  )}
                  selected={draft.features.includes(feature)}
                  onSelect={() =>
                    setDraft({ ...draft, features: toggle(draft.features, feature) })
                  }
                />
              ))}
            </Group>

            <div className="mt-5 flex flex-wrap gap-8">
              <Stepper
                label={t.bedrooms}
                value={draft.bedrooms}
                onChange={(bedrooms) => setDraft({ ...draft, bedrooms })}
                anyLabel={t.any}
              />
              <Stepper
                label={t.bathrooms}
                value={draft.bathrooms}
                onChange={(bathrooms) => setDraft({ ...draft, bathrooms })}
                anyLabel={t.any}
              />
            </div>
          </div>

          {/* Stuck to the bottom of the panel's own scroll, which on a phone is the bottom
              of the viewport. Apply used to sit at the end of the content, below the fold,
              with the panel pinned to the sticky bar so neither scroll could bring it up. */}
          <div className="sticky bottom-0 border-t border-hairline bg-bg px-5 py-3.5">
            <div className="mx-auto flex max-w-(--container-chrome) flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() =>
                  setDraft({ ...draft, areas: [], types: [], features: [], bedrooms: 0, bathrooms: 0 })
                }
                className="inline-flex min-h-11 cursor-pointer items-center px-1 text-[13px] underline underline-offset-4 text-muted hover:text-ink"
              >
                {t.clearFilters}
              </button>
              <span className="flex-1" />
              <button
                type="button"
                onClick={() => close()}
                className="min-h-11 cursor-pointer rounded-full border-[1.5px] border-hairline px-5 py-2.5 text-[13px] font-semibold hover:border-ink"
              >
                {t.close}
              </button>
              <button
                type="button"
                onClick={apply}
                className="pill-compact cursor-pointer"
              >
                {t.applyFilters}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function Group({
  title,
  children,
  /** The neighbourhood group is first only at 900px and up; the search fieldset is above
      it below that, and `first:mt-0` goes by the DOM rather than by what is displayed. */
  className = "",
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <fieldset className={`mt-5 first:mt-0 ${className}`}>
      <legend className="text-xs font-semibold uppercase tracking-[0.06em] text-muted">
        {title}
      </legend>
      <div className="mt-2.5 flex flex-wrap gap-2">{children}</div>
    </fieldset>
  );
}

function Chip({
  label,
  selected,
  onSelect,
}: {
  label: string;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onSelect}
      className={`inline-flex min-h-11 cursor-pointer items-center rounded-full border-[1.5px] px-4 py-2 text-[12.5px] ${
        selected
          ? "border-ink bg-ink font-semibold text-white"
          : "border-hairline bg-bg text-text hover:border-ink"
      }`}
    >
      {label}
    </button>
  );
}

function Stepper({
  label,
  value,
  onChange,
  anyLabel,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  anyLabel: string;
}) {
  return (
    <div>
      <span className="text-xs font-semibold uppercase tracking-[0.06em] text-muted">
        {label}
      </span>
      <div className="mt-2 flex items-center gap-3">
        <button
          type="button"
          onClick={() => onChange(Math.max(0, value - 1))}
          disabled={value === 0}
          aria-label={`${label} −`}
          className="h-11 w-11 cursor-pointer rounded-full border-[1.5px] border-hairline text-lg leading-none hover:border-ink disabled:cursor-not-allowed disabled:opacity-30"
        >
          −
        </button>
        <span className="min-w-12 text-center text-sm font-semibold">
          {value === 0 ? anyLabel : `${value}+`}
        </span>
        <button
          type="button"
          onClick={() => onChange(Math.min(8, value + 1))}
          aria-label={`${label} +`}
          className="h-11 w-11 cursor-pointer rounded-full border-[1.5px] border-hairline text-lg leading-none hover:border-ink"
        >
          +
        </button>
      </div>
    </div>
  );
}
