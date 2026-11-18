import { del, list, put } from "@vercel/blob";
import { MAX_PHOTO_BYTES, PHOTO_KEPT_DAYS } from "./comment-shape";

/**
 * The photos on a comment thread: proof that a room is finished, proof that a payment went.
 *
 * Paul, 17/11/2026, asked for images on both ends of the thread, and chose Vercel Blob to
 * hold them: the same vendor as the hosting and the store, one token, and a real URL rather
 * than a picture smuggled through a key-value store as text.
 *
 * **Everything here lives under one prefix**, which is what makes the monthly sweep
 * possible: it lists `cleaning/` and nothing else, so no other part of this project can
 * ever be caught by it, and nothing of ours can escape it.
 *
 * **The URLs are public to anyone holding them.** That is how image hosting works: the
 * name carries a random suffix nobody can guess, and there is no second check at the edge.
 * Worth knowing because one end of this thread is a payment slip. They are only ever written
 * into a thread that sits behind her PIN, and they stop existing after a month.
 */

/** Every photo this app stores, and the only thing the sweep is allowed to delete. */
export const PHOTO_PREFIX = "cleaning/";

/** The host Vercel Blob serves from. Checked rather than assumed, because a comment carries
 * the URL as text and a URL pointing anywhere else would load a stranger's image inside a
 * screen that is otherwise entirely this app's. */
const BLOB_HOST = ".public.blob.vercel-storage.com";

export function photosConfigured(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

/**
 * Whether a URL is one of ours.
 *
 * The two routes that write a comment take the photo URL from the client, because the
 * upload and the comment are two requests and the first one's answer has to survive to the
 * second. So it is checked: the right host, and the prefix this app owns. Anything else is
 * dropped rather than refused, so a comment with words still lands.
 */
export function isOurPhoto(url: unknown): url is string {
  if (typeof url !== "string" || url.length === 0) return false;
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:") return false;
    if (!parsed.hostname.endsWith(BLOB_HOST)) return false;
    return parsed.pathname.slice(1).startsWith(PHOTO_PREFIX);
  } catch {
    return false;
  }
}

export type StoreResult =
  | { ok: true; url: string }
  | { ok: false; reason: "unconfigured" | "too-big" | "not-an-image" | "failed" };

/**
 * Put one photo in the store and hand back its URL.
 *
 * The phone has already shrunk it. This checks what arrived rather than trusting that:
 * something that is not an image, or an image heavier than the backstop, is refused here
 * and never reaches the store.
 */
export async function storePhoto(file: Blob): Promise<StoreResult> {
  if (!photosConfigured()) return { ok: false, reason: "unconfigured" };
  if (!file.type.startsWith("image/")) return { ok: false, reason: "not-an-image" };
  if (file.size === 0 || file.size > MAX_PHOTO_BYTES) return { ok: false, reason: "too-big" };

  try {
    // No name from the client and no person in the path. A blob name is part of a public
    // URL, so it carries the date it was taken, for a human reading a listing, and random
    // characters for everything else.
    const day = new Date().toISOString().slice(0, 10);
    const result = await put(`${PHOTO_PREFIX}${day}/photo`, file, {
      access: "public",
      addRandomSuffix: true,
      contentType: file.type,
    });
    return { ok: true, url: result.url };
  } catch {
    return { ok: false, reason: "failed" };
  }
}

/**
 * Delete every photo older than the month it is kept for.
 *
 * Paul's rule of 18/11/2026, and the only thing that enforces it: Vercel Blob has no expiry
 * of its own, so without this a proof-of-work photo would sit there for good. Run daily by
 * the cron in vercel.json.
 *
 * It reads `uploadedAt` from the store rather than anything written in a comment, so a
 * photo whose comment has already expired out of Redis is still swept. Deleting in batches
 * because `del` takes a list and a month of photos is a short one.
 */
export async function sweepPhotos(now: Date = new Date()): Promise<{
  checked: number;
  deleted: number;
}> {
  const cutoff = now.getTime() - PHOTO_KEPT_DAYS * 24 * 60 * 60 * 1000;
  let cursor: string | undefined;
  let checked = 0;
  const doomed: string[] = [];

  do {
    const page = await list({ prefix: PHOTO_PREFIX, cursor, limit: 1000 });
    for (const blob of page.blobs) {
      checked += 1;
      if (blob.uploadedAt.getTime() < cutoff) doomed.push(blob.url);
    }
    cursor = page.hasMore ? page.cursor : undefined;
  } while (cursor);

  for (let at = 0; at < doomed.length; at += 100) {
    await del(doomed.slice(at, at + 100));
  }
  return { checked, deleted: doomed.length };
}
