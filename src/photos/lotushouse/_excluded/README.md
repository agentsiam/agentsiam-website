# Held back from the published set

`_`-prefixed folders are skipped by `scripts/build-photo-manifest.mjs`, so anything
here stays in the repo and off the site. Nothing is deleted: a photo pulled for one
reason may be fine once that reason is dealt with.

Three files, all held for the same reason: **the house number "42" is legible in them.**
That is the street address in image form, and the address is `booking-confirmation` under
the visibility rule in `as-context/03-systems/property-profile-schema.md`. The rule follows
the fact rather than the format.

| File | Why | Decided |
|---|---|---|
| `20240402_053731_edited.jpg` | The gated carport. **"42"** on the wall, a legible Thai licence plate (`งบ 4329 เชียงใหม่`) and the CCTV dome | 18/08/2026, Paul, Q9a |
| `Parking House.jpg` | Effectively the same photograph as the row above, and it stayed published for six days after that decision. Its own caption said so: *"The carport gate open at number 42, with the car parked inside."* **"42"** legible, plate unretouched, CCTV dome visible | 24/08/2026, applying Q9a |
| `20240402_053738_edited_resized.jpg` | Same burst as `053731`, seven seconds later. The licence plate had already been painted out of this one, so the plate is dealt with, but **"42" is still legible** on the neighbouring wall | 24/08/2026, applying Q9a |

The house number cannot be retouched out of any of these three without gutting the frame,
which is why they stay here rather than being cleaned up like the two below.

To bring one back: retouch out whatever caused it to be pulled, move it into its room
folder, run `node scripts/write-captions.mjs --write` and then `npm run photos`, and strike
the row above.

## Cleared and returned to the published set, 24/08/2026

**`Exterior/Parking zone Street.jpg` and `Exterior/20240402_052729_edited.jpg`.** Both were
pulled on 24/08 alongside the three above. Neither shows the house number, so the licence
plate was their only problem, and the plate has now been redacted in both: the region was
collapsed to a handful of pixels and blown back up, which destroys the glyphs rather than
merely softening them. There is no detail left to recover, unlike a blur. Checked afterwards
by cropping the region and upscaling it five times.

Both are back in `Exterior/`. They are the only wide shots of the lane, and without them the
folder was down to two photos.

Cost of the edit, stated because it is not free: the pixel edit means one JPEG re-encode of
the whole frame, at quality 95 with no chroma subsampling. `write-captions.mjs` then put the
IPTC caption and the star rating back, because a re-encode drops the metadata block and the
alt text lives in it.

**`Terrace/Gemini_Generated_Image_m2gl4om2gl4om2gl.jpg`.** Held from 22/08 pending an answer
on where the file came from, because `Gemini_Generated_Image_` plus a random token is Google
Gemini's default output filename and the design system bans stock and fake mockups.
**Paul confirmed on 24/08/2026 that the photograph is real.** Returned to `Terrace/` with its
caption intact. The filename is misleading and nothing more.

## Resolved, and not to be re-asked

Four files were flagged on 18/08/2026 on the strength of their filenames reading like stock
or generated output: `Terrace/asian_couple_terrace_sunset_3900px.jpg`,
`Terrace/two_men_terrace_sunset_1280.jpg`, `Terrace/terrace_people.jpg` and
`Kitchen/kitchen_with_people.jpg`.

**Settled 22/08/2026 by opening them at full resolution.** All four are the real property,
one professional shoot with models delivered at several sizes. `_3900px` and `_1280` are a
photographer's delivery-size tags. Nothing is stock and nothing is generated. **They stay
published**, and the question does not need asking again. Detail:
`agentsiam-consulting/as-work/2026-08-18-website-launch-blockers/photo-provenance.md`.

## A note on `write-captions.mjs`

Its `CAPTIONS` map still holds entries for the three files above, so a dry run reports
`3 file(s) not found`. That is correct rather than broken: the caption is kept against the
filename so that it travels back with the photo if one is ever retouched and restored.
