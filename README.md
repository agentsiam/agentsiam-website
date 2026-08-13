# agentsiam-website

Website for AgentSiam. Next.js 16 (App Router) + TypeScript + Tailwind v4, scaffolded
28/07/2026.

**Status: built, not deployed.** Eight routes, a nav and footer, the filed SVG wordmark, and
full metadata. Pushed to `github.com/agentsiam/agentsiam-website` (`main`). Not connected to
Vercel, and **not ready to go live** — see "Before this can be deployed" below.

## Routes

| Route | State |
|---|---|
| `/` | Real. Hero, three-step staircase, Lotus House feature. |
| `/how-it-works` | Real. The three services in detail. |
| `/lotushouse` | Real copy. No photography and no Beds24 booking embed yet. |
| `/contact` | Real. Client-side lead form, not wired to a backend. |
| `/business-services` | Real. The four non-STR service pillars. |
| `/terms-and-conditions` | Draft text, not reviewed by counsel. |
| `/about` | **Placeholder.** No founder bios. `noindex`, excluded from the sitemap. |
| `/privacy-policy` | **Placeholder.** Live text not ported. `noindex`, excluded from the sitemap. |

Routes are declared once in `src/lib/site.ts`. Adding a page there adds it to the sitemap.
Flip a route's `placeholder: true` when its real copy lands and it starts being indexed.

## Metadata and SEO

- `src/lib/site.ts` holds the canonical URL, share copy, and the route list. The domain is
  written down once.
- `NEXT_PUBLIC_SITE_URL` overrides the canonical host, so a Vercel preview advertises its own
  URL rather than production. Falls back to `https://www.agentsiam.com`.
- `src/app/opengraph-image.tsx` generates the 1200x630 share card at build time from the
  design-system colours and the filed wordmark, rather than a hand-exported PNG that drifts.
- `sitemap.ts`, `robots.ts` and `not-found.tsx` are all present.
- Not multilingual yet. Thai copy needs a locale segment plus `alternates.languages`, not just
  the Noto Sans Thai font that is already loaded.

## Where the design comes from

This is a separate repo from AgentSiam's business/content repo (`agentsiam-consulting`), kept
separate on purpose so public-facing source code doesn't sit alongside confidential business
content (pricing, revenue strategy, compliance findings). The design system, colour tokens, voice
rules, and draft copy this site is built from live there:

- `as-context/06-design-system/design-system.html` — component spec, colours, type, layout patterns
- `as-context/06-design-system/visual-language.json` / `hard-rules.json` — imagery rules
- `as-context/00-company/tone-of-voice.md` — copy voice
- `as-salesmarketing/04-collateral/website-positioning/website-content-outline.md` — draft hero +
  pillar copy
- `as-salesmarketing/04-collateral/website-positioning/terms-and-conditions-DRAFT.md` — placeholder
  T&Cs, not legal-ready

Those paths are on the machine that has both repos checked out side by side, and won't resolve for
anyone who only has this repo. Copy values in rather than referencing across repos at build time.
The tokens currently live in `src/app/globals.css` and are kept in sync by hand — if
`design-system.html` changes, that file goes stale until someone re-ports it.

## Booking

Short-term rental booking will be handled via Beds24's own hosted booking widget/iframe (Settings
→ Booking Page → Booking Widgets → Iframe Generator on the Beds24 dashboard), embedded rather than
built from scratch. A fully custom booking UI against Beds24's REST API v2 is a later, separate
project — it needs a server-side token proxy (Vercel API routes) and webhook handling, out of scope
here.

## Known gaps

- The contact form does not submit anywhere. It needs a handler or a form service.
- No photography anywhere. The property library was found to be generic international stock and
  removed, per the design system's "no stock, no fake mockups" rule.
- No analytics, no cookie banner. Both matter before launch given the privacy-policy gap.

## Getting started

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Before this can be deployed

`www.agentsiam.com` is **already live** and running the older business-consulting positioning
("Scale your business in Thailand"), with Business Consulting / Digital & Online Presence /
Operation Automation & AI / Business and Growth Alignment in the nav. This repo is a different
site: short-term rental first, with those four services demoted to `/business-services`.
Deploying to the apex domain replaces the live site. That is a positioning decision for Paul and
Nils, not a deploy step.

Hard blockers, in order:

1. **Four developer notes are rendered to real visitors.** `/about` ("TODO — placeholder"),
   `/privacy-policy` ("TODO — not ported yet"), `/lotushouse` ("No photography yet",
   "Booking widget not wired yet"), `/terms-and-conditions` ("Draft, not legal-ready"). These
   are honest internally and unshippable externally.
2. **The contact form does not submit.** It sets local state and prints "Form UI only — nothing
   was actually sent." A lead-gen site whose only conversion path is a dead form is worse than
   no site. Needs an API route plus email delivery, or a form backend.
3. **The privacy policy is a stub while a form collects personal data.** Owner, guest and lead
   data. Port the live text before the form goes live, not after.
4. **T&Cs have not been through counsel.** The short-term-rental clauses are new.
5. **No photography.** The property library was found to be generic international stock and
   removed, per the design system's "no stock, no fake mockups" rule.

Then, the deploy itself: connect the GitHub repo to Vercel, set `NEXT_PUBLIC_SITE_URL` on
preview deployments so previews don't advertise the production canonical, ship to a preview URL
first, and only repoint DNS once the list above is clear.

**Committing from this checkout fails.** The repo lives in Google Drive, and git cannot write
`.git/index.lock` through the Drive sync layer ("Operation not permitted"). Commit and push from
a normal Finder/terminal session, or move the checkout out of Drive.
