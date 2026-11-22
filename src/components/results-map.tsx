"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { DEFAULT_LOCALE, type Locale } from "@/i18n/config";

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
  /** Matches the card's data-map-key. A property's `unitKey()`, or a place name in the guide. */
  key: string;
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
  /**
   * What the card over the full-screen map shows when this pin is tapped, composed on the
   * server. The guide's pins carry none, and a pin without one points at the list instead,
   * which is what every pin did before the card existed.
   */
  card?: {
    href: string;
    /** A URL, not the import: the photo manifest stays on the server. */
    photo: string | null;
    photoAlt: string;
    /** Neighbourhood and distance, already joined. One string, like the map's own label. */
    subtitle: string;
  };
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

/**
 * Whether the URL currently says the map is open, and how to hear about it changing.
 *
 * Read from `window.location` rather than through `useSearchParams`, which would be the
 * obvious hook and is the wrong one here. This component is also the guide's map on every
 * property page, and those pages are static: a client component calling `useSearchParams`
 * on a statically rendered route has to sit inside a Suspense boundary or the production
 * build fails, and the boundary would take the map's own container out of the server HTML
 * and put a layout shift on a page that currently has none.
 *
 * `popstate` covers the phone's back gesture and the browser's own buttons. Our two writers
 * announce themselves, because changing history from script fires nothing.
 */
const MAP_URL_EVENT = "as:map-url";

function readMapParam(): boolean {
  return new URLSearchParams(window.location.search).get("map") === "1";
}

function subscribeToMapUrl(onChange: () => void) {
  window.addEventListener("popstate", onChange);
  window.addEventListener(MAP_URL_EVENT, onChange);
  return () => {
    window.removeEventListener("popstate", onChange);
    window.removeEventListener(MAP_URL_EVENT, onChange);
  };
}

/**
 * The breakpoint, as something React can read, because the URL alone does not say whether
 * the map is a view or a column.
 *
 * `?map=1` is width-blind: it is a link, and a link can be opened on anything. Opened on a
 * desktop the overlay's CSS does not apply, so the page looked right, but the component
 * still believed it was full screen and locked the body's scroll. A scroll container on
 * <body> is how `position: sticky` stops working, so the site header and the filter bar
 * both came unstuck on a page that otherwise looked perfectly normal.
 */
const PHONE_QUERY = "(max-width: 899px)";

function readIsPhone(): boolean {
  return window.matchMedia(PHONE_QUERY).matches;
}

