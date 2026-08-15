// Reads the photos in src/photos/<set>/ and writes src/lib/photos.generated.ts.
//
// A "set" is just a folder: `lotushouse` is the property, `team` is the founder portraits,
// `reports` is a redacted study page. Nothing here is property-specific.
//
// The point of this script is that a photo carries its own caption. You write the
// description once, in Photos.app (Get Info -> Description), Preview (Tools -> Show
// Inspector) or Lightroom, and it lives inside the file from then on. No parallel list of
// alt text to keep in sync with filenames, and nothing breaks when a file is renamed.
//
// What it reads out of each file:
//   caption  <- IPTC Caption-Abstract, XMP dc:description, or EXIF ImageDescription
//               (all three are what "Description" writes to, depending on the app)
//   title    <- IPTC ObjectName / XMP dc:title, if set. Optional, unused today.
//   rating   <- XMP Rating, 0-5 stars. Sorts highest-first, so promoting a photo to the
//               top of the gallery is a keystroke in Photos rather than a rename.
//
// Order is: rating descending, then filename. Give everything the same rating (or none)
// and it is plain filename order.
//
// The manifest emits *static imports*, not string paths, because that is what makes Next
// generate the width, height and blur-up placeholder for each file automatically. Files
// live under src/ rather than public/ on purpose: public/ would serve the untouched
// 4000px original to anyone who guessed the URL, where this way only the resized,
// re-encoded derivatives are ever reachable.

