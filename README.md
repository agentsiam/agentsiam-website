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
| `/journal` + `/host-newsletter` | Real. The two editorial hubs: masthead, lead piece, email sign-up through `/api/subscribe`, a rail into the rest of the site. One article each. |
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
| Renter leads | The enquiry, its shortlist, each candidate's decision | `01-crm/guest-leads.csv`, `01-crm/shortlists/G-####.json`, `01-crm/inquiries/G-####.json` |
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
itself and that is expected. Expiry is No expiration, Paul's choice on 13/11/2026: an expiring
token takes the admin down on a date nobody is watching, and every read and every save begins
failing at once. The cost of that choice is that the token never falls out of use by itself, so
it is only ever revoked by hand, at GitHub, Settings, Personal access tokens. Revoke it there
the moment a laptop or a Vercel account is in doubt, and treat the value as live until you do.
Copy the `github_pat_` value while it is on screen, because GitHub does not show it again.

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

### The renter request form writes to the store as well

The admin is no longer the only writer. `POST /api/stay-request`, behind the request form on
`/house-for-rent-chiang-mai` and on all eight property pages that are listed for enquiry rather
than bookable, records every submission before it emails anybody: a `G-####` row appended to
`guest-leads.csv`, then `inquiries/G-####.json` beside the shortlist. Until 14/11/2026 it sent
one email and persisted nothing, so the only evidence an enquiry had ever arrived was a message
in a mailbox and whatever somebody retyped into the CSV by hand.

**The order is the design, and a failure is never quiet.** The record goes first. If it cannot be
written the submission is still emailed, because a renter who waited for a reply should get one,
but the subject then says `NOT RECORDED` and the first row of the body says what went wrong.
Nothing is kept and nobody is told only if the mail also fails, and that is the one case the
renter is shown an error.

**Two files, because the row and the record answer different questions.** The CSV row is where a
person reads a lead, so the structured answers are composed into its `requirements` cell as plain
sentences. The JSON record holds them as fields, which is what can be matched against
`property-pool.csv`: a budget with its unit and currency, a date flexibility, the guest split with
the children's ages, eight fixed must-haves, pets, smoking, who is coming, a vehicle, the language
to answer in, and the consent answer with the exact words the renter was shown, in the language
they were shown them in.

**Neither file carries a contact handle**, which is the CRM's own rule in
`01-crm/README.md` and `01-crm/shortlists/README.md`: no guest email address and no guest phone
number, because those stay in the mailbox the enquiry arrived in. The row names the channels the
renter offered, the notification carries the handles, and the inquiry record holds no name and no
handle at all. That is also what decision 92 needs, since the record is what an owner is shown and
the renter's details cross only once that owner has accepted the introduction terms for the lead.

**One named channel, not email.** Email was required and is not any more: a submission needs a
name, the dates, how they found us, and at least one of email, phone, WhatsApp or LINE. Thai and
Chinese renters often use LINE and nothing else.

**Three routing cases, recorded, all landing with AgentSiam.** The form carries a property's route
slug when it sits on that property's page, and `beds24` on the `Property` decides the rest: a
property with a Beds24 room is `managed property`, one without is `listed with AgentSiam`, and no
slug at all is an `open requirement`, which is what most leads actually are. Nothing is sent to
an owner by the site; a person sends from the admin's "Ask pool owners" panel. See "Known gaps".

**Rotating and revoking.** Changing `ADMIN_COOKIE_SECRET` and redeploying signs both people out,
which is how a session is revoked. Deleting the token on GitHub stops reads and saves together:
sign-in still works and every page then shows a store error, which is the quickest way to shut
the admin without touching a deployment.

## The cleaning team's schedule app

A private area at `/cleaning` where Da, Aun and Ting read their own cleaning and laundry
schedule on their own phones, and their own door codes behind a PIN. Installed from the web,
not from an app store, and readable with no signal. Nothing in it is public, indexed or in the
sitemap.

**What it is for.** It replaces a LINE message that had to be pasted, read and trusted. The
housekeeping team are freelancers: they are offered work, they take it or they turn it down,
and somebody has to know which before the day arrives. So the app answers four questions a
message cannot. What is my next clean, which house is it at and what does it ask for. Has she
agreed to it. What did I do last month, because that is what she is paid for and the payslip
arrives in the thread on that clean. And, for Paul, who has not answered, who said no, and who
has the job now.

**It is live and in use.** The whole of what follows is built and running at
`agentsiam.com/cleaning`, with four people published to it. What is not finished is listed under
"Known gaps" and nowhere else: the biggest are that the schedule run publishes no houses yet, so
no row can name one; that the LINE Note and the app now disagree on purpose where a clean was
declined or moved; and that a cleaner's map link is a search rather than a share link. Those are
changes in `/Users/paulb/code/agentsiam/agentsiam-consulting`, not here.

**The shape of a day in it.** New work reaches her on a screen of its own that she cannot walk
past, one clean per blue panel, accept or decline on each. What she accepts joins her schedule;
what she declines leaves her screens and lands in a red block on `/admin/cleaning` for Paul to
hand to somebody else, or to give back to her. Her first screen leads with today's work, the
house, the hour, anything asked for on that clean, and the door codes on the day itself. Behind
one tap are the cleans she has already done, which the app keeps for ninety days of its own
accord because the published schedule starts at today.

**It holds no schedule of its own, and that is the whole design.** The `cleaning-schedule`
skill in `agentsiam-consulting` owns every rule about which clean happens when, who gets it
and what a line says, and it publishes one finished document per person into the Upstash store
on every run. This app reads one key and renders what is in it. It has no roster, no Beds24
access, no scheduling rule and no Thai date formatting, so the Note Paul pastes into LINE and
the screen she opens cannot disagree: they are two renderings of one run.

**The app never composes, formats or translates a Thai string.** The document carries the
queue title, every job line, the contact block, the access block and the change lines, all
finished. The skill owns Thai dates because the day of week is the
easiest thing in that system to get wrong and the hardest to spot, and an app that formats its
own job lines is a second schedule arriving as a formatting library. What this app decides is
order, weight and position.

**What it does decide is which published fields a screen prints**, and since 19/11/2026 a job
line is not one of them. Paul: the cleaner's name should not be in brackets after the date,
because the clean does not belong to her yet, and the special request belongs in the note and
not in the title of the clean. A published line is four things at once, `พุธ 18 พย - 10.00 (ดา)
มีแขกพักอยู่ เพิ่มเตียงเด็ก`, which is right in a LINE Note and is four things in one sentence on a
screen, three of them already drawn beside it. So a screen prints the day label and the hour,
two other published fields of the same visit, and the house, the occupied figure and the
request are drawn in their own places. `plainLine` in `src/lib/cleaning/english.ts` is the one
function that builds it and it parses nothing. **The LINE Note is unchanged**, because the
skill renders that: if the request should come out of the line there too, that is a change in
the skill.

**It does compose English**, and only English, in the same file. Paul,
18/11/2026: work out the English text as well, because some of it is showing in Thai. A
document is published in one language and that language is Thai, so a phone set to English was
reading English prompts over a Thai schedule. What that file composes it composes out of the
structure the skill publishes beside the finished text, the ISO date, the hour and the house,
and it parses no published string, so a change in the skill's wording cannot break a screen.
The Thai path is untouched: a phone set to Thai gets the document's own text exactly as before.

**Thai or English, on a switch at the top of every screen, and the Thai carries no English.**
Paul, 18/11/2026. The control is on the enrolment link, on the PIN gate and on every screen
behind it, because the person who needs it is the one who cannot read the screen she is looking
at. What it sets is an unsigned cookie on that phone and not a path: a locale in the URL, which
is how the public site does its three languages, would mean a second address for the same
schedule and a second saved copy of it in the service worker, so a phone with no signal would
open whichever of them it last happened to save. What it switches is the app's own words, which
are the two tables in `src/lib/cleaning/strings.ts`: the prompts, the headings, the markers, the
buttons and the seven weekday columns on the calendar. `npm run test:cleaning-strings` fails if
any Thai string carries a Latin letter or any English one carries a Thai character, so that half
of the instruction is a test and not a promise.

