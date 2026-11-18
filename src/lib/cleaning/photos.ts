import { del, get, list, put } from "@vercel/blob";
import {
  MAX_PHOTO_BYTES,
  PHOTO_KEPT_DAYS,
  PHOTO_PREFIX,
  photoStillKept,
} from "./comment-shape";

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
 * **The store is private, at Paul's instruction of 18/11/2026**, which is the decision the
 * rest of this file follows from. A public Blob store answers its own URLs to anybody
 * holding one, and one end of this thread is a bank transfer screenshot while the other is
 * the inside of a guest's bedroom. So nothing here hands out a URL: a comment carries the
 * blob's pathname inside the store, and the only thing that can read it is
 * /api/cleaning/photo, which checks the same two gates as everything else she can reach
 * before it streams a byte. There is no link to leak, with or without an expiry.
 *
 * **The month is enforced three times over**, deliberately, because the one thing worse
 * than keeping a payment slip too long is thinking it was deleted. `ttlDays` on the upload
 * means the store itself deletes it; the daily cron sweeps anything the store somehow kept;
 * and the read path below refuses a blob that is already too old, so a stale pathname in an
 * old comment cannot answer with a picture.
 */

/**
 * What a pathname this app wrote looks like, exactly.
 *
 * The prefix, a calendar date, and a name made of the characters `put` can return with a
 * random suffix on it. This is the one thing standing between a string that arrived from a
 * client and a read out of the store, so it is a whitelist and not a blacklist: no second
 * slash, no `..`, no percent escapes, nothing but what this app itself writes.
 */
const PHOTO_PATH = /^cleaning\/\d{4}-\d{2}-\d{2}\/[A-Za-z0-9._-]{1,120}$/;

export function photosConfigured(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

/**
 * Whether a pathname is one this app wrote.
 *
 * The two routes that write a comment take the pathname from the client, because the upload
 * and the comment are two requests and the first one's answer has to survive to the second.
 * So it is checked against the shape this app writes, and anything else is dropped rather
 * than refused, so a comment with words still lands.
 *
 * The read route checks the same thing, after it has put the prefix back on, so a request
 * cannot name a blob outside `cleaning/` even if the store holds one.
 */
export function isOurPhotoPath(path: unknown): path is string {
  return typeof path === "string" && PHOTO_PATH.test(path);
}

export type StoreResult =
  | { ok: true; path: string }
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
      access: "private",
      addRandomSuffix: true,
      contentType: file.type,
      // The store's own expiry, which is the only one that still works if this app stops
      // running. The cron is the sweep for anything it misses, not the mechanism.
      ttlDays: PHOTO_KEPT_DAYS,
    });
    // The pathname and never the URL: a private blob's URL answers nothing without a token,
    // and storing one would read like a link that works.
    return { ok: true, path: result.pathname };
  } catch {
    return { ok: false, reason: "failed" };
  }
}

export type ReadResult =
  | { ok: true; stream: ReadableStream<Uint8Array>; contentType: string; size: number }
  | { ok: false; reason: "unconfigured" | "gone" | "failed" };

/**
 * Read one photo out of the private store, for the route that streams it.
 *
 * Nothing else in this app reads a blob. A private store answers no URL, so the bytes come
 * back through here and out through /api/cleaning/photo, which has already decided whether
 * whoever is asking may see a photograph at all.
 *
 * A blob older than the month it is kept for is "gone" even while the store still has it.
 * The store deletes on its own clock and the sweep runs once a day, so for a few hours a
 * pathname can outlive the rule; this is what makes the rule exact rather than approximate.
 */
export async function readPhoto(path: string): Promise<ReadResult> {
  if (!photosConfigured()) return { ok: false, reason: "unconfigured" };
  if (!isOurPhotoPath(path)) return { ok: false, reason: "gone" };

  try {
    const found = await get(path, { access: "private" });
    if (!found || found.statusCode !== 200) return { ok: false, reason: "gone" };
    if (!photoStillKept(found.blob.uploadedAt.toISOString())) {
      return { ok: false, reason: "gone" };
    }
    return {
      ok: true,
      stream: found.stream,
      contentType: found.blob.contentType,
      size: found.blob.size,
    };
  } catch {
    // A missing blob throws rather than answering null, and from the route there is nothing
    // to tell it apart from a store that is having a bad minute. Both are "gone" to the
    // phone, which shows no image either way.
    return { ok: false, reason: "gone" };
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
 *
 * Since the store became private on 18/11/2026 every upload also carries `ttlDays`, so this
 * is the second of three mechanisms rather than the only one. It stays because it is the one
 * that can be checked: it reports what it found and what it deleted, and `scripts/check-cron.mjs`
 * refuses a build that has lost it.
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
      // By pathname, not by url: `del` takes either, and a private store's url is not a
      // thing this app ever holds on to.
      if (blob.uploadedAt.getTime() < cutoff) doomed.push(blob.pathname);
    }
    cursor = page.hasMore ? page.cursor : undefined;
  } while (cursor);

  for (let at = 0; at < doomed.length; at += 100) {
    await del(doomed.slice(at, at + 100));
  }
  return { checked, deleted: doomed.length };
}
