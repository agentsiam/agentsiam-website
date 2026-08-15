# Handoff: AgentSiam website — guest booking portal + owner conversion path

## Overview

AgentSiam is a short-term-rental management company in Chiang Mai, Thailand. This design covers a
single website serving two audiences without splitting into two sites:

- **Guests** browse and book stays at properties AgentSiam manages. Conversion goal: a completed
  booking (payment is taken by Beds24, not by us).
- **Property owners** decide whether to trust AgentSiam to run their rental. Conversion goal: book a
  paid feasibility study via the contact form.

The homepage leads with the guest search (a booking portal, not a brochure) and forks owners out to
`/how-it-works` via an explicit band plus an outlined nav CTA. Property and destination pages are
guest-facing entry points reachable from search without ever passing through owner content.

The design's whole argument is **verifiable honesty**: the feasibility study can end in a No-Go, the
qualifier tells unsuitable owners "no" before they pay, exclusions are printed next to inclusions,
and no claim is made that a reader could not check. Preserve that when implementing — softening the
"no" answers into lead capture breaks the product.

## About the design files

The files in this bundle are **design references created in HTML**. They are prototypes that show
intended structure, layout and behaviour. They are **not production code to copy**.

The task is to recreate these designs in the target codebase's own environment — React, Next.js, Vue,
Astro, whatever is established — using its existing patterns, routing, i18n and component libraries.
If no codebase exists yet, choose an appropriate framework. A server-rendered framework with real
per-language routes is strongly preferred here for search reasons (see *Open decisions*).

Two of the files are also useful as documents in their own right:

- `AgentSiam Portal Wireframe v2.dc.html` is the **annotated source of truth** for IA, block
  sequence, CTA hierarchy and rationale. Read it first. It records *why* each decision was made and
  which questions are still open.
- `AgentSiam Portal Prototype.dc.html` is the **clickable prototype** — the same structure resolved
  into a working interface with real navigation, filters, a map, and a simulated booking flow.

Both open directly in a browser. They need `support.js`, `i18n.js` and `properties.js` beside them.

## Fidelity

**Mixed, deliberately.**

- **Wireframe (`… Wireframe v2.dc.html`) — low fidelity.** Annotated blocks, not visual design. Use
  it for structure, sequence, CTA hierarchy and content decisions only.
- **Prototype (`… Prototype.dc.html`) — medium-to-high fidelity.** Colours, type, spacing, radii and
  interaction behaviour are real and taken from the AgentSiam design system. Treat these as correct.
  The exceptions, which are **not** final and must not be shipped as-is:
  - **All imagery is placeholder.** No real photography of these properties exists yet. Every image
    slot is a flat brand-colour block. Do not substitute stock photography — the honesty argument
    dies the moment the site shows a house that is not the house.
  - **Icons are typographic glyphs.** An icon set has not been chosen.
  - **The map is a schematic**, not a real map (see *The map*).
  - **All property data is invented.** 20 fictional Chiang Mai properties for layout purposes.
  - **Legal pages are deliberately empty stubs.** No invented terms or privacy text. Real copy must
    come from counsel.

## Routes / screens

Client-side screen state in the prototype; these are the intended URLs.

| Route | Screen | Audience | Primary CTA |
|---|---|---|---|
| `/` | Home | both (guest-led) | Search |
| `/properties` | Search results — split list + map | guest | Open a property |
| `/<property-slug>` | Property detail + booking | guest | Check availability / Book |
| `/checkout` | Booking handoff to Beds24 | guest | Pay (leaves to Beds24) |
| `/booking/confirmed` | AgentSiam-branded confirmation | guest | — (post-conversion) |
| `/destinations/<area-slug>` | Neighbourhood page | guest (+ owner tail) | Browse that area |
| `/how-it-works` | Owner conversion page | owner | Book a feasibility study |
| `/contact` | Enquiry form | owner | Send |
| `/business-services` | 4 consulting pillars | secondary | Contact |
| `/terms`, `/privacy` | Legal stubs | — | — |

### Global chrome

