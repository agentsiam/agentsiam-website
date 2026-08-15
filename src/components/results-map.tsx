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
 * `data-property-slug`, and this component finds them and wires the two-way behaviour.
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
  slug: string;
  title: string;
  lat: number;
  lng: number;
  /** Shown on the pin past cluster zoom. Null when the property has no rate loaded. */
  price: number | null;
  currency: string;
  href: string;
};

/** Chiang Mai, framed to the city and its immediate districts. */
const CITY = { lat: 18.7883, lng: 98.9853, zoom: 12 };

export function ResultsMap({ pins, t }: { pins: Pin[]; t: Dictionary }) {
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

      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(instance);

      const markers = new Map<string, L.Marker>();

      for (const pin of pins) {
        // A div icon rather than an image marker: it carries the price, which is what
        // makes a map worth using over a list, and it sidesteps Leaflet's default icon
        // paths breaking under a bundler.
        const label =
          pin.price !== null
            ? `${pin.currency} ${pin.price.toLocaleString("en-US")}`
            : pin.title;

        const marker = L.marker([pin.lat, pin.lng], {
          title: pin.title,
          icon: L.divIcon({
            className: "",
            html: `<span class="as-pin">${label}</span>`,
            iconSize: [0, 0],
          }),
        }).addTo(instance);

        marker.on("click", () => {
          const tile = document.querySelector<HTMLElement>(
            `[data-property-slug="${pin.slug}"]`,
          );
          tile?.scrollIntoView({ behavior: "smooth", block: "center" });
          tile?.classList.add("ring-2", "ring-ink");
          window.setTimeout(() => tile?.classList.remove("ring-2", "ring-ink"), 1600);
        });

        markers.set(pin.slug, marker);
      }

      // Only narrow the frame when the results are genuinely somewhere specific. One pin
      // would otherwise zoom the map to a street, which tells a guest less than the city.
      if (pins.length > 1) {
        instance.fitBounds(
          L.latLngBounds(pins.map((pin) => [pin.lat, pin.lng] as [number, number])),
          { padding: [40, 40], maxZoom: 15 },
        );
      }

      // Hover a tile, lift its pin. The listeners go on the server-rendered tiles.
      const tiles = Array.from(
        document.querySelectorAll<HTMLElement>("[data-property-slug]"),
      );
      const listeners: (() => void)[] = [];

      for (const tile of tiles) {
        const slug = tile.dataset.propertySlug ?? "";
        const marker = markers.get(slug);
        if (!marker) continue;

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
  }, [pins]);

  if (pins.length === 0) return null;

  return (
    <div className="as-map-pane min-[900px]:sticky min-[900px]:top-[150px]">
      <div
        ref={container}
        role="application"
        aria-label={t.mapLabel}
        className="h-[360px] w-full overflow-hidden rounded-panel border border-hairline min-[900px]:h-[calc(100vh-190px)]"
      />
    </div>
  );
}