**What English reaches, and what it does not.** The job lines and the day headings are
composed, so they read `Wed 18 Nov, 10.00` and `Wednesday 18 November` on an English phone and
the document's own Thai on a Thai one. The heading over the contact block, the codes and the
change lines is the app's in English, because a panel's heading says what the panel is and that
is furniture rather than content. **The prose inside them is not**, and stays in the language it
was published in: the names and roles in the contact block, the words beside each door code, the
change lines, and anything true of one clean. Those are the skill's sentences, and the honest
fix is a document published per language, which is a change in the skill and not in this
repository. It is in the known gaps. Three things are Latin in
both languages and are nobody's to translate: the house names, which are the names on the doors
and in LINE, the brand, and Ting's name. The word English on the switch is the fourth and is
deliberate: a language is named in its own language, or the person who needs that option cannot
find it. `/cleaning/check`, the service worker diagnostic, is English in both and is Paul's
screen rather than the team's; it says so on itself and nothing links to it.

| Screen | Needs | Is |
|---|---|---|
| `/cleaning` | the device cookie, then her PIN | Her schedule: her visits in date order with the next one filled in ink, a marker on anything new or moved since she last looked, the contact block and the change lines. It sends her to `/cleaning/new` while anything ahead of her is unanswered |
| `/cleaning/new` | the same two | The new work, in blue, one clean per panel with accept and decline on each. The one screen she cannot walk past, and it stops existing the moment nothing is waiting |
| `/cleaning/day/<date>` | the same two | One day and what it asks of her, in time order, reached by tapping a date on the month grid, which pages forward a month at a time from this one to the furthest she has work in, and three months at the least |
| `/cleaning/job/<slug>` | the same two | One job: the line, the house, the address, the people on it, the codes on the day, and the thread about it |
| `/api/cleaning/codes` | the same PIN, never asked for twice | Her gate and door codes as data, fetched into the schedule and the job screen rather than rendered into them. Kept by the service worker alone, on a deadline, and by no other cache |
| `/cleaning/enrol/<token>` | the link, plus her PIN | The one URL that answers without a cookie. A GET greets her and asks for her code; the POST behind the button enrols that browser. One link enrols as many browsers as she opens it in |
| `/cleaning/no-access` | nothing | The one thing a phone with no working access is ever told: ask Paul for a new link in LINE. Where a wrong code is the trouble she is sent back to the link instead, which says so in her own language |
| `/admin/cleaning` | the admin session | Paul's screen: every clean somebody turned down with a control to give it to another cleaner, every clean he has moved with a way to give it back, then three people, their enrolled phones, a name and a revoke on each one, a PIN each, a fresh link each |

**The sign-in, which is the largest piece.** Three people who will not manage passwords, so
there is no password and no account. Paul sends a link in LINE and she opens it with the
four-to-eight digit PIN he set and told her; that binds the browser she opened it in and mints a
signed `as_clean` cookie that lasts a year. Her schedule then needs that cookie alone, because
she opens it at a gate with her hands full and the schedule is not the secret. Her codes need
the cookie and the PIN, held as a PBKDF2 hash, with the failure counter in the shared store
rather than in `src/lib/rate-limit.ts`: that one is a bucket per warm instance by its own
admission, which is fine in front of a contact form and useless in front of a door code.

**What a link binds is one browser, not one phone.** LINE's in-app browser and the phone's own
browser keep separate cookies, so a cleaner who taps the link in LINE is enrolled in LINE and
nowhere else, and opening `/cleaning` in Chrome afterwards shows her the PIN gate with no
cookie behind it. The same handset in both is two enrolments, each revoked on its own, and
`/admin/cleaning` takes a typed name per enrolment because the agent strings differ by a
version number. **Only her own browser can hold the offline copy**: an in-app browser
registers no service worker, which `/cleaning/check` reports as "service worker NOT SUPPORTED",
so the codes she reads at a gate with no signal exist in her own browser and not in LINE's.

**The link is not the secret, her PIN is.** That is the change of 20/11/2026 and it is what
makes the paragraph above survivable. A single-use link had to die on its first open, because
possession of it was the whole proof, so it enrolled whichever browser she happened to tap it in
and the other one was a second link away; the link that had worked looked spent. One link now
enrols every browser that opens it with the right code, for thirty days, and **five wrong codes
delete the link** rather than locking it, counted against the link in the shared store because
at that moment there is no phone to count against. The cost is stated rather than hidden: a
stranger holding a forwarded link can burn it by guessing, which costs Paul one press of a
button, and a link plus an overheard code is an enrolment, which is why every one of them is
listed on his screen with a revoke. Two things follow. `/admin/cleaning` **refuses to mint a
link until her PIN is set**, since a link minted first can only tell her no code exists. And the
enrol route hands out the PIN cookie with the device cookie, so the gate she would have met on
the next screen is not asked a second time: it moved one screen earlier rather than being added
to. `npm run test:cleaning-devices` holds all of it: one link enrols two browsers, a wrong code
enrols nothing, five wrong codes kill the link while an unset PIN does not, a name survives the
stamp a visit puts on the record, and revoking one browser leaves the other and its name alone.

**Revocation is deleting the device record**, which stops that cookie resolving on the next
request and reprograms no lock. That is what the brief asks for: per-person door codes exist so
that a lost phone costs one lock slot, and an app session is a second thing that can be lost.
A cookie's signature is checked at the edge in `src/proxy.ts`, and the device record is checked
again inside every page and every route, because the edge does not reach the store and a
revoked cookie is still correctly signed. **There is no recovery flow and that is the feature.**
A lost phone is re-enrolled with a new link. Nothing mails or texts a way back in.

**Today's work is said, and said once.** Paul, 19/11/2026: when today is in the black card it
should say today's work, and the same clean should not be in the list underneath, where it was
duplicated. So the card carries a heading on a day she is working and none on any other, which
is how the absence of it says the next clean is further off, and the clean in the card is taken
out of the list below it. A day holding a second clean still shows that one under its heading.

**The cleans she has already done are kept by the app**, in `cleaning:history:<person>`, because
the document does not keep them. Paul, 19/11/2026: she has to be able to look back over the past
month, because AgentSiam pays her for that work and the payslip goes into the comments on the
clean itself. A published document is built from the bookings ahead, so the clean she did on the
Thursday is gone from it by Friday morning, and with it the way back to its thread. The ledger
is written when she opens the app, out of the schedule she is being shown, and it is read by her
past-jobs fold, by the day screen, by the job screen and by Paul's own screen, which otherwise
had no row to put the payslip on. **It is a ledger and never a schedule**: nothing ahead of her
is ever drawn from it, a clean that left her schedule before it happened is dropped from it, and
ninety days is as far back as it goes. `src/lib/cleaning/history.ts` carries the reasoning and
`npm run test:cleaning-history` holds it to those rules.

**The calendar runs three months back and three forward at the least**, both floors
unconditional, so the arrow is never alive in one direction and dead in the other. Three back
because the ledger keeps ninety days and a calendar that stopped short of it would hide rows the
list still has.

**What changed since she last looked** is the one thing this app does that the LINE Note
cannot. `cleaning:seen:<key>` holds when she last opened it and the lines she was shown;
matching is by Beds24 booking id where the job carries one. That answer is not the same as the
change lines at the foot of her schedule, which say what changed since the schedule was last
**posted**, and on a week she did not open the app both are true. They are kept visually apart
for that reason.

**She answers a clean, yes or no, and the marker is not enough on its own.** Paul, 18/11/2026: a
new clean, and a clean that has moved, should reach her as something to accept, and she has to be
able to reject it as well. The marker told her something had changed and could not tell him she
had read it, and a cleaner who has not read a move is a house nobody turns up to. So
`cleaning:accept:<person>` holds the cleans she has agreed to and the cleans she has turned down,
each with the line it read when she answered, and `/admin/cleaning/<person>` says accepted and
when, declined and when, or not answered yet, against every clean still ahead of her.

