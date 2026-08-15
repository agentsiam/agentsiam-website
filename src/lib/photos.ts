import { PHOTOS, type Photo } from "./photos.generated";

/**
 * Reading side of the photo manifest.
 *
 * Everything here returns undefined or an empty array when a set is missing, and every page
 * that uses it falls back to the flat brand panel it had before. That is deliberate: a
 * folder that has not been filled yet should leave the site looking finished, not broken.
 * Drop files in and the photo appears; take them out and the panel comes back.
 */

export type { Photo };

/** Every photo in a set, in the manifest's running order (rating, then filename). */
export function photoSet(set: string): Photo[] {
  return PHOTOS[set] ?? [];
}

/** The set's lead photo -- five stars, or first alphabetically if nothing is starred. */
export function heroPhoto(set: string): Photo | undefined {
  return PHOTOS[set]?.[0];
}

/**
 * One specific photo, found by any fragment of its path inside the set.
 * `pickPhoto("lotushouse", "IMG_5359")` survives the file being re-rated or moved between
 * room folders; it only breaks if the file is renamed, and then it returns undefined
 * rather than throwing.
 */
export function pickPhoto(set: string, fragment: string): Photo | undefined {
  return PHOTOS[set]?.find((photo) => photo.file.includes(fragment));
}

/**
 * The first of `fragments` that resolves, else the set's next-best photo. Lets a page ask
 * for the shot it wants without hard-failing when that shot has not been taken yet.
 */
export function pickPhotos(set: string, fragments: string[]): Photo[] {
  const chosen = fragments
    .map((fragment) => pickPhoto(set, fragment))
    .filter((photo): photo is Photo => Boolean(photo));
  if (chosen.length === fragments.length) return chosen;

  // Top up from the front of the set, skipping anything already chosen.
  const taken = new Set(chosen.map((photo) => photo.file));
  for (const photo of photoSet(set)) {
    if (chosen.length >= fragments.length) break;
    if (!taken.has(photo.file)) chosen.push(photo);
  }
  return chosen;
}