**Header** — sticky, white, 1px bottom hairline, 72px tall, content max-width 1440px, 20px side
padding. Left: wordmark. Centre-left: nav — **Guests · Destinations · Property Owners**. Right:
language segmented control (`EN / ไทย / 中文`), `List your property` (outlined pill), `Contact`
(solid ink pill). Nav items are labelled by *audience*, not by content, so a visitor sorts themselves
before reading anything.

**Footer** — ink `#14141C`, columns: Stay (All properties, Destinations) · For owners (How it works,
Contact, Business Services) · Company · Legal (Terms, Privacy) · Areas we manage (all 8
neighbourhoods, for search). Footer uses *descriptive* labels, not the audience labels — "How it
works" reads wrong under a "Stay" heading. Business Services appears **only** here; it must never be
promoted to primary nav (no active clients yet).

### `/` — Home, block sequence

1. **Hero** — full-width ink/blue panel, 16px radius, inset 20px from viewport, with a `#D9B16B`
   stripe occupying the right ~24%. Eyebrow pill → 42–56px Unbounded headline → subhead → **search
   bar**. The headline is guest-facing.
2. **Search bar** — white card overlapping the hero's lower edge. Fields: `Where` (city dropdown:
   Chiang Mai live; Bangkok and Phuket present but marked *launching soon* and unselectable) ·
   `Check-in` · `Check-out` · `Guests` (± stepper) · **Search** (oversized solid pill, larger than a
   field-height control — it is the page's single primary CTA).
3. **Owner fork band** — one line, an honest sentence, one text link to `/how-it-works`. Low visual
   weight on purpose. Not a competing primary CTA.
4. **Featured properties** — 3–4 tiles, same tile component as search results.
5. **Destinations** — neighbourhood cards, each linking to its area page.
6. **Social proof** — portfolio rating and count on the left of the section header, `‹ ›` arrows on
   the right. Below, a horizontal snap-scrolling rail of 8 review cards, 300px fixed width, swipeable
   on touch. **Each card links to its property** and shows the host portrait slot, host first name,
   property title and neighbourhood. A review is always attached to a person and a place.
7. **Owner staircase teaser** — the three services, compressed, ending in one CTA to `/how-it-works`.
8. **Closing guest CTA** — back to search.

### `/properties` — search results

Split view: **filters bar across the top; list left (~58%), map right (~42%, sticky)**. Filters:
neighbourhood chips, property type, bedrooms, price range, guests. Result count and active-filter
count always visible, with a clear-all.

Tiles carry: image slot, title, neighbourhood, type, bedrooms/guests, rating, nightly rate, and
**distance to the city centre in kilometres** (computed from the pin against Tha Phae Gate). The
distance badge replaced a photo count — it answers a question a guest actually has.

Hovering a tile highlights its pin and vice versa. Selecting a pin scrolls its tile into view.

### The map

The prototype's map is a **schematic**: pins positioned by linear interpolation of lat/lng into a
percentage box over a stylised background, with three zoom levels and clustering (nearby pins merge
into a count badge; clusters snap to a grid cell centre and colliding clusters are dropped so labels
never overlap).

For production, replace with a real map (MapLibre GL with a vector tile source, or Google Maps).
Keep: the clustering behaviour, the list↔pin hover linkage, the price-bearing pin labels, and the
"search this area" idea. The pin coordinates in `properties.js` are real Chiang Mai coordinates and
can be reused for testing.

### `/<property-slug>` — property detail

1. Breadcrumb, title, neighbourhood, rating, distance to centre.
2. **Gallery** — 1 large + 4 small image slots, all placeholder blocks.
3. Two-column body: content left, **sticky booking panel right**.
4. Content sequence: highlights → description → amenities (grouped) → **the honest section** ("what
   this place is not") → `Your host` block (portrait slot, first name, bio, response time,
   languages, hosting since) → house rules and check-in times → cancellation policy → reviews →
   neighbourhood → property-level FAQ.
5. **Booking panel** — nightly rate, `Check-in` / `Check-out`, guests, then a live cost breakdown
   (nights × rate, cleaning fee, any long-stay discount, total). Single primary CTA. States: no dates
   → *Check availability*; dates chosen → *Book*; unavailable → an explanatory line, not a dead
   button.

The `Your host` data comes from **one shared source** with the homepage review rail, so the two
cannot drift apart. Implement it as one data source, not two.

### Booking flow — the important part

```
property page  →  /checkout  →  Beds24 (payment)  →  webhook → middleware  →  /booking/confirmed
```

- **`/checkout`** is AgentSiam-branded: trip summary, guest details, cost breakdown. It hands off to
  Beds24 for payment only.
- **Beds24 owns money and calendar.** It is the system of record for availability, rates and payment.
  Do not reimplement any of that.
- **A middleware layer owns the HTML.** Beds24 posts booking data to our own endpoint; that endpoint
  renders the confirmation state, the confirmation email and any post-booking pages, so the guest
  never sees Beds24's own templates. Beds24 is the payment landing, not the presentation layer.
- **`/booking/confirmed`** is ours: booking reference, property, dates, guests, total paid, check-in
  instructions, host contact, what happens next, and a calendar add. Must survive a page refresh
  (state comes from the booking reference, not from client memory).
- Failure paths need designing: payment declined, session timeout, and the dates being taken between
  page load and payment.

### `/how-it-works` — the owner conversion page

This replaced a separate About page; there is no `/about`. Sequence:

1. **Hero** — "We tell you whether to do this before we ask to run it." Primary CTA *Book a
   feasibility study*; secondary text link scrolls to the qualifier.
2. **The staircase** — three steps, each a two-column card: coloured left panel (step number, name,
   meta) and a right panel with body, a *What you get* list, and a **"Not included, so there are no
   surprises"** box in warm red. The three steps are Feasibility & ROI study (ends in a Go or a
   No-Go) → Vacation rental permission (the step most managers skip) → Vacation rental management
   (ongoing, no lock-in).
