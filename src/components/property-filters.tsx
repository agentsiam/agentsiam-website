"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Dictionary } from "@/i18n";
import { localePath, type Locale } from "@/i18n/config";
import { AREAS, CITIES } from "@/lib/areas";
import {
  FEATURES,
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
 */

const field =
  "rounded-lg border-[1.5px] border-hairline bg-bg px-3 py-2.5 text-sm outline-none focus-visible:border-ink";

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
  // Mobile only. The split view cannot hold under 900px, so the map is opt-in there --
  // and the toggle belongs here, in the sticky bar, rather than below a list the guest
  // would have to scroll past fifty results to reach.
  const [mapOpen, setMapOpen] = useState(false);
  // The panel's working copy. Discarded on Close, pushed to the URL on Apply.
  const [draft, setDraft] = useState<SearchState>(state);

  function go(next: Partial<SearchState>) {
    const merged = { ...state, ...next };
    router.push(localePath(locale, "/properties") + searchToQuery(merged));
  }

  /**
   * Opens and closes the map pane on small screens.
   *
   * The state lives on <body> rather than in React because the pane is rendered by a
   * different component, in a different column of a server-rendered page. A data
   * attribute plus a CSS rule keeps them in step without lifting the whole results page
   * into a client component, which would cost the crawlable list. The event is for
   * Leaflet's benefit: it mis-measures a container that was hidden when it was built.
   */
  function toggleMap() {
    const next = !mapOpen;
    setMapOpen(next);
    document.body.dataset.mapOpen = String(next);
    window.dispatchEvent(new CustomEvent("as:map-toggle", { detail: { open: next } }));
  }

  function apply() {
    setOpen(false);
    // Only the fields the panel actually owns.
    //
    // The bar stays live while the panel is open -- it sits above it -- so a guest can
    // set a check-in date, then tick a neighbourhood, then Apply. `draft` was seeded when
    // the panel opened and still holds the *old* dates, so pushing all of it silently
    // reverted the date they had just chosen. The panel commits its own five fields and
    // leaves the rest of the committed state alone.
    go({
      areas: draft.areas,
      types: draft.types,
      features: draft.features,
      bedrooms: draft.bedrooms,
      bathrooms: draft.bathrooms,
    });
  }

  function openPanel() {
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
  ];

  function label(slug: string): string {
    return AREAS.find((area) => area.slug === slug)?.name ?? slug;
  }

  return (
    <div className="sticky top-[66px] z-30 border-b border-hairline bg-bg/95 px-5 backdrop-blur">
      <div className="mx-auto max-w-(--container-chrome) py-3">
        <div className="flex flex-wrap items-end gap-3">
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
              {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                <option key={n} value={n}>
                  {n}+
                </option>
              ))}
            </select>
          </label>

          <button
            type="button"
            onClick={openPanel}
            className="cursor-pointer rounded-full border-[1.5px] border-ink px-4 py-2.5 text-[13px] font-semibold hover:bg-ink hover:text-white"
          >
            {t.filters}
            {chips.length ? ` (${chips.length})` : ""}
          </button>

          {/* Below 900px only: the desktop split view already shows the map. */}
          {resultCount > 0 ? (
            <button
              type="button"
              onClick={toggleMap}
              aria-pressed={mapOpen}
              className="cursor-pointer rounded-full border-[1.5px] border-hairline px-4 py-2.5 text-[13px] font-semibold hover:border-ink min-[900px]:hidden"
            >
              {mapOpen ? t.hideMap : t.showMap}
            </button>
          ) : null}

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
                  className="cursor-pointer rounded-full bg-surface px-3 py-1.5 text-[12px] hover:bg-surface-2"
                >
                  {chip.label} <span aria-hidden="true">×</span>
                  <span className="sr-only">{t.removeFilter}</span>
                </button>
              </li>
            ))}
            <li className="text-[12px] text-muted">
              {resultCount === 1
                ? t.oneProperty
                : t.nProperties.replace("{n}", String(resultCount))}
            </li>
          </ul>
        ) : null}
      </div>

      {open ? (
        <div className="absolute inset-x-0 top-full max-h-[70vh] overflow-y-auto border-b border-hairline bg-bg px-5 py-6 shadow-lg">
          <div className="mx-auto max-w-(--container-chrome)">
            {/* Neighbourhood first: it is the strongest signal a Chiang Mai guest has, and
                it lives here rather than in the bar because Where is city-level. */}
            <Group title={t.neighbourhood}>
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

            <div className="mt-7 flex flex-wrap items-center gap-3 border-t border-hairline pt-5">
              <button
                type="button"
                onClick={() =>
                  setDraft({ ...draft, areas: [], types: [], features: [], bedrooms: 0, bathrooms: 0 })
                }
                className="cursor-pointer text-[13px] underline underline-offset-4 text-muted hover:text-ink"
              >
                {t.clearFilters}
              </button>
              <span className="flex-1" />
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="cursor-pointer rounded-full border-[1.5px] border-hairline px-5 py-2.5 text-[13px] font-semibold hover:border-ink"
              >
                {t.close}
              </button>
              <button
                type="button"
                onClick={apply}
                className="cursor-pointer rounded-full bg-ink px-6 py-2.5 text-[13px] font-semibold text-white hover:bg-primary"
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

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset className="mt-5 first:mt-0">
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
      className={`cursor-pointer rounded-full border-[1.5px] px-3.5 py-2 text-[12.5px] ${
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
          className="h-9 w-9 cursor-pointer rounded-full border-[1.5px] border-hairline text-lg leading-none hover:border-ink disabled:cursor-not-allowed disabled:opacity-30"
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
          className="h-9 w-9 cursor-pointer rounded-full border-[1.5px] border-hairline text-lg leading-none hover:border-ink"
        >
          +
        </button>
      </div>
    </div>
  );
}