**The new work is a screen of its own, and it is the one screen she cannot walk past.** Paul,
18/11/2026: the accept screen has to be a different screen from the calendar and the list, so
that she answers all of the new work before she goes into her schedule. It was a card at the top
of the schedule for one day, and a card can be scrolled past. So `/cleaning`, the day screen and
the month grid all send her to `/cleaning/new` while anything from today onwards is unanswered,
and that screen sends her straight back the moment nothing is. **Only cleans from today onwards
hold her**: a clean last Tuesday that was never answered would otherwise shut her out of her own
schedule for good. One pair of buttons per clean and never one pair over a list, because she is
agreeing to turn up at a particular house on a particular day. It is the brand blue rather than
the ink the rest of the app is built on, at Paul's instruction in the same message, and the blue
is also what says this is not a schedule before she has read a word.

**Answering is never a reassignment.** Nothing in this app decides who does what: that is the
skill's, and the rule is still Monday to Friday Da, the weekend Aun, Ting on every laundry.

**A clean she turns down leaves her screens entirely**, which is Paul's instruction a few hours
after the first version shipped and reverses what that version did. It shipped staying, marked
with a red pill, on the argument that nothing here can take a clean off a published document and
that a schedule holding fewer jobs than the LINE Note in her other hand is a second schedule. He
watched Aun turn three down and still see all three, and said plainly that a clean she has
rejected is not her schedule. So it is gone from the list, the next-visit card, the month grid's
counts, the day behind a tapped date and the job screen behind a kept link, through one filter,
`hidingDeclined`, applied once per screen rather than as a condition on every row.

**It is then on Paul's screen and nowhere else.** `/admin/cleaning` carries every declined clean
still ahead of it at the top, in red, with who turned it down and when, because a clean that is
invisible to the person it was published to and buried on an admin screen is a clean nobody
does.

**Or he gives it back to her.** Paul, 19/11/2026: it does not have to be reassigned to another
person. Her own name is at the top of the list on that control, and picking it moves nothing:
it forgets her answer, so the clean reaches her again as new work and she accepts or declines
it afresh. A no on the Tuesday and a conversation on the Wednesday is the ordinary way this
ends, and the answer to it is the same cleaner being asked again. Only Paul can do it: a
cleaner who could clear her own no would be a cleaner being asked until she said yes.

**The control is on every clean still ahead of her, not only on one she turned down.** Paul,
19/11/2026: ป้า is the backup cleaner, she has no prioritisation, and she is assigned the work
by hand. A backup exists to be given work nobody refused, so the control cannot wait for a
refusal: it stands under each of her cleans on `/admin/cleaning/<person>`, and the block on the
first admin screen stays what it was, the queue of cleans that came back and need somebody.

**A clean can be moved on, and who loses it does not change.** The record keeps the person it
was **published** to, however many hands it passes through, because the schedule run keeps
publishing that clean to her on every run and she is the one it has to be taken off. Recording
the last holder instead would hand the clean back to the first one the next time anybody looked.

**And he gives it to another cleaner from that block.** Paul, 18/11/2026: the cleaners are
freelancers, so turning a clean down is an option they have, and the admin reschedules it for
somebody else. `cleaning:assign` holds one row per moved clean, the app lays it over the
published documents on every render, and `scheduleFor` in `src/lib/cleaning/assign.ts` is the
one function that applies it. Everything that reads a schedule goes through that function, her
five screens and the four routes that write about a visit, or a route would refuse the
acceptance of a clean she can see. The move survives the next run of the skill, and the ten
after it.

**And he moves a clean to another date or hour.** Paul, 20/11/2026. `cleaning:when` is the
second override and `src/lib/cleaning/when.ts` owns it, laid over the document by the same
`scheduleFor` before anything else reads it. The two are separate records because they are
separate facts: who does a clean reaches one person, when it happens reaches everybody on the
job, so a moved hour moves the laundry run with the cleaning.

Four rules, and three of them fall out of one decision. **A moved clean keeps the slug it was
published under**, because a slug is the date, the hour and the house, and it is the identity
that the thread, the answers, the ledger row and the job's own URL all hang off; `date` and
`time` on the visit say where the work actually is. The hour was therefore never in the
accepted shape, so **the hour it moved to is what goes into that shape**, and only when there
is one. That is Paul's rule that a moved hour is accepted again by both of them, and his rule
that a change of cleaner alone leaves the laundry run's answer standing, which was already
true. It is also his rule that moving a clean asks him again who it goes to: an assignment is
held against that same shape, so moving the hour ends it and the clean goes back to whoever
the skill published it to, waiting to be given out. And **the move lapses rather than
lingers**: a clean that gains a cot returns to its published hour, and a booking whose own
hour changes publishes a different slug that this record does not answer to. A stale override
would stand a cleaner in front of a house at an hour nobody else believes in.

**The new day is said in Thai out of the skill's own words.** A new hour on the same day needs
nothing, because her published Thai day is still true. A new day is composed by
`src/lib/cleaning/thai-date.ts` from the seven weekday words and twelve month words the
document carries in `day_words`, in the script's own format, `{weekday} {day} {month}` with no
leading zero and no year. **This is the one place in the app that writes a Thai date and it
invents nothing**: the words are the skill's and what this adds is arithmetic, which is the
half a script does not get wrong. Before any of them is used they are composed against every
label the document already carries and compared; one disagreement anywhere and nothing is
composed at all, because a date that is nearly right would read as the skill's and be the
app's. A document from before the words existed composes nothing and says so on the admin
screen.

**Paul can still word it himself**, in a box beside the date, and what he types wins over what
would be composed, stored as he wrote it with the ends trimmed and nothing else touched.
Nothing checks those words against the date, which is the cost of him writing them and is said
on the screen. With neither words nor a typed day the clean reads as the hour alone under no
heading; it still sorts, lands on the right day screen and marks the right square on the
calendar, and an English phone reads the whole new date in every case. The words are not part
of what the two of them accepted, so correcting a typo in a date does not put the clean back in
front of anybody. `npm run test:cleaning-when` holds all of it against a throwaway store, 65
checks, including the composer against the script's own docstring example.

Three things about a clean moved to another cleaner are worth knowing. **The line stops naming the first cleaner**:
a job line is finished Thai text with her name inside it, so a moved clean prints the day label
and the time instead, which are two other published fields of the same visit. **The house
travels and the door codes do not**: an access block carries that person's own code for that
house, and per-person codes exist so a lost phone costs one lock slot, so the new cleaner sees a
code only where her own document already has one, and the admin says so before the move. **It
arrives as new work**, so she accepts or declines it like anything else, and she can turn it
down too.

**The admin warns off a field and not a sentence.** Each access block carries `own_code`, true
when a code of hers is in its lines and false when the block is the property's shared gate
alone. A cleaner on the roster before her slot on the lock exists gets the gate and nothing
else, and from this side the two blocks are identical: one line of finished Thai or two, which
this app may not read. **Missing means true**, because every document published before the field
existed belongs to somebody who has her codes.

**The LINE Note is unchanged** by any of it, because the skill renders that from its own run.
Hers still lists the clean she turned down and his still names her against a clean somebody else
now has, until the skill reads this record at build time. The app and the Note disagree on
purpose for the first time, which is the price of both halves of this and is in the known gaps.

**What counts as the same clean is the slug plus the shape of the work**, which is the kind of
clean and anything asked for on it, and never the job line. It was the line until 19/11/2026,
and a line carries who else is on the clean: `พฤหัส 19 พย - 10.00 (Ting) กับ ดา`. Paul that day:
moving the cleaning between Da and Aun does not move Ting, and a laundry run Ting has accepted
stands until she cancels it. Comparing lines put the laundry back in front of her for an answer
every time the cleaner beside her changed. A cot added to a clean still asks again; a colleague
swapped does not. A record written the old way is still compared the old way, so nothing was
migrated and nobody was asked twice for a change of format.

