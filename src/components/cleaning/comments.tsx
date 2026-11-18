"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { Camera } from "@/components/cleaning/glyphs";
import { PhotoTiles } from "@/components/cleaning/photo-tiles";
import {
  MAX_COMMENT_LENGTH,
  MAX_PHOTOS_PER_COMMENT,
  photoStillKept,
  type Comment,
} from "@/lib/cleaning/comment-shape";
import { builtAtDigits } from "@/lib/cleaning/document";
import { CLEANING_API_COMMENT, CLEANING_API_PHOTO } from "@/lib/cleaning/routes";
import { shrinkPhoto } from "@/lib/cleaning/shrink";
import { teamStrings, written, type TeamLang } from "@/lib/cleaning/strings";

/**
 * The conversation about one clean.
 *
 * Paul's instruction, 17/11/2026: a comment section where an AgentSiam colleague and the
 * cleaning lady can talk, like the comments under a post. It is the first thing in this app
 * that anybody on the team types into, and everything about its shape follows from where it
 * is read: a phone, one-handed, often at a house.
 *
 * **It never formats a date.** A comment carries the moment it was written and the moment
 * is printed as digits, by the same function that prints how old the schedule is. The rule
 * that this app composes no Thai date holds here exactly as it holds everywhere else.
 *
 * **A sent comment reloads the thread rather than guessing at it.** The list is rendered on
 * the server, so after a send the page is refreshed and what comes back is what the store
 * actually holds. An optimistic row would be a second place this app decides what a thread
 * says, and the one failure worth protecting against is a comment that looks sent and is
 * not.
 *
 * Offline it fails and says so. That is honest: the schedule and the codes are saved on the
 * phone, and a message to somebody else is not something a phone with no signal can do.
 *
 * **A comment may carry a photograph**, which is what Paul asked for on 17/11/2026: she
 * sends proof that the work is done, and the reply from AgentSiam can carry proof that she
 * has been paid. The phone shrinks it before it is sent, it is stored under its own URL,
 * and the comment carries that URL. Photographs are deleted after a month, so a thread
 * stops showing one on its thirtieth day rather than waiting for the sweep that removes it.
 */
