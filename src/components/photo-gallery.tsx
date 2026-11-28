"use client";

import Image, { getImageProps } from "next/image";
import { useCallback, useEffect, useId, useRef, useState, type RefObject } from "react";
import type PhotoSwipe from "photoswipe";
import "photoswipe/style.css";
import type { Photo } from "@/lib/photos.generated";

/**
 * The property gallery. Three layers, laid out differently on a phone and on a desktop:
 *
 *   Phone, below 900px: a full-width swipe carousel of every photo with a "3 / 46" counter.
 *   Tapping a photo opens the viewer at that photo.
 *
 *   Desktop: the handoff's one large slot plus four small ones. Any of them opens the viewer;
 *   "Show all photos" opens an overview of every photo at its own shape, and any photo there
 *   opens the viewer.
 *
 *   Viewer, both: one photo at a time, uncropped, on the scrim colour. Swipe, arrows and
 *   keyboard to move, pinch, double-tap or click to zoom, swipe down or Esc to close, with the
 *   photo's description underneath. This is PhotoSwipe, because swipe, pinch and double-tap
 *   zoom done by hand is a gesture library's worth of edge cases, and it already handles
 *   focus trapping and returning focus to whatever opened it.
 *
 * Grid and viewer are two views of one full-screen gallery, and one button in the same place
 * in each switches between them: four squares in the viewer, one square in the grid. The
 * switch keeps your place both ways. The grid opens scrolled to the photo you were on, with
 * it outlined; the viewer reopens on that photo. The phone carousel has the four-squares
 * button beside its counter, so the grid is one tap from the page.
 *
 * Closing, from either view, returns to the page. Each view is a browser history entry, so
 * the back gesture goes from the viewer to the grid, if that is where you came from, and then
 * out to the page, rather than leaving the listing.
 *
 * Every surface uses the same order: the hero first, then the set's running order. Swiping
 * the carousel to the fifth photo and tapping it opens the viewer on that same fifth photo.
 *
 * Every photo is a static import, so next/image knows its dimensions and carries a blur-up
 * placeholder. The viewer is handed next/image's own srcset through getImageProps, so it
 * gets the same optimised WebP or AVIF sizes as the page rather than the original file,
 * which is not reachable (it lives under src/, see src/photos/README.md).
 *
 * Mosaic shapes: every tile is landscape 3:2 or portrait 3:4, chosen by the file's own
 * orientation. Two 3:2 landscapes stacked are one 3:4 portrait, so any mix fills the grid
 * with no holes. Cropping is object-cover at render; the viewer and the overview show the
 * whole photo.
 */

const isPortrait = (photo: Photo) => photo.src.height > photo.src.width;

type Labels = {
  showAll: string;
  close: string;
  photosOf: string;
  propertyName: string;
  openPhoto: string;
  photoPrevious: string;
  photoNext: string;
  photoZoom: string;
  photoLoadError: string;
  photoSingle: string;
};

/** Four squares: "show all photos". The same shape in the viewer, the carousel and the mosaic. */
const GRID_PATH = "M9 9h6v6H9zM17 9h6v6h-6zM9 17h6v6H9zM17 17h6v6h-6z";

function GridIcon({ className }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 32 32" className={className} fill="currentColor">
      <path d={GRID_PATH} />
    </svg>
  );
}

/** One square: "show one photo", in the grid where the four squares sit in the viewer. */
function SingleIcon({ className }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 32 32" className={className} fill="currentColor">
      <path d="M8 8h16v16H8z" />
    </svg>
  );
}

type ViewerHooks = {
  /** The viewer moved to another photo. */
  onChange: (index: number) => void;
  /** The four-squares button was pressed on this photo. */
  onGrid: (index: number) => void;
  /** The guest closed the viewer: X, Esc, or swipe down. */
  onUserClose: () => void;
  /** Set by the viewer while it is closing, so a history step does not close it twice. */
  closing: RefObject<boolean>;
};

