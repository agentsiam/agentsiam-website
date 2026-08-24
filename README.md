# agentsiam-website

Website for AgentSiam. Next.js 16 (App Router) + TypeScript + Tailwind v4, scaffolded
28/07/2026. Rebuilt against the Claude Design handoff on 14/08/2026.

**Status: built, not deployed.** Ten routes plus eight neighbourhood pages, all in three
languages, the design system from `design_handoff_agentsiam_portal/`, a contact form
delivering over Zoho SMTP, direct booking with Stripe payment against Beds24, and full
metadata with hreflang. Not connected to Vercel, and **not ready to go live**: see "Before
this can be deployed" below.

Verified green on 18/08/2026: `next build`, `tsc --noEmit` and `eslint .` all clean.

## Routes

English lives at the bare path. Thai and Chinese are prefixed. Every route exists in all
three languages.

| Route | State |
|---|---|
| `/` | Real. Guest-led: hero, audience fork, the property, why book direct, review, owner band. |
| `/how-it-works` | Real. The owner conversion page: staircase, two gates, qualifier, TM30, FAQ. |
| `/properties` | Real. Server-rendered search results, URL-driven filters. |
| `/destinations` + `/destinations/<area>` | Real. Eight neighbourhoods, prerendered per locale. |
| `/lotushouse` | Real. Live Beds24 availability, prices, instant booking and requests. |
| `/contact` | Real. Owner intake, submits through `/api/contact` to Resend. |
| `/business-services` | Real. The four non-STR service pillars. Footer-linked only. |
| `/terms-and-conditions` | Real text, **not reviewed by counsel**. |
| `/privacy-policy` | Real text. Describes the fields the contact form actually collects. |

`/about` is gone — the design folds the company story into `/how-it-works`. `next.config.ts`
redirects the old URL permanently, in all three languages.

Routes are declared once in `src/lib/site.ts`. Adding a page there adds it to the sitemap in
every locale, with the hreflang set attached. Flip a route's `placeholder: true` to keep an
unfinished page out of the sitemap and set it to noindex.

## How the three languages work

