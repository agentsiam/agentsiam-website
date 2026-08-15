"use client";

import { useEffect, useRef } from "react";
import type { Dictionary } from "@/i18n";

/**
 * The results map: sticky on the right of the list, from the handoff's Level 1.
 *
 * **Why this talks to the DOM instead of holding the list in React state.** The results
 * list is server-rendered on purpose -- that is what makes a filtered search crawlable
 * rather than a client-side illusion. Lifting it into React to get hover linkage would
 * throw that away for a hover effect. So the list stays server HTML, each tile carries a
 * `data-map-key`, and this component finds them and wires the two-way behaviour.
 * The map is an enhancement layered onto a page that already works without it.
 *
 * Leaflet is imported inside an effect rather than at module scope. It touches `window`
 * on import, so a top-level import would break the server render of the page around it.
 *
 * Deliberately **not** auto-fitting to the result set. The handoff is explicit: this phase
 * the map always opens framed on Chiang Mai, so the view never jumps between searches. It
 * re-fits only when a search actually narrows to somewhere specific.
 */

export type Pin = {
  /** Matches the card's data-map-key. A property slug, or a place name in the guide. */
  slug: string;
  title: string;
  lat: number;
  lng: number;
  /** Shown on the pin past cluster zoom. Null when the property has no rate loaded. */
  price: number | null;
  currency: string;
  /** Emoji shown on the pin. Guide places use one; properties show a price instead. */
  icon?: string;
  /** A host pick. Ringed on the map so it reads as one at pin size too. */
  highlight?: boolean;
};

/**
 * Pin labels go into a divIcon's innerHTML, so anything from the data has to be escaped.
 * Place names come from a Google Sheet that several people edit, which is exactly the kind
 * of source that eventually contains an ampersand or an angle bracket.
 */
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Chiang Mai, framed to the city and its immediate districts. */
const CITY = { lat: 18.7883, lng: 98.9853, zoom: 12 };