/**
 * The block beside the hero: two columns, each holding one portrait or two landscapes, in
 * the set's running order. A photo that no longer fits is skipped for the next one that
 * does, and the viewer still shows it. A column left with a single landscape stretches it,
 * which only happens when a set runs out of landscapes.
 */
function fillBlock(photos: Photo[]) {
  const columns: Photo[][] = [[], []];
  for (const photo of photos) {
    if (isPortrait(photo)) {
      const empty = columns.find((column) => column.length === 0);
      if (empty) empty.push(photo);
    } else {
      const open = columns.find(
        (column) => column.length < 2 && (column.length === 0 || !isPortrait(column[0])),
      );
      if (open) open.push(photo);
    }
    if (columns.every((column) => column.length === 2 || column.some(isPortrait))) break;
  }
  return columns.flatMap((column, col) =>
    column.map((photo, row) => ({
      photo,
      col,
      row,
      tall: column.length === 1,
    })),
  );
}

/**
 * How tall a caption will render at a given viewport width, measured with a hidden copy
 * styled by the same class. The viewer reserves exactly this much under each photo. A fixed
 * reserve was tried first and failed on a 320px phone: a four-line caption under a portrait
 * photo sat on top of the bottom of the photo.
 */
const captionHeights = new Map<string, number>();
function captionHeight(caption: string, viewportWidth: number) {
  if (!caption) return 0;
  const key = `${viewportWidth}|${caption}`;
  let height = captionHeights.get(key);
  if (height === undefined) {
    const probe = document.createElement("div");
    probe.className = "pswp__caption";
    probe.style.cssText = `visibility:hidden;position:fixed;left:0;right:auto;bottom:0;width:${viewportWidth}px;margin:0`;
    probe.textContent = caption;
    document.body.appendChild(probe);
    height = Math.ceil(probe.getBoundingClientRect().height);
    probe.remove();
    captionHeights.set(key, height);
  }
  return height;
}

/**
 * Opens the full-screen viewer. PhotoSwipe is imported on first use, so a guest who never
 * opens a photo never downloads it.
 */
