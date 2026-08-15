// One-off: write a description into each photo's EXIF, losslessly.
//
// piexifjs rewrites only the APP1 metadata segment, so the compressed image data is
// untouched -- no second round of JPEG loss on top of the downscale. Once written, the
// caption travels with the file: rename it, move it, hand it to someone else, and the alt
// text goes with it.
//
// These captions describe what is visible in each frame, which is what alt text is for.
// To change one, edit the Description in Photos.app rather than editing this file -- the
// manifest reads whatever is in the file at build time.
//
//   node scripts/write-captions.mjs            (dry run)
//   node scripts/write-captions.mjs --write

import { readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import piexif from "piexifjs";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const BASE = path.join(ROOT, "src", "photos");
const WRITE = process.argv.includes("--write");

const CAPTIONS = {
  // -- first-floor bedroom and bathroom (bedroom 2 on the floor plan) ------------
  "lotushouse/Bed - 1st Floor/20240411_043128_edited.jpg":
    "Vanity in the first-floor bathroom, with a backlit mirror cabinet above a fluted wood cabinet",
  "lotushouse/Bed - 1st Floor/20240411_044832_edited.jpg":
    "Bidet sprayer beside the toilet in the first-floor bathroom",
  "lotushouse/Bed - 1st Floor/20240411_074844_edited.jpg":
    "Desk in the first-floor bedroom, with sliding doors onto the cactus planter in the back yard",
  "lotushouse/Bed - 1st Floor/20240411_075316_edited.jpg":
    "Open clothes rail and oval mirror in the first-floor bedroom, beside the bathroom door",
  "lotushouse/Bed - 1st Floor/IMG_5445_edited.jpg":
    "The first-floor bathroom, with the open shower area beside the vanity and toilet",
  "lotushouse/Bed - 1st Floor/IMG_5578_edited.jpg":
    "King bed in the first-floor bedroom, under a framed bonsai painting, with tree-stump bedside tables",
  "lotushouse/Bed - 1st Floor/IMG_5582_edited.jpg":
    "The first-floor bedroom seen across the desk, with the king bed and white coffered ceiling behind",
  "lotushouse/Bed - 1st Floor/lotus_bedroom2_4.jpg":
    "Shower in the first-floor bathroom, with a rain head, hand shower and instant water heater",

  // -- second-floor bedroom and bathroom (bedroom 1) -----------------------------
  "lotushouse/Bed - 2nd Floor/20240410_175659_edited.jpg":
    "Washing machine built in under the vanity in the second-floor bathroom",
  "lotushouse/Bed - 2nd Floor/20240411_083357_edited.jpg":
    "Clothes rail and oval mirror in the second-floor bedroom, looking towards the bed",
  "lotushouse/Bed - 2nd Floor/20240411_085747_edited.jpg":
    "Rain shower and hand shower in the second-floor bathroom, with towels on the rail",
  "lotushouse/Bed - 2nd Floor/20240411_090809_edited.jpg":
    "Basin and backlit mirror in the second-floor bathroom, with the washing machine below the counter",
  "lotushouse/Bed - 2nd Floor/20240411_091214_edited.jpg":
    "The second-floor bathroom, with the vanity and washing machine on the left and the shower beyond",
  "lotushouse/Bed - 2nd Floor/20240411_091311_edited.jpg":
    "Shower gel and shampoo on the rack in the second-floor shower",
  "lotushouse/Bed - 2nd Floor/IMG_5651_edited.jpg":
    "Desk under the window in the second-floor bedroom",
  "lotushouse/Bed - 2nd Floor/IMG_5659_edited.jpg":
    "Desk and lamp in the second-floor bedroom, under a framed botanical print",
  "lotushouse/Bed - 2nd Floor/IMG_5687_edited.jpg":
    "King bed in the second-floor bedroom, under a framed Thai silk panel between two brass wall lights",
  "lotushouse/Bed - 2nd Floor/IMG_5689_edited.jpg":
    "The second-floor bedroom, with the bed, towel ladder and the desk by the window",

  // -- exterior -------------------------------------------------------------------
  "lotushouse/Exterior/20240402_052729_edited.jpg":
    "The lane outside the house, looking along the soi towards the trees",
  "lotushouse/Exterior/20240402_053731_edited.jpg":
    "The gated carport at number 42, with the arched front door behind",
  "lotushouse/Exterior/20240402_053738_edited_resized.jpg":
    "A car parked in the covered carport, with the front door and window to the right",
  "lotushouse/Exterior/lotus_exterior_1.jpg":
    "The front of Lotus House from the carport, with the balcony above and the LOTUS HOUSE sign",
  "lotushouse/Exterior/mainstree_exterior_lotushouse.jpg":
    "The street the house sits on, with neighbouring townhouses along it",
  "lotushouse/Exterior/Parking House.jpg":
    "The carport gate open at number 42, with the car parked inside",
  "lotushouse/Exterior/Parking zone Street.jpg":
    "The lane outside, with off-street parking beside the house",

  // -- floor plans -----------------------------------------------------------------
  "lotushouse/Floor Plan/Lotus House Layout Fl-1.jpg":
    "First floor plan: garage, kitchen, second bedroom and the back yard",
  "lotushouse/Floor Plan/Lotus House Layout Fl-2.jpg":
    "Second floor plan: living room and the main bedroom",
  "lotushouse/Floor Plan/Lotus House Layout Fl-3.jpg":
    "Third floor plan: the front and back roof patios",

  // -- kitchen and entry -----------------------------------------------------------
  "lotushouse/Kitchen/20240412_035206_edited.jpg":
    "Entry hall with a gallery wall of framed prints, floating shelves and a shoe bench",
  "lotushouse/Kitchen/20240412_040311_edited.jpg":
    "Open shelf under the kitchen island, stacked with crockery and pans below the induction hob",
  "lotushouse/Kitchen/IMG_5724_edited.jpg":
    "The kitchen from the entry hall, with the island and stools, the arched door to the yard and the stairs on the right",
  "lotushouse/Kitchen/kitchen_with_people.jpg":
    "Four people around the kitchen island, with the arched door and the staircase behind",

  // -- living room -------------------------------------------------------------------
  "lotushouse/Living Room/20240405_162330_edited.jpg":
    "Wine and snacks on the glass coffee table in front of the navy sofa",
  "lotushouse/Living Room/20240411_045027_edited.jpg":
    "The black steel staircase, with afternoon light falling across the wall",
  "lotushouse/Living Room/20240411_051748_edited.jpg":
    "The living room with the navy sofa, coffee table and the staircase up to the terrace",
  "lotushouse/Living Room/20240411_052358_edited.jpg":
    "Living room with a navy sofa and horseshoe armchair, opening onto the balcony through full-height windows",
  "lotushouse/Living Room/20240411_052817_edited.jpg":
    "Sideboard in the living room, with a vase and carved wood pieces on top",
  "lotushouse/Living Room/20240411_053018_edited.jpg":
    "The navy sofa, horseshoe chair and glass coffee table in the living room",
  "lotushouse/Living Room/IMG_5525_edited.jpg":
    "Dining table and chairs beside the television and armchair in the living room",

  // -- roof terrace ---------------------------------------------------------------------
  "lotushouse/Terrace/20250413_100343 (2).jpg":
    "Outdoor table and wicker chairs on the roof terrace, under the rain tree",
  "lotushouse/Terrace/891b0e74-8666-4bef-8723-685261955329.jpg":
    "Sunset over the mountains, seen from the roof terrace",
  "lotushouse/Terrace/asian_couple_terrace_sunset_3900px.jpg":
    "Two people on loungers beside the tub on the roof terrace at sunset",
  "lotushouse/Terrace/Gemini_Generated_Image_m2gl4om2gl4om2gl.jpg":
    "The soaking tub and loungers on the roof terrace at sunset",
  "lotushouse/Terrace/IMG_4982_edited.jpg":
    "Soaking in the tub on the roof terrace at sunset, with the mountains on the horizon",
  "lotushouse/Terrace/IMG_4991_editedfinal.jpg":
    "The soaking tub and a wicker lounger on the roof terrace at sunset",
  "lotushouse/Terrace/IMG_5359_edited.jpg":
    "Yoga on the roof terrace under the shade sail, with the rain tree behind the railing",
  "lotushouse/Terrace/lotus_patio_2.jpg":
    "The back terrace, with the soaking tub, outdoor shower and two loungers",
  "lotushouse/Terrace/terrace_people.jpg":
    "Four people on the roof terrace at sunset, one of them in the tub",
  "lotushouse/Terrace/two_men_terrace_sunset_1280.jpg":
    "Two men on the roof terrace at sunset, one on a lounger beside the tub",

  // -- the team ---------------------------------------------------------------------
  // Alt text names the person and what they do. A portrait's alt text is the one case
  // where naming beats describing: "a smiling man in glasses" tells a screen-reader user
  // nothing about why the photo is on the page.
  "team/Paul_b__portrait_as_Co-founder.jpg": "Paul, co-founder of AgentSiam",
  "team/Nils_m_portrait_as_Co-founder.jpeg": "Nils, co-founder of AgentSiam",
  "team/Patthanapong_p_portrait_Appraisal_&_RealEstate_Specialist_as.jpg":
    "Patthanapong, appraisal and real estate specialist at AgentSiam",
  "team/Phakkaya_jen_k__portrait_as_Digital_&_Creative_Consultant.jpg":
    "Jen, digital and creative consultant at AgentSiam",
  "team/thicha_maseng_portrait_as_Project_Coordinator.jpg":
    "Thicha, project coordinator at AgentSiam",
};

// Star rating drives the running order: the manifest sorts highest-first, then by filename.
// Five stars is the hero -- the large gallery slot and the card on the homepage. Four stars
// fill the other four grid slots; everything else sits behind "Show all photos".
//
// This is the same field Photos.app writes when you star a photo, so re-ordering later is a
// keystroke there rather than an edit here.
const RATINGS = {
  "lotushouse/Terrace/IMG_4991_editedfinal.jpg": 5,

  // Team portraits run in the order the row should read: founders, then the specialists.
  // Ratings are only a tiebreak here -- TEAM in src/lib/team.ts is what actually orders the
  // row -- but keeping them in step means the manifest reads in the same order as the page.
  "team/Paul_b__portrait_as_Co-founder.jpg": 5,
  "team/Nils_m_portrait_as_Co-founder.jpeg": 5,
  "team/Patthanapong_p_portrait_Appraisal_&_RealEstate_Specialist_as.jpg": 4,
  "team/Phakkaya_jen_k__portrait_as_Digital_&_Creative_Consultant.jpg": 3,
  "team/thicha_maseng_portrait_as_Project_Coordinator.jpg": 2,

  "lotushouse/Bed - 1st Floor/IMG_5578_edited.jpg": 4,
  "lotushouse/Bed - 2nd Floor/IMG_5687_edited.jpg": 4,
  "lotushouse/Kitchen/IMG_5724_edited.jpg": 4,
  "lotushouse/Living Room/20240411_052358_edited.jpg": 4,

  // Strong supporting shots, in the lightbox.
  "lotushouse/Exterior/lotus_exterior_1.jpg": 3,
  "lotushouse/Kitchen/20240412_035206_edited.jpg": 3,
  "lotushouse/Living Room/20240411_051748_edited.jpg": 3,
  "lotushouse/Living Room/IMG_5525_edited.jpg": 3,
  "lotushouse/Bed - 1st Floor/IMG_5582_edited.jpg": 3,
  "lotushouse/Bed - 2nd Floor/IMG_5689_edited.jpg": 3,
  "lotushouse/Terrace/IMG_5359_edited.jpg": 3,
  "lotushouse/Terrace/IMG_4982_edited.jpg": 3,
  "lotushouse/Terrace/20250413_100343 (2).jpg": 3,
  "lotushouse/Terrace/lotus_patio_2.jpg": 3,

  // Detail and utility shots: true, useful, not what sells the first screen.
  "lotushouse/Bed - 1st Floor/20240411_043128_edited.jpg": 2,
  "lotushouse/Bed - 1st Floor/20240411_044832_edited.jpg": 1,
  "lotushouse/Bed - 1st Floor/20240411_074844_edited.jpg": 2,
  "lotushouse/Bed - 1st Floor/20240411_075316_edited.jpg": 2,
  "lotushouse/Bed - 1st Floor/IMG_5445_edited.jpg": 2,
  "lotushouse/Bed - 1st Floor/lotus_bedroom2_4.jpg": 2,
  "lotushouse/Bed - 2nd Floor/20240410_175659_edited.jpg": 2,
  "lotushouse/Bed - 2nd Floor/20240411_083357_edited.jpg": 2,
  "lotushouse/Bed - 2nd Floor/20240411_085747_edited.jpg": 2,
  "lotushouse/Bed - 2nd Floor/20240411_090809_edited.jpg": 2,
  "lotushouse/Bed - 2nd Floor/20240411_091214_edited.jpg": 2,
  "lotushouse/Bed - 2nd Floor/20240411_091311_edited.jpg": 1,
  "lotushouse/Bed - 2nd Floor/IMG_5651_edited.jpg": 2,
  "lotushouse/Bed - 2nd Floor/IMG_5659_edited.jpg": 2,
  "lotushouse/Exterior/20240402_052729_edited.jpg": 2,
  "lotushouse/Exterior/20240402_053731_edited.jpg": 2,
  "lotushouse/Exterior/20240402_053738_edited_resized.jpg": 2,
  "lotushouse/Exterior/mainstree_exterior_lotushouse.jpg": 2,
  "lotushouse/Exterior/Parking House.jpg": 2,
  "lotushouse/Exterior/Parking zone Street.jpg": 2,
  "lotushouse/Kitchen/20240412_040311_edited.jpg": 2,
  "lotushouse/Living Room/20240405_162330_edited.jpg": 2,
  "lotushouse/Living Room/20240411_045027_edited.jpg": 2,
  "lotushouse/Living Room/20240411_052817_edited.jpg": 2,
  "lotushouse/Living Room/20240411_053018_edited.jpg": 2,
  "lotushouse/Terrace/891b0e74-8666-4bef-8723-685261955329.jpg": 2,

  // Composited and generated images, kept at the owner's direction. Last in the run so the
  // gallery opens on photographs of the actual house.
  "lotushouse/Kitchen/kitchen_with_people.jpg": 1,
  "lotushouse/Terrace/asian_couple_terrace_sunset_3900px.jpg": 1,
  "lotushouse/Terrace/Gemini_Generated_Image_m2gl4om2gl4om2gl.jpg": 1,
  "lotushouse/Terrace/terrace_people.jpg": 1,
  "lotushouse/Terrace/two_men_terrace_sunset_1280.jpg": 1,

  // Floor plans: useful, but they are drawings, so they sit at the end.
  "lotushouse/Floor Plan/Lotus House Layout Fl-1.jpg": 1,
  "lotushouse/Floor Plan/Lotus House Layout Fl-2.jpg": 1,
  "lotushouse/Floor Plan/Lotus House Layout Fl-3.jpg": 1,
};

let written = 0;
let missing = 0;

for (const [relative, caption] of Object.entries(CAPTIONS)) {
  const file = path.join(BASE, relative);
  if (!existsSync(file)) {
    console.warn(`MISSING  ${relative}`);
    missing += 1;
    continue;
  }
  console.log(`${relative}\n         ${caption}`);
  if (!WRITE) continue;

  const binary = (await readFile(file)).toString("binary");
  // load() throws on a file with no EXIF block at all; start a fresh one in that case.
  let exif;
  try {
    exif = piexif.load(binary);
  } catch {
    exif = { "0th": {}, Exif: {}, GPS: {}, "1st": {}, thumbnail: null };
  }
  exif["0th"][piexif.ImageIFD.ImageDescription] = caption;
  // 0x4746: the standard Rating tag, the same one a star in Photos.app sets.
  exif["0th"][18246] = RATINGS[relative] ?? 3;
  const updated = piexif.insert(piexif.dump(exif), binary);
  await writeFile(file, Buffer.from(updated, "binary"));
  written += 1;
}

console.log(
  `\n${WRITE ? written + " captions written" : Object.keys(CAPTIONS).length + " captions ready"}` +
    `${missing ? `, ${missing} file(s) not found` : ""}`,
);
if (!WRITE) console.log("Dry run. Re-run with --write to apply.");
