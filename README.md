# agentsiam-website

Website for AgentSiam. Next.js 16 (App Router) + TypeScript + Tailwind v4, scaffolded
28/07/2026. Rebuilt against the Claude Design handoff on 14/08/2026.

**Status: live.** `www.agentsiam.com` serves this repo from Vercel, and `agentsiam.com`
redirects to it. Ten routes plus eight neighbourhood pages, all in three languages, the design
system from `design_handoff_agentsiam_portal/`, a contact form delivering over Zoho SMTP, direct
booking with Stripe payment against Beds24, and full metadata with hreflang.

**"Known gaps" below is the live record.** What is unbuilt, unreviewed or deliberately held back
is there and nowhere else in this file.

Verified green on 09/11/2026: `next build`, `tsc --noEmit` and `eslint .` all clean.

## Routes

English lives at the bare path. Thai and Chinese are prefixed. Every route exists in all
three languages.

| Route | State |
|---|---|
| `/` | Real. Guest-led: hero, audience fork, the property, why book direct, review, owner band. |
| `/how-it-works` | Real. The owner conversion page: six services as a menu, routes by owner situation, qualifier, TM30, FAQ. |
| `/properties` | Real. Server-rendered search results, URL-driven filters. |
| `/destinations` + `/destinations/<area>` | Real. Eight neighbourhoods, prerendered per locale. |
| `/lotushouse` | Real. Live Beds24 availability, prices, instant booking and requests. |
| `/lotushouse/local-guide` | Real. The guest guide, filterable. Place prose is English on every locale. |
| `/management/<city>` | Real. Owner pages for Phuket and Bangkok, from `src/lib/management-cities.ts`. |
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
- **Deliberately untranslated:** both legal pages. They render `<TranslationNote>` on `/th`
  and `/zh`, which names what is still English rather than serving it silently. Property
  descriptions and the `/how-it-works` owner sections are in the dictionaries now, so those
  pages no longer render it; a page whose body is fully translated must not carry the note.
- **Unreviewed translations:** there is no marker convention any more. Every key was reviewed in
  all three languages on 23/08/2026 and the `// NEW` markers were removed on 24/08/2026. Keys
  added since then are unreviewed and nothing in the files distinguishes them, so a review pass
  has to scope itself by date rather than by marker.

## Metadata and SEO

- `src/lib/site.ts` holds the canonical URL, share copy, and the route list. The domain is
  written down once.
- `NEXT_PUBLIC_SITE_URL` overrides the canonical host, so a Vercel preview advertises its own
  URL rather than production. Falls back to `https://www.agentsiam.com`.
- Every page emits a canonical plus the full hreflang set (`en`, `th`, `zh-Hans`, `x-default`),
  and `sitemap.xml` repeats the same set per URL. The two have to agree; both are generated
  from `languageAlternates()` so they cannot drift.
- `sitemap.xml` also carries image entries for the routes that render a whole photo set,
  which today is `/lotushouse` and its gallery. The mapping is `ROUTE_PHOTO_SET` in
  `src/app/sitemap.ts`; the team portraits are deliberately not advertised.
- `src/app/opengraph-image.tsx` generates the 1200x630 share card at build time from the
  design-system colours and the filed wordmark, rather than a hand-exported PNG that drifts.
- **Structured data** is built in `src/lib/structured-data.ts` and attached with
  `src/components/json-ld.tsx`. `Organization` and `WebSite` come from the root layout on
  every page and carry stable `@id` values; `/lotushouse` adds `VacationRental`, and
  `/lotushouse` and `/destinations/[area]` add a `BreadcrumbList` that mirrors the
  breadcrumb the page actually renders. `/how-it-works` adds `FAQPage` from the same array
  the accordion reads. No rating, no street address, no coordinates, no telephone: the file
  says why for each, and each is a one-line addition on the day the data exists.

## Where the design comes from

`design_handoff_agentsiam_portal/` in this repo — a Claude Design handoff covering a guest
booking portal and an owner conversion path. Read `README.md` there first, then the annotated
wireframe. The `.dc.html` files are design references, not code to copy; they are recreated in
`src/` using this codebase's own patterns.

What was taken from it: the design tokens (now in `src/app/globals.css`), the block sequence
and CTA hierarchy of every page, the owner-page copy, the qualifier's verdict logic, and the
Thai and Chinese dictionaries.

What was deliberately **not** taken:

- **The handoff's 20 invented properties.** `src/lib/property.ts` carries the one real property
  instead. The design's own argument is that nothing on the site is a claim a reader could not
  check; seeding a portfolio with fiction breaks it. The eight *areas* are real places and are
  imported, which is why `/destinations/<area>` can carry honest content long before there is
  anything to list there.
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

The naming rule is R4 in `CLAUDE.md`. No Beds24 payment gateway is involved either. Payment
runs through our own Stripe account with the Payment Element embedded in the panel, so the guest
never leaves the site and card details never reach this server — they go from the browser
straight to Stripe, which is what keeps the site in the lightest PCI bracket (SAQ-A).

### The ordering is the design

The ordering is R3 in `CLAUDE.md`, and it is the whole reason this section exists.

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

`npm run photos` regenerates on demand. Hand-editing a generated file is R5 in `CLAUDE.md`.

## The CRM admin

A private area at `/admin` where Paul and Nils work the CRM: renter leads and their
shortlists, the owner pipeline, the property pool and the client registry. Nothing in it is
public, indexed or in the sitemap.

It was the renter shortlist admin until 12/11/2026 and the document store still calls it that,
which is worth knowing when reading `as-salesmarketing/01-crm/README.md`.

| Screen | Is | Where it lives in `agentsiam-consulting` |
|---|---|---|
| Renter leads | The enquiry, its shortlist, each candidate's decision | `01-crm/guest-leads.csv`, `01-crm/shortlists/G-####.json` |
| Owner leads | The acquisition pipeline, with dated history | `01-crm/leads.csv` |
| Property pool | Properties AgentSiam does not manage, found while sourcing | `01-crm/property-pool.csv` |
| Clients | Signed owners, one markdown record each | `01-crm/clients/C-####-slug.md` |
| Blocked operators | Who AgentSiam will not source through | `01-crm/blocked-operators.json` |

**The data is files in the document store, not a database.** Paul's decision of 11/11/2026.
Every save from the admin is a commit to that repository, so git history is the audit trail,
Claude can still read a record, and a person can still edit one by hand.

**Which is why the writing rule is narrow: a cell nobody edited comes back out byte for
byte.** These files are worked by hand and by Claude as well, so the admin writes only the
cells it was asked to change, pads a short row before writing so a value cannot land in the
wrong column, refuses a column the header does not name, refuses an id that is not in the
file rather than quietly appending it, and writes nothing at all when the bytes would not
change. A client's frontmatter is edited line by line for the same reason: parsing it to an
object and serialising it back would reformat a file nobody asked to reformat. Two scripts
hold that to the real files, and both read only:

```bash
npm run check:csv
node scripts/check-frontmatter.mjs
```

**A candidate and a pool property are the same building.** Saving a candidate finds its pool
row by `property_id`, or by the name with punctuation and case ignored, and adds one only
when neither matches, so sending a second renter to the same house does not make a second
row. Only non-empty values cross, so a candidate with a blank area cannot wipe an area
somebody filled in from a later phone call, and the per-stay facts, the price for these
dates, whether it is free for them, the status on this shortlist, stay on the candidate where
they belong. `offered_to` is added to and never emptied. `scripts/link-shortlists-to-pool.mjs`
did this once to the candidates written before the link existed; it reports by default and
writes only with `--write`.

**What "ready to send" means, and it is a judgement rather than a fact.** A candidate counts
as ready when its availability reads `yes` rather than merely answered, because a property an
owner has said is not free cannot be sent, while a licence of `unknown` still counts as filled
in, because whether that is good enough to send is for whoever presses send. Both readings are
mine rather than the brief's, and both are on screen rather than buried in a gate.

**Five environment variables, all server-side**, documented in `.env.example`:
`ADMIN_COOKIE_SECRET`, `ADMIN_PASSPHRASE_PAUL`, `ADMIN_PASSPHRASE_NILS`, and then either
`CRM_GITHUB_TOKEN` for production or `CRM_LOCAL_PATH` for local development. Unset, the admin
fails closed: the sign-in page says it is not configured and nothing else answers. The token is
a fine-grained GitHub token with Contents read and write on `agentsiam-consulting` and nothing
else.

**What keeps it shut.** Three things, and only the first two actually stop anybody.
`src/proxy.ts` reads the session cookie and turns a signed-out visitor away before any page
renders. Every admin page and every `/api/admin` route then checks the session again for
itself, because an edge check that reads a cookie cannot be the only thing between a URL and
the document store. On top of that the pages are `noindex, nofollow, nocache` and `robots.ts`
disallows `/admin` and `/api/admin`, which keeps a well-behaved crawler away and nothing else:
that line also publishes the fact that the path exists.

**The blocked-operator check.** AgentSiam goes to owners directly and never sources through
another management company's channels. Saving a candidate matches its links and its contact
against the list, and a match refuses the save and names the operator and the outlet. An outlet
can be added from `/admin/blocked`; removing one is a decision about who AgentSiam deals with
and is made in the document store with a commit message saying why. One case no check can
catch is on the list and said out loud on screen: a blocked operator co-hosting on an owner's
own Airbnb account produces a listing that reads as the owner's.

**Ready to send** is computed, never typed: available `yes`, a total price, a licence status,
and at least one photo link. A status that asserts the candidate can go to a guest, `ready to
send`, `sent to guest` or `booked`, is refused while any of the four is missing.

**Running it locally.** Set `CRM_LOCAL_PATH` to the checkout of `agentsiam-consulting` on this
machine and the admin reads and writes the working tree directly, which is also how it is
tested. Those writes are not committed by the admin: `git status` in that repository shows
them, and a test write is undone with `git checkout --` on the file.

### Setting it up on Vercel

Done once, and none of it lives in this repository: a GitHub token, and four variables in the
Vercel project. Until both exist, `/admin` on any deployment answers a sign-in form that says it
is not configured.

**1. The token.** GitHub, Settings, Developer settings, Personal access tokens, Fine-grained
tokens, Generate new token. Resource owner is the account that owns `agentsiam-consulting`.
Repository access is Only select repositories, and that one repository alone. "Public
repositories" is not a milder version of that, it is the wrong answer: the document store is
private, so a token scoped that way is refused with a 404 on every path, which for a long time
looked from the admin exactly like an empty folder. Permissions is
Repository permissions, Contents, Read and write, and nothing else; GitHub adds Metadata read by
itself and that is expected. Set an expiry and put the date in "Known gaps", because the day it
lapses every read and every save in the admin starts failing. Copy the `github_pat_` value while
it is on screen, because GitHub does not show it again.

Scoped that narrowly, the worst a leaked token can do is commit to the document store, which has
git history. A token with access to every repository would be a different object entirely, so
this is the one setting not to be generous with.

**2. The three secrets.** `ADMIN_COOKIE_SECRET` is any 32 characters or more, and under 32 is
treated as unset rather than as weak:

```bash
openssl rand -base64 32
```

The two passphrases are one each for Paul and Nils, never shared between them, because which
passphrase signed in is what the admin writes against a candidate as `added_by` and `updated_by`.
Shared passphrases make that field a lie.

**3. The variables.** Vercel, the project, Settings, Environment Variables. Four of them:
`ADMIN_COOKIE_SECRET`, `ADMIN_PASSPHRASE_PAUL`, `ADMIN_PASSPHRASE_NILS` and `CRM_GITHUB_TOKEN`.
Tick Preview to test on a branch, and Production when it goes live; the two can hold different
passphrases and the same token. Mark them Sensitive so they cannot be read back out of the
dashboard. Leave `CRM_LOCAL_PATH` unset there: it is a path on a laptop, it means nothing on
Vercel, and the token takes precedence over it anyway.

Sensitive is a one-way door, and the cost is worth knowing before paying it: afterwards nothing
can read the value back, not the dashboard, not the API with `decrypt=true`, not
`vercel env pull`. A passphrase that does not work therefore cannot be diagnosed, only
overwritten. When that happens, write it again from the command line, where the bytes going in
are under your eye, and redeploy:

```bash
printf '%s' 'the-passphrase' | vercel env add ADMIN_PASSPHRASE_PAUL production --sensitive --force
```

`printf '%s'` rather than `echo` matters: a newline inside the stored value was once enough to
shut someone out. `whoSignedIn` now trims both the stored value and the typed one, so it is no
longer enough, but the habit costs nothing.

**4. Redeploy.** A deployment carries the variables it was built with, so adding one does not
reach a build that already exists. Deployments, the branch's newest build, Redeploy.

**5. Verify in the browser, in this order.** Each row proves a different half, and a failure in
one tells you nothing about the rows below it.

| Step | Proves | If it fails |
|---|---|---|
| `/admin` shows a sign-in form that does not say it is not configured | The variables reached this deployment | They are on the wrong environment, or nothing has been redeployed since they were set |
| The passphrase signs in, and a wrong one does not | The cookie is being signed and read | `ADMIN_COOKIE_SECRET` is under 32 characters, which counts as unset, or the stored passphrase is not the string you believe it is: it cannot be read back, so overwrite it |
| `G-0003` lists three candidates | The GitHub read path works | The screen says which it is: a token that cannot see the repository is now reported as that, rather than as a file that is not there |
| A saved change to a candidate is accepted | The GitHub write path works, which nothing else proves | Read the message on screen: it names the file and the repository |
| A `poolvillachiangmai.directstays.com` link is refused and names the operator | `blocked-operators.json` is read on every save | That file is not on `main` |