export function Comments({
  slug,
  comments,
  lang,
}: {
  slug: string;
  comments: Comment[];
  lang: TeamLang;
}) {
  const t = teamStrings(lang);
  const router = useRouter();
  const picker = useRef<HTMLInputElement>(null);
  const [body, setBody] = useState("");
  const [photos, setPhotos] = useState<{ file: Blob; preview: string }[]>([]);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);

  /**
   * Several at once, since Paul asked for it on 18/11/2026: a finished house is a bedroom,
   * a bathroom and a kitchen, and sending it was a comment each.
   *
   * Each is shrunk as it is picked rather than when the send happens, so the waiting is
   * spread across choosing them and the send is as quick as it was with one. Past the cap
   * the extras are dropped silently: she picked them in her phone's own sheet, and a
   * sentence explaining the limit is a sentence nobody has written in Thai.
   */
  async function choose(event: React.ChangeEvent<HTMLInputElement>) {
    const picked = Array.from(event.target.files ?? []);
    event.target.value = "";
    if (picked.length === 0) return;
    const room = MAX_PHOTOS_PER_COMMENT - photos.length;
    if (room <= 0) return;
    const shrunk = await Promise.all(picked.slice(0, room).map((file) => shrinkPhoto(file)));
    // Revoked when they are removed or sent, so a long thread does not hold on to blobs the
    // browser cannot free.
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
    setFailed(false);
    try {
      // The photographs first, because the comment carries their pathnames. One that fails
      // to store takes the whole send with it rather than quietly posting the rest: she is
      // sending proof, and a comment missing the room she meant to show is not that.
      //
      // One at a time on purpose. This runs on a phone on mobile data in somebody's house,
      // where six uploads at once is six that all slow down and any of which can time out.
      const images: string[] = [];
      for (const one of photos) {
        const upload = await fetch(CLEANING_API_PHOTO, {
          method: "POST",
          headers: { "Content-Type": one.file.type || "image/jpeg" },
          body: one.file,
        });
        if (!upload.ok) {
          setFailed(true);
          setBusy(false);
          return;
        }
        const path = ((await upload.json()) as { path?: string }).path ?? null;
        if (!path) {
          setFailed(true);
          setBusy(false);
          return;
        }
        images.push(path);
      }

      const response = await fetch(CLEANING_API_COMMENT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, body: text, images }),
      });
      if (response.ok) {
        setBody("");
        dropAll();
        router.refresh();
      } else {
        setFailed(true);
      }
    } catch {
      setFailed(true);
    }
    setBusy(false);
  }

  const placeholder = written(t.commentPlaceholder);
  const sendLabel = written(t.commentSend);

  return (
    <div className="mt-3">
      {comments.length > 0 ? (
        <ul className="space-y-3">
          {comments.map((comment) => {
            const when = builtAtDigits(comment.at);
            const fromUs = comment.by === "agentsiam";
            return (
              <li
                key={comment.id}
                className={`rounded-panel p-4 ${fromUs ? "bg-wash-gold" : "bg-surface"}`}
              >
                <p className="flex flex-wrap items-baseline gap-x-2">
                  <span
                    className={`text-[15px] font-semibold ${
                      fromUs ? "text-deep-gold" : "text-text"
                    }`}
                  >
                    {comment.name}
                  </span>
                  {when ? (
                    <span
                      className="text-[12px] text-muted"
                      style={{ fontFamily: "var(--font-plex-sans), system-ui, sans-serif" }}
                    >
                      {when}
                    </span>
                  ) : null}
                </p>
                {/* Plain text in a React child, so a comment is escaped and stays text. The
                    line breaks somebody typed are kept and nothing else is. */}
                {comment.body ? (
                  <p className="mt-1 whitespace-pre-wrap text-[16px] leading-7 text-body">
                    {comment.body}
                  </p>
                ) : null}
                {/* Only while the month it is kept for lasts. After that the sweep has
                    taken them, or is about to, and a broken image is worse than none. */}
                {photoStillKept(comment.at) ? <PhotoTiles paths={comment.images} /> : null}
              </li>
            );
          })}
        </ul>
      ) : null}

      <form onSubmit={send} className="mt-3">
        <textarea
          value={body}
          onChange={(event) => setBody(event.target.value)}
          maxLength={MAX_COMMENT_LENGTH}
          rows={3}
          placeholder={placeholder || undefined}
          className="w-full rounded-box border border-border bg-bg px-4 py-3 text-[16px] leading-7 text-text placeholder:text-muted"
        />
        {photos.length > 0 ? (
          // The same three-wide grid the thread shows, so what she is about to send looks
          // like what she will see once it is sent. The cross sits on the tile rather than
          // beside it, because beside it there is no room for six.
          <ul className="mt-2 grid grid-cols-3 gap-1.5">
            {photos.map((one, at) => (
              <li key={one.preview} className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={one.preview}
                  alt=""
                  className="aspect-square w-full rounded-box border border-border object-cover"
                />
                <button
                  type="button"
                  onClick={() => drop(at)}
                  className="absolute right-1 top-1 flex h-8 w-8 items-center justify-center rounded-full bg-ink/80 text-[18px] leading-none text-gold-on-ink"
                >
                  &#215;
                </button>
              </li>
            ))}
          </ul>
        ) : null}

        <div className="mt-2 flex items-center gap-2">
          {/* A camera and no word. The one control here that needs no sentence from Paul,
              because a camera on a message box means exactly one thing. `capture` is left
              off on purpose: she may be sending a room she has just finished or a picture
              she took ten minutes ago, and the phone's own sheet offers both. */}
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
            aria-label={t.commentPlaceholder}
            className="flex h-[54px] w-[54px] shrink-0 items-center justify-center rounded-full border border-border text-muted"
          >
            <Camera size={22} />
          </button>
          <button
            type="submit"
            aria-label={t.commentSend}
            disabled={busy || (body.trim().length === 0 && photos.length === 0)}
            className="h-[54px] flex-1 rounded-full bg-ink px-4 text-[17px] font-semibold text-gold-on-ink transition-opacity duration-150 disabled:opacity-30"
          >
            {sendLabel}
          </button>
        </div>
        {failed && written(t.commentFailed) ? (
          <p className="mt-3 rounded-box bg-wash-red px-4 py-3 text-center text-[15px] leading-6 text-deep-red">
            {written(t.commentFailed)}
          </p>
        ) : null}
      </form>
    </div>
  );
}