**An accepted clean says how to get out of it**: cancelling goes through us and we reschedule,
which was true from the first day and said nowhere, so the card simply ended. It now says so on
a clean still ahead of her, where the pair of buttons would be.

The record is keyed on the **visit slug**, the date, the time and the property, and deliberately
not on the `visitIdentity` the changed marker uses. That one falls back to the date when a job
carries no booking id, which was safe while a person had at most one clean a day and stopped
being safe in November when a second house arrived: accepting the morning at one house would have
accepted the afternoon at the other. The line is stored beside the slug, so a cot added to a
clean asks her again, and a clean that moves is a new slug and asks her again for the same
reason, a clean she declined included: that is a different clean from the one she said no to.
One clean carries one answer, so declining and then accepting leaves her having accepted and
not both. `npm run test:cleaning-accept` drives all of that against a throwaway file store, and
`npm run test:cleaning-assign` does the same for a moved clean: that it leaves one schedule and
joins the other, that the line stops naming the first cleaner, that the house travels and the
door codes do not, and that a move lapses when the clean it was made against changes.

**Installable and offline.** `public/cleaning/manifest.webmanifest`, icons generated by
`npm run cleaning:icons` and committed, and `public/cleaning-sw.js`, which keeps the last
schedule she loaded and serves it when the network does not answer. The worker is served from
the root rather than from inside `/cleaning` because a worker's maximum scope is the directory
it is served from. It deletes its cache the first time a navigation comes back redirected to
the "ask Paul" page, which is how a revoked phone loses its saved copy once it next has
signal. It refuses to save the PIN gate, which `/cleaning` answers with to a phone that has
not given it, because one load of the gate would otherwise overwrite the saved schedule with
a form whose submit cannot reach the network. **It saves no answer that arrived having been
redirected**, which is the same failure from the other direction: since `/cleaning` redirects to
the new-work screen while anything is unanswered, a redirected response written under the
schedule's own URL would be both the wrong page and one a browser refuses to accept for a
navigation at all, so the schedule would stop opening offline altogether.

**The door codes are kept too, and that is a reversal.** Until 17/11/2026 they were the one
thing the app refused to write down anywhere. Paul's decision: the one moment this app exists
for is a woman at a gate needing the number for the lock, and that gate is exactly where the
signal is not, so giving her the dates offline and not the code sent her back to LINE, which
is the thing the app was built to replace. What makes the copy carryable is that it is not
unconditional. `src/proxy.ts` puts a deadline on that response and only when a live PIN
session is behind it, so a codes page fetched any other way is served and never saved; the
deadline is the shorter of her remaining PIN session and seven days, so a phone lost and
never online again holds the codes for a week at the outside rather than the month the session
runs; a copy past its deadline is deleted rather than served; and a revocation wipes it with
everything else. The header is named in `src/lib/cleaning/routes.ts` and the window is in
`src/lib/cleaning/session.ts`.

**The page is still set to `no-store`, which is not a contradiction.** The rule has not
become "the codes may be cached", it has become "the codes may be cached by us". No cache
this app cannot reach is meant to hold them: not the browser's own HTTP cache, not a proxy in
between. The service worker's copy is the single exception, and it is the exception precisely
because it takes a deadline and answers to a kill switch. That is the whole difference
between a cache we can wipe and one we cannot. What the page is set to and what it answers
are not the same thing today: the known gap on this page's `Cache-Control` says what was
actually observed.

`npm run test:cleaning-sw` drives that file outside a browser and covers all of it,
twenty-eight cases with a non-zero exit on any failure; run it after touching the worker, that
header or that window. Six of the cases are the door codes, which is where the risk now is.
What it cannot cover is a browser, which is the known gap below.

**One host, and deliberately no subdomain.** The team's app is served at
`agentsiam.com/cleaning` and nowhere else, and nothing in the codebase reads a host. A
subdomain was built and taken out again, so the reason is worth keeping: it bought a tidier
URL for three people who reach the app from a link Paul pastes into LINE, and it cost a
rewrite that silently dropped every header the gate set, a host where the service worker
never registered at all so there was no offline copy of anything, and a code path that
nothing had ever exercised. Those are not three risks. They are one risk three times, which
is that the app the team would have got was not the app anyone had tested.

**More than one house, and the screens that come with it.** The published document can name
the properties she works at, put one on each visit, carry one access block per house and hand
over the date as a label of its own. When it does, the schedule becomes days with jobs under
them rather than a flat list, each job carries its house, a job screen appears behind every
card holding the address as a tappable map link and the way into that house's codes, and the
codes screen lists every house with the one she is going to next at the top. When it does not,
which is every document the skill publishes today, all of that quietly disappears and the
screens are exactly what they were: one house, implied, with no chip, no address and one set
of codes. That fallback is not theoretical, it is the only shape in production, and it is
checked by pointing the local fixture at a document built before any of this existed.

The codes screen takes `?house=`, and it is ordering and never filtering. The worker matches a
saved page ignoring the query string, so one saved copy answers every one of those links and
it has to hold every house or a phone with no signal would open the wrong gate.

**Four environment variables**, documented in `.env.example`: `CLEANING_COOKIE_SECRET`, then
either the `KV_REST_API_*` pair for the real store or `CLEANING_LOCAL_PATH` for development,
and `BLOB_READ_WRITE_TOKEN` for the photographs on a comment thread. Without the first the
app fails shut: no link opens and no cookie resolves. Without the last, everything works
except a photograph: an upload answers 503 and says `unconfigured`, and so does the route
that reads one back, because a private store cannot be read without it either.

**The door codes are not on a screen of their own and there is no screen that lists them.**
A house's codes appear inside the schedule, and on that job, on the day she is at that
house, and nowhere else. They are fetched from `/api/cleaning/codes` rather than rendered
into the page, because the service worker saves the schedule with no deadline so she can
read her dates at a house with no signal, and a code in that saved copy would still be
there next week. That one answer carries its own deadline, the end of the day, and is the
only path under `/api/` the worker keeps. Three things hold it off every other disk: the
route's own `no-store`, the same header in `next.config.ts`, and the worker refusing to
serve a copy past its deadline.

**Photographs live in a private Vercel Blob store and are deleted after a month.** Private
is Paul's decision of 18/11/2026 and it is the reason none of this looks like ordinary image
hosting. A public store answers its own URLs to anybody holding one, and what travels here
is a bank transfer screenshot at one end and the inside of a guest's bedroom at the other.
So no URL is ever handed out: the phone shrinks the photo before it is sent, the upload
answers with the blob's **pathname**, the comment carries that pathname, and the only thing
that can turn it back into bytes is `/api/cleaning/photo`, which checks the same two gates as
her schedule, or the admin session, before it streams one. There is no link to leak and
nothing with an expiry to keep fresh.

**The shrink aims at a weight, not at a quality.** Paul, 18/11/2026: compress them, the
quality does not matter, he does not want storage eaten. A fixed quality setting cannot
promise a size, because what a JPEG weighs depends on what is in it, and the heaviest thing
that travels here is the one with the most detail in it, a screenshot of a transfer slip. So
`src/lib/cleaning/shrink.ts` scales to a longest edge of 1280, encodes at quality 0.6,
weighs the result, and encodes again at 0.45 and then 0.35 until it is under
`PHOTO_TARGET_BYTES`, which is 150KB. Measured on three real property photographs of
2560x3523 and around 700KB each, that is 131KB, 91KB and 69KB, against 245KB, 174KB and
140KB under the longest edge of 1600 and the single quality of 0.75 it replaced: a little
under half, and a worst case that is now a number rather than a hope. `MAX_PHOTO_BYTES`
stays at 6MB and is nowhere near the target on purpose, because it is the backstop for a
browser whose shrink failed, and a failed shrink costing bandwidth is better than a refused
upload costing her the proof.

**A comment carries up to six photographs, shown as tiles**, which is Paul's instruction of
18/11/2026 after the first one landed: a finished house is a bedroom, a bathroom and a kitchen,
and sending it was a comment each. They are picked in one go, shrunk as they are picked and
uploaded one at a time, because six uploads at once on mobile data in somebody's house is six
that all slow down. Both ends of the thread render them through the same component,
`src/components/cleaning/photo-tiles.tsx`, as a three-wide grid of cropped squares with the
whole picture one tap away, so a thread full of evidence still scrolls like a conversation.

