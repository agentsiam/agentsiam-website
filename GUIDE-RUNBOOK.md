# The guest guide: how to change it

The guide is the list of places on `/lotushouse/local-guide` and `/cosmoshouse/local-guide`,
and the place cards on the home page and each `/destinations/*` page. This is how to add to
it, correct it and rebuild it.

Nothing here is automatic. Every change is a commit someone read.

---

## Where each thing lives

| What | File | Who writes it |
|---|---|---|
| The places: name, category, Maps links, the host's note | `scripts/guide-places.csv` | A person, in a diff |
| Tags and the business's own website, per place | `scripts/guide-extras.json` | A person, in a diff |
| The tag and category vocabulary, with Thai and Chinese | `src/lib/guide-vocabulary.json` | A person, in a diff |
| Resolved coordinates and routed times | `scripts/guide-cache.json` | `npm run guide`, cached by link |
| What the site reads | `src/lib/guide.generated.ts` | `npm run guide`. **Never by hand** |

The Google Sheet is **not** in that table. It is an inbox, described below.

## The three commands

```bash
npm run guide
```

Rebuilds `src/lib/guide.generated.ts` from the two data files. Resolves any Maps link it has
not seen before, routes any place it has not routed before, and caches both. A second run
with nothing changed does no network work at all and rewrites the same bytes.

```bash
npm run guide:import
```

Reads the Google Sheet and prints what it would add. **Writes nothing.**

```bash
npm run guide:import -- --apply
```

Appends the proposed rows to `scripts/guide-places.csv`. Still writes nothing else: tags, a
website and the rebuild are all separate, deliberate steps.

## Adding a place

1. `npm run guide:import` if it came from the sheet, then read what it proposes. Or add the
   row to `scripts/guide-places.csv` yourself: `Category, Site, Google Maps, Apple Maps,
   Comment`, and a `🔶` in front of the Site cell makes it a host pick.
2. `npm run guide:import -- --apply`, if you used the sheet.
3. Tags and a website, if it has them, go in `scripts/guide-extras.json` under the place's
   exact name.
4. `npm run guide`.
5. Read the diff on `src/lib/guide.generated.ts`. A new place should add one block, one line
   per property in `GUIDE_DISTANCES`, and nothing else.
6. Commit the CSV, the JSON, the cache and the generated file together.

## Correcting a place

Edit `scripts/guide-places.csv` and run `npm run guide`. The sheet is not updated and does
not need to be: `npm run guide:import` will report the difference and never act on it.

## Removing a place

Delete its row from `scripts/guide-places.csv`, and its entry from `scripts/guide-extras.json`
if it has one. If the place is still in the sheet, add its Maps link to `DECLINED` in
`scripts/import-guide-sheet.mjs` with the reason, or the importer proposes it again on every
run.

## Why the sheet is an inbox

Until 10/11/2026 `npm run guide` fetched the sheet on every run. That meant a cell edited in
a browser reached the guide with nobody reading it, a row deleted there deleted a place, and
four lists in `build-guide.mjs` existed only to patch a source nobody could edit: a removal,
two renames, a merge and thirty note corrections.

The sheet is still the easiest way for someone to add a restaurant from their phone, which
is the one thing it is good at. So it proposes and the repository decides. `guide:import`
prints a diff, writes nothing without `--apply`, and **never deletes**: a place missing from
the sheet is counted and left alone, because most of the library was never in the sheet.

A place is matched by its **Google Maps link**, not by its name. Names in the library have
been edited on purpose, so matching on them would make the importer propose undoing every
one of those edits on every run.

`npm run guide:import -- --differences` lists the rows where the sheet and the library
disagree. There are around thirty, almost all of them typos this repository corrected and the
sheet still has. They are quiet by default for that reason.

## What the build refuses to do

Each of these stops `npm run guide` with the place named. They exist because every one of
them has happened, or would have shipped silently.

- **A tag that is not in the vocabulary**, with a did-you-mean. A silently dropped tag is a
  filter that quietly returns the wrong places.
- **A name in `guide-extras.json` that matches no place.** A rename would otherwise drop that
  place's tags and website with nothing saying so.
- **Two places sharing one Google Maps link.** Coordinates are cached by link, so both rows
  resolve to the same point and one is pinned where it is not. Real exceptions are in
  `SHARED_LINKS` with a reason.
- **A link that resolves outside Chiang Mai.** That is a link pointing at the wrong business,
  not a distant place. The box is the province and its neighbours, since Doi Inthanon is 86km
  out and legitimate.
- **Two places with the same name.** `GUIDE_DISTANCES` is keyed by name, so one would vanish
  from the map with no error.
- **A walking route faster than 8km/h**, or walking and driving times that agree everywhere.
  Both mean a car-profile router is answering walking questions, which is silent otherwise.
- **A place with no coordinates.** It refuses to write a partial guide.

And two it warns about rather than refusing, because both still render correctly for a guest:
a category the vocabulary does not know, which ships with a plain pin and its English name,
and two places close together with similar names, which is usually two real places. Pairs
already judged are in `NOT_DUPLICATES`.

## Things that will catch you out

- **A place more than 12km away is in the data and not on the page.** `MAX_DISTANCE_M` in
  `src/components/local-guide.tsx`, Paul's call on 11/09/2026, when the library was smaller.
  Thirteen places are in this state today, Doi Suthep, Doi Inthanon, MAIIAM and Bo Sang among
  them. The build will not mention it and nothing on the page says a place was left out.
- **Routes start at the property's public start point, never the house.** `src/lib/guide-start.ts`
  names a guide place near each one, currently a 7-Eleven. Times measured from the door can
  be worked back to the door, so the house coordinate never enters this pipeline at all.
- **The sheet's own `Walk (min)` and `Car/Motorbik` columns are ignored.** They are hardcoded
  to Lotus House. Every time is routed per property instead.
- **Place names and the hosts' notes are English in every locale**, and the page says so.
  Categories and tags are translated, because they are a closed vocabulary rather than prose.
- **`npm run guide` needs the network only for places it has not seen.** The cache is keyed by
  Maps link, so a rerun after a note change does no network work. A business that moves while
  keeping its link is the one failure the cache cannot see: delete its line from
  `scripts/guide-cache.json` to force it.