A save that worked puts a commit in `agentsiam-consulting` within a second or two, authored
`agentsiam <hi@agentsiam.com>`, with a message like `Shortlist G-0003: add Villa 89 (Nils via the
admin)`. That commit is the proof. The screen saying it saved is not.

Wrong passphrases are rate limited to ten tries in ten minutes per address, so a tester who
fat-fingers it repeatedly waits rather than concluding it is broken.

**The signed-out check cannot be done with `curl` against a preview.** Every preview sits behind
the Vercel login, so a redirect out of one is Vercel's wall rather than the admin's and the two
are indistinguishable from outside. Do it in a browser that is signed in to Vercel and signed out
of the admin: every admin page must bounce to the sign-in form, and every `/api/admin` route must
answer 401.

**A shareable preview link opens the admin's front door.** The link described in "Showing a
preview to someone outside the team" opens the whole branch to anyone holding it, `/admin`
included, which leaves the passphrase as the only wall. Do not issue one for a branch that
carries the admin.

**Rotating and revoking.** Changing `ADMIN_COOKIE_SECRET` and redeploying signs both people out,
which is how a session is revoked. Deleting the token on GitHub stops reads and saves together:
sign-in still works and every page then shows a store error, which is the quickest way to shut
the admin without touching a deployment.

## Known gaps

- ~~**The CRM admin has never saved to GitHub (11/11/2026).**~~ Resolved 13/11/2026 by the
  first real save. Paul added a candidate to `G-0003` from the live domain and it landed as
  two commits in `agentsiam-consulting` at 08:56, authored `agentsiam <hi@agentsiam.com>`:
  `9770951` for the pool row the candidate needed, then `ab73168` for the shortlist itself.
  That is the token's Contents write, the contents API write with its `sha` check, and the
  candidate-to-pool link, all proven in production rather than against a local checkout. One
  thing in that path is still untried: the three-attempt conflict retry only fires when a file
  changes between the read and the write, and nothing has contrived that. A save that changes
  nothing is refused from 13/11/2026 with "Nothing was changed, so nothing was saved". Until
  then it answered 200 having written nothing, because the form posts only the fields it
  changed and `updateCsv` declines a write that would produce the same bytes, so it left
  exactly the absence a token without Contents write leaves and the screen called it a save.
- ~~**Nils cannot open a preview deployment (12/11/2026).**~~ Resolved 12/11/2026 by going to
  production rather than by giving him an account. Deployment Protection on the Vercel project
  is SSO on every deployment except custom domains, with no password protection and no bypass,
  and the team has two members: `agentsiam` and the PunProfile bot `punprofilecareer-droid`.
  Nils holds neither, so no preview URL can reach him. The live domain is the one surface that
  does not ask, which is why the admin went to `main` without a preview review.
- ~~**Both production passphrases were wrong on the first attempt (12/11/2026).**~~
  Resolved 12/11/2026 by overwriting both from the command line and by trimming whitespace
  at both ends of the comparison in `src/lib/admin/session.ts`, so a value carrying a
  newline, or a phone keyboard's trailing space, can no longer shut anyone out. Sign-in on
  the live domain works, which is the proof this entry was waiting for. Why the first pair
  failed cannot be established and never will be: both variables are Sensitive, so nothing
  can read back what they held. The two were created at 15:23 and the live deployment at
  16:01, so it was built with them, and the live `/api/admin/session` answered 401 rather
  than 503, which means it read non-empty values that simply did not match the strings
  handed over. A trailing newline and a stale pair from an earlier round both fit everything
  observed. The lesson is the one now in the setup section: Sensitive buys secrecy at the
  price of ever diagnosing it.
- **The GitHub token's expiry is not written down (12/11/2026).** Whatever expiry it carries
  is the day the admin stops working, and it stops all at once: every read and every save
  begins failing. The failure is at least legible, because `readStored` passes GitHub's own
  status and message through, and an expired token answers 401 with "Bad credentials"
  rather than the 404 a scope problem gives. What is missing is the warning: nothing watches
  the date, so the first notice is someone opening the admin and finding it dead. The date
  is not known to this repository, which is the gap. If the token was created on 12/11/2026
  and kept GitHub's 30-day default it lapses on 12/12/2026, which is an inference from that
  default rather than a reading of the token page. Rotating it is the command under
  "Setting it up on Vercel" above, plus a redeploy, because a Vercel variable binds when a
  deployment is created.
- **The lead list reads every shortlist file on every page load.** Five leads is five extra
  reads, which is nothing locally and five GitHub requests in production. It is fine at this
  size and is the first thing to change if the CRM grows to dozens of open renter leads.
- **`guest-leads.csv` has no `notes` and no `history` column**, although the CRM README says
  every lead row carries both and the owner file `leads.csv` does. That is why G-0003's
  shortlist was living in its `requirements` cell. The admin does not fix it: it reads the
  columns that exist.
- **The owner copy pass, and its unreviewed Thai and Chinese (10/11/2026).** The pass that took
  the stated management fee off the site and removed the claims a one-house portfolio cannot
  support was written on 06/11/2026 in all three languages, and both of its commits say the Thai
  and Chinese need a native read. They have not had one, so the English is the reviewed half and
  the other two are not. What it changed: the hero leads on the core claim, the fee answer names
  no percentage, per decisions 55 and 79 in the consulting repo's decisions log, and "most owners
  take two or three", "most owners have never been told" and "the service most owners come for"
  are gone. The first of those also survived in `mgmt2ServicesIntro`, which is the copy a reader
  actually sees on `/management/phuket` and `/management/bangkok`, and was removed separately.
  One claim of the same class is still standing on purpose: `hwExtra5Body` says most owners'
  photographs were taken to remember a room rather than to let it. That is a claim about amateur
  photography rather than about AgentSiam's owners, so it wants a decision rather than a deletion.

