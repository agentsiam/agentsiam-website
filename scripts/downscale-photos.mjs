// One-off maintenance script: shrink the working copies of the photos, keeping the
// untouched originals in a sibling raw/ folder.
//
// Nothing on the site renders wider than about 1400 CSS pixels, so a 2560px long edge is
// still double what the largest slot ever asks for. The 4000px originals are worth keeping
// for print or a future redesign, but they do not belong in git: raw/ is gitignored, and
// the folder syncs to Google Drive anyway.
//
// PNG photographs are re-encoded to JPEG. They are camera images with no transparency, and
// PNG is storing them two to five times larger for no visible gain.
//
// Safe to re-run: a file already at or under the target is skipped, and an original is only
// copied into raw/ if nothing is there under that name yet.
//
//   node scripts/downscale-photos.mjs --dry-run    (default: prints the plan, changes nothing)
//   node scripts/downscale-photos.mjs --write

import { readdir, mkdir, copyFile, rename, stat, unlink } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const PHOTO_DIR = path.join(ROOT, "src", "photos");
const MAX_EDGE = 2560;
const QUALITY = 85;
const WRITE = process.argv.includes("--write");

const CONVERTIBLE = new Set([".jpg", ".jpeg", ".png"]);

function skipDir(name) {
  return name.toLowerCase() === "raw" || name.startsWith("_") || name.startsWith(".");
}

async function walk(dir) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (skipDir(entry.name)) continue;
      out.push(...(await walk(full)));
    } else if (entry.isFile() && CONVERTIBLE.has(path.extname(entry.name).toLowerCase())) {
      out.push(full);
    }
  }
  return out;
}

const mb = (bytes) => (bytes / 1048576).toFixed(1);

async function main() {
  const files = (await walk(PHOTO_DIR)).sort();
  let before = 0;
  let after = 0;
  let touched = 0;

  for (const file of files) {
    const original = await stat(file);
    before += original.size;

    const meta = await sharp(file).metadata();
    const longEdge = Math.max(meta.width ?? 0, meta.height ?? 0);
    const isPng = path.extname(file).toLowerCase() === ".png";

    if (longEdge <= MAX_EDGE && !isPng) {
      after += original.size;
      continue;
    }

    // Keep the untouched original next door, unless one is already filed there.
    const rawDir = path.join(path.dirname(file), "raw");
    const backup = path.join(rawDir, path.basename(file));
    const needsBackup = !existsSync(backup);

    const target = file.replace(/\.png$/i, ".jpg");
    const temp = `${target}.tmp`;

    console.log(
      `${path.relative(PHOTO_DIR, file)}  ${longEdge}px ${mb(original.size)}MB` +
        `${isPng ? " (png -> jpg)" : ""}${needsBackup ? "  [backing up original]" : ""}`,
    );

    if (!WRITE) {
      after += original.size / 4; // rough, only used for the dry-run estimate
      touched += 1;
      continue;
    }

    if (needsBackup) {
      await mkdir(rawDir, { recursive: true });
      await copyFile(file, backup);
    }

    await sharp(file)
      .rotate() // honour the EXIF orientation flag before it is discarded
      .resize({ width: MAX_EDGE, height: MAX_EDGE, fit: "inside", withoutEnlargement: true })
      .jpeg({ quality: QUALITY, mozjpeg: true })
      .toFile(temp);

    if (target !== file) await unlink(file);
    await rename(temp, target);

    after += (await stat(target)).size;
    touched += 1;
  }

  console.log(
    `\n${touched} of ${files.length} files ${WRITE ? "rewritten" : "would be rewritten"}; ` +
      `${mb(before)}MB -> ${WRITE ? mb(after) : "~" + mb(after)}MB`,
  );
  if (!WRITE) console.log("Dry run. Re-run with --write to apply.");
}

await main();