import { readdir, readFile, writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import exifr from "exifr";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const PHOTO_DIR = path.join(ROOT, "src", "photos");
const OUT_FILE = path.join(ROOT, "src", "lib", "photos.generated.ts");

// Formats next/image can generate a blurDataURL from. HEIC is excluded deliberately: it
// is what an iPhone shoots by default and Next cannot read it, so it gets a named error
// rather than silently disappearing from the gallery.
const SUPPORTED = new Set([".jpg", ".jpeg", ".png", ".webp", ".avif"]);
const REJECTED = new Set([".heic", ".heif", ".tif", ".tiff", ".raw", ".dng", ".cr2", ".nef"]);

/** Pulls the description a photo app wrote, whichever field it chose. */
function captionFrom(meta) {
  if (!meta) return "";
  const candidates = [
    meta.Caption, // IPTC Caption-Abstract, as exifr names it
    meta["Caption-Abstract"],
    meta.description?.value, // XMP dc:description as a language alternative
    meta.description,
    meta.ImageDescription, // EXIF
    meta.XPComment,
  ];
  for (const value of candidates) {
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return "";
}

function titleFrom(meta) {
  if (!meta) return "";
  for (const value of [meta.ObjectName, meta.title?.value, meta.title, meta.Headline]) {
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return "";
}

function ratingFrom(meta) {
  const raw = meta?.Rating ?? meta?.RatingPercent;
  const n = Number(raw);
  return Number.isFinite(n) ? Math.max(0, Math.min(5, Math.round(n > 5 ? n / 20 : n))) : 0;
}

/** Escapes a string for a double-quoted TypeScript literal. */
function quote(value) {
  return JSON.stringify(value);
}

/**
 * Directories that are never scanned.
 *
 *   raw/  — camera originals kept beside the edited version. Including them would put
 *           every shot in the gallery twice, once unedited.
 *   _*    — anything deliberately held back, e.g. _excluded/. Prefixing a folder with an
 *           underscore is how you take photos out of the gallery without deleting them.
 */
function isSkippedDir(name) {
  return name.toLowerCase() === "raw" || name.startsWith("_") || name.startsWith(".");
}

/** Every image under a set folder, including its subfolders. */
async function collectFiles(dir, relative = "") {
  const found = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (isSkippedDir(entry.name)) continue;
      found.push(...(await collectFiles(path.join(dir, entry.name), path.join(relative, entry.name))));
    } else if (entry.isFile() && !entry.name.startsWith(".")) {
      found.push({ relative: path.join(relative, entry.name), name: entry.name, room: relative });
    }
  }
  return found;
}

async function readSet(slug) {
  const dir = path.join(PHOTO_DIR, slug);
  const entries = await collectFiles(dir);
  const photos = [];
  const warnings = [];

  for (const entry of entries) {
    const ext = path.extname(entry.name).toLowerCase();

    if (REJECTED.has(ext)) {
      warnings.push(
        `${slug}/${entry.relative}: ${ext} cannot be optimised. Export it as JPEG ` +
          `(in Photos: File -> Export -> Export Photo, format JPEG) and delete the original.`,
      );
      continue;
    }
    if (!SUPPORTED.has(ext)) continue;

    let meta = null;
    try {
      // xmp and iptc are off by default in exifr; both are needed because different apps
      // write "Description" to different blocks.
      meta = await exifr.parse(await readFile(path.join(dir, entry.relative)), {
        iptc: true,
        xmp: true,
        exif: true,
      });
    } catch {
      // A file with no metadata block at all throws rather than returning null. That is
      // not an error -- it just means there is no caption to read.
    }

    const caption = captionFrom(meta);
    if (!caption) {
      warnings.push(
        `${slug}/${entry.relative}: no description. Add one in Photos (Get Info -> Description) ` +
          `so the photo has real alt text.`,
      );
    }

    photos.push({
      file: entry.relative,
      room: entry.room,
      caption,
      title: titleFrom(meta),
      rating: ratingFrom(meta),
    });
  }

  photos.sort((a, b) => b.rating - a.rating || a.file.localeCompare(b.file, "en"));
  return { photos, warnings };
}

async function main() {
  if (!existsSync(PHOTO_DIR)) await mkdir(PHOTO_DIR, { recursive: true });

  const slugs = (await readdir(PHOTO_DIR, { withFileTypes: true }))
    .filter((entry) => entry.isDirectory() && !entry.name.startsWith("."))
    .map((entry) => entry.name)
    .sort();

  const imports = [];
  const groups = [];
  const warnings = [];
  let total = 0;

  for (const slug of slugs) {
    const { photos, warnings: setWarnings } = await readSet(slug);
    warnings.push(...setWarnings);
    if (photos.length === 0) continue;

    const identifier = slug.replace(/[^a-zA-Z0-9]/g, "_");
    const entries = photos.map((photo, index) => {
      const binding = `${identifier}_${index}`;
      const importPath = `@/photos/${slug}/${photo.file.split(path.sep).join("/")}`;
      imports.push(`import ${binding} from ${quote(importPath)};`);
      total += 1;
      return (
        `    { src: ${binding}, file: ${quote(photo.file.split(path.sep).join("/"))}, alt: ${quote(photo.caption)}` +
        (photo.room ? `, room: ${quote(photo.room.split(path.sep).join(" / "))}` : "") +
        (photo.title ? `, title: ${quote(photo.title)}` : "") +
        ` },`
      );
    });

    groups.push(`  ${quote(slug)}: [\n${entries.join("\n")}\n  ],`);
  }

  const body = [
    "// GENERATED FILE -- do not edit by hand.",
    "// Written by scripts/build-photo-manifest.mjs, which runs automatically before",
    "// `npm run dev` and `npm run build`. To regenerate on demand: `npm run photos`.",
    "//",
    "// Add or change photos in src/photos/<set>/. Captions come from the file's",
    "// own metadata, so edit the Description in Photos.app rather than editing this file.",
    "",
    'import type { StaticImageData } from "next/image";',
    "",
    ...(imports.length ? [...imports, ""] : []),
    "export type Photo = {",
    "  src: StaticImageData;",
    "  /** Path inside the set, e.g. \"Terrace/IMG_4991.jpg\". Used to pick one out. */",
    "  file: string;",
    "  /** From the photo's own Description field. Empty when the photographer left it blank. */",
    "  alt: string;",
    "  /** The subfolder it came from, e.g. \"Terrace\". Groups the lightbox. */",
    "  room?: string;",
    "  title?: string;",
    "};",
    "",
    "/** Keyed by set name -- the folder under src/photos. An empty set is simply absent. */",
    "export const PHOTOS: Record<string, Photo[]> = {",
    ...groups,
    "};",
    "",
  ].join("\n");

  await writeFile(OUT_FILE, body, "utf8");

  const summary = total === 0 ? "no photos yet" : `${total} photo${total === 1 ? "" : "s"}`;
  console.log(`[photos] ${summary} across ${groups.length} set${groups.length === 1 ? "" : "s"}`);
  for (const warning of warnings) console.warn(`[photos] ${warning}`);
}

await main();
