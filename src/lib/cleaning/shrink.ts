import { MAX_PHOTO_EDGE } from "./comment-shape";

/**
 * Shrink a photo on the phone, before it is ever sent.
 *
 * A photograph from a modern phone is four or five megabytes. What it is for here is
 * showing that a room is finished or that a transfer went through, and both are legible at
 * a fraction of that. Shrinking first means an upload that completes on a Thai mobile
 * connection in a house, a store that does not fill up, and a thread that loads.
 *
 * **It never fails loudly.** A browser without `createImageBitmap`, a file the canvas
 * cannot decode, a photo that is already small: all of them come back as the original file,
 * which the route will still accept as long as it is under the backstop. Losing the shrink
 * costs bandwidth; refusing the upload would cost her the proof she came to send.
 *
 * Orientation is handled by `createImageBitmap` with `imageOrientation: "from-image"`, so a
 * photo taken sideways is not stored sideways. The output is JPEG regardless of what came
 * in, because the alternative is shipping a 12 megapixel PNG of a bedspread.
 */
export async function shrinkPhoto(file: File): Promise<Blob> {
  if (!file.type.startsWith("image/")) return file;
  if (typeof createImageBitmap !== "function") return file;

  try {
    const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
    const longest = Math.max(bitmap.width, bitmap.height);
    if (longest <= MAX_PHOTO_EDGE && file.size <= 400_000) {
      bitmap.close();
      return file;
    }

    const scale = Math.min(1, MAX_PHOTO_EDGE / longest);
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) {
      bitmap.close();
      return file;
    }
    context.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();

    const shrunk = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, "image/jpeg", 0.75);
    });
    // Bigger than what came in happens with an already-compressed small JPEG, and the
    // original is then the better thing to send.
    if (!shrunk || shrunk.size >= file.size) return file;
    return shrunk;
  } catch {
    return file;
  }
}
