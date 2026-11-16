/**
 * Downloads the six font families from Google Fonts into src/fonts/ and writes the two
 * GENERATED files beside them. Run by hand, never at build time.
 *
 *   node scripts/fetch-fonts.mjs            prints what would change, writes nothing
 *   node scripts/fetch-fonts.mjs --apply    downloads and writes
 *
 * Why this exists. Until the fonts were self-hosted, src/app/[locale]/layout.tsx loaded
 * all six families through next/font/google, which fetches fonts.googleapis.com and then
 * fonts.gstatic.com at build time. That made every build depend on a third party, and the
 * failure did not read as a network failure: offline it says "Failed to fetch `Poppins`"
 * under a module-not-found trace, and a production build of 5d90301 was lost on
 * 12/11/2026 to "Turbopack build failed with 27 errors" on a commit that touched
 * README.md and nothing else. The files are now in the repository and the build touches
 * no network.
 *
 * The files are Google's own woff2 subsets, byte for byte. This script asks
 * fonts.googleapis.com for the same css2 URL next/font/google would have asked for, with
 * the same user agent, so the response and therefore the font files are the ones the site
 * shipped before. Every file's sha256 goes in src/fonts/faces.json, so a later refresh
 * that changes a face says so instead of changing the type silently.
 *
 * What is dropped on purpose. next/font/google downloads every subset in Google's
 * response and preloads only the ones asked for, so the previous build carried 9.46MB of
 * font files, of which no browser ever fetched more than a fraction. Measured against the
 * text of all 114 pages in all three languages, the only slices any character on this site
 * reaches are latin for the four Latin families, thai for Noto Sans Thai, and 30 of the
 * 101 Noto Sans SC slices. The four Latin families and Noto Sans Thai therefore ship their
 * one needed slice each. Noto Sans SC ships all 101, because Chinese copy gets written
 * after this script runs and a character outside a shipped slice would drop to the system
 * face with nothing to show for it.
 *
 * Noto Sans SC is the one family that does not go through next/font/local. Google slices
 * it into 101 unicode-range files per weight so a browser fetches only the ranges a page
 * uses, a Chinese page costs 1.2MB rather than 4.4MB, and next/font/local cannot express
 * unicode-range per face: its src array takes a path, a weight and a style, and its
 * declarations option applies to every face in the call. So the SC faces are generated
 * into src/fonts/noto-sans-sc.generated.css with Google's own ranges, and that file is
 * what reproduces the previous behaviour exactly.
 */

import { createHash } from "node:crypto";
import fs from "node:fs";
import https from "node:https";
import path from "node:path";
import process from "node:process";

const FONTS_DIR = path.join(import.meta.dirname, "..", "src", "fonts");
const APPLY = process.argv.includes("--apply");

/**
 * The same user agent next/font/google sends, because Google returns woff2 only to a
 * browser it recognises and ttf to anything else. Taken from
 * node_modules/next/dist/compiled/@next/font/dist/google/fetch-resource.js.
 */
const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 " +
  "(KHTML, like Gecko) Chrome/104.0.0.0 Safari/537.36";

/**
 * One entry per family, carrying exactly what the next/font/google call carried: the
 * weights, and the subsets the site actually renders. `slices: "all"` keeps every subset
 * in the response, which only Noto Sans SC asks for.
 *
 * display is swap for all six, which is next/font's default and what the previous build
 * emitted. Changing it here changes the generated SC stylesheet; the five families read
 * their own display from the localFont calls in the layouts.
 */
const FAMILIES = [
  { family: "Poppins", slug: "poppins", weights: ["600", "700", "800"], subsets: ["latin"] },
  { family: "IBM Plex Sans", slug: "ibm-plex-sans", weights: ["400", "500", "600"], subsets: ["latin"] },
  { family: "IBM Plex Mono", slug: "ibm-plex-mono", weights: ["500"], subsets: ["latin"] },
  { family: "Unbounded", slug: "unbounded", weights: ["800"], subsets: ["latin"] },
  { family: "Noto Sans Thai", slug: "noto-sans-thai", weights: ["400", "600", "800"], subsets: ["thai"] },
  { family: "Noto Sans SC", slug: "noto-sans-sc", weights: ["400", "700"], subsets: "all", sliced: true },
];

const DISPLAY = "swap";

function get(url) {
  return new Promise((resolve, reject) => {
    https
      .request(url, { headers: { "User-Agent": UA } }, (res) => {
        if (res.statusCode !== 200) {
          reject(new Error(`${url} answered ${res.statusCode}`));
          return;
        }
        const chunks = [];
        res.on("data", (c) => chunks.push(Buffer.from(c)));
        res.on("end", () => resolve(Buffer.concat(chunks)));
      })
      .on("error", reject)
      .end();
  });
}