A comment stores `images`, a list. Comments written before that afternoon carry `image`, a
single pathname, and `photoList` reads both, which is why the first two photographs Paul sent
still render. Nothing migrates and nothing needs to: the old shape is read, never written.

The pathname is the boundary that replaced the URL check, and it is a stricter one. A
pathname has been to a phone and back and is handed to the store, so `isOurPhotoPath` accepts
only the shape this app writes, the prefix, a calendar date and a name, and the read route
puts the prefix on itself after the segments arrive, so a request cannot name a blob outside
`cleaning/` whatever else the store holds. `npm run test:cleaning-photos` is what proves it:
traversals, sibling prefixes, a second slash, an absolute URL, a null byte, each composed
exactly as the route composes what it is given. It compiles the modules it tests, so it is
the real functions under test and not a copy of the rule.

**The month is enforced three times and none of the three depends on another.** `ttlDays` on
the upload means the store deletes the blob on its own clock, which is the only mechanism
that still works if this app stops running. `/api/cron/cleaning-photos` runs daily, lists the
one prefix this app writes to, and deletes by what the store says rather than by what a
comment says, so a photo whose comment has already expired is still swept;
`scripts/check-cron.mjs` refuses a build whose `vercel.json` has lost that entry, because a
sweep that silently stops running looks exactly like one that is working. And the read route
refuses a blob older than the month even while the store still has it, so the rule is exact
rather than approximate in the hours between a photo turning thirty days old and either of
the other two noticing.

### Running it locally, without a live door code on this machine

The fixture is what `build_note.py --publish` writes, built from a payload whose codes and
phone numbers are invented. Both example files are in `scripts/`. From a checkout of
`agentsiam-consulting`, with `<fixture>` a directory outside both repositories:

```bash
python3 .claude/skills/cleaning-schedule/scripts/build_note.py \
  <website>/scripts/cleaning-fixture-payload.example.json \
  --previous <website>/scripts/cleaning-fixture-previous.example.md \
  --publish <fixture>/documents.json > /dev/null
```

**Two houses is two runs merged.** `scripts/cleaning-fixture-lotus.example.json` and
`scripts/cleaning-fixture-cosmos.example.json` are that pair: a `property` block in each and
`note_titles.<role>.all_houses` in both, because the per-house title is wrong on a screen
holding both houses. Build each with `--publish` to its own file, then merge them:

```bash
python3 .claude/skills/cleaning-schedule/scripts/publish_note.py   <fixture>/lotus.json <fixture>/cosmos.json --dry-run
```

Drop `--dry-run` to publish to the store, or merge them into one local file by calling
`documents_from` in that script. The pair is the only way to see the multi-property screens,
since one house publishes a document that deliberately does not mention houses at all, and
their jobs are arranged to collide on two days so that the day screen, the house marks and the
time ordering all have something to show.

Then set `CLEANING_LOCAL_PATH` to `<fixture>/documents.json` and `npm run dev`. The state the
app writes, device records, PINs and last-opened timestamps, lands in
`<fixture>/documents.state.json` beside it. The dates in the example payload are fixed, so move
them forward or the whole fixture renders as a schedule that has already happened. Sign in to
`/admin`, open `/admin/cleaning`, mint a link for one person and open it: that is the whole
flow, end to end, with nothing live anywhere near it.

## Known gaps

- ~~**Photographs cannot be uploaded in production, because there is no Blob store (18/11/2026).**~~
  Resolved the same day. The store is `agentsiam-cleaning-photos`, private, in `iad1`, linked
  to production, preview and development, and production was redeployed for it, because a
  variable added after a deployment is built never reaches that deployment. The whole path was
  then run against the real store: a photograph stored, read back byte for byte through the
  gated route's own reader, carrying an expiry 31 days out, a traversal refused, the sweep
  leaving it alone the same day and deleting it with the clock a month on, and the store left
  empty. Paul's first two photographs from `/admin/cleaning` landed at 09:50 UTC. What the
  rest of this entry said is kept below because it is still what a missing store looks like.
  `npx vercel storage status` lists `upstash-kv-chestnut-ribbon` and `agentsiam-whatsapp`, both
  Upstash for Redis, and `npx vercel env ls` carries no `BLOB_READ_WRITE_TOKEN`, so
  `photosConfigured()` is false on every environment. From a phone that looks like this: the
  camera button is there, the photo is picked and shrunk on the device, and the upload answers
  503 `unconfigured`, which the thread shows as a send that failed. In the logs it looks like
  this: `/api/cron/cleaning-photos` refuses once a day at 03:20 UTC saying
  `BLOB_READ_WRITE_TOKEN is not set`, which is the sweep declining to run rather than a sweep
  that broke. Words on a comment are unaffected and are the whole of what a thread carries
  today. The fix is creating a Blob store in the Vercel dashboard and connecting it to this
  project including development: the routes read that one variable and no code changes for it.
  The one thing still unproven is the one that needs a phone rather than a store: a
  photograph taken on an actual phone, through its own camera sheet, on mobile data in a
  house. That is the same gap as the service worker's below and it needs the same thing.
- ~~**The cleaning app cannot say how old a schedule is, in production (17/11/2026).**~~
  Resolved the same day in `agentsiam-consulting`, commit `af1a9e7`: `documents()` in
  `build_note.py` now puts `built_at` on every person's document as well as on the file, so
  what `publish_note.py` stores under each key carries it and the line renders from the store.
  It was worth finding because of how it hid: the local fixture is the whole file, so the line
  rendered in development and would have gone missing only in production, on the one screen
  that tells a cleaner whether what she is holding is current. Nothing in this repository
  changed for it; the app read `built_at` off the document already.
- **No document carries `day_words` yet, so a moved day has no Thai date until one does
  (20/11/2026).** The app composes the day from the seven weekday words and twelve month words
  a document publishes, and checks them against that document's own labels first. Nothing
  publishes them: `build_note.py` in `/Users/paulb/code/agentsiam/agentsiam-consulting` holds
  the tables in `L10N["th"]`, Monday first and 1 to 12, and has to write them into each
  document beside `day_label`, after which a schedule run fills them in. Until then a clean
  moved to another day reads as the hour alone unless Paul types the day himself in the box on
  the admin screen, and words he types are never checked against the date. A clean moved to
  another hour on the same day is unaffected throughout, because the label it was published
  with is still true.
- **The accept flow cannot say what moved or why (18/11/2026).** A clean that has moved reaches
  her as something to accept, which is the half the app can do alone, and the card says nothing
  about where it moved from or why it moved, which Paul asked for in the same breath. Both need
  the skill: `history_diff.py` already words the move as finished text, `ย้ายจาก{frm} ไป{to}`, but
  it words it into the block at the foot of the Note rather than onto the visit, so the app has
  no per-visit field to render. The reason exists nowhere at all and is a habit as much as a
  field: four values and an optional line, chosen when a clean is moved. Until both land, a moved
  clean and a new one look the same on the card.
- **The run publishes no houses, so no row can name one (19/11/2026).** The app draws a house
  on every row that has one, as a name and a shape, and production publishes documents whose
  `properties` list is empty and whose every visit has a null property: the house exists in that
  document only inside the queue title the skill wrote. The app falls back to printing that title
  under the heading on her first screen and on the new-work screen, so the house is at least on
  the screen, and that is all it can do. **The fix is one `property` block in the payload** and a
  re-run, which is a change in `/Users/paulb/code/agentsiam/agentsiam-consulting`. Two things
  follow when it lands: every row gets its own house, and **every slug changes**, because a slug
  is the date, the hour and the house, so every clean is asked for again once and every comment
  thread opened before it stays under the old slug.