function subscribeToWidth(onChange: () => void) {
  const query = window.matchMedia(PHONE_QUERY);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

/** Chiang Mai, framed to the city and its immediate districts. */
const CITY = { lat: 18.7883, lng: 98.9853, zoom: 12 };

/**
 * Intl locale for each of our three. Copied from the booking panel rather than imported:
 * pulling a Stripe-bearing client component in for a thousands separator is not a trade
 * worth making. Thai is pinned to the Gregorian calendar there and is kept identical here.
 */
const INTL_LOCALE: Record<Locale, string> = {
  en: "en-GB",
  th: "th-TH-u-ca-gregory",
  zh: "zh-Hans",
};

/**
 * Whether to animate at all.
 *
 * Read at the moment of the interaction rather than once on mount, because the setting can
 * change while the page is open and a map that keeps flying after someone has asked it to
 * stop is exactly the complaint the setting exists for.
 */
function prefersReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function ResultsMap({
  pins,
  mapLabel,
  mapOpenLabel = "",
  mapCloseLabel = "",
  priceFromLabel = "",
  perNightLabel = "",
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
  /** Decides the thousands separator on the price pins. Defaults to English. */
  locale = DEFAULT_LOCALE,
}: {
  pins: Pin[];
  /** The map's accessible name. One string, where the whole dictionary used to arrive. */
  mapLabel: string;
  /** The floating button's label, and the overlay's close control. Collapsible maps only. */
  mapOpenLabel?: string;
  mapCloseLabel?: string;
  /** The two halves of the card's price line, in the tile's own words and order. */
  priceFromLabel?: string;
  perNightLabel?: string;
  panOnCardClick?: boolean;
  collapsible?: boolean;
  cluster?: boolean;
  home?: { lat: number; lng: number; label: string } | null;
  frameOn?: { lat: number; lng: number }[] | null;
  sticky?: boolean;
  mapHeightClass?: string;
  locale?: Locale;
}) {
  const container = useRef<HTMLDivElement>(null);
  const map = useRef<import("leaflet").Map | null>(null);
  /**
   * Whether the map has come near the viewport yet.
   *
   * Leaflet and leaflet.markercluster are 51KB gzipped and cost about 430ms of main
   * thread on a throttled phone, and on the local guide the map sits at y=27,946 of a
   * 29,694px page: 94% of the way down, past roughly 35 screens of scrolling. It was
   * being fetched and executed on mount regardless, competing with the LCP image for a
   * component almost nobody scrolls to.
   *
   * The container itself already has a fixed height, so nothing shifts when the map
   * finally mounts into it. 400px of rootMargin means it is drawn before the reader
   * arrives rather than after.
   */
  const [near, setNear] = useState(false);

  /**
   * Whether the map is the whole screen, which below 900px is the only shape it takes.
   *
   * The state is the URL, for one reason above the others: the phone's back gesture then
   * closes the map instead of leaving the page, which is what every guest will try first.
   * It is also one store rather than two, which is the bug that made the old toggle need
   * pressing twice, and a map view can be sent to someone.
   *
   * `window.history.pushState` rather than `router.push`, which Next supports: opening a
   * map is not worth a round trip to the server for a list that has not changed.
   */
  const mapParam = useSyncExternalStore(subscribeToMapUrl, readMapParam, () => false);
  // The width is half the answer: see PHONE_QUERY above. Both snapshots are false on the
  // server, which is the first paint on every page, and neither is known until the client
  // has one.
  const isPhone = useSyncExternalStore(subscribeToWidth, readIsPhone, () => false);
  const fullscreen = collapsible && mapParam && isPhone;
  /** Whether this component is what put the entry on the history stack. */
  const pushed = useRef(false);

  /**
   * The pin whose card is showing, by key.
   *
   * Derived through `fullscreen` rather than cleared when the map closes, so a stale key
   * can never put a card on a page that has no map open. Opening and closing both reset it
   * anyway, which covers the one path that does not go through a re-render: the back
   * gesture, which leaves the key behind and is then cleared by the next open.
   */
  const [selected, setSelected] = useState<string | null>(null);
  const selectedPin = fullscreen ? (pins.find((pin) => pin.key === selected) ?? null) : null;
  const money = new Intl.NumberFormat(INTL_LOCALE[locale], { maximumFractionDigits: 0 });

  const openMap = useCallback(() => {
    const params = new URLSearchParams(window.location.search);
    params.set("map", "1");
    window.history.pushState(null, "", `?${params.toString()}`);
    pushed.current = true;
    setSelected(null);
    window.dispatchEvent(new Event(MAP_URL_EVENT));
  }, []);

  /**
   * Back where we can, which keeps the history stack honest and matches what the phone's
   * own back gesture does. A guest who arrived on a shared `?map=1` link has no entry of
   * ours to pop, and going back would take them off the site, so that one is replaced.
   */
  const closeMap = useCallback(() => {
    setSelected(null);
    if (pushed.current) {
      pushed.current = false;
      // popstate follows on its own, and that is what the store is listening for.
      window.history.back();
      return;
    }
    const params = new URLSearchParams(window.location.search);
    params.delete("map");
    const query = params.toString();
    window.history.replaceState(null, "", query ? `?${query}` : window.location.pathname);
    window.dispatchEvent(new Event(MAP_URL_EVENT));
  }, []);

  useEffect(() => {
    // Closed from outside, by the back gesture or by a link: the entry is already gone.
    if (!fullscreen) pushed.current = false;
  }, [fullscreen]);

  /** The page behind must not scroll, and Escape closes, as the filter sheet does. */
  useEffect(() => {
    if (!fullscreen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeMap();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [fullscreen, closeMap]);

  /**
   * Whether to build the map at all.
   *
   * Two ways in, and they belong to the two shapes. At 900px and up the pane is a column on
   * the page and the observer below decides, which is what keeps 51KB of Leaflet off a page
   * nobody scrolls far down. Below it the pane has no box until it is opened, so nothing
   * ever intersects and the toggle is the only thing that can say.
   *
   * It follows that closing the map on a phone tears the instance down and reopening builds
   * a fresh one. That is deliberate: it is about a hundred milliseconds against cached
   * tiles, and it means the map is always measured against a container at its real size,
   * which is the thing Leaflet is worst at being told later.
   */
  const active = near || fullscreen;

  useEffect(() => {
    const node = container.current;
    if (!node) return;
    // No feature test. IntersectionObserver has been in every shipping browser since
    // 2019 and this application's own baseline (React 19, Next 16) is years past that, so
    // a fallback here would be dead code that also trips the lint rule against setting
    // state synchronously in an effect.
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setNear(true);
          observer.disconnect();
        }
      },
      { rootMargin: "400px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!active || !container.current) return;
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

      // Anywhere that is not a pin puts the card away, which is the gesture every map
      // app has taught people to expect and is the only dismissal the card needs.
      instance.on("click", () => {
        setSelected(null);
        for (const marker of markers.values()) {
          marker.getElement()?.classList.remove("as-pin-active");
        }
      });

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

      const money = new Intl.NumberFormat(INTL_LOCALE[locale], { maximumFractionDigits: 0 });

      for (const pin of pins) {
        // A div icon rather than an image marker: it carries the price, which is what
        // makes a map worth using over a list, and it sidesteps Leaflet's default icon
        // paths breaking under a bundler.
        //
        // aria-hidden on the label, in both shapes. For a marker, name-from-content beats
        // the title attribute, so a visible "THB 3,400" *was* the accessible name and the
        // property's own name never reached anyone listening. Hidden, the title below is
        // what is left, which is the name.
        const html = pin.icon
          ? `<span class="as-pin-dot${pin.highlight ? " is-pick" : ""}" aria-hidden="true">${pin.icon}</span>`
          : `<span class="as-pin" aria-hidden="true">${
              pin.price !== null
                ? `${escapeHtml(pin.currency)} ${money.format(pin.price)}`
                : escapeHtml(pin.title)
            }</span>`;

        const marker = L.marker([pin.lat, pin.lng], {
          // Leaflet renders this as a native title attribute, which is also the accessible
          // name, so the pin is never an unlabelled dot to a screen reader.
          title: pin.title,
          // Not in the tab order. The guide puts 109 of these inside one container with no
          // way past them, and every one of them repeats a place that is already in the
          // list beside the map, in reading order, as real focusable content.
          keyboard: false,
          icon: L.divIcon({ className: "", html, iconSize: [0, 0] }),
        });

        // The name arrives on hover rather than being printed 109 times.
        if (pin.icon) marker.bindTooltip(pin.title, { direction: "top", offset: [0, -18] });

        if (layer) layer.addLayer(marker);
        else marker.addTo(instance);

        marker.on("click", () => {
          // On a phone the map is the whole screen and the list is behind it, so the place
          // has to introduce itself here. Two pins can then be compared by where they are,
          // which is the only question a map is better at answering than a list.
          if (window.matchMedia("(max-width: 899px)").matches && pin.card) {
            for (const other of markers.values()) {
              other.getElement()?.classList.remove("as-pin-active");
            }
            marker.getElement()?.classList.add("as-pin-active");
            setSelected(pin.key);
            return;
          }
          const tile = document.querySelector<HTMLElement>(
            `[data-map-key="${pin.key}"]`,
          );
          tile?.scrollIntoView({
            behavior: prefersReducedMotion() ? "auto" : "smooth",
            block: "center",
          });
          tile?.classList.add("ring-2", "ring-ink");
          window.setTimeout(() => tile?.classList.remove("ring-2", "ring-ink"), 1600);
        });

        markers.set(pin.key, marker);
      }

      if (home) {
        L.marker([home.lat, home.lng], {
          title: home.label,
          // Out of the tab order for the same reason as the rest: it is a label, not a
          // control, and the page it marks is the one the guest is already on.
          keyboard: false,
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
        const key = tile.dataset.mapKey ?? "";
        const marker = markers.get(key);
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
              const zoom = Math.max(instance.getZoom(), 16);
              // Same destination either way. Reduced motion gets there without the flight:
              // flyTo animates the zoom as well as the pan, which is the whole screen
              // moving under someone who asked for that not to happen.
              if (prefersReducedMotion()) {
                instance.setView(marker.getLatLng(), zoom, { animate: false });
              } else {
                instance.flyTo(marker.getLatLng(), zoom, { duration: 0.6 });
              }
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

    return () => {
      cancelled = true;
      cleanup();
    };
    // Re-drawn whenever the result set changes, which on this page means a new URL, and
    // once when the map first becomes active: in view on a desktop, opened on a phone.
    // Nothing calls invalidateSize any more, because there is no longer a path on which the
    // container is measured at a size it is not about to be shown at.
  }, [active, pins, panOnCardClick, cluster, home, frameOn, locale, closeMap]);

  if (pins.length === 0) return null;

  return (
    <>
      <div
        className={`${collapsible ? "as-map-pane" : ""} ${
          sticky ? "min-[900px]:sticky min-[900px]:top-[150px]" : ""
        }`}
        /* What the full-screen rule in globals.css keys on. Below 900px it is the whole of
           the layout: fixed, inset 0, over the chrome. Above it, nothing changes. */
        data-fullscreen={fullscreen ? "true" : undefined}
      >
        <div
          ref={container}
          /* region, not application. `application` drops a screen reader out of browse mode
             for everything inside it, and it is only worth that when the element implements
             its own key bindings that the reader would otherwise swallow. This one does not:
             the markers are out of the tab order and Leaflet's own controls are ordinary
             buttons. */
          role="region"
          aria-label={mapLabel}
          className={`as-map-canvas h-[360px] w-full overflow-hidden rounded-panel border border-hairline ${mapHeightClass}`}
        />

        {/* The tapped pin, as a card. Above the attribution line rather than over it: that
            line is the licence condition the tiles are shown under and covering it is not a
            layout decision we get to make. */}
        {selectedPin?.card ? (
          <div className="absolute inset-x-3 bottom-8 z-10 min-[900px]:hidden">
            <Link
              href={selectedPin.card.href}
              className="flex items-center gap-3 rounded-panel border border-hairline bg-bg p-3 shadow-lg"
            >
              {selectedPin.card.photo ? (
                <Image
                  src={selectedPin.card.photo}
                  alt={selectedPin.card.photoAlt}
                  lang="en"
                  width={96}
                  height={72}
                  className="h-[72px] w-24 shrink-0 rounded-box object-cover"
                />
              ) : null}
              <span className="min-w-0 flex-1">
                <span className="block truncate font-display text-[15px] font-bold tracking-[-0.015em]">
                  {selectedPin.title}
                </span>
                <span className="mt-0.5 block truncate text-[12.5px] text-muted">
                  {selectedPin.card.subtitle}
                </span>
                {selectedPin.price !== null ? (
                  <span className="mt-1 block text-[13px]">
                    <span className="text-muted">{priceFromLabel} </span>
                    <span className="font-display font-bold">
                      {selectedPin.currency}&nbsp;{money.format(selectedPin.price)}
                    </span>
                    <span className="text-muted"> {perNightLabel}</span>
                  </span>
                ) : null}
              </span>
            </Link>
          </div>
        ) : null}

        {/* Over the map, not under it. Leaflet's own zoom control is top left and its
            attribution is bottom right, which is the licence condition and not ours to
            move, so the close sits in the corner both of them leave alone. */}
        {collapsible && fullscreen ? (
          <button
            type="button"
            onClick={closeMap}
            className="absolute right-4 top-4 z-10 min-h-11 cursor-pointer rounded-full bg-bg px-5 py-2.5 text-[13px] font-semibold shadow-lg min-[900px]:hidden"
          >
            {mapCloseLabel}
          </button>
        ) : null}
      </div>

      {/* The way in. Floating over the results rather than sitting in the bar, because the
          bar is one row now and a map is a thing you reach for part way down a list, not a
          setting you leave switched on. Centred, clear of the WhatsApp launcher in the
          right corner. */}
      {collapsible && !fullscreen ? (
        <button
          type="button"
          onClick={openMap}
          className="fixed bottom-5 left-1/2 z-40 min-h-11 -translate-x-1/2 cursor-pointer rounded-full bg-ink px-6 py-3 text-[13px] font-semibold text-white shadow-lg print:hidden min-[900px]:hidden"
        >
          {mapOpenLabel}
        </button>
      ) : null}
    </>
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
