"use client";

import { useCallback, useEffect, useState } from "react";
import { cleaningPhotoSrc } from "@/lib/cleaning/routes";

/**
 * The photographs on one comment, as tiles.
 *
 * Paul, 18/11/2026: several photographs at once, shown small so they cost as little of the
 * screen as possible. On a phone held one-handed at a house, a thread where every photo is
 * full width is a thread you scroll past rather than read, and the photographs are evidence
 * rather than decoration: the question they answer is "was it done", and a thumbnail answers
 * it.
 *
 * So: a three-wide grid of squares, cropped to fill, with the whole picture one tap away.
 * One photograph on its own is not stretched across the screen either, because a comment
 * with one and a comment with four should read as the same kind of thing.
 *
 * **The same component on both ends of the thread**, hers and Paul's, which is the reason it
 * is a client component rather than two lots of markup: the tap that opens a photograph
 * needs state, and a thread that behaves differently in the admin is a thread nobody can
 * reason about.
 *
 * Every `src` goes through cleaningPhotoSrc, so what the browser requests is this app's own
 * gated route and never the store. There is no URL here that works without her cookies.
 */
export function PhotoTiles({ paths }: { paths: string[] }) {
  const [open, setOpen] = useState<number | null>(null);
  const shown = open === null ? null : paths[open];

  const close = useCallback(() => setOpen(null), []);

  useEffect(() => {
    if (open === null) return;
    function key(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(null);
      if (event.key === "ArrowRight") setOpen((at) => (at === null ? null : (at + 1) % paths.length));
      if (event.key === "ArrowLeft") {
        setOpen((at) => (at === null ? null : (at - 1 + paths.length) % paths.length));
      }
    }
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [open, paths.length]);

  if (paths.length === 0) return null;

  return (
    <>
      <ul
        className={`mt-2 grid gap-1.5 ${
          paths.length === 1 ? "max-w-[9rem] grid-cols-1" : "grid-cols-3"
        }`}
      >
        {paths.map((path, at) => (
          <li key={path}>
            <button
              type="button"
              onClick={() => setOpen(at)}
              className="block w-full overflow-hidden rounded-box border border-hairline"
            >
              {/* A plain img rather than next/image: these are photographs of unknown shape
                  coming out of a gated route, and the optimizer would neither be allowed to
                  fetch them nor have anything to gain by it. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={cleaningPhotoSrc(path)}
                alt=""
                loading="lazy"
                className="aspect-square w-full object-cover"
              />
            </button>
          </li>
        ))}
      </ul>

      {shown ? (
        // One tap anywhere closes it, which is the gesture a phone expects and the only one
        // that needs no instruction.
        <div
          role="presentation"
          onClick={close}
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/90 p-4"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={cleaningPhotoSrc(shown)}
            alt=""
            className="max-h-full max-w-full rounded-box object-contain"
          />
          {paths.length > 1 ? (
            <p className="absolute bottom-6 text-sm font-semibold text-bg">
              {open === null ? "" : `${open + 1}/${paths.length}`}
            </p>
          ) : null}
        </div>
      ) : null}
    </>
  );
}
