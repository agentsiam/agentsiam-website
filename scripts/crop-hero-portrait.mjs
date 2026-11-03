// One-off maintenance script: cut the portrait hero crop the homepage serves to phones.
//
// Why a second crop exists at all. The homepage hero puts its copy inside the photo panel,
// so the panel's height is set by the length of the text stack: about 335 by 972 CSS pixels
// at 375 wide, a ratio of 0.34. Against a 4:3 frame, object-fit cover keeps only about a
// quarter of the frame's width at that shape, whatever the frame is of. Picking a
// well-composed frame fixes the desktop letterbox, where half the height still survives, and
// does nothing for the phone. So phones get a 9:16 band cut here instead.
//
// The band is the right-hand 1080 pixels of the living-room frame, full height: the painting,
// the navy sofa and the horseshoe chair. Its middle 61 percent, which is what a 375px phone
// actually shows, carries the painting and the sofa. The window wall was the alternative and
// is brighter, which costs contrast under white type.
//
// Output goes in _hero/, which both build-photo-manifest.mjs and downscale-photos.mjs skip by
// the underscore rule, so the crop never enters the gallery as a 47th Lotus House photo.
//
// Safe to re-run: it overwrites its own output and reads the source without touching it.
//
//   node scripts/crop-hero-portrait.mjs

import { mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const SOURCE = path.join(
  ROOT,
  "src/photos/lotushouse/Living Room/20240411_052358_edited.jpg",
);
const OUT_DIR = path.join(ROOT, "src/photos/lotushouse/_hero");
const OUT = path.join(OUT_DIR, "lotus_living_room_portrait.jpg");

// Same encoder settings as scripts/downscale-photos.mjs, so the two agree.
const QUALITY = 85;
const CROP = { left: 1480, top: 0, width: 1080, height: 1920 };

const { width, height } = await sharp(SOURCE).metadata();
if (CROP.left + CROP.width > width || CROP.top + CROP.height > height) {
  throw new Error(
    `Crop ${CROP.left},${CROP.top} ${CROP.width}x${CROP.height} does not fit the ` +
      `${width}x${height} source. The source was re-edited; re-pick the band.`,
  );
}

await mkdir(OUT_DIR, { recursive: true });
const info = await sharp(SOURCE)
  .extract(CROP)
  .jpeg({ quality: QUALITY, mozjpeg: true })
  .toFile(OUT);

console.log(
  `${path.relative(ROOT, OUT)}: ${info.width}x${info.height}, ` +
    `ratio ${(info.width / info.height).toFixed(3)}, ${(info.size / 1024).toFixed(0)}kB`,
);