async function openViewer(
  photos: Photo[],
  index: number,
  labels: Labels,
  viewerRef: RefObject<PhotoSwipe | null>,
  hooks: ViewerHooks,
) {
  if (viewerRef.current) return;
  const { default: PhotoSwipeCore } = await import("photoswipe");

  const dataSource = photos.map((photo) => {
    const { props } = getImageProps({
      src: photo.src,
      alt: "",
      sizes: "100vw",
    });
    return {
      src: props.src,
      srcset: props.srcSet,
      width: photo.src.width,
      height: photo.src.height,
      // alt="" where the caption below is about to say the same words, so a screen reader
      // hears the description once, from the live caption, rather than twice.
      alt: photo.alt ? "" : labels.propertyName,
      msrc: photo.src.blurDataURL,
      caption: photo.alt,
    };
  });

  const viewer = new PhotoSwipeCore({
    dataSource,
    index,
    bgOpacity: 1,
    showHideAnimationType: "fade",
    mainClass: "pswp--gallery",
    indexIndicatorSep: " / ",
    closeTitle: labels.close,
    zoomTitle: labels.photoZoom,
    arrowPrevTitle: labels.photoPrevious,
    arrowNextTitle: labels.photoNext,
    errorMsg: labels.photoLoadError,
    // The gallery puts focus back itself: on the grid's outlined photo when switching, on
    // whatever opened the gallery when closing. PhotoSwipe's own return would aim at a grid
    // thumbnail that has gone.
    returnFocus: false,
    // Room at the top for the counter and close button, and at the bottom for this photo's
    // own caption, measured. On a phone the photo runs edge to edge; on a desktop it clears
    // the arrow buttons.
    paddingFn: (viewport, item) => {
      const caption = captionHeight((item.caption as string | undefined) ?? "", viewport.x);
      return viewport.x < 900
        ? { top: 56, bottom: Math.max(24, caption), left: 0, right: 0 }
        : { top: 64, bottom: Math.max(32, caption), left: 72, right: 72 };
    },
  });

  viewer.on("uiRegister", () => {
    // Between zoom (10) and close (20), so it sits beside the X on every screen size.
    viewer.ui?.registerElement({
      name: "grid-toggle",
      title: labels.showAll,
      ariaLabel: labels.showAll,
      order: 15,
      isButton: true,
      html: {
        isCustomSVG: true,
        inner: `<path d="${GRID_PATH}" id="pswp__icn-grid"/>`,
        outlineID: "pswp__icn-grid",
      },
      onClick: (_event, _element, pswp) => hooks.onGrid(pswp.currIndex),
    });
    viewer.ui?.registerElement({
      name: "caption",
      order: 9,
      isButton: false,
      appendTo: "root",
      onInit: (element, pswp) => {
        // The description is the photographer's English, whatever the page language, so it
        // is marked as English for a Thai or Chinese screen reader voice.
        element.setAttribute("lang", "en");
        element.setAttribute("aria-live", "polite");
        // The caption sits directly under the photo, not at the foot of the screen, so it
        // reads as belonging to that photo. Its top is the photo's bottom edge, taken from
        // the slide's own container, and it is re-placed whenever the photo moves: a new
        // slide, a resize, or a zoom step. Zoomed in, the photo fills the screen and the
        // caption gets out of the way.
        const place = () => {
          const slide = pswp.currSlide;
          const caption = (slide?.data.caption as string | undefined) ?? "";
          const zoomed = slide ? slide.currZoomLevel > slide.zoomLevels.initial + 0.01 : false;
          if (element.textContent !== caption) element.textContent = caption;
          element.hidden = caption === "" || zoomed;
          if (element.hidden || !slide) return;
          // The image, or its blurred placeholder while it loads: both are laid out at the
          // photo's displayed size. The slide container itself has no height, so measuring
          // it put the caption across the top of the photo.
          const photo = slide.container.querySelector(".pswp__img");
          if (!photo) return;
          element.style.top = `${Math.round(photo.getBoundingClientRect().bottom)}px`;
        };
        pswp.on("change", place);
        pswp.on("resize", place);
        pswp.on("zoomPanUpdate", ({ slide }) => {
          if (slide === pswp.currSlide) place();
        });
        place();
      },
    });
  });
  viewer.on("change", () => hooks.onChange(viewer.currIndex));
  // "close" fires for every closing: the guest's, a history step's, and the destroy() that
  // switching to the grid uses. The last two set hooks.closing first, so only the guest's
  // own closing reaches onUserClose.
  viewer.on("close", () => {
    if (hooks.closing.current) return;
    hooks.closing.current = true;
    hooks.onUserClose();
  });
  viewer.on("destroy", () => {
    viewerRef.current = null;
    hooks.closing.current = false;
  });

  viewerRef.current = viewer;
  viewer.init();
}

/** The gallery's key on history.state: which view this entry shows, and how many deep it is. */
type GalleryState = { photoGallery?: "grid" | "single"; photoDepth?: number };
const galleryState = () => (window.history.state ?? {}) as GalleryState;

/** A visually hidden "Open photo: <description>" pair, each fragment in its own language. */
function OpenPhotoName({ id, photo, label }: { id: string; photo: Photo; label: string }) {
  if (!photo.alt) return null;
  return (
    <>
      <span id={`${id}-label`} className="sr-only">
        {label}
      </span>
      <span id={`${id}-alt`} lang="en" className="sr-only">
        {photo.alt}
      </span>
    </>
  );
}

/**
 * Buttons are named "Open photo: <description>". Two hidden spans rather than one
 * aria-label string once a caption exists: the caption is the photo's own English words,
 * and an aria-label is a flat string with no way to mark part of it lang="en". A Thai or
 * Chinese screen reader would otherwise try to pronounce the caption in that voice. No
 * caption, no mixed language, so the fallback stays a plain aria-label.
 */
