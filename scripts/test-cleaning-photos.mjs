/*
 * Drives the photo store's two pure functions against the real modules.
 *
 *   npm run test:cleaning-photos
 *
 * **Why this file exists.** Paul chose a private Blob store on 18/11/2026, so a photograph
 * is no longer a URL anybody can open: a comment carries the blob's pathname and
 * /api/cleaning/photo reads it back out of the store. That moves the risk. A public URL
 * could only ever be the one the store handed out, while a pathname is a string that has
 * been to a phone and come back, and the route hands it to the store. So the check that it
 * is a pathname this app wrote is the whole of the boundary, and this is what tests it.
 *
 * The cases that matter are the ones where a crafted pathname would read somebody else's
 * blob: a traversal out of the prefix, a sibling prefix, a second slash, an absolute URL in
 * place of a path. The route composes what it is given exactly as it is composed here, with
 * the prefix put back on this side of the check, so the composition is under test and not
 * only the regular expression.
 *
 * Since 18/11/2026 a comment carries several photographs, which adds two functions worth
 * testing for the same reason. `ourPhotoPaths` is what the write routes filter a list
 * through, and one crafted entry must cost that entry rather than the whole comment.
 * `photoList` is what reads a stored comment back, and it has to understand both shapes:
 * the list written since, and the single `image` written before it, because the store holds
 * comments of each.
 *
 * **What it does not prove.** Anything that needs the store: that an upload lands, that the
 * route streams it, that `ttlDays` deletes it, or that the sweep finds what the store kept.
 * Those need a real Blob token and are the open half of README.md's known gap.
 *
 * It compiles the three modules it imports, because they are TypeScript with extensionless
 * relative imports that node cannot resolve on its own, and tsc is already a dependency
 * here. Output goes to a temporary directory under node_modules and is deleted. Nothing in
 * the repository itself is written.
 */

import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync } from "node:fs";
import { createRequire } from "node:module";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const here = fileURLToPath(new URL(".", import.meta.url));
const repo = join(here, "..");
// Inside node_modules rather than in /tmp, which is not a detail: the compiled module
// imports @vercel/blob, and node resolves that by walking up from the file that asks for
// it. From /tmp there is nothing to walk up to. node_modules/.cache is already ignored.
const cache = join(repo, "node_modules", ".cache");
mkdirSync(cache, { recursive: true });
const out = mkdtempSync(join(cache, "cleaning-photos-"));

try {
  execFileSync(
    "npx",
    [
      "tsc",
      "src/lib/cleaning/photos.ts",
      "src/lib/cleaning/routes.ts",
      "--outDir",
      out,
      "--module",
      "commonjs",
      "--moduleResolution",
      "node",
      "--target",
      "es2022",
      "--esModuleInterop",
      "--skipLibCheck",
    ],
    { cwd: repo, stdio: "inherit" },
  );
} catch {
  console.error("the modules did not compile, so nothing below was run");
  rmSync(out, { recursive: true, force: true });
  process.exit(1);
}

const require = createRequire(join(out, "test.cjs"));
const { isOurPhotoPath, ourPhotoPaths } = require(join(out, "photos.js"));
const { cleaningPhotoSrc } = require(join(out, "routes.js"));
const { PHOTO_PREFIX, photoList, MAX_PHOTOS_PER_COMMENT } = require(
  join(out, "comment-shape.js"),
);

let failures = 0;
let ran = 0;

function check(name, actual, expected) {
  const ok = actual === expected;
  ran += 1;
  if (!ok) failures += 1;
  console.log(`${ok ? "pass" : "FAIL"}  ${name}  (${String(actual)})`);
}

/** What the route does with the segments it is handed, before it checks anything. */
function asRouteWouldRead(segments) {
  return `${PHOTO_PREFIX}${segments.join("/")}`;
}

console.log("\nwhat the store itself writes");
check(
  "a pathname put() returned is ours",
  isOurPhotoPath("cleaning/2026-11-18/photo-Hs82kdLq0Zx"),
  true,
);
check("a plain name with no suffix is ours", isOurPhotoPath("cleaning/2026-11-18/photo"), true);
check(
  "dots and underscores in the name are allowed",
  isOurPhotoPath("cleaning/2026-01-01/photo_2.jpeg"),
  true,
);