- **The two editorial outlets, and what is unreviewed in them (09/11/2026).**
  `/journal` (Journal of Chiang Mai, guests) and `/host-newsletter` (Chiang Mai Host Newsletter,
  owners) publish editorial prose from `src/lib/editorial.ts` rather than the dictionaries; that
  file carries the full reasoning and the chrome/editorial split. Both are published in all three
  languages. The ordering in `publishedIn` differs and is not cosmetic: the guest journal leads
  with English because it was written in English, the owner outlet leads with Thai because it was
  written in Thai and because Paul set the owner audience on 09/11/2026 as Thai, then English, then
  Chinese, largest to smallest. The sitemap, the hreflang set and the canonical all read it.
  Three things are open. A review came back on 09/11/2026 and was applied as one scripted patch:
  it found four of the five published occupancy figures in the owner article stale, and every
  figure in that table was then re-read off the provider's own page before it shipped. **Whether
  that review was a native read is not established, so the Thai and Chinese have no confirmed
  native sign-off.** The review file is
  `as-work/2026-11-09-editorial-copy-review/copy-review.md` in agentsiam-consulting, 135 strings
  regenerated from the live module after the patch, with a `PB:` line under each, and its README
  records which of the reviewer's changes were not taken. The owner article is the
  one to read hardest: it was written in Thai as primary copy, so there is no English original
  behind it to check it against. Nothing routes a reader from the body of a relevant page into
  either outlet yet: the only links in are the two footer entries and the cross-link between the
  two indexes, so `/short-term-rental-licence-chiang-mai` and `/house-for-rent-chiang-mai` do not
  point at the owner outlet, and the neighbourhood pages do not point at the journal. And **the
  owner outlet is called a newsletter while no list, no signup and no sending path exists**; the
  index says so in its standfirst rather than implying one, but the name still promises a cadence
  that nothing delivers. Either an email capture is built or the name is reconsidered.

- **Channel strip shows symbols, not wordmarks (owner-page-s3-1106, 06/11/2026).**
  `src/components/channel-marquee.tsx` uses Simple Icons symbols beside each name, and Agoda and
  Vrbo have no symbol at all. Paul decided the official wordmarks replace them, sourced from each
  platform's own brand or press page with its usage terms checked (decision 84 in the consulting
  repo). Not yet sourced.
- **Left behind by the renter homepage (homepage-renter branch, 03/11/2026).**
  `src/components/hero-search.tsx` is no longer rendered anywhere. The fork, owner-band and
  service-card keys the homepage used (`guestPanelTitle`, `guestPanelBody`, `ownerPanelTitle`,
  `forGuests`, `ownerBandSub`, `ownerBandFoot`, `closingOwner`) are orphaned in all three
  dictionaries; `guestPanelBody` still carries the "local number that answers" promise, so it
  must not be reused while no number is published. The homepage review is shown as stored in
  `src/lib/property.ts`, which is itself cut off with an ellipsis: the full text is not on file.
- **Homepage Chinese strings unreviewed.** The renter homepage keys (`heroEyebrow`, `heroTitleA`,
  `heroTitleB`, `heroSub`, the eight `homeChoice*` keys, `metaHomeTitle`, `metaHomeDesc`) and
  `metaHowTitle` in `zh.ts` have had no native read. Thai approved by Paul 03/11/2026.

- **WhatsApp guest messages are a second store beside Beds24.** `/api/whatsapp/webhook`
  receives Meta's WhatsApp Cloud API webhook and keeps messages in Upstash Redis
  (`src/lib/whatsapp-store.ts`); `/api/whatsapp/messages` is the bridge's read and record
  endpoint, behind `WA_BRIDGE_SECRET`. The bridge itself is outside this repo, at
  `/Users/paulb/code/whatsapp-bridge`. Open: the privacy policy does not yet say guest
  WhatsApp messages are stored with Upstash, and nothing expires old conversations beyond the
  500-message cap per guest.
- ~~No photography yet.~~ Resolved. Real Lotus House photography landed 15/08/2026. As of
  24/08/2026 the published set is 46 Lotus House frames across seven rooms, plus five team
  portraits. Three carport shots are held back in `_excluded/` for showing the house number.
  The old generic stock library stays removed, per the design system's "no stock, no fake
  mockups" rule.
- ~~**No `src/photos/team/team-on-site.jpg`.**~~ Resolved. The homepage fork panel asks for
  `team-group-portrait` instead, and `src/photos/team/agentsiam-team-group-portrait.jpg` exists,
  so the panels render photographs rather than flat brand fills.
- ~~No icon set.~~ Resolved 06/09/2026. `src/components/icon.tsx` is the set: the four route
  glyphs moved there out of `how-it-works/page.tsx` when the property page wanted amenity
  icons, and it now carries 26. The spec is in that file's header and is the one Paul
  authorised on 25/08/2026: stroke only, `currentColor`, 24x24, always in a chip, chip
  `aria-hidden`, literal rather than metaphorical. `design-guardrails.md` in the consulting
  repo still says the design system carries no icons and is stale on this point.
- **No phone number or LINE ID published.** The footer carries name, address and email
  only; all three have to match the Google Business Profile character for character.
- ~~The company address in the footer is the Bangkok registered office.~~ Resolved
  06/09/2026 on Paul's instruction: the registered office is and always was Chiang Mai, and
  the Bangkok block was simply wrong. `POSTAL_ADDRESS` now reads 42 Soi 1, Wiang Ping Road,
  Chang Khlan, Chiang Mai 50100, which is the DBD record mirrored in the consulting repo's
  `as-context/00-company/company-identity.md`. The footer's "where we work" line went with
  it, because the mismatch it existed to explain no longer exists, and `footWhereWeWork` was
  deleted from all three dictionaries. `organizationSchema()` became
  `["LocalBusiness", "Organization"]` in the same change: the type local search actually
  reads, honest only now that the address points at the right city.
  **Two things follow and neither is done.** The Google Business Profile still carries the
  old address and has to be corrected to match this one character for character, or the two
  records compete. And the registered office is the Lotus House building, so the property's
  street address is now published on every page rather than released at booking
  confirmation. That is a deliberate trade, written up in `src/lib/site.ts`.
- **The `LocalBusiness` node has no `telephone`, `geo`, `openingHours` or `sameAs`.** Each is
  a one-line addition on the day it has a verified value. `geo` and `openingHours` are the two
  a LocalBusiness rich result most wants. ~~`logo` is also absent.~~ Set 12/09/2026:
  `public/agentsiam-logo.jpg`, wired into `organizationSchema()`, copied from the consulting
  repo's brand assets, which stay the source.
- ~~**No cancellation policy exists anywhere on the site.**~~ Resolved 02/11/2026: windows
  30 / 7 / 50% and a THB 1,000 rebooking fee, with a line that terms stated in a booking
  confirmation take precedence. Wording in the `cx*` dictionary keys, version in
  `src/lib/cancellation-policy.ts`. Shown in full with a checkbox before the nights are held,
  required by `/api/booking/checkout`, stored on the Stripe PaymentIntent metadata and the
  Beds24 booking notes, sent in the guest confirmation email from the Stripe webhook, and on
  `/terms-and-conditions` in English. Still open from the draft's section 4: deposit versus
  full prepayment, Direct Sale Act s.33, and Booking.com rate parity.
- **The paid-booking half of the cancellation flow is untested end to end.** Checked live
  02/11/2026: terms box and checkbox gate on the pay path. Not yet seen: the "You accepted"
  panel on the payment step and the guest confirmation email from the Stripe webhook. Paul
  chose to verify on the first real paid booking rather than a preview test: the host email
  for that booking should show a "Cancellation terms" row with a version, and the guest
  should receive the confirmation. If the guest email is missing, check the Vercel logs for
  `guest not emailed`.
