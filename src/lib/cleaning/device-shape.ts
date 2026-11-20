/**
 * What a phone is called, in the one form both sides of the app can hold.
 *
 * Split out for the same reason src/lib/cleaning/comment-shape.ts is: the screen where the
 * name is typed is a client component, and src/lib/cleaning/devices.ts reaches the store,
 * which imports the filesystem. One number and one function, no state and no I/O.
 */

/** One short line. Long enough for "LINE browser" or "the new Samsung", short enough to sit
 * on a row beside the dates it has to be read against. */
export const MAX_DEVICE_LABEL = 40;

/** Trimmed to one line and capped. Returns "" for anything not worth storing, which is also
 * how a name is removed: an empty field is a deletion rather than a value. */
export function cleanDeviceLabel(raw: unknown): string {
  if (typeof raw !== "string") return "";
  return raw.replace(/\s+/g, " ").trim().slice(0, MAX_DEVICE_LABEL);
}
