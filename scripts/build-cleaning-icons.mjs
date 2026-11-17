#!/usr/bin/env node
/**
 * The home-screen icons for the cleaning team's app, written as PNG files with nothing but
 * node:zlib.
 *
 * They exist because the app is installed from the web rather than from an app store, which
 * means a manifest and real icon files: Android reads the manifest, iOS reads the
 * apple-touch-icon, and an iPhone with neither screenshots the page and puts that on the
 * home screen instead.
 *
 * Generated rather than drawn, and committed rather than generated at build time, for the
 * same reason the fonts are files in this repository: a build step that reaches for
 * something is a build that can fail without the code changing. Run it by hand if the mark
 * or the colours change.
 *
 *     npm run cleaning:icons
 *
 * The mark is three bars on the ink ground, the top one full width: a schedule, at 48px on a
 * phone, with no text in it, so it needs no font and says the same thing in every language.
 * Colours are the design system's own tokens, read from src/app/globals.css by eye and
 * written here as hex because this script has no CSS parser: --color-ink and
 * --color-gold-on-ink.
 */

import { deflateSync } from "node:zlib";
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT = join(HERE, "..", "public", "cleaning");

const INK = [0x14, 0x14, 0x1c];
const GOLD = [0xf0, 0xcb, 0x86];

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(buffer) {
  let c = 0xffffffff;
  for (const byte of buffer) c = CRC_TABLE[(c ^ byte) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([length, body, crc]);
}

/** RGBA, 8 bits a channel, one filter byte of zero per scanline. */
function png(width, height, pixels) {
  const header = Buffer.alloc(13);
  header.writeUInt32BE(width, 0);
  header.writeUInt32BE(height, 4);
  header[8] = 8;
  header[9] = 6;
  const raw = Buffer.alloc(height * (1 + width * 4));
  for (let y = 0; y < height; y += 1) {
    const row = y * (1 + width * 4);
    raw[row] = 0;
    pixels.copy(raw, row + 1, y * width * 4, (y + 1) * width * 4);
  }
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", header),
    chunk("IDAT", deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

/** Coverage of one pixel by a rounded rectangle, sampled on a 4 by 4 grid so an edge is a
 * gradient rather than a staircase. */
function coverage(px, py, x, y, w, h, radius) {
  let hits = 0;
  for (let sy = 0; sy < 4; sy += 1) {
    for (let sx = 0; sx < 4; sx += 1) {
      const fx = px + (sx + 0.5) / 4;
      const fy = py + (sy + 0.5) / 4;
      if (fx < x || fy < y || fx > x + w || fy > y + h) continue;
      const cx = Math.min(Math.max(fx, x + radius), x + w - radius);
      const cy = Math.min(Math.max(fy, y + radius), y + h - radius);
      const dx = fx - cx;
      const dy = fy - cy;
      if (dx * dx + dy * dy <= radius * radius) hits += 1;
    }
  }
  return hits / 16;
}

function over(pixels, index, colour, alpha) {
  if (alpha <= 0) return;
  const existing = pixels[index + 3] / 255;
  const out = alpha + existing * (1 - alpha);
  for (let channel = 0; channel < 3; channel += 1) {
    const under = pixels[index + channel];
    pixels[index + channel] = Math.round(
      (colour[channel] * alpha + under * existing * (1 - alpha)) / (out || 1),
    );
  }
  pixels[index + 3] = Math.round(out * 255);
}

/**
 * One icon.
 *
 * `inset` is the share of the edge the mark keeps clear. A maskable icon is cropped to a
 * circle by the launcher, so its mark sits inside the safe zone and its ground runs to the
 * edge; an ordinary icon keeps its own rounded corners.
 */
function icon(size, { maskable = false } = {}) {
  const pixels = Buffer.alloc(size * size * 4);
  const groundRadius = maskable ? 0 : size * 0.22;
  const safe = maskable ? size * 0.14 : size * 0.2;
  const barHeight = size * 0.1;
  const gap = size * 0.1;
  const widths = [1, 0.66, 0.84];
  const top = (size - (barHeight * 3 + gap * 2)) / 2;

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const index = (y * size + x) * 4;
      over(pixels, index, INK, coverage(x, y, 0, 0, size, size, groundRadius));
      for (let bar = 0; bar < 3; bar += 1) {
        const width = (size - safe * 2) * widths[bar];
        const alpha = coverage(
          x,
          y,
          safe,
          top + bar * (barHeight + gap),
          width,
          barHeight,
          barHeight / 2,
        );
        over(pixels, index, GOLD, alpha);
      }
    }
  }
  return png(size, size, pixels);
}

mkdirSync(OUT, { recursive: true });
const written = [
  ["icon-192.png", icon(192)],
  ["icon-512.png", icon(512)],
  ["icon-maskable-512.png", icon(512, { maskable: true })],
  ["icon-180.png", icon(180, { maskable: true })],
];
for (const [name, buffer] of written) {
  writeFileSync(join(OUT, name), buffer);
  console.log(`${name}  ${buffer.length} bytes`);
}