- **The live chat is built and switched off.** `src/components/crisp-chat.tsx` renders
  nothing until `NEXT_PUBLIC_CRISP_WEBSITE_ID` is set, which needs a Crisp account that does
  not exist yet. Two things have to be true before it is set: Total Privacy Mode enabled in
  the Crisp dashboard, or the site needs the cookie banner it has never needed, and the
  desktop app installed on the laptop that answers. Setting the variable also turns on
  `privacyChatCookie` in the privacy policy and shifts the WhatsApp launcher up to
  `bottom-24` so the two floating buttons do not collide. `.env.example` carries the full
  warning.
- **Google Analytics 4 has two parts still unreviewed.** It runs only while
  `NEXT_PUBLIC_GA_MEASUREMENT_ID` is set in Vercel: `src/components/analytics-consent.tsx`
  loads it on page view outside the EEA, UK and Switzerland and asks first inside them, and
  the privacy policy's GA paragraphs and on/off switch render only while the variable is set.
  The property is agentsiam.com, on Thailand time and Thai baht; its data retention (2 months
  event, 14 months user) is what the privacy policy states, so a change there is a change to
  the policy. **Exercised 20/09/2026**, write-up in the consulting repo at
  `as-work/2026-09-20-website-pre-merge-checks/findings.md`.

  ~~Whether a visitor outside Europe loads gtag correctly cannot be exercised locally
  because the country header only exists on Vercel.~~ It can. `x-vercel-ip-country` is a
  request header, so `/api/consent-region` was driven locally with it set: no header, `TH`,
  `US`, `DE`, `GB`, `CH`, `RE`, `AX` and a lowercase `th` all answered correctly, and a
  missing header answers "ask". Pressing Accept in the browser then loaded gtag at the right
  id with `ad_storage`, `ad_user_data` and `ad_personalization` denied in the Consent Mode
  default, which is the same code path a non-European visitor takes. ~~What is still untested
  off Vercel is only whether Vercel sets the header at all; if it stops, the site over-asks
  rather than over-tracks. Worth one look in the Network tab on the first production deploy
  anyway.~~ Checked on the live site 26/10/2026 and all of it holds: a Thai visitor gets
  `{"required":false}` and no banner, gtag loads at the live id, and a real `page_view`
  reaches Google with `gcs=G101`, meaning ads storage denied. Vercel also overwrites the
  header rather than trusting it, so a visitor cannot pick their own country: requests sent
  with `x-vercel-ip-country: DE` and `GB` from Thailand both still answered `false`. The
  route comes back `private, no-store` and uncached, so one visitor's answer is never served
  to another.

  The Thai and Chinese banner strings (`consentLabel`, `consentBody`, `consentAccept`,
  `consentDecline`) were read for accuracy and rendered at 375px in both languages: accurate,
  correct register against the strings around them, no truncation and no missing glyphs. That
  was a non-native read and it missed one thing: ~~the Chinese puts spaces around "Google
  Analytics" and "cookie", against the spacing convention the first copy review settled.~~
  Fixed 03/10/2026: both strings now close the spaces. The four values are still in the round
  two review brief in the consulting repo,
  `as-work/2026-09-21-website-copy-review-delta/`, with 508 other values nobody native has read.

  ~~**One defect, reproduced, not fixed.** `analytics-consent.tsx` clears `_ga` cookies inside
  an effect that returns early when `window.gtag` is not a function, so a visitor carrying
  `_ga` cookies from an earlier session with no stored choice could press Decline and keep the
  cookies.~~ Fixed 03/10/2026: `clearAnalyticsCookies()` now runs on `denied` before the gtag
  check, and only the Consent Mode update sits behind it.

  **Five outcome events are sent, all five are key events, and not one has ever fired.**
  `src/lib/analytics.ts` is the only thing that speaks to gtag: `contact_form_sent` from the
  contact form, `stay_request_sent` from the monthly stay request on
  `/house-for-rent-chiang-mai`, and `booking_requested`, `booking_paid` and
  `booking_unconfirmed` from the booking panel's three terminal states. Each carries an
  event name and no parameters, so nothing a visitor typed, and no amount, reaches Google;
  that is what keeps the privacy policy's description of what Google receives true, and
  adding a parameter is a change to the policy. All five are starred as key events in the
  GA4 property under Admin, Data display, Events, checked there 03/11/2026.

  **The zero is real, not a wiring fault**, and it is the finding rather than the gap. Over
  06/10 to 03/11/2026 the property recorded 95 active users and 276 views and zero key
  events. Collection is working: `page_view`, `session_start`, `first_visit`, `scroll`,
  `click`, `user_engagement` and `form_start` all arrive from the agentsiam.com stream, and
  the deployed JavaScript on `/contact` contains `contact_form_sent`, checked by fetching
  the live chunk. `form_start` arriving without any completion is the shape of the problem:
  people reach a form and leave it. In the same window `/contact` took 6 views from 5
  people against 61 on `/lotushouse`, so most of the loss is before the form, not inside it.

  The contact path was exercised end to end with the POST stubbed in the browser, so no
  enquiry was sent: the event reached Google on Accept, and on Decline the form still
  submitted while no gtag, no `dataLayer`, no cookie and no request existed at all. The
  booking panel's three were not exercised, because reaching them means holding real nights
  in Beds24 or taking a real payment.
- ~~**No Search Console or Bing Webmaster property is verified.**~~ Google resolved
  31/10/2026. `https://agentsiam.com` is verified as a **URL prefix** property by the HTML
  tag method, and `sitemap.xml` is submitted. `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` is set
  in Vercel production, as a Config value rather than a Secret, since the token renders into
  the page. **Deleting that variable drops the tag on the next deploy and silently
  unverifies the property.** A Domain property for `agentsiam.com` also exists and is
  deliberately left unverified: it needs a DNS `TXT` record in a zone that still sits at Wix,
  and it is the better property to finish the day the zone moves, because it covers the apex,
  `www` and every subdomain at once.
  **Two things remain.** Verification by Google Analytics was tried first and cannot work
  here: `analytics-consent.tsx` decides client-side after the region check, so the HTML
  Google fetches carries no gtag and the attempt failed with "we could not find any Google
  Analytics tracking codes on the index page". That is the privacy design working, not a
  defect, but it rules the method out permanently. And **Bing is still unverified**;
  `NEXT_PUBLIC_BING_SITE_VERIFICATION` is wired and unset, and Bing can import the verified
  Google property rather than being verified separately.
- **No aggregate rating and no review count.** One quoted Airbnb review, no verified figure
  behind it. The homepage and the property page both render a single review as a quote
  rather than as a rail of one, and neither states a count. The figure has to come off the
  platform before anything on the page or in the markup can carry it.
