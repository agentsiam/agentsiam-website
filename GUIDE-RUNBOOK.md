# Local guide

## What it is

A curated library of places, one per city, rendered per property. Chiang Mai today, 157
places. A guest sees it at `/[locale]/lotushouse/local-guide` in English, Thai or Chinese.

**`src/data/places.json` is the library.** Everything else derives from it or feeds into it.

## Scope

**Curation, not data.** No opening hours, menus, phone numbers, prices or photos. They rot
within weeks and Google Maps does them better. The value is that someone went there and
wrote a sentence about it. A website URL is fine — it is stable. Opening hours are not.

**Distance never lives on a place.** It belongs to the pairing of a place and a property,
which is what lets one library serve every property in its city. Walk and drive times are
routed per property and cached.

**A second city** means `city` on the new places and an entry in `areas.ts`. Not a second
system, not a second file.

## Adding or changing a place

Edit `src/data/places.json`:

```json
{
  "name": "Huen Muan Jai",
  "category": "Restaurant",
  "city": "chiang-mai",
  "tags": ["northern-thai"],
  "highlight": false,
  "comment": "Renowned for authentic Northern Thai cooking. Khao soi, sai ua, nam prik.",
  "google": "https://maps.app.goo.gl/...",
  "apple": "https://maps.apple/p/...",
  "website": ""
}
```

`name`, `category` and `google` are required. `name` is the key the whole system joins on,
so it must be unique. Never type a coordinate; the build resolves them from `google`.
`highlight: true` marks a host pick.

Then:

```
npm run guide
```

Commit **both** `src/lib/guide.generated.ts` and `scripts/guide-cache.json`. A deploy does
no network work for the guide — it reads the checked-in file — so nothing is live until
those two are committed and deployed.

## Proposals from the sheet

The Google Sheet is an inbox: how someone adds a place from their phone. It is not the
library and nothing in it reaches a guest unreviewed.

```
npm run guide:import              # show the diff, change nothing
npm run guide:import -- --apply   # write it into places.json
npm run guide                     # then enrich and commit as above
```

The import never deletes — a place in the library but not in the sheet is reported and left
alone. An empty cell means "not filled in", not "clear this field". It refuses if two rows
share a name.

**Reseed the inbox from the library** after a divergence, so the only rows that differ
afterwards are ones somebody is actually proposing:

```
npm run guide:csv -- --sheet      # -> scripts/guide-for-sheet.csv
```

Import that into the sheet with File → Import → **Replace current sheet**. It round-trips
losslessly.

## Reading the library

```
npm run guide:csv                 # -> scripts/guide-export.csv
```

Everything, including coordinates and per-property times. Gitignored and regenerated on
demand: a checked-in copy is a second answer to "what places do we have" that goes wrong the
moment the first one changes.

## When the build refuses

It fails early — before any network work where it can — because the alternative is a guest
standing outside the wrong restaurant.

| It says | Fix |
|---|---|
| `tag(s) are not in the vocabulary` | Fix the spelling, or add the tag to `guide-vocabulary.json` |
| `link(s) are used by more than one place` | One of them is pinned wrong. Get the right link, or add it to `SHARED_LINKS` with the reason |
| `place(s) resolved outside Chiang Mai` | The link points at the wrong business. Search Maps again |
| `Duplicate place name(s)` | Remove one, or give them names that tell them apart |
| `Walking route came back at N km/h` | A driving router answered a walking question. Check `OSRM_FOOT_URL` |

Warnings that need a human but do not stop the build:

- `Nm apart and similarly named` — probably one place entered twice. Confirm it is not.
- `category "X" is not in guide-vocabulary.json` — ships with a plain pin, English on
  `/th` and `/zh`.

## When a place moves

The coordinate cache is keyed by Maps link and never expires, which is right: places do not
move, and re-resolving every link on every run is waste. The exception never errors — when a
business relocates, the link stays the same while the coordinates change, so the cache
returns the old position forever.

```
npm run guide -- --refresh "Huen Muan Jai"    # one place
npm run guide -- --refresh                    # everything, ~5 minutes
```

Errors if the name matches nothing, rather than silently doing nothing.

## Vocabulary

`src/lib/guide-vocabulary.json` — 15 categories and 41 tags, each with English, Thai and
Chinese, each category with its map-pin emoji. Read by the build script and the app.

Tags are an allowlist. Adding one is a line there plus an entry on the sheet's Vocabulary
tab so the dropdown offers it. Translations are required; a missing one falls back to
English rather than showing a slug.

## Open

- **Nothing detects a place that has closed.** The guide's real risk, and no tooling fixes
  it. Needs a human sweep — quarterly is the suggestion.
- `website` is stored and not yet rendered on the card. 10 of 157 places have one.
- Seven places are waiting on a correct Maps link before they can be added: San Mai,
  Salt & Fire, Projek Outdoor, Eudemonia, and one Lila Thai Massage branch. Each currently
  resolves to a different business.