- `src/proxy.ts` (Next 16's rename of `middleware.ts`) rewrites `/how-it-works` to
  `/en/how-it-works` internally and redirects `/en/...` back to the bare path, so English URLs
  never changed and there is exactly one canonical URL per page per language.
- Everything under `src/app/[locale]` therefore, including the root layout. There is no
  `src/app/layout.tsx`.
- `src/app/[locale]/[...rest]/page.tsx` exists only to 404 properly: without it an unmatched
  URL falls through to Next's own bare `/_not-found` page, with no header, no footer and no
  language.
- Strings live in `src/i18n/dictionaries/{en,th,zh}.ts`. English is the source and the type;
  adding a key there is a compile error until the other two carry it. Lookup falls back to
  English per key, so a missing or blank translation degrades to readable rather than blank.
- **Deliberately untranslated:** property descriptions, the long-form owner sections on
  `/how-it-works`, and both legal pages. Those pages render `<TranslationNote>` on `/th` and
  `/zh`, which names what is still English rather than serving it silently.
- **Unreviewed translations:** strings marked `// NEW` in `th.ts` and `zh.ts` were written for
  this site rather than taken from the handoff, and no native speaker has read them. Everything
  unmarked is the handoff's own translation. Get the marked ones checked before launch.

## Metadata and SEO

- `src/lib/site.ts` holds the canonical URL, share copy, and the route list. The domain is
  written down once.
- `NEXT_PUBLIC_SITE_URL` overrides the canonical host, so a Vercel preview advertises its own
  URL rather than production. Falls back to `https://www.agentsiam.com`.
- Every page emits a canonical plus the full hreflang set (`en`, `th`, `zh-Hans`, `x-default`),
  and `sitemap.xml` repeats the same set per URL. The two have to agree; both are generated
  from `languageAlternates()` so they cannot drift.
- `src/app/opengraph-image.tsx` generates the 1200x630 share card at build time from the
  design-system colours and the filed wordmark, rather than a hand-exported PNG that drifts.

## Where the design comes from

`design_handoff_agentsiam_portal/` in this repo — a Claude Design handoff covering a guest
booking portal and an owner conversion path. Read `README.md` there first, then the annotated
wireframe. The `.dc.html` files are design references, not code to copy; they are recreated in
`src/` using this codebase's own patterns.

What was taken from it: the design tokens (now in `src/app/globals.css`), the block sequence
and CTA hierarchy of every page, the owner-page copy, the qualifier's verdict logic, and the
Thai and Chinese dictionaries.

What was deliberately **not** taken:

- **Its 50 Chiang Mai properties are invented.** `src/lib/property.ts` carries the one real
  property instead. The design's own argument is that nothing on the site is a claim a reader
  could not check; seeding a portfolio with fiction breaks it.
- **The handoff's 50 invented properties.** `src/lib/property.ts` carries the one real
  property instead. The design's own argument is that nothing on the site is a claim a reader
  could not check; seeding a portfolio with fiction breaks it. The eight *areas* are real
  places and are imported, which is why `/destinations/<area>` can carry honest content long
  before there is anything to list there.
- **`/checkout` and `/booking/confirmed` as separate pages.** The design routes payment to a
  Beds24 iframe on its own page; we take payment with Stripe inside the property page's own
  booking panel, on our own domain, so the guest never leaves and Beds24 is never named. See
  Booking below.
- **Empty legal stubs.** The handoff ships `/terms` and `/privacy` as "not yet written" boxes.
  Ours are written, and keep their existing URLs so published links do not break.
- **Colour blocks standing in for photographs.** Right for a prototype, wrong on a live page a
  guest is deciding on. Brand fills are used only as panels with content on top, which is the
  treatment the handoff sanctions.

The earlier token source, `agentsiam-consulting`'s `as-context/06-design-system/`, is superseded
for colour and type by the handoff. Voice rules and draft copy still live there. Those paths are
on the machine that has both repos checked out side by side and won't resolve for anyone who
only has this repo — copy values in rather than referencing across repos at build time.

## The guest portal

Built to the handoff's Level 0 and Level 1: nav labelled by audience (Guests · Destinations ·
Property Owners), a hero search bar as the homepage's single primary action, a two-panel fork
band, server-rendered results, and per-neighbourhood landing pages.

- `src/lib/areas.ts` — the eight Chiang Mai neighbourhoods and the three cities. Areas are
  real, so an area page is honest with or without inventory. Only Chiang Mai is live; the
  other two cities are selectable and answer with a named "launching soon" page, never an
  unexplained empty result.
- `src/lib/search.ts` — the one place that knows how a query string maps to a set of
  properties. Pure: no fetching, no React. **Availability is deliberately not filtered here** —
  dates ride along in the URL to be prefilled on the property page, but whether a specific
  stay is free is Beds24's answer, given per property in the booking panel.
- `src/app/[locale]/properties` — results, rendered on the server so a filtered list is
  crawlable rather than a client-side illusion. Every search state is a URL.
- `src/app/[locale]/destinations` — index plus `[area]`, prerendered for every area × locale.

Two deviations from the handoff, both deliberate:

- **Result grids use `auto-fill`, not the specified `auto-fit`.** auto-fit is right at the
  design's assumed scale of hundreds of units, but it collapses empty tracks — so with one
  property a single tile stretches across 1440px and reads as a page that failed to load the
  rest. The two behave identically once the grid is full.
- **Default sort groups by area but orders by price within it, not rating.** The handoff says
  rating; there are no ratings, because none exist as verified data. Swap it when they do.

### The results map

Split view at 900px and up: list left, sticky map right. Below that the split cannot hold, so
the list takes the full width and the map becomes a "Show map" toggle.