/** The css2 URL next/font/google builds for a family, weights sorted as Google wants them. */
function css2Url({ family, weights }) {
  const name = family.replace(/ /g, "+");
  return `https://fonts.googleapis.com/css2?family=${name}:wght@${weights.join(";")}&display=${DISPLAY}`;
}

/**
 * Parses a css2 response into faces, in response order, each carrying the subset label
 * from the comment above it.
 *
 * Google emits exactly one comment per @font-face, so a label applies to the next face and
 * to nothing after it. That is load-bearing rather than tidy. A CJK family puts its
 * hundred-odd unlabelled slices first and its four named subsets (cyrillic, vietnamese,
 * latin-ext, latin) at the end of each weight's group, so a label allowed to run on would
 * be inherited by the next weight's slices, name them all noto-sans-sc-latin.woff2, and
 * collapse 101 files into a handful. That is what this script did on its first write.
 *
 * An unlabelled face is identified by its unicode-range instead, through `faceId`. It
 * cannot be identified by its URL: Google serves Noto Sans SC through
 * fonts.gstatic.com/l/font?kit=... which carries no filename and is not stable between
 * requests, while the ranges it slices on are.
 */
function parseCss2(css) {
  const faces = [];
  const tokens = css.split(/\/\*\s*([^*]+?)\s*\*\//);
  // tokens[0] is whatever precedes the first comment: for a CJK family that is most of
  // the file, so it is parsed with no label rather than skipped.
  let label = null;
  for (let i = 0; i < tokens.length; i++) {
    const isLabel = i % 2 === 1;
    if (isLabel) {
      label = tokens[i];
      continue;
    }
    for (const block of tokens[i].match(/@font-face\s*\{[\s\S]*?\}/g) ?? []) {
      const url = block.match(/url\(([^)]+)\)/)?.[1];
      if (!url) continue;
      const weight = block.match(/font-weight:\s*([^;]+)/)?.[1]?.trim() ?? "400";
      const style = block.match(/font-style:\s*([^;]+)/)?.[1]?.trim() ?? "normal";
      const unicodeRange = block.match(/unicode-range:\s*([^;]+)/)?.[1]?.trim() ?? "";
      faces.push({ subset: label, weight, style, url, unicodeRange });
      label = null;
    }
  }
  return faces;
}

/**
 * The stable name of a face within its family: its subset label where Google gives one,
 * and otherwise a digest of the range it covers, which is the only thing about an
 * unlabelled slice that holds still.
 */
function faceId(face) {
  if (face.subset) return face.subset;
  if (!face.unicodeRange) return "full";
  const digest = createHash("sha256")
    .update(face.unicodeRange.replace(/\s+/g, "").toLowerCase())
    .digest("hex")
    .slice(0, 8);
  return `r${digest}`;
}

/**
 * The fallback metrics next/font/google would have emitted for a family, read from Next's
 * own table rather than copied out of a previous build, so a Next upgrade that revises
 * them shows up here. Only Noto Sans SC needs this: the other five get theirs from
 * next/font/local, which measures the font file.
 */
async function fallbackMetrics(family) {
  const mod = await import(
    "next/dist/compiled/@next/font/dist/google/get-fallback-font-override-metrics.js"
  ).catch(() => null);
  const metrics = mod?.getFallbackFontOverrideMetrics?.(family);
  if (!metrics) {
    throw new Error(
      `No fallback metrics for ${family}. next/font's metrics table moved or lost the ` +
        `family, and guessing the numbers would change the layout the fallback face holds. ` +
        `Read node_modules/next/dist/compiled/@next/font/dist/google/ and fix this script.`,
    );
  }
  return metrics;
}

function sha256(buf) {
  return createHash("sha256").update(buf).digest("hex");
}

