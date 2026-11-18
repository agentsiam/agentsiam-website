"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { Camera } from "@/components/cleaning/glyphs";
import {
  MAX_COMMENT_LENGTH,
  photoStillKept,
  type Comment,
} from "@/lib/cleaning/comment-shape";
import { builtAtDigits } from "@/lib/cleaning/document";
import { CLEANING_API_COMMENT, CLEANING_API_PHOTO } from "@/lib/cleaning/routes";
import { shrinkPhoto } from "@/lib/cleaning/shrink";
import { TEAM_STRINGS, written } from "@/lib/cleaning/strings";

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
export function Comments({ slug, comments }: { slug: string; comments: Comment[] }) {
  const router = useRouter();
  const picker = useRef<HTMLInputElement>(null);
  const [body, setBody] = useState("");
  const [photo, setPhoto] = useState<{ file: Blob; preview: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);

  async function choose(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    const shrunk = await shrinkPhoto(file);
    // Revoked when it is replaced or sent, so a long thread does not hold on to blobs the
    // browser cannot free.
    setPhoto((before) => {
      if (before) URL.revokeObjectURL(before.preview);
      return { file: shrunk, preview: URL.createObjectURL(shrunk) };
    });
  }

  function drop() {
    setPhoto((before) => {
      if (before) URL.revokeObjectURL(before.preview);
      return null;
    });
  }

  async function send(event: React.FormEvent) {
    event.preventDefault();
    const text = body.trim();
    if ((!text && !photo) || busy) return;
    setBusy(true);
    setFailed(false);
    try {
      // The photo first, because the comment carries its URL. A photo that fails to store
      // takes the whole send with it rather than quietly posting the words alone: she is
      // sending proof, and a comment that says "done" without the picture is not that.
      let image: string | null = null;
      if (photo) {
        const upload = await fetch(CLEANING_API_PHOTO, {
          method: "POST",
          headers: { "Content-Type": photo.file.type || "image/jpeg" },
          body: photo.file,
        });
        if (!upload.ok) {
          setFailed(true);
          setBusy(false);
          return;
        }
        image = ((await upload.json()) as { url?: string }).url ?? null;
      }

      const response = await fetch(CLEANING_API_COMMENT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, body: text, image }),
      });
      if (response.ok) {
        setBody("");
        drop();
        router.refresh();
      } else {
        setFailed(true);
      }
    } catch {
      setFailed(true);
    }
    setBusy(false);
  }

  const placeholder = written(TEAM_STRINGS.commentPlaceholder);
  const sendLabel = written(TEAM_STRINGS.commentSend);

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
                    taken it, or is about to, and a broken image is worse than none.
                    A plain img rather than next/image: these are photographs of unknown
                    shape from a phone, and the optimizer would crop or cost for nothing. */}
                {comment.image && photoStillKept(comment.at) ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={comment.image}
                    alt=""
                    loading="lazy"
                    className="mt-2 max-h-[320px] w-full rounded-box object-contain"
                  />
                ) : null}
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
        {photo ? (
          <div className="mt-2 flex items-start gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={photo.preview}
              alt=""
              className="h-24 w-24 rounded-box object-cover"
            />
            <button
              type="button"
              onClick={drop}
              aria-label={TEAM_STRINGS.commentSend}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-surface text-[20px] leading-none text-muted"
            >
              &#215;
            </button>
          </div>
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
            onChange={choose}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => picker.current?.click()}
            aria-label={TEAM_STRINGS.commentPlaceholder}
            className="flex h-[54px] w-[54px] shrink-0 items-center justify-center rounded-full border border-border text-muted"
          >
            <Camera size={22} />
          </button>
          <button
            type="submit"
            aria-label={TEAM_STRINGS.commentSend}
            disabled={busy || (body.trim().length === 0 && !photo)}
            className="h-[54px] flex-1 rounded-full bg-ink px-4 text-[17px] font-semibold text-gold-on-ink transition-opacity duration-150 disabled:opacity-30"
          >
            {sendLabel}
          </button>
        </div>
        {failed && written(TEAM_STRINGS.commentFailed) ? (
          <p className="mt-3 rounded-box bg-wash-red px-4 py-3 text-center text-[15px] leading-6 text-deep-red">
            {written(TEAM_STRINGS.commentFailed)}
          </p>
        ) : null}
      </form>
    </div>
  );
}
