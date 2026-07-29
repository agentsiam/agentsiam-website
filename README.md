# agentsiam-website

Website prototype for AgentSiam. Next.js (App Router) + TypeScript + Tailwind, scaffolded
28/07/2026 to validate the GitHub → Vercel deploy pipeline before any real components are built.

**Status: blank scaffold.** This is intentionally still the default `create-next-app` starter
page, not the real homepage — that's the next step, not this one.

## Where the design comes from

This is a separate repo from AgentSiam's business/content repo (`agentsiam-consulting`), kept
separate on purpose so public-facing source code doesn't sit alongside confidential business
content (pricing, revenue strategy, compliance findings). The design system, color tokens, voice
rules, and draft copy this site will be built from live there:

- `as-context/06-design-system/design-system.html` — component spec, colors, type, layout patterns
- `as-context/06-design-system/visual-language.json` / `hard-rules.json` — imagery rules
- `as-context/00-company/tone-of-voice.md` — copy voice
- `as-salesmarketing/04-collateral/website-positioning/website-content-outline.md` — draft hero +
  pillar copy
- `as-salesmarketing/04-collateral/website-positioning/terms-and-conditions-DRAFT.md` — placeholder
  T&Cs, not legal-ready

These paths are on the machine that has both repos checked out side by side — they won't resolve
for anyone who only has this repo. Copy the relevant values in rather than referencing across repos
at build time.

## Booking

Short-term rental booking will be handled via Beds24's own hosted booking widget/iframe (Settings
→ Booking Page → Booking Widgets → Iframe Generator on the Beds24 dashboard), embedded rather than
built from scratch. A fully custom booking UI against Beds24's REST API v2 is a later, separate
project — it needs a server-side token proxy (Vercel API routes) and webhook handling, out of scope
for this prototype.

## Getting started

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Deploy

Not yet connected to GitHub or Vercel — see the parent conversation / project notes for the
planned next step.
