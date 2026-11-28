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
  viewer.on("destroy", () => {
    viewerRef.current = null;
  });

  viewerRef.current = viewer;
  viewer.init();
}

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
  const [overviewOpen, setOverviewOpen] = useState(false);
  const [current, setCurrent] = useState(0);
  const viewerRef = useRef<PhotoSwipe | null>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const baseId = useId();

  // Close the viewer if the gallery itself goes away, e.g. on client navigation.
  useEffect(() => () => viewerRef.current?.destroy(), []);

  const onTrackScroll = useCallback(() => {
    const track = trackRef.current;
    if (!track || track.clientWidth === 0) return;
    setCurrent(Math.round(track.scrollLeft / track.clientWidth));
  }, []);

  if (photos.length === 0) return null;

  // The hero slot is landscape, so it takes the first landscape in running order, and it
  // leads every surface so they all share one order.
  const hero = photos.find((photo) => !isPortrait(photo)) ?? photos[0];
  const ordered = [hero, ...photos.filter((photo) => photo !== hero)];
  const tiles = fillBlock(ordered.slice(1));
  const remaining = ordered.length - 1 - tiles.length;

  const open = (photo: Photo) => {
    void openViewer(ordered, ordered.indexOf(photo), labels, viewerRef);
  };

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
          <span
            aria-hidden="true"
            className="pointer-events-none absolute bottom-3 right-3 rounded-full bg-scrim/75 px-2.5 py-1 text-xs font-semibold tabular-nums text-white"
          >
            {current + 1} / {ordered.length}
          </span>
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
            onClick={() => setOverviewOpen(true)}
            className="absolute bottom-4 right-4 cursor-pointer rounded-full bg-bg/95 px-4 py-2.5 text-[13px] font-semibold text-text shadow-sm hover:bg-bg"
          >
            {labels.showAll} ({ordered.length})
          </button>
        ) : null}
      </div>

      {overviewOpen ? (
        <Overview
          photos={ordered}
          labels={labels}
          baseId={baseId}
          viewerRef={viewerRef}
          onOpen={open}
          onClose={() => setOverviewOpen(false)}
        />
      ) : null}
    </>
  );
}

/**
 * Every photo at its own shape, as thumbnails to pick from. Descriptions are not printed
 * here: they belong with the photo at full size, in the viewer, not as a column of small
 * text under forty thumbnails.
 */
function Overview({
  photos,
  labels,
  baseId,
  viewerRef,
  onOpen,
  onClose,
}: {
  photos: Photo[];
  labels: Labels;
  baseId: string;
  viewerRef: RefObject<PhotoSwipe | null>;
  onOpen: (photo: Photo) => void;
  onClose: () => void;
}) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  // Where focus was when the overlay opened, so it can go back there on close rather than
  // to the top of the document.
  const openerRef = useRef<Element | null>(null);

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
    // Stop the page behind scrolling while the overlay is up.
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";

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

    openerRef.current = document.activeElement;
    closeRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = overflow;
      for (const el of hidden) el.removeAttribute("inert");
      const opener = openerRef.current;
      if (opener instanceof HTMLElement && opener.isConnected) opener.focus();
    };
  }, [onKeyDown]);

  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-label={labels.photosOf.replace("{property}", labels.propertyName)}
      className="fixed inset-0 z-70 flex items-start justify-center overflow-y-auto bg-scrim/95 p-6 sm:p-10"
      onClick={onClose}
    >
      <button
        ref={closeRef}
        type="button"
        onClick={onClose}
        aria-label={labels.close}
        className="fixed right-5 top-4 z-10 cursor-pointer rounded-full px-3 py-1 text-3xl leading-none text-white/80 hover:text-white"
      >
        ×
      </button>

      {/* Clicks inside the grid should not close it; only the backdrop and × do. Columns
          rather than a grid, so photos of any shape pack without ragged rows. */}
      <div
        className="w-full max-w-[1100px] gap-2.5 sm:columns-2 lg:columns-3"
        onClick={(event) => event.stopPropagation()}
      >
        {photos.map((photo, index) => (
          <button
            key={photo.src.src}
            type="button"
            onClick={() => onOpen(photo)}
            {...openPhotoProps(`${baseId}-all-${index}`, photo, labels.openPhoto)}
            className="mb-2.5 block w-full cursor-pointer break-inside-avoid overflow-hidden rounded-box"
          >
            <OpenPhotoName id={`${baseId}-all-${index}`} photo={photo} label={labels.openPhoto} />
            <Image
              src={photo.src}
              alt=""
              placeholder="blur"
              sizes="(min-width: 1024px) 360px, (min-width: 640px) 50vw, 100vw"
              className="h-auto w-full transition-opacity hover:opacity-90"
            />
          </button>
        ))}
      </div>
    </div>
  );
}