- **A backup cleaner cannot be reached at all until the run publishes her (19/11/2026).** ป้า is
  on the roster as the backup, with no place in the rota and her work given to her by hand. The
  skill builds a document per roster member **who appears in a job**, so a person with no jobs
  gets no document, and without one she cannot be enrolled, cannot be given a PIN, does not
  appear in the admin at all and cannot receive a moved clean, because a moved clean is merged
  into a published document. **The fix is in the skill**: publish a document for every roster
  member, with no visits in it where there are none. It has to carry her access blocks, or the
  first clean given to her arrives with no door code, since the app will not copy a colleague's
  codes across. That is a change in
  `/Users/paulb/code/agentsiam/agentsiam-consulting/.claude/skills/cleaning-schedule/`, in
  `documents()`, which skips a roster member whose `parts` are empty.
- **A map link is a Google search, not a share link (19/11/2026).** The job screen opens whatever
  `map` the document carries, and the property file carries a `maps.google.com/search?query=` URL
  built from the address text, which drops the pin wherever the search lands. Paul, 19/11/2026:
  it has to be a real Google location share link. That is one value per house in the property's
  own file in the document store, and it needs the two links from him.
- **The schedule itself is published in one language (18/11/2026).** The switch and
  `src/lib/cleaning/english.ts` between them put the app's words, the job lines, the day
  headings and the headings over the blocks into English. What stays Thai on an English phone is
  every sentence the skill wrote: the names and roles inside the contact block, the words beside
  each door code, the change lines at the foot, and anything true of one clean. None of it can be
  composed from structure and none of it may be parsed out of a finished line, so the fix is the
  skill publishing a document per language rather than per person, which is a change in
  `/Users/paulb/code/agentsiam/agentsiam-consulting` and not here. Nobody on the team reads
  English today, so this is Paul's own screen in practice.
- **The LINE Note and the app now disagree, on purpose (18/11/2026).** Until today they were two
  renderings of one run and could not differ. Two things this evening broke that, both at Paul's
  instruction: a clean somebody turns down leaves her screens, and a clean he moves to another
  cleaner leaves the first one's screens and appears on the second one's. The skill knows about
  neither, so the Note from the last run still lists a clean she declined under her name, and
  still names her against a clean somebody else now has. **The fix is the skill reading
  `cleaning:accept:<person>` and `cleaning:assign` at build time**, which is the first thing to
  flow back from the app to the skill, and it is a change in
  `/Users/paulb/code/agentsiam/agentsiam-consulting`. Until it lands, the app is right about who
  is doing what and the Note is right about what the schedule run decided, and the team reads the
  app.
- **A decline cannot be undone from her phone (18/11/2026).** The job screen let her take one
  back for a few hours and no longer can, because the clean is gone from her screens before she
  can reach it. A mis-tap on the cross is a message to Paul, who gives it back to her from the
  admin by moving it to her, or by leaving it where the skill put it.
- ~~**Reassigning a clean is a file edit and a re-run (18/11/2026).**~~ Resolved the same day.
  `/admin/cleaning` moves a declined clean to another cleaner, the app applies it over the
  published documents on every render, and the move survives later runs. What it does not change
  is the Note or the next run, per the gap above: the skill still publishes that clean to the
  person its file names, and it is the record in the store that keeps the clean where Paul put
  it. **A cleaner who has no published document of her own cannot receive one**, because a moved
  clean is merged into a document and there is nothing to merge it into; the admin refuses that
  move rather than losing the clean.
- **A moved clean can land without a door code (18/11/2026).** Codes are per person and per
  house: they live in the access block of each person's own document, so a clean moved to
  somebody who has none for that house arrives with no code behind it. The admin warns before
  the move, off the `own_code` field on that block, and nothing else happens: the app will not
  copy a colleague's code across, because per-person codes exist so that a lost phone costs one
  lock slot. Fixing it properly is her own code reaching that house, which is a line in the
  codes file and a re-run. **What the warning cannot tell you is whether that code is programmed
  into that lock.** The roster holds one code per person for the whole portfolio, so a second
  house she has never been given to reads the same as one she works at every week. The codes
  file has a "Live in lock" column the skill does not read; reading it is what would close that,
  and it is a change there rather than here.
- **`/cleaning/codes/<slug>` is still mounted and nothing links to it (18/11/2026).** The codes
  moved onto the schedule and the job screen on 17/11/2026, fetched from `/api/cleaning/codes`
  with a deadline on the copy, and the page they replaced was left in the tree. It still answers
  behind the same cookie and PIN, renders the codes into the HTML rather than fetching them, and
  carries no keep-until header, so the service worker would save that copy with no deadline on
  it. Only one of the three could reach it, on her own phone, by typing a URL nothing has ever
  shown her. It should be deleted; it is left standing because deleting a route is a decision and
  it is not the one Paul asked for tonight.
- ~~**The cleaning app's Thai is mine and has had no native read (18/11/2026).**~~ Resolved
  the same day. A Thai speaker read every line and eleven came back corrected; they are in
  `src/lib/cleaning/strings.ts` exactly as they were given. Two of the corrections turned on
  how the app works rather than on Thai and were answered from the code: the enrolment link
  binds whichever phone opens it rather than being tied to one in advance, so it now asks her
  to open it on the phone she will use; and the marker on a changed visit compares the whole
  job line, a new per-clean note included, so it says the job details changed rather than
  naming the date and the time. The sheet that carries every slot, what it has to say and what
  it must not, now records what was read and what moved:
  `/Users/paulb/code/agentsiam/agentsiam-consulting/as-work/2026-11-16-cleaning-app-scope/thai-strings-to-write.txt`.
  **What is still unread is the nine strings added the same evening** for accepting and
  declining, the title at the top of her first screen among them: they are drafts of mine, they
  are on the sheet, and they want the next native read. **And the English table**, which is mine
  and was moved only where a correction moved the meaning; nobody on the team reads it, so it is
  the lesser half. **And a
  slot nobody has written still ships as silence rather than as English**: an unwritten string
  renders as nothing and takes its element with it, at Paul's instruction of 17/11/2026, so
  nothing in the running app says a sentence is missing. `npm run test:cleaning-strings` is
  what finds one, and the same run refuses a Latin letter in the Thai.
- ~~**The app reads a multi-property document the skill does not write yet (17/11/2026).**~~
  Resolved the same day in `agentsiam-consulting`, commit `b945243`. The payload names the
  house it is for, every visit carries it along with the date as a label of its own, access is
  a list of one block per house, and `publish_note.py` takes several of those files and merges
  them into one document per person. One run is still one house, because a Note names its
  house in its own title; the merge is what makes two runs one schedule. Nothing in this
  repository changed for it: the screens already read those fields, and a payload with no
  property block still publishes what it published yesterday, which is the single-house path
  production is on.
- **The cleaning app's service worker has never run in a real browser (17/11/2026).** Its
  logic is covered: `npm run test:cleaning-sw` drives `public/cleaning-sw.js` outside a browser
  with its globals stubbed and its clock movable, twenty-eight cases, non-zero exit on any
  failure, and it proves the branching that matters. The API and the enrolment link pass
  through untouched whatever they answer, a schedule saved from a good load is served when
  fetch throws, a cold cache fails rather than inventing a page, a navigation coming back
  redirected to the no-access page wipes the cache, the PIN gate is served without being saved
  over her schedule, and a door code is saved only on the app's say-so, served with no network
  only while its deadline holds, and deleted rather than served once it has passed. Every one
  of those was watched to fail against a worker broken on purpose. So the caching and the
  offline fallback are no longer unproven. What is still unproven needs a browser: that one registers the script at all, that
  it installs, that it serves the saved copy after a real network failure rather than a thrown
  fetch in a harness, and the install prompt on either iOS or Android. The browser available
  while it was built refuses registration outright, for any script on any origin, returning
  `TypeError: Failed to register a ServiceWorker ... An unknown error occurred when fetching the
  script` while a HEAD for that same URL answers 200 with `application/javascript; charset=utf-8`,
  so the refusal is the browser and not the file. It needs one real phone, which on this project
  means production.