Leaflet with OpenStreetMap raster tiles — no API key, no account. Pins are div icons carrying
the nightly rate, which is what makes a map worth using over a list, and which sidesteps
Leaflet's default marker images breaking under a bundler.

**The list is not lifted into React state to get the hover linkage.** It stays server-rendered
HTML — that is what makes a filtered search crawlable — and each tile carries a
`data-property-slug`. The map component finds those tiles and attaches the two-way behaviour
to them: hover a tile and its pin inverts, click a pin and the list scrolls to that tile. The
map is an enhancement layered on a page that already works without it.

Two things to know:

- **⚠️ OSM's public tile servers are for low-volume use** and their usage policy is not a
  production SLA. Before real traffic, move to a proper tile provider (MapTiler, Stadia and
  Carto all have free tiers) — it is a one-line URL change in `results-map.tsx`. Attribution
  must stay either way.
- **No clustering yet.** The handoff calls it mandatory, and it is — at hundreds of units,
  where the Old City becomes one unreadable mass. With a handful of pins it would be a second
  dependency doing nothing, so it is deliberately deferred. Add `leaflet.markercluster` when
  the pin count justifies it.

The map does not auto-fit on load: it always opens framed on Chiang Mai, per the handoff, so
the view never jumps between searches. It re-fits only when a search returns more than one
property.

## DNS and transactional email

`agentsiam.com` is registered at Wix, and **Wix does not permit nameserver changes**, so
Resend cannot verify the domain (it needs an `MX` record on a `send` subdomain, which the
Wix DNS editor cannot create). The domain also **expires 23 September 2026**.

`DNS-EMAIL-RUNBOOK.md` has the full picture: the complete current zone, the two ways
forward (send via Zoho with no DNS changes, or transfer the domain and use Cloudflare +
Resend), and the missing DKIM/DMARC records. Read it before touching DNS or email config.

Note that pointing the domain at Vercel does **not** require moving DNS — Wix handles the
root A record and the `www` CNAME fine.

## Booking

Beds24 is the system of record for availability, rates and reservations. The site reads it and
writes requests to it; it never keeps a second copy of a calendar to drift out of sync.

The property page offers a guest two things, because they are two different promises:

| Path | What happens |
|---|---|
| **Book now, pay online** | Nights held in Beds24 → Stripe takes the money on our own domain → webhook confirms the booking. Instant. |
| **Request to book** | `POST /api/booking/request` → re-quoted server side → written to Beds24 as a `request` for manual confirmation. No money moves. |

**Beds24 is never named in the front end**, and no Beds24 payment gateway is involved. Payment
runs through our own Stripe account with the Payment Element embedded in the panel, so the guest
never leaves the site and card details never reach this server — they go from the browser
straight to Stripe, which is what keeps the site in the lightest PCI bracket (SAQ-A).

### The ordering is the design

Hold the nights, *then* charge. Never the other way round.

1. `POST /api/booking/checkout` re-quotes, then writes a hold to Beds24 (`status: new`) with
   `checkAvailability`. If the nights went while the guest was choosing, Beds24 refuses and
   **no card is ever touched**.
2. Only then is a Stripe PaymentIntent created, carrying the Beds24 booking id in its metadata.
3. `POST /api/stripe/webhook` on `payment_intent.succeeded` flips the hold to `confirmed` and
   writes two invoice lines (a `charge` for the stay, a `payment` for the money).

Charging first would mean that every time the house sells on another channel during the ninety
seconds someone spends typing a card number, we have taken money for a room that no longer
exists. A hold costs nothing and can be released; a refund is a bad day for the guest.

**The webhook is the only thing that confirms a booking.** Not the browser — a guest whose phone
dies between paying and the page redirecting must still get their stay. Stripe signs the call
and retries for days, which is the durability a confirmation needs. `STRIPE_WEBHOOK_SECRET` is
therefore load-bearing: without it, payments succeed and nothing is ever confirmed.

### Abandoned checkouts

