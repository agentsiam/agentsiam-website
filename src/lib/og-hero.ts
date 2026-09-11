import { readFile } from "node:fs/promises";
import path from "node:path";
import { heroPhoto, pickPhoto } from "@/lib/photos";

/**
 * A photo set's hero frame, as a data URI, for use inside an opengraph-image route.
 *
 * Satori cannot resolve a Next static import or a relative path, so the bytes have to be
 * inlined. Shared between every opengraph-image.tsx under lotushouse/ so each route does not
 * repeat the same readFile-and-base64 block.
 */
export async function heroDataUri(slug: string, preference: string[] = []): Promise<string | undefined> {
  const hero = preference.map((fragment) => pickPhoto(slug, fragment)).find(Boolean) ?? heroPhoto(slug);
  if (!hero) return undefined;
  try {
    const bytes = await readFile(path.join(process.cwd(), "src/photos", slug, hero.file));
    return `data:image/jpeg;base64,${bytes.toString("base64")}`;
  } catch {
    // A missing file must not fail the build. Falls back to the flat brand panel, the same
    // treatment the gallery uses when a photo set is empty.
    return undefined;
  }
}