- **The codes page does not actually answer `no-store`, and the browser cache claim above
  rests on it (17/11/2026).** `src/proxy.ts` sets `Cache-Control: no-store, must-revalidate`
  on `/cleaning/codes`, and what the page answers is `Cache-Control: no-cache,
  must-revalidate`. Observed against the dev server on this tree, with a live device cookie
  and PIN cookie, by reading the response headers directly; Next's own header for a dynamic
  render wins over the one the proxy sets. The difference is not cosmetic: `no-store` means a
  cache may not keep the response at all, and `no-cache` means it may keep it as long as it
  revalidates before reusing it, so a door code may be sitting in the browser's own HTTP
  cache on disk, which is the one place the design says it must not be. The service worker's
  copy is unaffected and is still the only copy this app can reach, delete or put a deadline
  on. Unverified in production: whether a production build answers the same way was not
  checked, and it is worth the first real deploy looking at before anything else. The fix, if
  it is needed, is not in the proxy, because a header set there is what is being overridden.

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
- ~~**The GitHub token's expiry is not written down (12/11/2026).**~~ Resolved 13/11/2026:
  the token carries no expiry, on Paul's word. So the admin will not stop on a date nobody is
  watching, and the entry closes rather than waiting for one. What it leaves standing is in
  the setup section above, not here: a token that never expires is only ever revoked by hand,
  so the day a laptop or a Vercel account is in doubt, revoking it at GitHub is a step
  somebody has to remember. If it is ever replaced rather than revoked, the command and the
  redeploy are under "Setting it up on Vercel", because a Vercel variable binds when a
  deployment is created.
- **The site delivers nothing to a property owner by itself (22/11/2026).** Stage 1 of owner
  delivery is a person sending by hand: the "Ask pool owners" panel on each renter lead in the
  admin matches the pool, writes the owner message in Thai or English, and records `asked_on`
  and `g2_terms_agreed`; the renter's details are offered only after the owner accepts the terms
  and the renter consented. Design: `as-work/2026-11-22-owner-delivery/` in the consulting repo.
  Open: the Thai owner messages have had no native read; there is no introduction terms document
  for an owner to accept; and stage 2, sending through the LINE Official Account `@555ampnu`,
  needs each owner to add the account first so the `userId` from that follow event can be stored
  against their pool row, plus a one-time code to the renter before anything is forwarded.
- **A spam submission now reaches the document store, not just a mailbox (14/11/2026).** The
  protection is still what it was for a mailbox: one honeypot field and six submissions per ten
  minutes per address, in module scope on a serverless platform, so one bucket per warm instance.
  A bot that gets past both now leaves a lead row and an inquiry file, which in production is two
  commits in `agentsiam-consulting`. That is cheap to undo and noisy to live with, and it gets
  worse the day an inquiry is forwarded to an owner's phone on a metered channel. The normal
  answer is a one-time code to the renter's email or phone before anything is forwarded, and
  nothing like it exists here.
- ~~**Two renter leads carrying the same person and the same dates make two records.**~~
  Resolved 22/11/2026: a request sharing an email address, phone or WhatsApp number, or LINE ID
  with a request from the last 90 days is flagged "Repeat of G-####" in its `requirements` cell,
  its inquiry record and the email, and is still recorded. Matching uses keyed fingerprints
  (`src/lib/lead-match.ts`) and needs `LEAD_MATCH_KEY` set; without it the email says the check
  did not run. Leads recorded before it shipped carry no fingerprint and never match.
- **The Thai and Chinese of the request form have had no native read (14/11/2026).** Sixty keys,
  the `sr*` block in the three dictionaries: the four contact channels, the date flexibility, the
  guest split, the budget unit and currency, the eight must-haves, the four questions behind the
  disclosure, the consent sentence and its explanation, and the confirmation body. Written in one
  scripted pass per R9 and rendered at 375px in both languages with no truncation and no
  horizontal scroll, which is a layout check and not a language one. The consent sentence is the
  one to read hardest, because it is the string stored on the record as evidence of what the
  renter agreed to.
- **The privacy policy does not describe what the request form now collects (14/11/2026).** Its
  "What we collect, and why" section has an `Enquiries` paragraph written for the contact form,
  naming the name, the email address, a phone or LINE handle, a property type, a neighbourhood
  and the message. The renter request form now also collects a budget with its unit, a date
  flexibility, the number of adults and children **and the children's ages**, eight must-haves,
  pets, smoking, who is coming, whether they will have a vehicle and the language to answer in.
  The children's ages are worth their own look: the same policy says the site is not directed at
  children and that we do not knowingly collect their personal information. Nothing was changed
  there, because the paragraph and the recipient list the owner delivery needs are one edit to a
  page that has to be legally exact, and that is Paul's call rather than a side effect of a form.
  **Drafted 21/11/2026 on Paul's instruction, not signed off and not read by counsel:** a
  "Requests for a place to stay" paragraph naming every field, the children's ages with their
  purpose, and the owner introduction as the consent box words it; and two recipients under
  "Who else sees it", the GitHub repository that holds the enquiry records and an owner where
  the box is ticked. The GitHub line is true of the contact form too, which never named it.
- **The lead list reads every shortlist file on every page load.** Five leads is five extra
  reads, which is nothing locally and five GitHub requests in production. It is fine at this
  size and is the first thing to change if the CRM grows to dozens of open renter leads.
- **`guest-leads.csv` has no `notes` and no `history` column**, although the CRM README says
  every lead row carries both and the owner file `leads.csv` does. That is why G-0003's
  shortlist was living in its `requirements` cell. The admin does not fix it: it reads the
  columns that exist. Neither does the request form, which is why the structured answers go into
  `requirements` as sentences and into `inquiries/G-####.json` as fields. **The consent answer
  rides in that same cell**, as the clause "Consent to pass this to a property owner or their
  manager: yes" or "no". It belongs in a column of its own, and a column is a header change to a
  file in another repository, so it waits for the same decision as `notes` and `history`.
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
  ~~The capture half of that last point was resolved on 15/11/2026~~: both indexes carry a one-field
  sign-up through `POST /api/subscribe`, and the host standfirst no longer says there is no mailing
  list, because there now is one. **What is still open is everything after the capture**, and it is
  listed separately below rather than left inside this entry. The same change closes the outward
  half of the routing gap above: each index now carries a rail of the pages on this site that
  belong beside it. The inward half, links from `/short-term-rental-licence-chiang-mai`,
  `/house-for-rent-chiang-mai` and the neighbourhood pages back into the outlets, is still open.

- **The newsletter list is a mailbox, and the promise on the page is kept by hand (15/11/2026).**
  `POST /api/subscribe` mails each sign-up to the enquiry address and that mail is the whole record:
  there is no list, no provider, no scheduled send and no record of who has already been written to.
  The consent line on the form promises one email when something new is published, so until a
  sending path exists a person keeps that promise, and a reader who signed up in November and hears
  nothing in March has been told something untrue by this site. Three things come with a real
  sending path and none of them is built: double opt-in, an unsubscribe link, and a suppression
  list. Unsubscribing today is replying to an issue, which works only because a person reads the
  mailbox. Resend cannot verify this domain while it stays at Wix (`DNS-EMAIL-RUNBOOK.md`), so the
  provider decision is not a free one.
- **The privacy policy's newsletter paragraph is drafted and not signed off (15/11/2026).**
  Written the same day on Paul's instruction, after the gap was raised: a paragraph under "What we
  collect, and why" naming the address, which hub it came from and the language read in, the single
  purpose, and consent withdrawn by replying; a sentence under "How long we keep it"; and
  `PRIVACY_UPDATED` moved to 2026-11-15, which the policy's own "Changes" section promises. **It has
  not been read by counsel and Paul has not signed it off.** Three claims in it are true only while
  the list stays a mailbox: that no mailing-list provider holds the address, that it is not used to
  market the services, and that replying is how consent is withdrawn. The day a sending provider is
  chosen, that paragraph changes and "Who else sees it" gains a bullet naming the provider. No
  recipient bullet was added now, because the sign-up goes out through the transactional email and
  mailbox providers the first bullet already names. What this entry does **not** cover is the
  renter request form's own gap, two entries above: that one is still open and the two were not
  written in one pass after all.
