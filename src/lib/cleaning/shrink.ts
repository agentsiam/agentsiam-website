import { MAX_PHOTO_EDGE, PHOTO_TARGET_BYTES } from "./comment-shape";

/**
 * The qualities tried, in order, until one lands under PHOTO_TARGET_BYTES.
 *
 * Three steps rather than a search, because every step costs a full JPEG encode on a phone
 * that is holding six of these, and because the third step is low enough that a fourth
 * would be arguing about an image nobody would want anyway. The first step is where an
 * ordinary camera photo already fits, so the usual case encodes once.
 */
const QUALITY_STEPS = [0.6, 0.45, 0.35];

/**
 * Shrink a photo on the phone, before it is ever sent.
 *
 * A photograph from a modern phone is four or five megabytes. What it is for here is
 * showing that a room is finished or that a transfer went through, and both are legible at
 * a fraction of that. Shrinking first means an upload that completes on a Thai mobile
 * connection in a house, a store that does not fill up, and a thread that loads.
 *
 * **It aims at a weight, not at a quality**, which is Paul's instruction of 18/11/2026: a
 * fixed quality setting is a promise about nothing, because what a JPEG weighs depends on
 * what is in it. A photograph of a plain white wall and a screenshot of a transfer slip
 * come out of one setting an order of magnitude apart, and it is the slip, the thing with
 * the most detail, that would blow the budget. So it encodes, weighs, and encodes lower
 * until the photo fits or the steps run out.
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
    // Already small in both senses: re-encoding it could only make it worse.
    if (longest <= MAX_PHOTO_EDGE && file.size <= PHOTO_TARGET_BYTES) {
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

    let best: Blob | null = null;
    for (const quality of QUALITY_STEPS) {
      const attempt = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob(resolve, "image/jpeg", quality);
      });
      // A step that will not encode at all is not a reason to stop: the next one may.
      if (!attempt) continue;
      // Each step is lower quality than the last, so each is smaller, and the first one
      // under the budget is both small enough and the best-looking of those that are.
      best = attempt;
      if (attempt.size <= PHOTO_TARGET_BYTES) break;
    }

    // Bigger than what came in happens with an already-compressed small JPEG, and the
    // original is then the better thing to send.
    if (!best || best.size >= file.size) return file;
    return best;
  } catch {
    return file;
  }
}