- **The 404 boundary is client-rendered in production.** Verified 06/09/2026 against
  `next build` plus `next start`: `/nope` returns a correct 404 status and, with JavaScript,
  the full localised page inside the normal layout. With JavaScript off the body is empty.
  Every real page server-renders correctly, so this is confined to unmatched URLs. Next
  renders a `notFound()` boundary this way; forcing the catch-all dynamic was tried and
  changed nothing. Fixing it properly means the proxy matching the route table and rewriting
  to a real page with a 404 status, which is more machinery than the problem is worth today.
- **Guide place names and host notes are English on every locale.** They come
  from `src/lib/guide.generated.ts`, built from an English sheet and never hand-edited. Since
  06/09/2026 the guide carries its own note saying so, and the copies on `/destinations/*`
  are wrapped in `lang="en"` so a Thai voice engine does not read English aloud in Thai. The
  real fix is in the sheet. **Categories left this gap on 10/11/2026**, Paul's call: they are
  a closed set of fifteen values rather than sheet prose, so they moved into
  `src/lib/guide-vocabulary.json` with Thai and Chinese labels, came out of the note, and lost
  their `lang="en"`. Tags, added the same day, carried all three languages from the start. The
  English name stays the key in both cases, so a `?for=` or `?tag=` link means the same thing
  in any locale. The fifteen category labels and the forty-one tag labels in Thai and Chinese
  were written by a session and have had no native read, like the other unreviewed strings
  recorded in this section.
- **The vacation rental rich result is forfeited, not broken.** Google requires `geo` on a
  `VacationRental`, and exact coordinates are booking-confirmation material under the same
  rule the property page and the results map already follow. Checked against the Rich Results
  Test on 01/09/2026: the missing `geo` is the only critical issue left on the item, every
  other field validates, and `/lotushouse` still earns a valid Local business result
  alongside it. `approxLocation()` already publishes an offset point for public maps and
  would satisfy the field, but it would hand a booking product a location that is
  deliberately wrong. Open, and a decision rather than a bug.
- **`/lotushouse/local-guide` now plots the house at its real coordinate, not the
  neighbourhood centroid.** Paul's decision, 11/09/2026, reversing the page's earlier
  position. Before this the map pin used the area centroid from `src/lib/areas.ts`, about
  1.4km from the real house for Chang Khlan specifically, labelled with the area name rather
  than "Lotus House". That read as a broken pin on a page meant to orient a guest, not as a
  deliberately fuzzed one. The street address in `property.ts` (`address`) stays
  booking-confirmation-only; only the lat/lng pair is now published, which changes nothing
  the `VacationRental` `geo` gap above does not already weigh, since that item is about a
  different node (`propertySchema()` on `/lotushouse`) and is still open on its own terms.
- ~~The share cards for `/lotushouse/local-guide` and `/destinations/*` used to fall back to
  the site-wide owner pitch.~~ Resolved. The guide, 11/09/2026; `/destinations` and
  `/destinations/[area]`, 12/09/2026. Each has its own `opengraph-image.tsx`, wired through
  `pageMeta`'s `image` argument the same way `/lotushouse` already was. The area cards have
  no photo to lead with, unlike the property and guide cards, so they use the same flat
  brand panel the property page itself falls back to when its own photo set is empty:
  neighbourhood name, `vibe` line, and the guide place count for that area.
- ~~The guide was missing places that existed in two separate, unmerged spreadsheets.~~
  Resolved. Massage and wellness, 12/09/2026: ten places (Calm Massage's four branches,
  Sense Garden, Sense Massage Nimman, Sense Onsen Suandok, Lila Thai Massage, Daydream Sleep
  Salon, Everyday Nails). Restaurants and cafes, 12/09/2026: twenty-eight places. 148 places
  total, up from 110. Not by editing the sheet: `scripts/guide-extra.csv` is a local,
  git-tracked file in the sheet's own column shape that `build-guide.mjs` merges in before
  the coordinate-resolution and routing pipeline runs, per CLAUDE.md R11. Three restaurant
  rows were dropped, not added: "Dash" and "B Sam Cook" were already in the guide under
  their full names (`Dash Teak House`, `B Samcook Home16`, confirmed by matching
  coordinates), and "San Mai" carried the same Google Maps link as "B Sam Cook", the same
  copy-paste shape as the Sense Massage and Lila Thai mixup earlier, so its real location is
  unknown and it was left out rather than guessed. Two candidates, Ferment Space and
  Friend's Table, resolved correctly but route more than 12km from the house and are
  excluded by the guide's own cutoff, not an error.
- ~~The guide library researched in August was never merged.~~ Resolved, 10/11/2026, and
  re-implemented on `main` in three pieces rather than cherry-picked: the branch predates the
  08/11 routing rewrite and conflicts in seven files, and one of its commits would have undone
  routing from the public start point. The build guards landed first, then the tag vocabulary,
  then the data: thirteen places (six bars, two Sanmai Ramen branches, two viewpoints, a sauna,
  a zipline booking office and an archery range) and twenty-two websites. 162 places in the
  data, up from 149; 149 on the page, up from 138. Two of the thirteen, Chiang Mai Sauna Ice
  Bath Eudemonia at 13.6km and Huay Tueng Thao Reservoir at 15.6km, route past the 12km cutoff
  and sit in the data without appearing, the same as Ferment Space and Friend's Table. "San
  Mai", left out on 12/09/2026 because it shared a Maps link with "B Sam Cook" and its location
  was unknown, is back as `Sanmai Ramen Nimman` and `Sanmai Ramen Suriwong`, each with its own
  link. The branch's price bands were not imported: no other note in the guide carries a dollar
  sign and nothing on the page explains the scale, so the descriptive half of each note was
  kept and the band dropped, which leaves five of the thirteen with an empty note. Forty of the
  other 149 already have one. The sheet stopped being a build input the same day, which closed
  the branch out: `scripts/guide-places.csv` is the library, `npm run guide:import` proposes
  rows from the sheet and writes nothing without `--apply`, and `GUIDE-RUNBOOK.md` is the
  procedure. Nothing in the repository fetches a spreadsheet any more.
- **`/lotushouse/local-guide` drops any place more than 12km away, and paginates the rest.**
  Both Paul's decisions, 11/09/2026. Before this the guide showed every place in
  `GUIDE_PLACES` regardless of distance, sorted into the "Further out" filter rather than
  excluded, and rendered the entire filtered list in one `<ul>`, which read as an endless
  scroll on the default "Everything" view. `MAX_DISTANCE_M` in
  `local-guide/page.tsx` now drops anything past 12km using `GUIDE_DISTANCES`' routed
  `metres`, and the list renders `PAGE_SIZE` (24) cards at a time behind a "Show more" link
  that carries the count in the URL (`?n=`), the same URL-state pattern as every other
  filter on the page.
