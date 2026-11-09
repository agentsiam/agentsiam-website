// Regenerates the raster site icons from src/app/icon.svg, which is the authored source.
//
// apple-icon.png is full bleed and square: iOS rounds the corners itself, so the rounded
// rect in icon.svg is flattened here rather than baked in twice.
// favicon.ico carries 16, 32 and 48, the three sizes the file already shipped.
//
// Run by hand after editing src/app/icon.svg: node scripts/build-icons.mjs
import fs from "node:fs";
import sharp from "sharp";

const SRC = "src/app/icon.svg";
const raw = fs.readFileSync(SRC, "utf8");

// The C2PA provenance block the icon arrived with is metadata, not artwork, and librsvg
// does not need it. It stays in the file on disk and is only stripped for rendering.
const art = raw.replace(/<metadata>[\s\S]*?<\/metadata>/, "");
const square = art.replace(/\srx="\d+(\.\d+)?"/, "");

const render = (svg, px) =>
  sharp(Buffer.from(svg)).resize(px, px).png({ compressionLevel: 9 }).toBuffer();

await fs.promises.writeFile("src/app/apple-icon.png", await render(square, 180));
console.log("wrote src/app/apple-icon.png");

const SIZES = [16, 32, 48];
const pngs = [];
for (const px of SIZES) pngs.push(await render(art, px));

const header = Buffer.alloc(6);
header.writeUInt16LE(0, 0);
header.writeUInt16LE(1, 2);
header.writeUInt16LE(SIZES.length, 4);

let offset = 6 + 16 * SIZES.length;
const entries = SIZES.map((px, i) => {
  const e = Buffer.alloc(16);
  e.writeUInt8(px === 256 ? 0 : px, 0);
  e.writeUInt8(px === 256 ? 0 : px, 1);
  e.writeUInt8(0, 2);
  e.writeUInt8(0, 3);
  e.writeUInt16LE(1, 4);
  e.writeUInt16LE(32, 6);
  e.writeUInt32LE(pngs[i].length, 8);
  e.writeUInt32LE(offset, 12);
  offset += pngs[i].length;
  return e;
});

await fs.promises.writeFile("src/app/favicon.ico", Buffer.concat([header, ...entries, ...pngs]));
console.log("wrote src/app/favicon.ico");
