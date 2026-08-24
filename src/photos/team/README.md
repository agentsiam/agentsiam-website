# team

Photographs of the people who run AgentSiam. Two things live here, and the code picks each
one out by name rather than by position, so an extra file never lands somewhere unexpected.

## 1. The portraits. One file per person

Used by `TeamRow` on `/how-it-works`, which walks the explicit list in `src/lib/team.ts` and
matches each member to a file by a fragment of its filename. Someone whose photo has not been
supplied simply does not render, so the row shows whoever has one.

Shot and cropped square, roughly 1024px. The row uses square tiles because that is the shape
these are shot in: cropping a head-and-shoulders portrait to landscape either cuts the head
off or leaves it swimming.

The owner page claims "we live here", "we visit the properties", "someone local reads the
message at 11pm". Every one of those is a claim about a person, and this row is what stops the
page making them without showing anyone.

**What works:** each person photographed at a property or on a Chiang Mai street, in daylight,
looking at the camera. Not a studio backdrop, not a headshot against a white wall, not a
stock-looking "team in a meeting" shot. The whole argument is that these are real people in a
real city.

**Description to type into each file:** the person's name and where it was taken, e.g. "Paul
at Lotus House in Chang Khlan". That becomes the alt text.

## 2. `agentsiam-team-group-portrait.jpg`. The homepage band

A **landscape 16:9** frame of the whole team, used by the "For owners" fork panel on the
homepage. `src/app/[locale]/page.tsx` looks for the filename fragment `team-group-portrait`,
so the name is load-bearing: rename the file and the panel goes dark.

Deliberately not one of the portraits above. Those are ~480px square avatars and this slot is
a wide band, so using one would crop the head and upscale it.

- **2560 x 1440** ideally, **1440 x 810** absolute minimum
- Landscape only. It is centre-cropped to 16:9, so leave headroom above and below
- Caption it as a team image, never as a place. Anything naming a property is wrong, because
  the caption is the alt text and that is what turns an image into a claim about an address

### Provenance: this file is a generated composite

**It is not a photograph of a moment that happened.** It was generated on 24/08/2026 from the
five real team headshots in this folder, as a studio group portrait against a plain backdrop.

Permitted by a named exception to the design system's "Real AgentSiam photography only" rule,
approved by Paul on 24/08/2026 and recorded as **decision 27** in
`agentsiam-consulting/as-context/00-company/decisions-log.md`. **The exception is scoped to
this one slot and does not license generated property photography, which stays banned
outright.**

Written down here deliberately. The entire cost of the terrace-photo investigation that ran
from 18/08 to 24/08/2026 was that nobody had recorded where a file came from, and a filename
was left to carry the whole argument. The brief, the two rejected runs and the reasoning are
in `agentsiam-consulting/as-work/2026-08-24-vercel-setup-and-deploy/`.

**Why it is not in a set of its own.** It was originally coded to read a `team-wide/` folder.
That is a whole top-level manifest key, a folder to maintain and a thing to explain, for one
file. It lives here instead and is addressed by name, which is the idiom `src/lib/team.ts` was
already using for this folder. Nothing iterates this set blind, so an extra file here appears
in its own slot and nowhere else.

## Both panels light up together, or neither does

The homepage is written so the guest panel and the owner panel take a photo or neither:

```ts
const forkPhotos = guestForkPhoto && ownerForkPhoto ? { ... } : null;
```

One panel with a photo and one without leaves a hole where the second image should be, so the
flat brand fill is the correct treatment whenever either photo is absent. That fill is the
design's own fallback, not a placeholder to feel bad about.

**So a missing `agentsiam-team-group-portrait.jpg` costs two homepage photographs, not one.**