3. **Value props** — "What the fee actually buys", 4 columns + one CTA: *Legal, not just listed* ·
   *A team in Chiang Mai* · *Numbers before contracts* · *Channels, plus your own*. Every claim is
   checkable. No "state-of-the-art technology", no "exceptional service".
4. **The two gates** — dark panel, two columns. Gate one (*your side*): at cautious occupancy,
   short-let must beat a long-term tenant, judged against a real local comparable. Gate two (*our
   side*): the property must be worth managing properly, and we will say if we are the wrong size of
   manager. This is the block that makes the No-Go credible.
5. **The qualifier** — 4 questions (property type, bedrooms, neighbourhood, private pool) and a
   sticky verdict card that changes tone and colour with the answer: green for a fit, red for a
   genuine no (condos: the non-hotel exemption does not cover them; one-beds: usually lose to a
   tenant), gold for conditional. The "no" verdicts must stay real — a couple of them offer a
   lower-commitment link, none of them pretend the answer was yes.
6. **Included / not included** — side by side, stating the arrange-vs-pay boundary: we arrange and
   supervise cleaning, laundry, maintenance and vendors; the owner pays those suppliers directly.
7. **TM30 block** — gold panel. Foreign-guest Immigration reporting is included; most contracts hand
   it back to the owner.
8. **Owner FAQ** — accordion, covering fees, contract length, exclusions and the No-Go.
9. **Closing CTA** — *Book a feasibility study*, then one low-weight guest cross-link.

**No prices anywhere on this page.** Prices live only in the internal price book.

### `/contact`

Two columns: form left, "what happens next" right (3 numbered steps: we reply within two working
days → a call, then a site visit if viable → a written report including the case against). Fields
include property type, neighbourhood, bedrooms, and a message field hinting at size / furnishing /
anything unusual. One primary CTA. A note redirects guests with booking questions to the property
page's enquiry form, which carries their dates.

## CTA hierarchy rule

Every page has **exactly one primary CTA** plus at most one same-audience secondary. Cross-audience
links are a third, lower tier: plain text, never a button. The rule settled during review is that
**"secondary" always means same-audience**; the cross-audience link is always the third tier. Do not
let a cross-audience link acquire button styling.

## Internationalisation

Three languages: **English (source), Thai, Chinese**. Per-key fallback to English, so a missing
translation degrades to readable rather than blank.

**Translated:** all chrome, nav, search, filters, CTAs, section headings, forms, footer, plus place
names (清迈 / เชียงใหม่ and all eight neighbourhoods) and property types. **English strings remain
the internal keys**, so filtering, routing and data joins are language-independent — keep that.