console.log("\nwhat a crafted comment must not get past");
check("a traversal out of the prefix", isOurPhotoPath("cleaning/../secrets/key"), false);
check("a traversal in the name", isOurPhotoPath("cleaning/2026-11-18/../../x"), false);
check("a sibling prefix", isOurPhotoPath("cleaningother/2026-11-18/photo"), false);
check("another prefix entirely", isOurPhotoPath("admin/2026-11-18/photo"), false);
check("no prefix at all", isOurPhotoPath("2026-11-18/photo"), false);
check("a leading slash", isOurPhotoPath("/cleaning/2026-11-18/photo"), false);
check("a third slash", isOurPhotoPath("cleaning/2026-11-18/deeper/photo"), false);
check("a date that is not one", isOurPhotoPath("cleaning/anything/photo"), false);
check("an absolute URL", isOurPhotoPath("https://evil.example.com/cleaning/x/y"), false);
check(
  "a blob URL from the store",
  isOurPhotoPath("https://abc.public.blob.vercel-storage.com/cleaning/2026-11-18/photo-x"),
  false,
);
check("a percent escape", isOurPhotoPath("cleaning/2026-11-18/photo%2F..%2Fkey"), false);
check("a null byte", isOurPhotoPath("cleaning/2026-11-18/photo\u0000.jpg"), false);
check("a name longer than anything put() returns", isOurPhotoPath(`cleaning/2026-11-18/${"a".repeat(121)}`), false);
check("the empty string", isOurPhotoPath(""), false);
check("not a string at all", isOurPhotoPath(null), false);
check("an object pretending", isOurPhotoPath({ toString: () => "cleaning/2026-11-18/photo" }), false);

console.log("\nthe segments the route is handed, composed as the route composes them");
check(
  "an ordinary request reads a pathname that is ours",
  isOurPhotoPath(asRouteWouldRead(["2026-11-18", "photo-Hs82kdLq0Zx"])),
  true,
);
check(
  "a request climbing out of the prefix does not",
  isOurPhotoPath(asRouteWouldRead(["..", "..", "etc", "passwd"])),
  false,
);
check(
  "a request with an extra segment does not",
  isOurPhotoPath(asRouteWouldRead(["2026-11-18", "deeper", "photo"])),
  false,
);
check("a request with no segments does not", isOurPhotoPath(asRouteWouldRead([])), false);

console.log("\nthe URL a screen puts in an img");
check(
  "the prefix is dropped, so the route cannot be pointed outside it",
  cleaningPhotoSrc("cleaning/2026-11-18/photo-Hs82kdLq0Zx"),
  "/api/cleaning/photo/2026-11-18/photo-Hs82kdLq0Zx",
);
check(
  "a round trip through the builder and back is the pathname we started with",
  asRouteWouldRead(
    cleaningPhotoSrc("cleaning/2026-11-18/photo-Hs82kdLq0Zx")
      .replace("/api/cleaning/photo/", "")
      .split("/")
      .map((part) => decodeURIComponent(part)),
  ),
  "cleaning/2026-11-18/photo-Hs82kdLq0Zx",
);

console.log("\nseveral photographs on one comment, as the routes filter them");
const good = "cleaning/2026-11-18/photo-aaa";
const also = "cleaning/2026-11-18/photo-bbb";
check("two of ours are both kept", ourPhotoPaths([good, also]).join(","), `${good},${also}`);
check(
  "a crafted one beside a real one is dropped alone",
  ourPhotoPaths([good, "cleaning/../x"]).join(","),
  good,
);
check("nothing but crafted ones leaves nothing", ourPhotoPaths(["../x", 7, null]).length, 0);
check("not an array at all", ourPhotoPaths("cleaning/2026-11-18/photo-aaa").length, 0);
check(
  "more than a comment may carry is cut to the cap",
  ourPhotoPaths(Array.from({ length: 10 }, (_, at) => `cleaning/2026-11-18/photo-${at}`)).length,
  MAX_PHOTOS_PER_COMMENT,
);

console.log("\nthe comment a phone running the previous bundle sends");
check("a single image is read as a list of one", ourPhotoPaths(undefined, good).join(","), good);
check("a crafted single image is still refused", ourPhotoPaths(undefined, "../x").length, 0);
check("a list wins over a single image", ourPhotoPaths([also], good).join(","), also);

console.log("\nreading back a comment the store already holds");
check("the two shapes, list first", photoList([good, also]).join(","), `${good},${also}`);
check("a comment written before 18/11/2026", photoList(undefined, good).join(","), good);
check("a comment with neither", photoList(undefined, null).length, 0);
check("junk in the list is dropped", photoList([good, "", null, 3]).join(","), good);
check(
  "a list longer than the cap is cut",
  photoList(Array.from({ length: 9 }, (_, at) => `p${at}`)).length,
  MAX_PHOTOS_PER_COMMENT,
);

rmSync(out, { recursive: true, force: true });

// Counted and never written down, because a case count in a comment is a number that goes
// wrong the next time somebody adds a case.
console.log(`\n${ran - failures}/${ran} passed`);
if (failures > 0) process.exit(1);