A guest who closes the tab mid-payment generates **no Stripe event at all**, so nothing will ever
arrive to tell us those nights are free. `/api/booking/release-holds` finds them by looking, and
`vercel.json` runs it every ten minutes. Without it, every closed tab would block its nights on
all six channels indefinitely.

It is deliberately paranoid: it cancels only bookings that Beds24 says are ours and awaiting
payment (`custom1` starts `stripe:`) **and** that Stripe confirms did not succeed. Trusting
elapsed time alone would eventually cancel a stay somebody paid for.

### Shape of it

- `src/lib/beds24.ts` — the API v2 client. Server-side only: it reads `BEDS24_REFRESH_TOKEN`,
  which has write scope on the whole account. Mints and caches a 24-hour access token from the
  refresh token. The property and room IDs are not secrets and live in `src/lib/property.ts`.
- `src/app/api/booking/availability` — per-night availability and rates.
- `src/app/api/booking/webhook` — Beds24 calls it when the allotment moves; it drops the
  cache and does nothing else.
- `src/app/api/booking/quote` — the total for one specific stay. This is the **only** number
  the UI is allowed to show as a total; adding nightly rates up in the browser would ignore
  length-of-stay pricing and quote a figure Beds24 would not honour.
- `src/app/api/booking/checkout` — holds the nights, then opens a Stripe payment.
- `src/app/api/stripe/webhook` — confirms or releases, depending on what the money did.
- `src/app/api/booking/release-holds` — sweeps abandoned checkouts. Cron, every 10 min.
- `src/lib/stripe.ts` — Stripe client and the minor-units conversion. THB is a two-decimal
  currency in Stripe, so ฿7,000 is 700000 satang; getting that factor wrong is a hundredfold
  error in someone's money, so the zero-decimal set is written out rather than assumed.
- `src/components/payment-form.tsx` — the Payment Element, themed from our own tokens.
- `src/app/api/booking/request` — re-quotes, writes to Beds24, then emails us. In that order:
  a booking without a notification is recoverable from the Beds24 calendar, a notification
  without a booking sends someone chasing a reservation that does not exist.
- `src/components/booking-panel.tsx` — the calendar, the quote and the request form.

The write passes Beds24's `checkAvailability` action, so Beds24 refuses to save a request for
nights that went while the form was open, rather than accepting a booking that collides with
one Airbnb made an hour ago.

### Real-time allotment across six channels

Lotus House is sold on six channels. There is no cross-channel race for this site to lose:
**Beds24 is the channel manager, so every channel books through it and it already holds the
one true allotment.** The only thing that can be stale is our own cached copy of it, and that
is handled in three layers:

1. **Webhook.** Beds24 fires `webhooks.url` whenever a change affects availability — status,
   arrival, departure, room or quantity, but not a surname correction. `/api/booking/webhook`
   drops the `beds24-allotment` cache tag, so a booking taken on Airbnb is off this calendar
   about a second later. Set the URL and a matching `x-webhook-secret` custom header in the
   Beds24 property settings; **it currently has none set**, and it needs a public URL, so it
   can only be wired after deploy.
2. **A 30-second TTL** as the backstop for a missed or unconfigured webhook. Short on purpose,
   but not zero: Beds24 allows about 100 API credits per rolling five minutes (one credit per
   calendar read, reported in `X-Request-Cost` / `X-Five-Min-Limit-Remaining`), so reading
   through on every page view would be self-limiting under any traffic spike. Thirty seconds
   caps this site at ten reads per window however many people are looking. The API itself is
   included in the Beds24 subscription — calls consume rate budget, not money.
3. **`checkAvailability` on every write**, which is the layer that actually guarantees
   correctness. Beds24 itself refuses to save a booking for nights that are gone. A stale
   calendar can waste a click; it cannot double-book the house.

Availability and price share one cache tag deliberately: a price and an availability that
disagreed would be worse than either being briefly stale.

