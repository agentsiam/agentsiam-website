# Photos

Drop photos in the folder named after the property. Lotus House is `lotushouse/`, matching
its URL. A new property gets a new folder with the same name as its slug.

```
src/photos/
  lotushouse/
    01-living-room.jpg
    02-rooftop-terrace.jpg
    ...
```

That is the whole job. The site picks them up on the next `npm run dev` or `npm run build`.

## What to hand over

**One file per photo, the biggest version you have.** Don't resize, don't crop, don't
convert. Next generates every size the page needs and serves WebP or AVIF automatically —
there is no export step and nothing to upload separately.

- **JPEG or PNG.** Not HEIC, which is what an iPhone shoots by default: the build will name
  any HEIC file it finds and tell you to export it. In Photos: File → Export → Export Photo,
  format JPEG.
- **2400px or more on the long edge.** 1600px is the floor before the large slot goes soft
  on a retina screen.
- **Landscape for the gallery.** Portrait shots work in the lightbox but break the grid.
- **8–15 per property.** Five show in the grid; the rest sit behind "Show all photos".

## Captions are the alt text

Write a one-line description into each photo and it travels inside the file — no list to
keep in sync, and renaming a file breaks nothing.

- **Photos.app** — select the photo, ⌘I, type in the Description field
- **Preview** — Tools → Show Inspector
- **Lightroom** — the Caption field in the Metadata panel

That line becomes the image's alt text and its lightbox caption. It is what a screen reader
announces and what Google reads, so describe what is actually in the frame ("rooftop terrace
at dusk with the soaking tub"), not the property name. The build prints a warning naming any
photo that has no description.

## Order

Star rating first (highest to lowest), then filename A→Z. Star a photo in Photos.app and it
moves up; that is how you promote something to the hero slot without renaming anything.

The first photo in the final order is the hero — it fills the large gallery slot and the
card on the homepage. Five stars is the hero, four stars fill the other four grid slots,
everything else sits behind "Show all photos".

## Room subfolders

Group by room if you like — `Terrace/`, `Kitchen/`, `Bed - 1st Floor/`. The folder name is
read as a room label. Two folder names are skipped by the build:

- `raw/` — camera originals. Gitignored, so put the untouched full-size files here.
- anything starting with `_`, e.g. `_excluded/` — how you take a photo out of the gallery
  without deleting it.

## Why these live here and not in `public/`

Anything in `public/` is served exactly as it sits on disk, so a 6MB original would be
downloadable by anyone who guessed the URL. From here, only the resized and re-encoded
versions are ever reachable.

The re-encode also strips metadata: a file served through `/_next/image` comes back with no
metadata block at all, checked against an original that had one. So the caption is read at
build time and rendered as text, while the GPS coordinates your camera wrote into the file
never leave the repo.