- **The `FAQPage` block on `/how-it-works` produces no rich result.** The markup is correct:
  zero errors and zero warnings at validator.schema.org on 01/09/2026, and all eight questions
  and answers appear verbatim in the rendered page, so markup and visible text agree. Google no
  longer returns FAQ rich results for a site like this one, so the block earns nothing in Search
  and is there for the other engines and the language models. Nothing to fix, and no FAQ
  snippets to expect. Since 06/09/2026 `/lotushouse` carries a second, separate `FAQPage` for
  the seven guest questions, which is subject to the same limit.

- ~~The Chinese webfont loaded on every page in every language.~~ Resolved 06/09/2026. The
  language switcher's 中文 label pulled 1.14MB of Noto Sans SC onto every route, because no
  Latin or Thai face carries those glyphs and all four font stacks ended in the SC variable.
  The variable is applied on `zh` only, the stacks read it as `var(--font-noto-sc,
  sans-serif)` so they stay valid without it, and the weight list dropped from four to two.
  A Chinese page went from 4.6MB of webfont to 2.3MB. `preload: false` on that face is
  load-bearing and must stay.
- ~~All three dictionaries shipped in the shared client chunk.~~ Resolved 06/09/2026. The
  404 boundary was a client component, which made `getDictionary` a client import. The
  layout passes it six strings through a context instead. Two other approaches were tried
  and are recorded in `src/components/not-found-strings.tsx`.
- ~~The whole dictionary was serialised as a client prop.~~ Resolved 06/09/2026 on the home
  page and the local guide, which were shipping 778 keys so that a search bar could read
  twelve and a map could read one. `PropertyFilters` (23 keys), `ContactForm` (31),
  `Qualifier` (52) and `BookingPanel` (89) still take the whole dictionary; each is a
  genuinely wide consumer and the same narrowing would be worth doing if `/properties` or
  `/contact` ever matters as much as the home page.
- **Photo `alt` text is English on every locale.** It comes from
  `src/lib/photos.generated.ts`, which reads the image files' own metadata, so it cannot be
  fixed in the dictionaries. Every `<img>` carrying it declares `lang="en"`, which stops a
  Thai or Chinese voice engine reading an English sentence in the wrong language, but the
  text itself is still English. The real fix is captions in the file metadata, or a
  translated layer over the manifest.
  ~~The gallery's own "Open photo" buttons in `photo-gallery.tsx` were the one path this
  missed.~~ Resolved 12/09/2026: `aria-label` is a flat string, so `labels.openPhoto.replace(
  "{alt}", ...)` spliced the English caption into a Thai or Chinese phrase with no way to
  mark the join, the exact case the `lang="en"` fix elsewhere could not reach. Two `sr-only`
  spans and `aria-labelledby` now, one per language, same pattern as the visible figcaption
  a few lines below it already used.
- ~~`whyC` on the homepage promised "Phone or LINE, 24/7"~~ and the site published neither a
  number nor a LINE ID. Resolved 12/09/2026: reworded to name email, the one channel
  verified live on the running site.
- **`NEXT_PUBLIC_WHATSAPP_NUMBER` is unset in production**, found while fixing the item
  above. `src/components/whatsapp-cta.tsx` is fully built and is the guide's primary
  "talk to us" prompt, but checked directly against agentsiam.com on 12/09/2026: no `wa.me`
  link anywhere on the page. Every WhatsApp call to action on the live site is currently
  invisible by design, per the component's own comment ("Unset hides every WhatsApp call to
  action"), not broken. Setting the env var is the fix, once a real number exists to put in
  it.
- ~~`robots.txt` disallowed `/opengraph-image`, the `og:image` URL of nearly every page.~~
  Resolved 04/11/2026: nothing is disallowed now. Facebook's and X's crawlers are reported to
  honour robots rules, so a Disallow on the card could blank the preview of any link pasted
  into a group. **That impact is inferred from third-party reports, not confirmed**: Meta's
  own documentation says its crawler may bypass robots.txt. Run the Facebook Sharing Debugger
  on `https://www.agentsiam.com/` once to settle whether previews were ever broken.

- ~~The homepage, `/properties` and `/house-for-rent-chiang-mai` shared the owner-pitch card.~~
  Resolved 04/11/2026. The homepage turned renter-first on 03/11/2026 and kept the site-wide
  card ("Know if it's worth it before you commit to it. Feasibility study, vacation rental
  permission, and management."), so pasting it into a guest group showed an offer to someone
  who came to rent. `/properties/opengraph-image.tsx` is the renter card, and the homepage
  names it explicitly: a file-based card cannot sit at the locale root beside the site-wide
  one. `/house-for-rent-chiang-mai` has its own. Both use the Lotus House living room the
  homepage hero uses, not the terrace tub shot, and read their words from the English
  dictionary (`heroEyebrow`, `heroTitleA`, `heroTitleB`, `hfrEyebrow`, `hfrH1`), so they
  cannot drift from the pages. The owner pages (`/how-it-works`, `/business-services`, the
  licence page) keep the owner card on purpose. `src/lib/og-photo-card.tsx` is the shared
  renderer. The five older cards still carry their own copy of the wordmark and could adopt it.

## Getting started

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). `/th` and `/zh` for the other two.

Environment variables are listed in `.env.example`.

## Showing a preview to someone outside the team

Every branch push builds a preview on Vercel, and every preview is locked: opening one without
a Vercel login for the `agent-siam` team returns a redirect to Vercel's sign-in. Previews also
carry a `noindex` header, so they stay out of Google.

To let a partner, a designer or anyone else outside the team see one, issue a shareable link.
In the Vercel dashboard open that branch's deployment, click Share, and set the dropdown to
"Anyone with the link". The link that comes back carries `?_vercel_share=<token>` on the branch
address, `https://agentsiam-website-git-<branch>-agent-siam.vercel.app`. It opens with no
account, no password and no Vercel login, and the visitor can browse the rest of the branch
from there. Every link issued is listed at Team Settings, Deployment Protection, External
Access, with a Revoke button beside it.

Verify before sending it. The dashboard saying a link is shared is not evidence:

```bash
curl -s -o /dev/null -w "%{http_code}\n" "<the shared link>"
```

200 means it is open. Fetch the same path without the token and confirm it still returns 302,
so the wall is intact for anyone who does not hold the link.

Three things not to do instead. Do not turn off Require Log In: that opens every preview and
every generated production URL at once, for good. Do not turn on Password Protection: it costs
20 US dollars per project each month, and scoped to All Deployments it puts a password in front
of `www.agentsiam.com`, which 401s the Stripe and Beds24 webhooks. Do not fall back to an
access request: the partner has to create a Vercel account before they see anything.

Two cautions. A shared preview is readable by anyone the link reaches, so do not issue one for
a branch carrying something that should not be forwarded. And the booking panel on a preview is
live, because the Stripe keys are shared between Production and Preview while
`BEDS24_ALLOW_WRITES` is unset, so a payment made on a preview takes money without producing a
booking. Tell the visitor to look and not to book.

