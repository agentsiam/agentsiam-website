"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { MAX_COMMENT_LENGTH, MAX_PHOTOS_PER_COMMENT } from "@/lib/cleaning/comment-shape";
import { ADMIN_API_CLEANING, ADMIN_API_CLEANING_PHOTO } from "@/lib/cleaning/routes";
import { shrinkPhoto } from "@/lib/cleaning/shrink";

/**
 * Paul's half of a conversation about one clean.
 *
 * The same thread her phone shows, written from the other end. It posts to the admin route
 * rather than to hers, so the comment is signed AgentSiam rather than with her name, and so
 * the admin session is what authorises it.
 *
 * **It can carry photographs**, which is the half of Paul's instruction that points this
 * way: she sends proof the work is done, and the reply carries proof of the payment. Same
 * store, same shrink on the way out, same month before they are deleted, and since
 * 18/11/2026 up to six on one comment, shown as the same tiles her phone shows.
 *
 * English, like the rest of the admin. The team's screens are Thai because the team reads
 * Thai; this one has two readers and they wrote the rules file.
 */
export function JobComment({ person, slug }: { person: string; slug: string }) {
  const router = useRouter();
  const picker = useRef<HTMLInputElement>(null);
  const [body, setBody] = useState("");
  const [photos, setPhotos] = useState<{ file: Blob; preview: string }[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function choose(event: React.ChangeEvent<HTMLInputElement>) {
    const picked = Array.from(event.target.files ?? []);
    event.target.value = "";
    if (picked.length === 0) return;
    const room = MAX_PHOTOS_PER_COMMENT - photos.length;
    if (room <= 0) {
      setError(`A comment carries at most ${MAX_PHOTOS_PER_COMMENT} photos.`);
      return;
    }
    const shrunk = await Promise.all(picked.slice(0, room).map((file) => shrinkPhoto(file)));
    setPhotos((before) => [
      ...before,
      ...shrunk.map((file) => ({ file, preview: URL.createObjectURL(file) })),
    ]);
  }

  function drop(at: number) {
    setPhotos((before) => {
      const gone = before[at];
      if (gone) URL.revokeObjectURL(gone.preview);
      return before.filter((_, index) => index !== at);
    });
  }

  function dropAll() {
    setPhotos((before) => {
      for (const one of before) URL.revokeObjectURL(one.preview);
      return [];
    });
  }

  async function send(event: React.FormEvent) {
    event.preventDefault();
    const text = body.trim();
    if ((!text && photos.length === 0) || busy) return;
    setBusy(true);
    setError("");
    try {
      // The photographs first, because the comment carries their pathnames, and one at a
      // time for the same reason her end does it that way.
      const images: string[] = [];
      for (const one of photos) {
        const upload = await fetch(ADMIN_API_CLEANING_PHOTO, {
          method: "POST",
          headers: { "Content-Type": one.file.type || "image/jpeg" },
          body: one.file,
        });
        const answer = (await upload.json().catch(() => ({}))) as {
          path?: string;
          error?: string;
        };
        if (!upload.ok || !answer.path) {
          setError(answer.error ?? "The photo did not upload.");
          setBusy(false);
          return;
        }
        images.push(answer.path);
      }

      const response = await fetch(ADMIN_API_CLEANING, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "comment", person, slug, body: text, images }),
      });
      const answer = (await response.json().catch(() => ({}))) as { error?: string };
      if (response.ok) {
        setBody("");
        dropAll();
        router.refresh();
      } else {
        setError(answer.error ?? "That did not send.");
      }
    } catch {
      setError("That did not send.");
    }
    setBusy(false);
  }

  return (
    <form onSubmit={send} className="mt-3">
      <textarea
        value={body}
        onChange={(event) => setBody(event.target.value)}
        maxLength={MAX_COMMENT_LENGTH}
        rows={2}
        placeholder="Reply to her about this clean"
        className="w-full rounded-box border border-hairline bg-bg px-3 py-2 text-sm text-text placeholder:text-muted"
      />
      {photos.length > 0 ? (
        <ul className="mt-2 grid max-w-[18rem] grid-cols-3 gap-1.5">
          {photos.map((one, at) => (
            <li key={one.preview} className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={one.preview}
                alt=""
                className="aspect-square w-full rounded-box border border-hairline object-cover"
              />
              <button
                type="button"
                onClick={() => drop(at)}
                aria-label="Remove this photo"
                className="absolute right-1 top-1 flex h-7 w-7 items-center justify-center rounded-full bg-ink/80 text-[16px] leading-none text-bg"
              >
                &#215;
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      <div className="mt-2 flex items-center gap-3">
        <input
          ref={picker}
          type="file"
          accept="image/*"
          multiple
          onChange={choose}
          className="hidden"
        />
        <button
          type="button"
          onClick={() => picker.current?.click()}
          className="rounded-full border border-hairline px-4 py-2 text-sm font-semibold text-muted"
        >
          Photos
        </button>
        <button
          type="submit"
          disabled={busy || (body.trim().length === 0 && photos.length === 0)}
          className="rounded-full bg-ink px-4 py-2 text-sm font-semibold text-bg disabled:opacity-30"
        >
          Send
        </button>
        {error ? <span className="text-sm text-deep-red">{error}</span> : null}
      </div>
    </form>
  );
}