- **The hub chrome's Thai and Chinese have had no native read (15/11/2026).** Forty-five keys, the
  `hub*` and `sub*` blocks in the three dictionaries: the masthead facts, the reading-time label,
  the three "How this is written" lines, the six rail cards, and the whole of the sign-up form
  including its consent sentence and its confirmation. Written in one scripted pass per R9 and
  rendered at 375px in Thai and Chinese with no truncation and no horizontal scroll, which is a
  layout check and not a language one. The consent sentence is the one to read hardest, for the
  same reason the request form's is: it is the promise the reader agrees to. Register was split
  where it had to be, `subBodyJournal` taking คุณ and `subBodyHost` taking ท่าน, and every key
  shared by the two outlets is written without a pronoun in Thai. That split is the thing a native
  read is most likely to find fault with.
- **The reading time is calibrated, not measured (15/11/2026).** `readingMinutes` in
  `src/lib/editorial.ts` counts English in words at 225 a minute and Thai and Chinese in characters
  at 1,000 and 400. The three rates were set so the three versions of one piece report roughly the
  same length, which is the only check available: the same article now shows 8, 8 and 7 minutes.
  Thai shipped at 350 a minute for an hour on 15/11/2026 and announced a 24-minute read against the
  English page's 8. If a piece is ever published in one language and not translated, that check is
  gone and the rate behind its number is a guess.

- ~~**The homepage hero's desktop scrim no longer carries the standfirst (15/11/2026).**~~
  Resolved 15/11/2026 by rebuilding that scrim on px stops instead of percentages. The lantern
  photograph replaced the Lotus House living room in the hero the same day, and the horizontal
  scrim at 900px and up had been tuned over a flat white wall. Against a night frame the
  standfirst measured 3.4 to 1 at 900, 3.3 at 1024, 4.4 at 1152 and 4.4 at 1440 against the 4.5
  WCAG AA asks for body text, per glyph on the running site, with about 3 percent of its own
  pixels under the line at the two narrow widths. It was worst at 1024, not at 1440, because the
  text column is a fixed width, 48px of padding plus at most 470 for the standfirst, while the
  panel grows with the viewport: the narrower the panel, the further along the gradient's falloff
  the copy's right end sits. Raising the percentage stops cleared the numbers and emptied the
  picture, since 0.50 at the 58 percent stop lands on the temple at 1440 and leaves a near-black
  panel. The stops are now `0.88 0px, 0.84 300px, 0.72 520px, 0.10 800px, 0.06 100%`, which holds
  the ink over the text column at every width and spends it by 800px. Per glyph the standfirst
  now measures 8.5 at 900, 7.6 at 1024, 7.7 at 1152, 6.3 at 1440 and 8.2 at 1920, the headline
  5.1 at worst against its 3.0, and the right of the frame carries less ink than the percentage
  scrim ever gave it. A percentage gradient behind a fixed-width text column is the shape of this
  bug.

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
  `/Users/paulb/code/whatsapp-bridge`. ~~Open: the privacy policy does not yet say guest
  WhatsApp messages are stored with Upstash, and nothing expires old conversations beyond the
  500-message cap per guest.~~ Both closed 13/11/2026 in `52e096c`: the policy carries a
  WhatsApp paragraph naming Upstash and Singapore, a line for Upstash under "Who else sees
  it" and a retention sentence, and `RETENTION_SECONDS` in `src/lib/whatsapp-store.ts`
  expires a conversation 365 days after its most recent message, which is the twelve months
  the policy promises, and prunes the index on the read path. Checked on the live site in all
  three languages 16/11/2026.
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
- ~~**No phone number or LINE ID published.**~~ Out of date, found 21/11/2026. The LINE
  Official Account is linked from the footer since 15/11/2026 (`b2879f5`, `LineFooterLink`),
  and the business line `CONTACT_TELEPHONE` is in the `LocalBusiness` node since 01/11/2026
  (`80f051e`). Still true: no phone number is printed on any page, and name, address and email
  have to match the Google Business Profile character for character.
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
- **The `LocalBusiness` node has no `geo`, `openingHours` or `sameAs`.** (`telephone` is set,
  see the entry above.) Each is
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
- **Nobody has confirmed the LINE account receives anything (15/11/2026).** `LINE_BASIC_ID` in
  `src/lib/site.ts` is `@555ampnu`, published by the footer link and by the add-us panel under
  the two forms that carry a real enquiry, contact and renter request, once they are sent. The
  panel serves the account's own QR from `public/line-qr.png`. The newsletter signup carries
  neither, deliberately: an email address is not an enquiry, so LINE follows a requirement or
  it does not follow at all. Verified live: the footer link is on the English, Thai and Chinese
  pages and the QR answers 200, and the ID and the QR are the same account, proven by opening
  the add-friend link and comparing the QR LINE itself serves for it. Not verified: that a
  message sent to the account reaches anybody, and the panel on the live site, which needs a
  real submission to see. `page.line.me/555ampnu` returns no public profile, so the account is
  either not searchable in LINE or not finished, and a channel nobody can find by name is half
  a channel. The Thai and Chinese of the five `line*` strings have had no native read.
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
  "talk to us" prompt, but checked directly against agentsiam.com on 12/09/2026 and again on
  16/11/2026: no `wa.me` link anywhere on the page, and the variable is absent from the
  Vercel production environment. Every WhatsApp call to action on the live site is currently
  invisible by design, per the component's own comment ("Unset hides every WhatsApp call to
  action"), not broken. It quietly changes a second button as well: the homepage builds "Book
  a video viewing" as a WhatsApp link where the number is configured and falls back to
  `/house-for-rent-chiang-mai#request` where it is not, so that button opens the monthly
  rental form rather than a chat.
  **The number exists and the channel does not.** +66 98 331 8083 was opened for AgentSiam
  and confirmed 13/11/2026 as the one to publish, `66983318083` as the variable, digits only
  with the country code and no plus. Setting the variable is the last step rather than the
  fix: the number has first to be moved onto the Cloud API app at Meta, which the bridge's
  own README still records as carrying Meta's test number, and added to the Google Business
  Profile in the form the site will carry. The ordered steps and the traps are in
  `/Users/paulb/code/agentsiam/handoff-whatsapp-channel.md`.
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
  one. `/house-for-rent-chiang-mai` has its own. Both use the Lotus House living room, not
  the terrace tub shot, and read their words from the English dictionary (`heroEyebrow`, `heroTitleA`, `heroTitleB`, `hfrEyebrow`, `hfrH1`), so they
  cannot drift from the pages. The owner pages (`/how-it-works`, `/business-services`, the
  licence page) keep the owner card on purpose. `src/lib/og-photo-card.tsx` is the shared
  renderer. The five older cards still carry their own copy of the wordmark and could adopt it.

- **The hero photograph is atmosphere on a phone, not a picture (15/11/2026).** Both frames are
  now the same house: `src/photos/_hero/house_garden_hero_wide.jpg` at 900px and up, and
  `house_garden_hero_portrait.jpg`, a 9:16 crop of it, below that. The wide one is composed for
  the one window the panel leaves clear, the right half between 18% and 55% down, which is where
  the roof and upper storey sit, and it reads. The phone cannot: the panel there is 335x1019, the
  copy covers y 48 to 397 under 0.74 to 0.66 of ink and the three opaque cards cover y 433 to 971,
  so 90% of the frame is behind something. Trimming the sky out of the crop puts the roof and the
  upper storey behind the copy instead of flat grey, which is as far as the frame alone goes;
  lightening the scrim past 0.60 drops the standfirst under 4.5 to 1 over the pale wall. Showing
  the house on a phone means giving the photograph a band of its own above the copy, which is a
  layout change to the hero and has not been made. The scrims were not retuned for the daylight
  frame and did not need to be: on a wide screen the headline holds 5.6 to 1 at worst and the
  standfirst 6.8, against AA's 3.0 and 4.5.

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