**Deliberately not translated:** property descriptions, FAQ answers and host bios. These carry the
honesty argument and the owner/guest registers differ per language, so they need human translation.
A banner names what is pending rather than silently serving English.

`i18n.js` holds all three dictionaries and is the starting point for whatever i18n library the target
codebase uses.

## Design tokens

**Colour**

| Token | Hex | Use |
|---|---|---|
| Ink | `#14141C` | text, dark panels, primary buttons |
| Blue | `#0100DD` | primary brand, hero, accents |
| Gold | `#D9B16B` | hero stripe, TM30 panel, conditional verdict |
| Teal | `#00B4B1` | inclusion ticks, positive verdict |
| Orange-red | `#FB5932` | exclusions, negative verdict |
| Pink | `#F7ACC6` | image-slot rotation |
| Muted text | `#5B5B6B` | secondary copy |
| Body text | `#2A2A33` | paragraphs |
| Off-white | `#F6F6FB` | panel fills |
| Wash: green / red / gold | `#EAFBFA` / `#FFF3EF` / `#FDF8EE` | verdict and callout backgrounds |
| Deep green / deep red | `#00745F` / `#B93B18` | labels on the washes |
| Hairline | `rgba(24,24,24,0.12)` | borders and dividers |

Image slots use **solid** brand fills. A gradient fading to white was tried and rejected — on a 4:3
tile it reads as blank. Gradients belong only behind panels that have content on top of them.

**Type** — `Unbounded` 800 for hero headlines (−0.03em); `Poppins` 700 for section headings
(−0.02em); `Poppins` / system sans 400–600 for body at 14–16px, line-height 1.55–1.65;
`IBM Plex Mono` uppercase 10.5–12px, letter-spacing 0.07–0.08em for eyebrows and labels.

**Other** — radii: 999px pills, 16px cards and panels, 12px inner boxes. Spacing on an 8px-ish
scale (7 / 9 / 16 / 20 / 26 / 32 / 56 / 64px in practice). Content max-widths: 1440px chrome, 1080px
prose sections. Transitions 0.18s on colour and background only; no decorative motion. Sticky
offsets 90–92px, clearing the header.

## Responsive

One real breakpoint at **900px**. Card grids use `repeat(auto-fit, minmax(…, 1fr))` so they reflow
continuously rather than snapping. At and below 900px: search bar stacks into labelled rows with a
full-width button; hero stripes drop; headline scales with viewport; the results split view becomes a
list with a "Show map" toggle; property and checkout panes stack; checkout puts the trip summary
above the form; sticky positioning is disabled anywhere it would trap content on a short screen.

## Open decisions the implementer must resolve

1. **Localised URLs.** Language is component state in the prototype. Production needs indexable
   per-language paths (`/th/…`, `/zh/…`) plus `hreflang`. Decide before launch — retrofitting routing
   is expensive.
2. **`Property Owners` and `List your property` both point at `/how-it-works`.** One should go.
3. **Icon set** not chosen.
4. **Real map provider** not chosen.
5. **Booking failure states** not designed.
6. **Legal copy** must come from counsel, not from us.
7. **Photography.** Everything waits on a real shoot. Until then, placeholder blocks only.

## Assets

None. No photography, no icon files, no logo files. All imagery is a CSS colour block; all icons are
typographic glyphs. Fonts are Google Fonts (`Unbounded`, `Poppins`, `IBM Plex Mono`).

## Files in this bundle

| File | What it is |
|---|---|
| `AgentSiam Portal Wireframe v2.dc.html` | Annotated wireframe — the IA and rationale source of truth. Read first. |
| `AgentSiam Portal Prototype.dc.html` | Clickable prototype — structure, styling and interaction. |
| `i18n.js` | EN / TH / ZH string dictionaries. |
| `properties.js` | 20 invented Chiang Mai properties with real coordinates, plus the neighbourhood definitions. |
| `support.js` | Runtime that renders the two `.dc.html` files in a browser. Not part of the design; not needed in the target codebase. |

Open either `.dc.html` in a browser with the other files beside it.
