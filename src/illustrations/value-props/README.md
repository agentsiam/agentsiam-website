# Value-prop tile illustrations

Four 1024px square PNGs with alpha, one per card in the "Why owners choose AgentSiam"
block on `/how-it-works`. They sit on that block's `.grad-sand` panel and are drawn for it.

**Deliberately not under `src/photos/`.** That folder is scanned by
`scripts/build-photo-manifest.mjs`, which treats every file as a photograph, reads an alt
string out of its EXIF description and warns when one is missing. These are not
photographs and they are not captioned: the card's own heading and body carry the claim,
so each renders with an empty `alt` and `aria-hidden`, which is the correct treatment for
an illustration that repeats the text beside it. Putting them in the manifest would have
meant inventing alt text for decoration.

Generated, not drawn, and permitted only by the named exception in the consulting repo's
`as-context/00-company/decisions-log.md`. Brief, the rejected runs and the reason each
failed: `agentsiam-consulting/as-work/2026-11-04-value-tile-illustrations/`.

The green screen they were generated on is keyed by `src/key-green.py` in that same work
folder, which also normalises all four to one optical size by measuring each object's own
alpha bounding box. Re-generate any single tile and run it through that script, or it will
sit at a different size from the other three.
