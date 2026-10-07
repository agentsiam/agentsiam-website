"use client";

import Image from "next/image";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import type { Photo } from "@/lib/photos.generated";

/**
 * The property gallery from the handoff: one large slot plus four small ones, opening into
 * a lightbox of everything.
 *
 * Every photo is a static import, so next/image already knows its dimensions and carries a
 * blur-up placeholder, and generates a WebP/AVIF at whatever size the slot actually needs.
 * Nothing here has to know a pixel dimension -- `sizes` tells the browser how wide the slot
 * will be at each breakpoint and it picks from the generated set.
 *
 * Every photo shows in one of two shapes, whatever property it belongs to: landscape 3:2
 * or portrait 3:4, chosen by the file's own orientation. The two tile exactly, because two
 * 3:2 landscapes stacked are one 3:4 portrait, so any mix of photos fills the grid with no
 * holes and no per-property layout. Cropping is object-cover from the centre, at render;
 * the originals are never cut. If a particular photo crops badly, give it an
 * `objectPosition` in the manifest rather than re-cropping the original by hand.
 */

const isPortrait = (photo: Photo) => photo.src.height > photo.src.width;

/**
 * The block beside the hero: two columns, each holding one portrait or two landscapes, in
 * the set's running order. A photo that no longer fits is skipped for the next one that
 * does, and the lightbox still shows it. A column left with a single landscape stretches
 * it, which only happens when a set runs out of landscapes.
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

export function PhotoGallery({
  photos,
  labels,
}: {
  photos: Photo[];
  labels: {
    showAll: string;
    close: string;
    photosOf: string;
    propertyName: string;
    openPhoto: string;
  };
}) {
  const [openAt, setOpenAt] = useState<number | null>(null);
  const baseId = useId();

  if (photos.length === 0) return null;

  // The hero slot is landscape, so it takes the first landscape in running order.
  const hero = photos.find((photo) => !isPortrait(photo)) ?? photos[0];
  const tiles = fillBlock(photos.filter((photo) => photo !== hero));
  const remaining = photos.length - 1 - tiles.length;

  return (
    <>
      <div className="relative">
        <div className="grid gap-1.5 overflow-hidden rounded-panel min-[900px]:grid-cols-2 min-[900px]:gap-2">
          {/* Named "Open photo: <description>". Named by the description alone, five
              buttons in a row announced as five paragraphs of prose with nothing saying
              any of them opened anything.

              Two hidden spans rather than one aria-label string once a caption exists:
              the caption is the photo's own English words (same source as the visible
              lightbox figcaption below), and an aria-label is a flat string with no way
              to mark part of it lang="en". A Thai or Chinese screen reader would otherwise
              try to pronounce the caption in that voice. aria-labelledby lets each
              fragment carry its own language. No caption, no mixed language, so the
              fallback stays a plain aria-label. */}
          <button
            type="button"
            onClick={() => setOpenAt(photos.indexOf(hero))}
            aria-label={hero.alt ? undefined : labels.openPhoto}
            aria-labelledby={hero.alt ? `${baseId}-hero-label ${baseId}-hero-alt` : undefined}
            className="relative aspect-3/2 cursor-pointer"
          >
            {hero.alt ? (
              <>
                <span id={`${baseId}-hero-label`} className="sr-only">
                  {labels.openPhoto}
                </span>
                <span id={`${baseId}-hero-alt`} lang="en" className="sr-only">
                  {hero.alt}
                </span>
              </>
            ) : null}
            <Image
              src={hero.src}
              alt={hero.alt || labels.propertyName}
              lang="en"
              placeholder="blur"
              priority
              fill
              // Hero is the full content width below 900px, then a little under half of a
              // 1440px container above it.
              sizes="(min-width: 900px) 700px, 100vw"
              className="object-cover"
            />
          </button>

          {/* Two columns by two rows at 3:2 overall, the same shape as the hero, so each
              cell is 3:2 and a cell pair stacked is 3:4. */}
          {tiles.length > 0 ? (
            <div className="grid aspect-3/2 grid-cols-2 grid-rows-2 gap-1.5 min-[900px]:gap-2">
              {tiles.map(({ photo, col, row, tall }, index) => (
                <button
                  key={photo.src.src}
                  type="button"
                  onClick={() => setOpenAt(photos.indexOf(photo))}
                  aria-label={photo.alt ? undefined : labels.openPhoto}
                  aria-labelledby={
                    photo.alt ? `${baseId}-thumb-${index}-label ${baseId}-thumb-${index}-alt` : undefined
                  }
                  style={{
                    gridColumn: col + 1,
                    gridRow: tall ? "1 / span 2" : row + 1,
                  }}
                  className="relative cursor-pointer"
                >
                  {photo.alt ? (
                    <>
                      <span id={`${baseId}-thumb-${index}-label`} className="sr-only">
                        {labels.openPhoto}
                      </span>
                      <span id={`${baseId}-thumb-${index}-alt`} lang="en" className="sr-only">
                        {photo.alt}
                      </span>
                    </>
                  ) : null}
                  <Image
                    src={photo.src}
                    alt={photo.alt || labels.propertyName}
                    lang="en"
                    placeholder="blur"
                    fill
                    sizes="(min-width: 900px) 350px, 50vw"
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
            onClick={() => setOpenAt(0)}
            className="absolute bottom-4 right-4 cursor-pointer rounded-full bg-bg/95 px-4 py-2.5 text-[13px] font-semibold text-text shadow-sm hover:bg-bg"
          >
            {labels.showAll} ({photos.length})
          </button>
        ) : null}
      </div>

      {openAt !== null ? (
        <Lightbox photos={photos} startAt={openAt} labels={labels} onClose={() => setOpenAt(null)} />
      ) : null}
    </>
  );
}

function Lightbox({
  photos,
  startAt,
  labels,
  onClose,
}: {
  photos: Photo[];
  startAt: number;
  labels: { close: string; photosOf: string; propertyName: string };
  onClose: () => void;
}) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const startRef = useRef<HTMLDivElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  // Where focus was when the overlay opened, so it can go back there on close rather than
  // to the top of the document.
  const openerRef = useRef<Element | null>(null);

  const onKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
        return;
      }
      // Tab is trapped inside the dialog. aria-modal="true" tells assistive technology the
      // rest of the page is unavailable; until the siblings were inert and Tab cycled,
      // that was a claim the markup did not keep -- six Tab presses walked out of a
      // full-screen overlay onto controls the user could no longer see.
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
    [onClose],
  );

  useEffect(() => {
    document.addEventListener("keydown", onKeyDown);
    // Stop the page behind scrolling while the overlay is up.
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";

    // Everything else on the page goes inert, so a screen reader in browse mode cannot
    // read through the overlay either.
    //
    // Walking document.body.children is not enough and was the first attempt: this dialog
    // is rendered inline, inside <main>, so the one body child that contains it is the one
    // holding almost all of the page, and skipping it left the whole article reachable
    // behind a full-screen overlay. Walking up the ancestor chain and inerting each
    // level's siblings is the version that actually covers the page.
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
    startRef.current?.scrollIntoView({ block: "start" });
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

      {/* Clicks inside the grid should not close it; only the backdrop and × do.
          Columns rather than a grid, so 3:2 and 3:4 photos pack without ragged rows. */}
      <div
        className="w-full max-w-[1000px] gap-2.5 sm:columns-2 lg:columns-3"
        onClick={(event) => event.stopPropagation()}
      >
        {photos.map((photo, index) => (
          <figure
            key={photo.src.src}
            ref={index === startAt ? startRef : undefined}
            className="mb-2.5 break-inside-avoid"
          >
            {/* alt="" where a figcaption is about to say the same words. Repeating the
                description in both read each photo twice, forty-six times. */}
            <div
              className={`relative overflow-hidden rounded-box ${isPortrait(photo) ? "aspect-3/4" : "aspect-3/2"}`}
            >
              <Image
                src={photo.src}
                alt={photo.alt ? "" : labels.propertyName}
                placeholder="blur"
                fill
                sizes="(min-width: 1024px) 330px, (min-width: 640px) 50vw, 100vw"
                className="object-cover"
              />
            </div>
            {photo.alt ? (
              <figcaption
                lang="en"
                className="mt-1.5 text-xs leading-relaxed text-white/60"
              >
                {photo.alt}
              </figcaption>
            ) : null}
          </figure>
        ))}
      </div>
    </div>
  );
}