export function ResultsMap({
  pins,
  t,
  /**
   * Clicking a card flies the map to its pin.
   *
   * Off by default because on the results page a card *is* a link to the property, and
   * hijacking that click would take a guest somewhere they did not ask to go. In the guide
   * the card is not a link, so the click is free and panning is the obvious thing to do
   * with it.
   */
  panOnCardClick = false,
  /**
   * On the results page the map hides below 900px behind a toggle in the filter bar,
   * because a map under fifty property tiles is a map nobody finds.
   *
   * The guide has no such toggle and the map is half the point of the page, so it opts
   * out and stays visible at every width. Without this it inherited `display: none` on a
   * phone with nothing anywhere to turn it back on.
   */
  collapsible = true,
  /**
   * Group overlapping pins at low zoom. Mandatory past a few dozen: without it the Old
   * City is one unreadable mass however small the pins are.
   */
  cluster = false,
  /** The property, drawn as the one labelled marker. Every time on the page is from here. */
  home = null,
  /**
   * What to frame on, when that is not simply every pin.
   *
   * The guide spans 86km because it includes Doi Inthanon, so fitting all of it opens at
   * provincial scale and crushes the fifty-odd places around the house into a smudge.
   * Framing on the walkable ones opens at the scale a guest is actually standing in.
   */
  frameOn = null,
  /**
   * Off when something outside is already sticky. Nesting a sticky element inside another
   * one gives the inner element a scroll container that never scrolls, so it silently
   * stops working and looks like a layout bug rather than a positioning one.
   */
  sticky = true,
  /** Desktop height. Shortened when a card shares the column. */
  mapHeightClass = "min-[900px]:h-[calc(100vh-190px)]",
}: {
  pins: Pin[];
  t: Dictionary;
  panOnCardClick?: boolean;
  collapsible?: boolean;
  cluster?: boolean;
  home?: { lat: number; lng: number; label: string } | null;
  frameOn?: { lat: number; lng: number }[] | null;
  sticky?: boolean;
  mapHeightClass?: string;
}) {
  const container = useRef<HTMLDivElement>(null);
  const map = useRef<import("leaflet").Map | null>(null);

  useEffect(() => {
    if (!container.current) return;
    let cleanup = () => {};
    let cancelled = false;

    async function draw() {
      const L = (await import("leaflet")).default;
      await import("leaflet/dist/leaflet.css");
      if (cancelled || !container.current) return;

      const instance = L.map(container.current, {
        center: [CITY.lat, CITY.lng],
        zoom: CITY.zoom,
        // A map inside a scrolling page must not eat the scroll. Ctrl+wheel still zooms,
        // and the +/- control is always there.
        scrollWheelZoom: false,
      });

      // Named for the basemap specifically: `tiles` further down means the property tiles
      // in the results list, which are a different thing entirely.
      const base = basemap();
      L.tileLayer(base.url, { maxZoom: base.maxZoom, attribution: base.attribution }).addTo(instance);

      const markers = new Map<string, L.Marker>();

      let layer: import("leaflet").MarkerClusterGroup | null = null;
      if (cluster) {
        await import("leaflet.markercluster");
        await import("leaflet.markercluster/dist/MarkerCluster.css");
        layer = L.markerClusterGroup({
          showCoverageOnHover: false,
          maxClusterRadius: 45,
          // The plugin's own icons are green and yellow blobs. This is the same shape as a
          // pin so a cluster reads as "several of these" rather than a different species.
          iconCreateFunction: (group) =>
            L.divIcon({
              className: "",
              html: `<span class="as-cluster">${group.getChildCount()}</span>`,
              iconSize: [0, 0],
            }),
        });
        instance.addLayer(layer);
      }

      for (const pin of pins) {
        // A div icon rather than an image marker: it carries the price, which is what
        // makes a map worth using over a list, and it sidesteps Leaflet's default icon
        // paths breaking under a bundler.
        const html = pin.icon
          ? `<span class="as-pin-dot${pin.highlight ? " is-pick" : ""}" aria-hidden="true">${pin.icon}</span>`
          : `<span class="as-pin">${
              pin.price !== null
                ? `${pin.currency} ${pin.price.toLocaleString("en-US")}`
                : escapeHtml(pin.title)
            }</span>`;

        const marker = L.marker([pin.lat, pin.lng], {
          // Leaflet renders this as a native title attribute, which is also the accessible
          // name, so the pin is never an unlabelled dot to a screen reader.
          title: pin.title,
          icon: L.divIcon({ className: "", html, iconSize: [0, 0] }),
        });

        // The name arrives on hover rather than being printed 109 times.
        if (pin.icon) marker.bindTooltip(pin.title, { direction: "top", offset: [0, -18] });

        if (layer) layer.addLayer(marker);
        else marker.addTo(instance);

        marker.on("click", () => {
          const tile = document.querySelector<HTMLElement>(
            `[data-map-key="${pin.slug}"]`,
          );
          tile?.scrollIntoView({ behavior: "smooth", block: "center" });
          tile?.classList.add("ring-2", "ring-ink");
          window.setTimeout(() => tile?.classList.remove("ring-2", "ring-ink"), 1600);
        });

        markers.set(pin.slug, marker);
      }

      if (home) {
        L.marker([home.lat, home.lng], {
          title: home.label,
          zIndexOffset: 1000,
          icon: L.divIcon({
            className: "",
            html: `<span class="as-pin-home">${escapeHtml(home.label)}</span>`,
            iconSize: [0, 0],
          }),
        }).addTo(instance);
      }

      // Only narrow the frame when the results are genuinely somewhere specific. One pin
      // would otherwise zoom the map to a street, which tells a guest less than the city.
      const frame = frameOn && frameOn.length > 0 ? frameOn : pins;
      if (frame.length > 1) {
        instance.fitBounds(
          L.latLngBounds(frame.map((point) => [point.lat, point.lng] as [number, number])),
          { padding: [40, 40], maxZoom: 16 },
        );
      }

      // Hover a tile, lift its pin. The listeners go on the server-rendered tiles.
      const tiles = Array.from(
        document.querySelectorAll<HTMLElement>("[data-map-key]"),
      );
      const listeners: (() => void)[] = [];

      for (const tile of tiles) {
        const slug = tile.dataset.mapKey ?? "";
        const marker = markers.get(slug);
        if (!marker) continue;

        if (panOnCardClick) {
          const fly = (event: Event) => {
            // Anything genuinely clickable inside the card keeps its own behaviour: the
            // directions links are the whole point of the card and must not be swallowed.
            if ((event.target as HTMLElement).closest("a,button")) return;
            // zoomToShowLayer expands the cluster the marker is hiding in. Without it a
            // clustered pin is flown to and still not visible.
            if (layer) {
              layer.zoomToShowLayer(marker, () => {
                marker.getElement()?.classList.add("as-pin-active");
              });
            } else {
              instance.flyTo(marker.getLatLng(), Math.max(instance.getZoom(), 16), {
                duration: 0.6,
              });
              marker.getElement()?.classList.add("as-pin-active");
            }
          };
          tile.addEventListener("click", fly);
          listeners.push(() => tile.removeEventListener("click", fly));
        }

        const enter = () => marker.getElement()?.classList.add("as-pin-active");
        const leave = () => marker.getElement()?.classList.remove("as-pin-active");
        tile.addEventListener("mouseenter", enter);
        tile.addEventListener("mouseleave", leave);
        tile.addEventListener("focusin", enter);
        tile.addEventListener("focusout", leave);
        listeners.push(() => {
          tile.removeEventListener("mouseenter", enter);
          tile.removeEventListener("mouseleave", leave);
          tile.removeEventListener("focusin", enter);
          tile.removeEventListener("focusout", leave);
        });
      }

      map.current = instance;

      cleanup = () => {
        for (const off of listeners) off();
        instance.remove();
        map.current = null;
      };
    }

    draw();

    /**
     * Leaflet measures its container on creation. On a phone the pane starts hidden, so
     * the map it builds is sized against a zero-height box and renders as a grey slab
     * until told otherwise. The filter bar's toggle fires this event; invalidateSize is
     * the fix.
     */
    const onToggle = (event: Event) => {
      const open = (event as CustomEvent<{ open: boolean }>).detail?.open;
      if (open) window.setTimeout(() => map.current?.invalidateSize(), 0);
    };
    window.addEventListener("as:map-toggle", onToggle);

    return () => {
      cancelled = true;
      window.removeEventListener("as:map-toggle", onToggle);
      cleanup();
    };
    // Re-drawn whenever the result set changes, which on this page means a new URL.
  }, [pins, panOnCardClick, cluster, home, frameOn]);

  if (pins.length === 0) return null;

  return (
    <div
      className={`${collapsible ? "as-map-pane" : ""} ${
        sticky ? "min-[900px]:sticky min-[900px]:top-[150px]" : ""
      }`}
    >
      <div
        ref={container}
        role="application"
        aria-label={t.mapLabel}
        className={`h-[360px] w-full overflow-hidden rounded-panel border border-hairline ${mapHeightClass}`}
      />
    </div>
  );
}