### Two things to know before changing this

- **`REQUEST_STATUS` in `src/lib/beds24.ts`** decides whether a request holds the dates.
  `request` puts it on the calendar and takes the nights off the other channels while you
  decide — which protects against double-booking, but means an unanswered request quietly
  blocks sellable nights. `inquiry` touches nothing and protects nothing. It is one constant,
  deliberately not an env var: it changes what a guest is promised, so it belongs in a diff
  someone reviewed. **The blocking behaviour has not been verified against this account** —
  confirming it means creating a real booking and watching the calendar.
- **`HOLD_STATUS`** is `new`, chosen because it counts against availability while reading as
  visibly not-yet-a-reservation on the Beds24 calendar. As with `REQUEST_STATUS`, the blocking
  behaviour has not been verified against this account.

## Light mode only

The handoff defines no dark palette: the design is built on white ground with solid ink, blue
and gold panels, and every wash and "on-ink" pairing would have to be re-designed for dark.
The previous `prefers-color-scheme: dark` block in `globals.css` was removed rather than left
to guess at values. Bringing dark mode back means designing a dark set of the same tokens
first, not re-adding the media query.

## Photography

Drop files in `src/photos/<property-slug>/` and the gallery, lightbox and homepage card
appear on their own. Until then those slots render brand-colour panels with content on top,
which is the design's own treatment for a fill — not a stand-in for a missing photo.
`src/photos/README.md` is the brief to hand a photographer.

The pipeline, so nobody has to think about image formats:

- **One file in, every size out.** `scripts/build-photo-manifest.mjs` runs before `dev` and
  `build`, scans the folders, and writes `src/lib/photos.generated.ts` as static imports —
  which is what gives Next each file's dimensions and a blur-up placeholder for free. Then
  `next/image` generates the sizes and serves WebP or AVIF by content negotiation. Verified:
  the same URL returns `image/webp` to Chrome and `image/jpeg` to a client that sends
  `Accept: image/jpeg`. There is no export step and no separate upload.
- **Alt text lives inside the photo.** The script reads IPTC Caption-Abstract, XMP
  `dc:description` and EXIF `ImageDescription` — the three places a "Description" field
  writes to — so a caption typed in Photos.app becomes the alt text and the lightbox caption.
  No parallel list to keep in sync with filenames. The build warns by name about any photo
  with no description.
- **Order is filename A→Z, overridden by star rating** (higher first), so promoting a photo
  to the hero slot is a keystroke in Photos rather than a rename.
- **Originals never ship.** They sit under `src/`, not `public/`, so only the re-encoded
  derivatives are reachable, and the re-encode drops the metadata block along with the
  camera's GPS.

`npm run photos` regenerates on demand. Never edit `photos.generated.ts` by hand.

## Known gaps

- ~~No photography yet.~~ Resolved. Real Lotus House photography landed 15/08/2026. As of
  24/08/2026 the published set is 46 Lotus House frames across seven rooms, plus five team
  portraits. Three carport shots are held back in `_excluded/` for showing the house number.
  The old generic stock library stays removed, per the design system's "no stock, no fake
  mockups" rule.
- **No `src/photos/team/team-on-site.jpg`.** One landscape frame of the team on a site visit.
  Until it exists, both homepage fork panels render as brand fills rather than photos, because
  they are coded to take a photo or neither. See `src/photos/team/README.md`.
- No icon set. Value-prop icons are typographic glyphs, as in the handoff.
- No phone number or LINE ID published. The footer carries name, address and email only; all
  three have to match the Google Business Profile character for character.
- ~~The footer has no "Areas we manage" column.~~ Resolved. The footer links all eight
  neighbourhood pages.
- ~~Page titles and meta descriptions are English in all three locales.~~ Found and fixed
  18/08/2026. All eleven route files now read `metaXxxTitle` / `metaXxxDesc` from the
  dictionary. The 22 new Thai and Chinese strings are marked `// NEW` and are unreviewed.