function openPhotoProps(id: string, photo: Photo, label: string) {
  return {
    "aria-label": photo.alt ? undefined : label,
    "aria-labelledby": photo.alt ? `${id}-label ${id}-alt` : undefined,
  };
}

export function PhotoGallery({ photos, labels }: { photos: Photo[]; labels: Labels }) {
  // The grid is open, outlining this photo, or null when it is not.
  const [gridIndex, setGridIndex] = useState<number | null>(null);
  const [current, setCurrent] = useState(0);
  const viewerRef = useRef<PhotoSwipe | null>(null);
  const closingRef = useRef(false);
  const trackRef = useRef<HTMLDivElement>(null);
  // The photo the guest is on, in either view, so each switch lands on it.
  const placeRef = useRef(0);
  // Whatever on the page opened the gallery, for focus to return to on close.
  const openerRef = useRef<Element | null>(null);
  const isOpenRef = useRef(false);
  // Set while a close is stepping back through history, so a second close request in the
  // same moment cannot step back past the page. Cleared when the gallery has closed.
  const leavingRef = useRef(false);
  const baseId = useId();

  // The hero slot is landscape, so it takes the first landscape in running order, and it
  // leads every surface so they all share one order.
  const hero = photos.find((photo) => !isPortrait(photo)) ?? photos[0];
  const ordered = hero ? [hero, ...photos.filter((photo) => photo !== hero)] : [];

  // The three ways the gallery can be shown. These only render; the history entry that goes
  // with each is pushed by the guest's action, or is the one a back step landed on.
  const showSingle = (index: number) => {
    placeRef.current = index;
    isOpenRef.current = true;
    const viewer = viewerRef.current;
    if (viewer) {
      viewer.goTo(index);
      setGridIndex(null);
      return;
    }
    // The grid stays up until the viewer has faded in over it, so there is no flash of the
    // page between the two.
    void openViewer(ordered, index, labels, viewerRef, {
      onChange: (i) => {
        placeRef.current = i;
      },
      onGrid: (i) => toGrid(i),
      onUserClose: () => close(),
      closing: closingRef,
    }).then(() => {
      const opened = viewerRef.current;
      if (opened) opened.on("openingAnimationEnd", () => setGridIndex(null));
      else setGridIndex(null);
    });
  };

  const showGrid = (index: number) => {
    placeRef.current = index;
    isOpenRef.current = true;
    setGridIndex(index);
    const viewer = viewerRef.current;
    // After the grid has rendered underneath, so the switch is a cut, not a flash. destroy()
    // runs PhotoSwipe's own close() first, so the switch is marked as a closing already in
    // hand, or the close handler would take it for the guest closing the whole gallery.
    if (viewer) {
      requestAnimationFrame(() => {
        closingRef.current = true;
        viewer.destroy();
        // The viewer kept focus until it was gone, so the grid's own focus on mount did not
        // stick; put it on the outlined photo now.
        document
          .querySelector<HTMLElement>('[data-photo-grid] [aria-current="true"]')
          ?.focus({ preventScroll: true });
      });
    }
  };

  const showClosed = () => {
    leavingRef.current = false;
    if (!isOpenRef.current) return;
    isOpenRef.current = false;
    setGridIndex(null);
    const viewer = viewerRef.current;
    if (viewer && !closingRef.current) {
      closingRef.current = true;
      viewer.close();
    }
    // The carousel ends on the photo the guest was last looking at.
    const track = trackRef.current;
    if (track) track.scrollTo({ left: placeRef.current * track.clientWidth });
    // A frame later, once the grid has unmounted: until then the page is still inert and
    // will not take focus.
    const opener = openerRef.current;
    requestAnimationFrame(() => {
      if (opener instanceof HTMLElement && opener.isConnected) opener.focus({ preventScroll: true });
    });
  };

  // The guest's actions. Each moves history, and the view follows.
  const push = (view: "grid" | "single", depth: number) =>
    window.history.pushState(
      { ...window.history.state, photoGallery: view, photoDepth: depth },
      "",
    );

  const openFromPage = (view: "grid" | "single", index: number) => {
    if (isOpenRef.current) return;
    openerRef.current = document.activeElement;
    push(view, 1);
    if (view === "single") showSingle(index);
    else showGrid(index);
  };

  const toSingle = (index: number) => {
    push("single", (galleryState().photoDepth ?? 0) + 1);
    showSingle(index);
  };

  function toGrid(index: number) {
    placeRef.current = index;
    const state = galleryState();
    // Came from the grid: step back to its entry, so back from the grid leaves the gallery.
    if (state.photoGallery === "single" && (state.photoDepth ?? 0) >= 2) {
      window.history.back();
      return;
    }
    window.history.replaceState({ ...window.history.state, photoGallery: "grid" }, "");
    showGrid(index);
  }

  function close() {
    if (leavingRef.current) return;
    const depth = galleryState().photoDepth ?? 0;
    if (depth > 0) {
      leavingRef.current = true;
      window.history.go(-depth);
    } else showClosed();
  }

  // A back or forward step lands on an entry; show what it holds. Read through a ref, so the
  // listener is attached once and still sees this render's functions.
  const onHistory = useRef<() => void>(() => {});
  useEffect(() => {
    onHistory.current = () => {
      const { photoGallery } = galleryState();
      if (photoGallery === "grid") showGrid(placeRef.current);
      else if (photoGallery === "single") showSingle(placeRef.current);
      else showClosed();
    };
  });
  useEffect(() => {
    // A reload with the gallery open keeps that entry's marker while the gallery itself
    // comes back closed. Left there, a later close would count it and step back past the
    // page, so the page's own entry is cleared of it on load.
    const { photoGallery, photoDepth, ...rest } = galleryState();
    if (photoGallery !== undefined || photoDepth !== undefined) {
      window.history.replaceState(rest, "");
    }
    const listener = () => onHistory.current();
    window.addEventListener("popstate", listener);
    return () => window.removeEventListener("popstate", listener);
  }, []);
  // Close the viewer if the gallery itself goes away, e.g. on client navigation.
  useEffect(() => () => viewerRef.current?.destroy(), []);

  const onTrackScroll = useCallback(() => {
    const track = trackRef.current;
    if (!track || track.clientWidth === 0) return;
    setCurrent(Math.round(track.scrollLeft / track.clientWidth));
  }, []);

  if (!hero) return null;

  const tiles = fillBlock(ordered.slice(1));
  const remaining = ordered.length - 1 - tiles.length;

  const open = (photo: Photo) => openFromPage("single", ordered.indexOf(photo));

  return (
    <>
      {/* Phone: one photo at a time, swiped. Native scroll snapping rather than a script,
          so the swipe is the browser's own and works before any JavaScript has run. */}
      <div className="relative min-[900px]:hidden">
        <div
          ref={trackRef}
          onScroll={onTrackScroll}
          className="flex snap-x snap-mandatory overflow-x-auto overscroll-x-contain rounded-panel [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {ordered.map((photo, index) => (
            <button
              key={photo.src.src}
              type="button"
              onClick={() => open(photo)}
              {...openPhotoProps(`${baseId}-slide-${index}`, photo, labels.openPhoto)}
              className="relative aspect-3/2 w-full shrink-0 cursor-pointer snap-center"
            >
              <OpenPhotoName id={`${baseId}-slide-${index}`} photo={photo} label={labels.openPhoto} />
              <Image
                src={photo.src}
                alt={photo.alt || labels.propertyName}
                lang="en"
                placeholder="blur"
                // fetchPriority rather than preload: the carousel and the mosaic are both in
                // the page and only one is displayed, and lazy loading is what keeps the
                // hidden one from downloading. Next's image docs, art direction section.
                fetchPriority={index === 0 ? "high" : undefined}
                fill
                sizes="100vw"
                className="object-cover"
              />
            </button>
          ))}
        </div>
        {ordered.length > 1 ? (
          <div className="absolute bottom-3 right-3 flex items-center gap-1.5">
            <span
              aria-hidden="true"
              className="pointer-events-none rounded-full bg-scrim/75 px-2.5 py-1 text-xs font-semibold tabular-nums text-white"
            >
              {current + 1} / {ordered.length}
            </span>
            {/* The grid, opened on the photo the carousel is showing. A 36px circle on a
                44px hit area, so it is a comfortable thumb target without crowding the photo. */}
            <button
              type="button"
              onClick={() => openFromPage("grid", current)}
              aria-label={`${labels.showAll} (${ordered.length})`}
              className="-m-1 flex size-11 cursor-pointer items-center justify-center"
            >
              <span className="flex size-9 items-center justify-center rounded-full bg-scrim/75 text-white">
                <GridIcon className="size-7" />
              </span>
            </button>
          </div>
        ) : null}
      </div>

      {/* Desktop: the handoff's mosaic. */}
      <div className="relative hidden min-[900px]:block">
        <div className="grid grid-cols-2 gap-2 overflow-hidden rounded-panel">
          <button
            type="button"
            onClick={() => open(hero)}
            {...openPhotoProps(`${baseId}-hero`, hero, labels.openPhoto)}
            className="relative aspect-3/2 cursor-pointer"
          >
            <OpenPhotoName id={`${baseId}-hero`} photo={hero} label={labels.openPhoto} />
            <Image
              src={hero.src}
              alt={hero.alt || labels.propertyName}
              lang="en"
              placeholder="blur"
              fetchPriority="high"
              fill
              // A little under half of a 1440px container.
              sizes="700px"
              className="object-cover"
            />
          </button>

          {/* Two columns by two rows at 3:2 overall, the same shape as the hero, so each
              cell is 3:2 and a cell pair stacked is 3:4. */}
          {tiles.length > 0 ? (
            <div className="grid aspect-3/2 grid-cols-2 grid-rows-2 gap-2">
              {tiles.map(({ photo, col, row, tall }, index) => (
                <button
                  key={photo.src.src}
                  type="button"
                  onClick={() => open(photo)}
                  {...openPhotoProps(`${baseId}-thumb-${index}`, photo, labels.openPhoto)}
                  style={{
                    gridColumn: col + 1,
                    gridRow: tall ? "1 / span 2" : row + 1,
                  }}
                  className="relative cursor-pointer"
                >
                  <OpenPhotoName id={`${baseId}-thumb-${index}`} photo={photo} label={labels.openPhoto} />
                  <Image
                    src={photo.src}
                    alt={photo.alt || labels.propertyName}
                    lang="en"
                    placeholder="blur"
                    fill
                    sizes="350px"
                    className="object-cover"
                  />
                </button>
              ))}
            </div>
          ) : null}
        </div>

        {remaining > 0 ? (
          <button
            type="button"
            onClick={() => openFromPage("grid", 0)}
            className="absolute bottom-4 right-4 flex cursor-pointer items-center gap-1.5 rounded-full bg-bg/95 py-2.5 pl-3 pr-4 text-[13px] font-semibold text-text shadow-sm hover:bg-bg"
          >
            <GridIcon className="-my-1 size-5" />
            {labels.showAll} ({ordered.length})
          </button>
        ) : null}
      </div>

      {gridIndex !== null ? (
        <Overview
          photos={ordered}
          labels={labels}
          baseId={baseId}
          viewerRef={viewerRef}
          current={gridIndex}
          onOpen={toSingle}
          onClose={close}
        />
      ) : null}
    </>
  );
}