Whether a link survives a fresh push to the same branch is unverified. Vercel's documentation
describes a shareable link as belonging to one deployment, while the dashboard issues it against
the branch address, which always points at the newest build. Check after a push and issue a new
link if the old one has gone stale.

## What went live unverified

The positioning question this section used to hold open is settled by what is published: this
site replaced the older business-consulting one, and those four services sit at
`/business-services`.

Two things were written here on 24/08/2026 as hard blockers to clear before any deploy. The
deploy happened and neither was ever recorded as closed. The first is now tested and works. The
second is now half answered: the request path is verified, the paid path is not, and the wiring
is not what this section long said it was. Read item 2 before trusting that path, and record the
paid run here when it happens.

1. **Contact form delivery, end to end: VERIFIED 09/11/2026.** A marked test enquiry was
   submitted through the live form at `/contact` and arrived in the `hi@agentsiam.com` Zoho
   inbox, subject "Website enquiry: TEST - delivery check, please ignore (ICP5, House)", with
   every field intact: name, ICP, email, listed-now, bedrooms, property type, neighbourhood and
   locale. `POST /api/contact` returned 200 and the page showed its success state. The transport
   is Zoho SMTP, not Resend, and it sends from `paul@agentsiam.com` to `hi@agentsiam.com`, so
   `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD` and `CONTACT_TO_EMAIL` are all set in
   Vercel. `.env.example` documents all seventeen variables. A mail from the monthly stay
   request form is in the same inbox, so that path sends too, though it was not tested here.
   The test enquiry is still in the inbox and wants deleting by hand.
2. **A real Beds24 test booking, end to end. The request half is VERIFIED 10/11/2026; the paid
   half is not.** Part A of the runbook was run on production, where the request path needs no
   Stripe: booking 95951578 for 12 to 14 October 2027, two adults and one child, quoted THB 5,800.
   Every step passed. The Beds24 booking carried status `request`, `numAdult 2` / `numChild 1`,
   the `Website request` flag and the right notes; the notification mail reached
   `hi@agentsiam.com` with "2 adults, 1 children" rather than 3 adults; no guest mail was sent,
   which is correct because `notifyGuest` is off on that path; the two nights came off the public
   calendar and came back after the cancel. Full write-up in
   `as-work/2026-08-18-website-launch-blockers/findings.md`.

   Two things that run established about the history. **Both website paths had already run** and
   nothing recorded it. Seven website bookings exist on the account, all cancelled, and three
   carry a `custom1` beginning `stripe:`: one created 14/08/2026 and two on 24/08/2026. Since
   `attachPaymentIntent` writes that marker in the same request flow as the hold, this site was
   creating live Stripe PaymentIntents on both dates. **Second, the Stripe webhook handler almost
   certainly ran at some point**, because `cancelBooking` writes its reason into `flagText` and
   `Payment failed` exists in only one place in this codebase,
   `src/app/api/stripe/webhook/route.ts`. The date cannot be fixed: the whole 24/08 cluster was
   modified again on 28/09/2026 and `modifiedTime` holds only the last touch, and a flag can be
   hand-typed, as `TEST - cancelled` on one booking shows. None of it proves the webhook works
   today, no payment has ever succeeded, and no booking carries the sweep's own `Unpaid, released
   after 30 minutes` flag, so the hold sweep has never released anything.

   **The wiring, checked 09/11/2026. The publishable key in production is a live-mode key.** It is
   served in two of the twenty six JavaScript chunks the live `/lotushouse` page loads, alongside
   `loadStripe` and `PaymentElement`, so `PAYMENTS_ENABLED` is true and the page renders its "Book
   now, pay online" button. Searching the page source, and only some of those chunks, is how an
   earlier pass concluded the opposite, which is why the method is written down here.
   `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` and the Beds24 refresh token are set too: an
   unparseable POST to `/api/booking/checkout` answers 400 rather than 503, and an unsigned POST
   to `/api/stripe/webhook` answers 400 `Unsigned.` rather than 503. Neither probe writes
   anything. So the live site can take a real card.

   The distinction that matters, because there is no Beds24 sandbox: **production charges a real
   card, the procedure does not.** Where to run the paid path, and why it is not the preview
   deployment the runbook assumes, is in
   `as-work/2026-08-18-website-launch-blockers/part-b-handoff.md`: the Stripe keys are shared
   between Production and Preview, so a test key saved at the wrong scope puts the live site into
   test mode, and a Stripe webhook cannot get past a preview's login wall.

   Three things remain unknown, and each needs a dashboard rather than the code. Whether the live
   Stripe account **still** has a webhook endpoint registered against
   `https://www.agentsiam.com/api/stripe/webhook`, subscribed to `payment_intent.succeeded`, with
   a signing secret matching the one set here. `STRIPE_WEBHOOK_SECRET` being set here proves
   nothing about an endpoint existing at Stripe's end, and that endpoint is what flips a paid hold
   to confirmed, so with it missing or mismatched a guest who pays gets a charge, no confirmation,
   and a hold the sweep then declines to cancel. Note the `www`, because the bare domain
   308-redirects and Stripe does not follow redirects on delivery. Whether `STRIPE_SECRET_KEY` is
   itself live mode, since a mismatched pair fails at confirmation rather than taking money. And
   whether `CRON_SECRET` is set as opposed to only `BEDS24_WEBHOOK_SECRET`, because only the first
   makes Vercel's scheduled request authenticate and the hold sweep 401s in silence otherwise.

The homepage fork panel photograph is in place: it asks for `team-group-portrait` and
`src/photos/team/agentsiam-team-group-portrait.jpg` exists, so both panels render photographs.
The original brief for a team-on-site frame is in `src/photos/team/README.md` if a landscape
site-visit shot is ever wanted instead.

Closed, kept here so they are not re-opened by mistake:

- ~~**T&Cs have not been through counsel.**~~ Cleared for draft 1 by Paul, 24/08/2026.
- ~~**The Thai and Chinese strings marked `// NEW` have not been reviewed by a native speaker.**~~
  Closed 23/08/2026. All 296 keys were reviewed in English, Thai and Chinese, 199 findings
  raised and applied. The `// NEW` markers were stale after that and were removed 24/08/2026.
  See `as-work/2026-08-18-website-launch-blockers/copy-review-findings.md`.
- ~~**Four listing disclosures are missing from `/lotushouse`, one of them `safety`.**~~ Closed
  22/08/2026. The child-safety disclosure leads "Limits to know before booking" in all three
  languages, as `childSupervision`, and the booking panel counts adults and children
  separately. **There is no acknowledgement and no server-side enforcement.** The under-5
  question, the checkbox and the enforcement on the request and payment paths were added on
  22/08/2026 and removed again on 23/08/2026, replaced by the single plain line, which is the
  default the guest-copy standard sets. Nothing in `src/` enforces an acknowledgement today.
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
