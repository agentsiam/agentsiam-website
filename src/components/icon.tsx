/**
 * The site's icon set.
 *
 * The design system carries no icon set. Paul authorised introducing one on 25/08/2026,
 * with a spec that is deliberately narrow: stroke-only SVG paths drawn by hand, never a
 * library; `fill="none"`, `stroke="currentColor"`, width 1.8, round caps and joins, a
 * 24x24 viewBox, rendered around 19px; `currentColor` always, because an icon is not a
 * place to introduce a hue; always inside a chip and never bare on the page; the chip
 * `aria-hidden`, because an icon carrying meaning the text does not is a bug; and literal
 * rather than metaphorical -- a house means a property, a magnifier means finding
 * something out. If a shape needs explaining it is the wrong shape.
 *
 * The first four glyphs (trend, search, house, transfer) were drawn for the route cards on
 * /how-it-works and lived in that file. They moved here when the second page wanted one,
 * which is the moment a private set becomes a shared one. The spec's own instruction is to
 * extend by adding to the existing set rather than starting a second one somewhere else,
 * so this file is that set and there is not another.
 *
 * Nothing here is decorative filler. Every glyph below is used; an unused glyph is a shape
 * nobody checked against the spec.
 */
import type { ReactNode } from "react";

export const ICON_PATHS: Record<string, ReactNode> = {
  // Earning already -- a rising line.
  trend: (
    <>
      <polyline points="3 16.5 9.5 10 13.5 14 21 6.5" />
      <polyline points="15.5 6.5 21 6.5 21 12" />
    </>
  ),
  // Listed but underperforming -- a question to diagnose.
  search: (
    <>
      <circle cx="11" cy="11" r="6.25" />
      <line x1="15.6" y1="15.6" x2="20.5" y2="20.5" />
    </>
  ),
  // Nothing yet -- the property itself.
  house: (
    <>
      <path d="M3.75 10.75 12 4.25l8.25 6.5" />
      <path d="M5.75 12.4V19.25h12.5V12.4" />
    </>
  ),
  // Held elsewhere -- a handover.
  transfer: (
    <>
      <path d="M3.75 8.75h14.5" />
      <polyline points="15 5.5 18.25 8.75 15 12" />
      <path d="M20.25 15.25H5.75" />
      <polyline points="9 12 5.75 15.25 9 18.5" />
    </>
  ),

  // -- amenities. Literal objects, because an amenity list is the one place a reader
  //    scans shapes rather than words.

  // A bed: frame, mattress, pillow.
  bed: (
    <>
      <path d="M3.25 18.25V7.75" />
      <path d="M3.25 12.25h17.5v6" />
      <path d="M20.75 15.25H3.25" />
      <path d="M6.5 12.25v-2.5h4.75v2.5" />
    </>
  ),
  // A bath: tub, tap, feet.
  bath: (
    <>
      <path d="M3.25 12.25h17.5v2a4 4 0 0 1-4 4h-9.5a4 4 0 0 1-4-4z" />
      <path d="M6 12.25V6.5a1.75 1.75 0 0 1 3.5 0" />
      <path d="M6.75 18.25 5.75 20.5" />
      <path d="M17.25 18.25l1 2.25" />
    </>
  ),
  // A hob and a pan handle: a kitchen you cook in, not a kitchenette.
  kitchen: (
    <>
      <rect x="3.75" y="8.25" width="16.5" height="11" rx="2" />
      <path d="M3.75 12.25h16.5" />
      <circle cx="8" cy="15.75" r="1.5" />
      <path d="M7.5 8.25V4.75" />
      <path d="M12.5 8.25V4.75" />
    </>
  ),
  // Wi-Fi: three arcs and a dot.
  wifi: (
    <>
      <path d="M4.5 10.25a10.5 10.5 0 0 1 15 0" />
      <path d="M7.5 13.5a6.25 6.25 0 0 1 9 0" />
      <path d="M10.4 16.6a2.25 2.25 0 0 1 3.2 0" />
      <circle cx="12" cy="19.25" r="0.6" />
    </>
  ),
  // A screen on a stand.
  screen: (
    <>
      <rect x="3.25" y="4.75" width="17.5" height="11.5" rx="2" />
      <path d="M9 19.75h6" />
      <path d="M12 16.25v3.5" />
    </>
  ),
  // A car under a roof: gated parking.
  parking: (
    <>
      <path d="M3.5 15.25h17" />
      <path d="M5.25 15.25 7 10.25h10l1.75 5" />
      <path d="M4.75 15.25v3.25" />
      <path d="M19.25 15.25v3.25" />
      <circle cx="7.75" cy="15.25" r="0.6" />
      <circle cx="16.25" cy="15.25" r="0.6" />
      <path d="M3.5 7.25 12 3.5l8.5 3.75" />
    </>
  ),
  // A safe: box, dial, hinge.
  safe: (
    <>
      <rect x="3.75" y="4.75" width="16.5" height="14.5" rx="2" />
      <circle cx="12.75" cy="12" r="3.5" />
      <path d="M12.75 8.5v-1" />
      <path d="M7 4.75v14.5" />
    </>
  ),
  // A terrace: a rail with a plant beside it.
  terrace: (
    <>
      <path d="M3.25 19.25h17.5" />
      <path d="M4.75 19.25V11h9.5v8.25" />
      <path d="M4.75 14.5h9.5" />
      <path d="M9.5 11v8.25" />
      <path d="M18 19.25c0-3 -1.5-4.25 0-6.5 1.5 2.25 0 3.5 0 6.5z" />
    </>
  ),

  // -- orientation and process.

  // A pin: where a thing is.
  pin: (
    <>
      <path d="M12 21.25s6.5-5.6 6.5-10.25a6.5 6.5 0 0 0-13 0C5.5 15.65 12 21.25 12 21.25z" />
      <circle cx="12" cy="10.75" r="2.5" />
    </>
  ),
  // A person walking: a distance you cover on foot.
  walk: (
    <>
      <circle cx="13.25" cy="4.75" r="1.75" />
      <path d="M13 9.25 10 11.5l1.5 3.75" />
      <path d="M13 9.25l3 1.75 1.5 3" />
      <path d="M11.5 15.25 9.75 20.75" />
      <path d="M11.5 15.25l2.75 2 .75 3.5" />
    </>
  ),
  // A clock: a time, a hold, a response window.
  clock: (
    <>
      <circle cx="12" cy="12" r="8.25" />
      <path d="M12 7.25V12l3.25 2" />
    </>
  ),
  // A document with a rule through it: the written report, the permission, the record.
  document: (
    <>
      <path d="M6.25 3.75h7.5l4.5 4.5v12h-12z" />
      <path d="M13.75 3.75v4.5h4.5" />
      <path d="M8.75 13h6.5" />
      <path d="M8.75 16.25h4.5" />
    </>
  ),
  // A shield: protection, deposit, cover.
  shield: (
    <>
      <path d="M12 3.5 5.25 6.25v5.5c0 4.25 2.9 7.4 6.75 8.75 3.85-1.35 6.75-4.5 6.75-8.75v-5.5z" />
      <polyline points="9.25 11.75 11.25 13.75 15 10" />
    </>
  ),
  // Two speech marks facing each other: a conversation with a person, not a ticket queue.
  talk: (
    <>
      <path d="M8.25 15.75H6.5a2.75 2.75 0 0 1-2.75-2.75V7.5A2.75 2.75 0 0 1 6.5 4.75h8a2.75 2.75 0 0 1 2.75 2.75v1" />
      <path d="M20.25 18.5a2.25 2.25 0 0 1-2.25 2.25h-6.5l-3 2v-2h-.25A2.25 2.25 0 0 1 6 18.5v-4.25a2.25 2.25 0 0 1 2.25-2.25h9.75a2.25 2.25 0 0 1 2.25 2.25z" />
    </>
  ),
  // A key: the handover, the direct booking, the thing the guest actually receives.
  key: (
    <>
      <circle cx="7.75" cy="15.75" r="3.5" />
      <path d="M10.5 13.5 19 5" />
      <path d="M16.25 7.75 18.5 10" />
      <path d="M14 10l2.25 2.25" />
    </>
  ),
  // A tag: what a thing costs, and on what basis.
  tag: (
    <>
      <path d="M11.25 3.75H20.25v9l-8.5 8.5-9-9z" />
      <circle cx="16.25" cy="7.75" r="1.5" />
    </>
  ),
  // A stamp/seal: the compliance side. A rounded mark over a base line.
  seal: (
    <>
      <circle cx="12" cy="9.25" r="4.5" />
      <path d="M9 13.25 8.25 17.25h7.5L15 13.25" />
      <path d="M5.25 20.25h13.5" />
    </>
  ),
  // A camera: the photography service.
  camera: (
    <>
      <path d="M3.75 8.75h3l1.5-2.5h7.5l1.5 2.5h3v10.5h-16.5z" />
      <circle cx="12" cy="13.5" r="3.25" />
    </>
  ),
  // A ruler and pencil crossed: the design and upgrade service.
  design: (
    <>
      <path d="M3.75 16.5 16.5 3.75l3.75 3.75L7.5 20.25l-4.5.75z" />
      <path d="M13.75 6.5 17.5 10.25" />
      <path d="M9.75 10.5l2 2" />
    </>
  ),
  // A broom: turnover and housekeeping.
  broom: (
    <>
      <path d="M14.25 3.75 9.5 8.5" />
      <path d="M7.25 10.75 13.25 4.75l3.5 3.5-6 6z" />
      <path d="M7.25 10.75 4.5 17.5c2.5 2.5 5.75 2.75 8.25 1.5l-1-4.5z" />
    </>
  ),
  // A globe with a meridian: the channels, the languages, the reach.
  globe: (
    <>
      <circle cx="12" cy="12" r="8.25" />
      <path d="M3.75 12h16.5" />
      <path d="M12 3.75c2.25 2.5 3.25 5.25 3.25 8.25S14.25 17.75 12 20.25c-2.25-2.5-3.25-5.25-3.25-8.25S9.75 6.25 12 3.75z" />
    </>
  ),
  // A stack of coins: revenue, the fee, the money ladder.
  coins: (
    <>
      <ellipse cx="12" cy="6.5" rx="6.75" ry="2.75" />
      <path d="M5.25 6.5v5c0 1.5 3 2.75 6.75 2.75s6.75-1.25 6.75-2.75v-5" />
      <path d="M5.25 11.5v5c0 1.5 3 2.75 6.75 2.75s6.75-1.25 6.75-2.75v-5" />
    </>
  ),
};

export type IconName = keyof typeof ICON_PATHS;

/**
 * A glyph on its own. Callers that place it inside their own chip use this; callers that
 * want the standard chip use `IconChip` below. Both are `aria-hidden` at the root, per the
 * spec: the label beside the icon is what carries the meaning.
 */
export function Icon({ name, className }: { name: string; className?: string }) {
  const paths = ICON_PATHS[name];
  if (!paths) return null;
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      {paths}
    </svg>
  );
}

/**
 * The glyph in its chip. `tone="ink"` is the variant for the dark bands, where a surface
 * fill would disappear and the glyph takes the gold that the rest of the band's small
 * type already uses.
 */
export function IconChip({
  name,
  tone = "surface",
  className = "",
}: {
  name: string;
  tone?: "surface" | "ink" | "sand";
  className?: string;
}) {
  const TONES = { surface: "", ink: "icon-chip-ink", sand: "icon-chip-sand" };
  return (
    <span aria-hidden="true" className={`icon-chip ${TONES[tone]} ${className}`}>
      <Icon name={name} />
    </span>
  );
}
