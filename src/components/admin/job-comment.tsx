"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { MAX_COMMENT_LENGTH } from "@/lib/cleaning/comment-shape";
import { ADMIN_API_CLEANING, ADMIN_API_CLEANING_PHOTO } from "@/lib/cleaning/routes";
import { shrinkPhoto } from "@/lib/cleaning/shrink";

/**
 * Paul's half of a conversation about one clean.
 *
 * The same thread her phone shows, written from the other end. It posts to the admin route
 * rather than to hers, so the comment is signed AgentSiam rather than with her name, and so
 * the admin session is what authorises it.
 *
 * **It can carry a photograph**, which is the half of Paul's instruction that points this
 * way: she sends proof the work is done, and the reply carries proof of the payment. Same
 * store, same shrink on the way out, same month before it is deleted.
 *
 * English, like the rest of the admin. The team's screens are Thai because the team reads
 * Thai; this one has two readers and they wrote the rules file.
 */
export function JobComment({ person, slug }: { person: string; slug: string }) {
  const router = useRouter();
  const picker = useRef<HTMLInputElement>(null);
  const [body, setBody] = useState("");
  const [photo, setPhoto] = useState<{ file: Blob; preview: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function choose(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    const shrunk = await shrinkPhoto(file);
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
    setError("");
    try {
      // The photo first, because the comment carries its URL.
      let image: string | null = null;
      if (photo) {
        const upload = await fetch(ADMIN_API_CLEANING_PHOTO, {
          method: "POST",
          headers: { "Content-Type": photo.file.type || "image/jpeg" },
          body: photo.file,
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
        image = answer.path;
      }

      const response = await fetch(ADMIN_API_CLEANING, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "comment", person, slug, body: text, image }),
      });
      const answer = (await response.json().catch(() => ({}))) as { error?: string };
      if (response.ok) {
        setBody("");
        drop();
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
      {photo ? (
        <div className="mt-2 flex items-start gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={photo.preview} alt="" className="h-20 w-20 rounded-box object-cover" />
          <button type="button" onClick={drop} className="text-sm text-muted underline">
            remove
          </button>
        </div>
      ) : null}

      <div className="mt-2 flex items-center gap-3">
        <input ref={picker} type="file" accept="image/*" onChange={choose} className="hidden" />
        <button
          type="button"
          onClick={() => picker.current?.click()}
          className="rounded-full border border-hairline px-4 py-2 text-sm font-semibold text-muted"
        >
          Photo
        </button>
        <button
          type="submit"
          disabled={busy || (body.trim().length === 0 && !photo)}
          className="rounded-full bg-ink px-4 py-2 text-sm font-semibold text-bg disabled:opacity-30"
        >
          Send
        </button>
        {error ? <span className="text-sm text-deep-red">{error}</span> : null}
      </div>
    </form>
  );
}