async function main() {
  if (!fs.existsSync(FONTS_DIR)) {
    if (!APPLY) {
      console.log(`src/fonts/ does not exist yet. Rerun with --apply to create it.`);
    } else {
      fs.mkdirSync(FONTS_DIR, { recursive: true });
    }
  }

  const previous = fs.existsSync(path.join(FONTS_DIR, "faces.json"))
    ? JSON.parse(fs.readFileSync(path.join(FONTS_DIR, "faces.json"), "utf8"))
    : { faces: [] };
  // Keyed on the filename, which is one file, and never on the Google URL: the URL form
  // for Noto Sans SC changes between requests, so keying on it reports every slice as new
  // and every old slice as gone while nothing has actually moved. Family and id are not a
  // key either, because a static family has one of those per weight: keyed that way,
  // Poppins latin 600, 700 and 800 collapse into one entry and each weight is then
  // compared against another weight's bytes and reported as changed.
  const previousByFile = new Map(previous.faces.map((f) => [f.file, f]));

  const manifest = [];
  const downloads = new Map(); // filename -> Buffer

  for (const spec of FAMILIES) {
    const url = css2Url(spec);
    const css = (await get(url)).toString("utf8");
    const all = parseCss2(css);
    const kept = spec.subsets === "all" ? all : all.filter((f) => spec.subsets.includes(f.subset));
    if (kept.length === 0) {
      throw new Error(
        `${spec.family}: Google's response carried none of the subsets asked for ` +
          `(${spec.subsets}). Subsets present: ${[...new Set(all.map((f) => f.subset))].join(", ")}.`,
      );
    }

    // One file can serve several weights: a variable font is one woff2 per subset, and
    // next/font clamps it per weight with font-weight in the @font-face. Group by URL so
    // each file is downloaded and named once, and record every weight it serves.
    const byUrl = new Map();
    for (const face of kept) {
      const entry = byUrl.get(face.url) ?? { ...face, weights: [] };
      entry.weights.push(face.weight);
      byUrl.set(face.url, entry);
    }

    // A face id with more than one file across the requested weights is a static family,
    // so the weight goes in the filename. One file for the id means a variable font, which
    // the @font-face clamps per weight, and the name stays weightless.
    const filesPerId = new Map();
    for (const entry of byUrl.values()) {
      const id = faceId(entry);
      filesPerId.set(id, (filesPerId.get(id) ?? 0) + 1);
    }

    for (const entry of byUrl.values()) {
      const id = faceId(entry);
      const perWeight = filesPerId.get(id) > 1;
      const file = `${spec.slug}-${id}${perWeight ? `-${entry.weights[0]}` : ""}.woff2`;
      if (downloads.has(file)) {
        throw new Error(
          `${spec.family}: two faces both want to be ${file}. Their ids collided, so the ` +
            `naming in faceId() no longer separates this family's faces.`,
        );
      }
      const buf = await get(entry.url);
      downloads.set(file, buf);
      manifest.push({
        family: spec.family,
        slug: spec.slug,
        id,
        subset: entry.subset ?? null,
        weights: entry.weights,
        style: entry.style,
        display: DISPLAY,
        file,
        unicodeRange: entry.unicodeRange,
        sha256: sha256(buf),
        // Recorded for provenance, not for identity: see previousById in main().
        googleUrl: entry.url,
        sliced: Boolean(spec.sliced),
      });
    }
    console.log(
      `${spec.family.padEnd(16)} ${String(byUrl.size).padStart(3)} files, ` +
        `${(([...downloads.values()].slice(-byUrl.size).reduce((a, b) => a + b.length, 0)) / 1024).toFixed(1)} KB`,
    );
  }

  // Report what moved before writing anything.
  let changed = 0;
  const fresh = [];
  for (const face of manifest) {
    const was = previousByFile.get(face.file);
    if (!was) {
      fresh.push(face);
    } else if (was.sha256 !== face.sha256) {
      changed++;
      console.log(
        `CHANGED ${face.file}: ${was.sha256.slice(0, 12)} -> ${face.sha256.slice(0, 12)}. ` +
          `Google reissued this face, so the type on the site moves with it.`,
      );
    }
  }
  const gone = previous.faces.filter((f) => !manifest.some((m) => m.file === f.file));
  // A file that arrives with the bytes of one that left is this script's own naming
  // changing its mind, not a new face. Worth separating: a rename is reviewable at a
  // glance, a new face is not.
  const renamed = [];
  const added = [];
  for (const face of fresh) {
    const from = gone.find((g) => g.sha256 === face.sha256);
    if (from) renamed.push([from, face]);
    else added.push(face);
  }
  for (const [from, to] of renamed) console.log(`RENAMED ${from.file} -> ${to.file}, same bytes`);
  for (const face of added) console.log(`NEW     ${face.file} (${face.family}, ${face.id})`);
  for (const f of gone.filter((g) => !renamed.some(([from]) => from.file === g.file))) {
    console.log(`GONE    ${f.file} (${f.family}, ${f.id ?? "no id recorded"})`);
  }
  console.log(
    `\n${manifest.length} faces, ${new Set(manifest.map((f) => f.file)).size} files, ` +
      `${added.length} new, ${changed} changed, ${renamed.length} renamed, ` +
      `${gone.length - renamed.length} gone`,
  );

  if (!APPLY) {
    console.log("\nNothing written. Rerun with --apply.");
    return;
  }

  for (const [file, buf] of downloads) {
    fs.writeFileSync(path.join(FONTS_DIR, file), buf);
  }

  // Anything the manifest no longer points at is dead weight that the generated stylesheet
  // and the localFont calls cannot reach, so it goes rather than sitting in src/ looking
  // like a face the site uses.
  for (const file of fs.readdirSync(FONTS_DIR)) {
    if (!file.endsWith(".woff2") || downloads.has(file)) continue;
    fs.unlinkSync(path.join(FONTS_DIR, file));
    console.log(`REMOVED ${file}, no face in the manifest points at it`);
  }

  fs.writeFileSync(
    path.join(FONTS_DIR, "faces.json"),
    `${JSON.stringify(
      {
        generatedBy: "scripts/fetch-fonts.mjs",
        source: "fonts.googleapis.com css2, woff2 user agent",
        display: DISPLAY,
        faces: manifest,
      },
      null,
      1,
    )}\n`,
  );

  // The Noto Sans SC stylesheet, which is the whole reason this script writes CSS at all.
  const sc = manifest.filter((f) => f.slug === "noto-sans-sc");
  const metrics = await fallbackMetrics("Noto Sans SC");
  const rules = [];
  for (const face of sc) {
    for (const weight of face.weights) {
      rules.push(
        `@font-face {\n` +
          `  font-family: "Noto Sans SC";\n` +
          `  font-style: ${face.style};\n` +
          `  font-weight: ${weight};\n` +
          `  font-display: ${face.display};\n` +
          `  src: url("./${face.file}") format("woff2");\n` +
          `  unicode-range: ${face.unicodeRange};\n` +
          `}`,
      );
    }
  }
  const css = `/*
  GENERATED by scripts/fetch-fonts.mjs from src/fonts/faces.json. Do not hand-edit: edit
  the script and rerun it.

  Noto Sans SC, sliced exactly as Google slices it. ${sc.length} files, two weights each,
  every face carrying Google's own unicode-range so a browser fetches only the ranges the
  page uses. This is the one family that does not go through next/font/local, which emits
  one face per src entry and has no way to put a unicode-range on each: de-slicing it
  would make a Chinese page fetch 4.4MB instead of 1.2MB.

  All ${sc.length} slices are here on purpose, and only 30 of them hold a character the site
  currently renders. Do not trim them. Trimming saves repository bytes and nothing else:
  unicode-range means a visitor already fetches only the slices their page needs, measured
  at 27 files and 1.2MB on the Chinese home page either way. What it would cost is the
  failure this site keeps finding in other forms. A character outside a shipped range drops
  to the system CJK face mid-sentence, with no build error and no warning, and Chinese is
  the locale nobody here reads: the open items in
  /Users/paulb/code/agentsiam/agentsiam-consulting/as-context/00-company/decisions-log.md
  record that the Chinese copy has never had a native read. A missing slice would be found
  by a Chinese-speaking visitor, not by us. That is the shape of R8, where a blank
  dictionary string ships English and the per-key fallback hides it.

  400 and 700 only, and the two faces are clamped rather than given a 400 to 700 range on
  purpose. font-medium and font-extrabold reach this family by CSS weight matching, and a
  range face would render them at 500 and 800 instead of snapping to the two weights the
  site pays for.

  The fallback face is the one next/font/google emitted, with the metrics read from Next's
  own table at generation time. It holds the line box while the real face loads.

  --font-noto-sc is set by a class rather than by next/font, and src/app/[locale]/layout.tsx
  puts that class on <html> for the Chinese locale only. On en and th the variable stays
  absent and the stacks in globals.css read it through var(--font-noto-sc, sans-serif), so
  CJK characters fall through to whatever the system provides. That is what keeps an
  English page from fetching a Chinese webfont to draw the two characters in its language
  switcher.
*/

${rules.join("\n\n")}

@font-face {
  font-family: "Noto Sans SC Fallback";
  src: local("${metrics.fallbackFont}");
  ascent-override: ${metrics.ascentOverride};
  descent-override: ${metrics.descentOverride};
  line-gap-override: ${metrics.lineGapOverride};
  size-adjust: ${metrics.sizeAdjust};
}

.noto-sans-sc-variable {
  --font-noto-sc: "Noto Sans SC", "Noto Sans SC Fallback";
}
`;
  fs.writeFileSync(path.join(FONTS_DIR, "noto-sans-sc.generated.css"), css);

  console.log(
    `\nWrote ${downloads.size} woff2 files, faces.json and noto-sans-sc.generated.css ` +
      `(${rules.length} SC faces) into src/fonts/.`,
  );
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