/**
 * Where map tiles come from.
 *
 * OpenStreetMap's public tile servers are run on donated capacity for development and
 * low volume, and their usage policy is explicit that it is not a service anyone should
 * build a product on. It is the right default for a repository that has to work the
 * moment it is cloned, and the wrong thing to serve to paying guests.
 *
 * So the key decides. Set NEXT_PUBLIC_MAPTILER_KEY and every map on the site moves to
 * MapTiler; leave it unset and everything still renders, on OSM, with a warning in the
 * browser console rather than a broken page. The key is publishable by design, which is
 * why it is NEXT_PUBLIC_ and why restricting it to the site's own domains in the MapTiler
 * dashboard is what actually protects the quota.
 *
 * Attribution is not optional on either provider and is not a detail: it is the licence
 * condition under which the data may be shown at all.
 */
function basemap() {
  const key = process.env.NEXT_PUBLIC_MAPTILER_KEY;
  if (key) {
    return {
      url: `https://api.maptiler.com/maps/streets-v2/{z}/{x}/{y}.png?key=${key}`,
      maxZoom: 20,
      attribution:
        '&copy; <a href="https://www.maptiler.com/copyright/">MapTiler</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    };
  }
  if (process.env.NODE_ENV === "production") {
    console.warn(
      "[map] NEXT_PUBLIC_MAPTILER_KEY is not set, falling back to OpenStreetMap's public tiles. " +
        "Those are not intended for production traffic and may be throttled or blocked.",
    );
  }
  return {
    url: "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  };
}