/**
 * Deals photo indexes into stacks, each to the stack that is shortest so far, measuring a
 * photo's height as height over width since every stack is the same width.
 */
function stackPhotos(photos: Photo[], columns: number) {
  const stacks: number[][] = Array.from({ length: columns }, () => []);
  const heights = new Array<number>(columns).fill(0);
  photos.forEach((photo, index) => {
    const shortest = heights.indexOf(Math.min(...heights));
    stacks[shortest].push(index);
    heights[shortest] += photo.src.height / photo.src.width;
  });
  return stacks;
}

/**
 * Every photo at its own shape, as thumbnails to pick from. Descriptions are not printed
 * here: they belong with the photo at full size, in the viewer, not as a column of small
 * text under forty thumbnails. The photo the guest was on is outlined and scrolled into
 * view, and the one-square button reopens the viewer on it.
 */
function Overview({
  photos,
  labels,
  baseId,
  viewerRef,
  current,
  onOpen,
  onClose,
}: {
  photos: Photo[];
  labels: Labels;
  baseId: string;
  viewerRef: RefObject<PhotoSwipe | null>;
  current: number;
  onOpen: (index: number) => void;
  onClose: () => void;
}) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const currentRef = useRef<HTMLButtonElement>(null);

  // Three stacks from 1024px, two below, the breakpoint the grid has always used. The grid
  // only renders after a tap, so reading the width here never meets a server render.
  const [columns, setColumns] = useState(() =>
    window.matchMedia("(min-width: 1024px)").matches ? 3 : 2,
  );
  useEffect(() => {
    const query = window.matchMedia("(min-width: 1024px)");
    const update = () => setColumns(query.matches ? 3 : 2);
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);
  const stacks = stackPhotos(photos, columns);

  // Land on the photo the guest was on, in the middle of the screen, with focus on it.
  useEffect(() => {
    const photo = currentRef.current;
    if (!photo) return;
    photo.scrollIntoView({ block: "center" });
    photo.focus({ preventScroll: true });
  }, [current]);

  const onKeyDown = useCallback(
    (event: KeyboardEvent) => {
      // While the viewer is open on top, Esc and Tab are the viewer's. Without this, one
      // Esc closed both layers at once.
      if (viewerRef.current) return;
      if (event.key === "Escape") {
        onClose();
        return;
      }
      // Tab is trapped inside the dialog. aria-modal="true" tells assistive technology the
      // rest of the page is unavailable; until the siblings were inert and Tab cycled,
      // that was a claim the markup did not keep.
      if (event.key !== "Tab") return;
      const root = dialogRef.current;
      if (!root) return;
      const focusable = Array.from(
        root.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])',
        ),
      ).filter((el) => el.offsetParent !== null || el === closeRef.current);
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;
      if (event.shiftKey && (active === first || !root.contains(active))) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    },
    [onClose, viewerRef],
  );

  useEffect(() => {
    document.addEventListener("keydown", onKeyDown);
    // Stop the page behind scrolling while the overlay is up. overflow: hidden alone is not
    // enough: iOS Safari ignores it for touch, so a swipe past the last photo carried on
    // into the listing behind and the grid seemed to scroll for ever. Pinning the body in
    // place at its current offset holds it on every browser; the offset goes back on close.
    // The grid itself is overscroll-behavior: none rather than contain: contain stops the
    // page scrolling but still lets iOS pull the grid past its last photo and bounce back.
    const body = document.body.style;
    const saved = {
      overflow: body.overflow,
      position: body.position,
      top: body.top,
      width: body.width,
    };
    const scrollY = window.scrollY;
    body.overflow = "hidden";
    body.position = "fixed";
    body.top = `-${scrollY}px`;
    body.width = "100%";

    // Everything else on the page goes inert, so a screen reader in browse mode cannot
    // read through the overlay either. This dialog renders inline, inside <main>, so
    // walking only document.body.children would skip the one child holding almost all of
    // the page; walking up the ancestor chain and inerting each level's siblings covers it.
    // The viewer is appended to <body> after this runs, so it is never made inert.
    const dialog = dialogRef.current;
    const hidden: HTMLElement[] = [];
    for (let node = dialog?.parentElement; node; node = node.parentElement) {
      for (const sibling of Array.from(node.children)) {
        if (!(sibling instanceof HTMLElement)) continue;
        if (sibling.contains(dialog)) continue;
        if (sibling.hasAttribute("inert")) continue;
        sibling.setAttribute("inert", "");
        hidden.push(sibling);
      }
      if (node === document.body) break;
    }

    // Focus goes to the outlined photo on mount, and back to the page's opener on close;
    // the gallery handles both, since the grid is not the only view that can end it.
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      Object.assign(body, saved);
      window.scrollTo({ top: scrollY, behavior: "instant" });
      for (const el of hidden) el.removeAttribute("inert");
    };
  }, [onKeyDown]);

  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-label={labels.photosOf.replace("{property}", labels.propertyName)}
      className="fixed inset-0 z-70 flex items-start justify-center overflow-y-auto overscroll-none bg-scrim px-3 pb-6 pt-[72px] sm:px-10 sm:pb-10"
      onClick={onClose}
    >
      {/* The viewer's top bar, in the grid: the one-square button where the viewer has its
          four squares, then the X. Same places, so the switch is the same tap both ways. */}
      <div className="fixed inset-x-0 top-0 z-10 flex h-[60px] items-center justify-end bg-scrim pr-1.5">
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onOpen(current);
          }}
          aria-label={labels.photoSingle}
          title={labels.photoSingle}
          className="flex h-[60px] w-[50px] cursor-pointer items-center justify-center text-white/85 hover:text-white"
        >
          <SingleIcon className="size-8" />
        </button>
        <button
          ref={closeRef}
          type="button"
          onClick={(event) => {
            // The backdrop closes too; one click, one close, or history steps back twice.
            event.stopPropagation();
            onClose();
          }}
          aria-label={labels.close}
          title={labels.close}
          className="flex h-[60px] w-[50px] cursor-pointer items-center justify-center text-3xl leading-none text-white/85 hover:text-white"
        >
          ×
        </button>
      </div>

      {/* Clicks inside the grid should not close it; only the backdrop and × do.

          Two stacks of photos, three from 1024px, each photo going to whichever stack is
          shortest so far, so photos of any shape pack without ragged rows and still read
          roughly in order across. Built here rather than with CSS columns: Safari on an
          iPhone sized the columns' scrollable area at about twice the photos' height, and a
          guest could scroll some 3,000px of empty dark space past the last photo. */}
      <div
        data-photo-grid=""
        className="flex w-full max-w-[1100px] items-start gap-2 sm:gap-2.5"
        onClick={(event) => event.stopPropagation()}
      >
        {stacks.map((stack, column) => (
          <div key={column} className="flex min-w-0 flex-1 flex-col gap-2 sm:gap-2.5">
            {stack.map((index) => {
              const photo = photos[index];
              return (
                <button
                  key={photo.src.src}
                  ref={index === current ? currentRef : undefined}
                  type="button"
                  onClick={() => onOpen(index)}
                  aria-current={index === current ? "true" : undefined}
                  {...openPhotoProps(`${baseId}-all-${index}`, photo, labels.openPhoto)}
                  className="block w-full cursor-pointer overflow-hidden rounded-box outline-offset-2 aria-[current]:outline-3 aria-[current]:outline-white"
                >
                  <OpenPhotoName id={`${baseId}-all-${index}`} photo={photo} label={labels.openPhoto} />
                  <Image
                    src={photo.src}
                    alt=""
                    placeholder="blur"
                    sizes="(min-width: 1024px) 360px, 50vw"
                    className="block h-auto w-full transition-opacity hover:opacity-90"
                  />
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
