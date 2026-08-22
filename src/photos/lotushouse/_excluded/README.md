# Held back from the published set

`_`-prefixed folders are skipped by `scripts/build-photo-manifest.mjs`, so anything
here stays in the repo and off the site. Nothing is deleted: a photo pulled for one
reason may be fine once that reason is dealt with.

| File | Why | Decided |
|---|---|---|
| `20240402_053731_edited.jpg` | The gated carport. Shows **"42"** on the wall, a legible Thai licence plate (`งบ 4329 เชียงใหม่`) and the CCTV dome. The house number plus "Chang Khlan" on the same page is the street address again, in image form, immediately after we stopped publishing it as text. The plate is a separate problem: it is personal data belonging to whoever owns that car, and nobody consented to it appearing on a public listing. | 18/08/2026, Paul, Q9a |
| `Gemini_Generated_Image_m2gl4om2gl4om2gl.jpg` | Published as photo 46 with the caption "The soaking tub and loungers on the roof terrace at sunset", presented as a photograph of the house. `Gemini_Generated_Image_` plus a random token is Google Gemini's default output filename, and the floor shows a generation artefact where a smooth grey area meets the wood planking. EXIF cannot settle it, the build pipeline strips metadata from every file. A generated image of a property a guest is paying to stay in is a representation about a real thing, and the design system bans stock and fake mockups. Held back pending Paul's confirmation of where the file came from. | 22/08/2026, Paul, Q1a |

Exact address and coordinates are `booking-confirmation` under the visibility rule in
`as-context/03-systems/property-profile-schema.md`. A photograph of the house number is
the same fact through a different door, and the rule follows the fact rather than the
format.

To bring one back: retouch out whatever caused it to be pulled, move it into its room
folder, run `npm run photos`, and strike the row above.

Still to confirm, raised 18/08/2026 and not yet answered: `Terrace/asian_couple_terrace_sunset_3900px.jpg`, `Terrace/two_men_terrace_sunset_1280.jpg`, `Terrace/terrace_people.jpg` and `Kitchen/kitchen_with_people.jpg`. All four are published. Their names read like stock-library or generated output rather than camera output, where every other file in the library is `IMG_####`, a `YYYYMMDD_` timestamp or a plain room name. They may be legitimate frames from a people-shoot on the real terrace, renamed for clarity. Detail: `/Users/paulb/code/agentsiam-consulting/as-work/2026-08-18-website-launch-blockers/photo-provenance.md`.