## Getting started

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). `/th` and `/zh` for the other two.

Environment variables are listed in `.env.example`.

## Before this can be deployed

`www.agentsiam.com` is **already live** and running the older business-consulting positioning
("Scale your business in Thailand"), with Business Consulting / Digital & Online Presence /
Operation Automation & AI / Business and Growth Alignment in the nav. This repo is a different
site: short-term rental first, with those four services demoted to `/business-services`.
Deploying to the apex domain replaces the live site. That is a positioning decision for Paul and
Nils, not a deploy step.

Hard blockers, in order. State as of 24/08/2026.

1. **Contact form delivery is unverified end to end.** The transport is Zoho SMTP, not
   Resend: `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD` and `CONTACT_TO_EMAIL`
   have to be set in Vercel and a real send tested. `.env.example` documents all seventeen
   variables. Cannot be closed until the Vercel project exists.
2. **A real Beds24 test booking has not been run end to end.** There is no Beds24 sandbox, so
   it charges a real card against the live account and has to be cleaned up afterwards. The
   procedure and the cost are in `as-work/2026-08-18-website-launch-blockers/test-booking-runbook.md`.

Not a blocker, but the first thing anyone sees: **`src/photos/team/team-on-site.jpg` does not
exist.** The homepage asks for it by that exact name, and because the two fork panels are
written to take a photo or neither, one missing file suppresses two homepage photos and both
render as flat brand fills. It wants one landscape frame of the team on a site visit, 16:9,
minimum 1440x810 and ideally 2560x1440. Brief: `src/photos/team/README.md`, and the full spec
plus the generation prompt in
`as-work/2026-08-24-vercel-setup-and-deploy/team-wide-image-prompt.md`.

Closed, kept here so they are not re-opened by mistake:

- ~~**T&Cs have not been through counsel.**~~ Cleared for draft 1 by Paul, 24/08/2026.
- ~~**The Thai and Chinese strings marked `// NEW` have not been reviewed by a native speaker.**~~
  Closed 23/08/2026. All 296 keys were reviewed in English, Thai and Chinese, 199 findings
  raised and applied. The `// NEW` markers were stale after that and were removed 24/08/2026.
  See `as-work/2026-08-18-website-launch-blockers/copy-review-findings.md`.
- ~~**Four listing disclosures are missing from `/lotushouse`, one of them `safety`.**~~ Closed
  22/08/2026. The child-safety disclosure leads "What this place is not" in all three
  languages, the booking panel counts adults and children separately, and the acknowledgement
  is enforced server-side on both the request and the payment path.
- ~~**The exact street address and coordinates are public before booking.**~~ Closed
  18/08/2026 as text, and 24/08/2026 in image form: three carport photographs showing the
  house number "42" are held back in `src/photos/lotushouse/_excluded/`, and two shots of the
  lane had a licence plate redacted before being republished. The rule follows the fact
  rather than the format. See that folder's README.

Then, the deploy itself: connect the GitHub repo to Vercel, set `NEXT_PUBLIC_SITE_URL` on
preview deployments so previews don't advertise the production canonical, ship to a preview URL
first, and only repoint DNS once the list above is clear.

**Vercel must be on Pro before the first production deploy.** `vercel.json` carries the real
`*/10 * * * *` hold sweep, and Hobby caps crons at once per day, so Vercel rejects it at deploy
time. Upgrade the team first, then deploy. `scripts/check-cron.mjs` guards the other direction:
a production build carrying the daily stopgap is refused.

**A note on git locks.** This checkout moved out of Google Drive on 15/08/2026, which fixed
the old "Operation not permitted" failure on `.git/index.lock`. Two zero-byte lock files
survived the move and silently failed every write until they were cleared on 18/08/2026. If
git reports "Another git process seems to be running" with no git running, check for
`.git/*.lock` and delete them. A failed write can report success: a branch checkout blocked
this way still printed "Already up to date".
