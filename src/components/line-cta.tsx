import Image from "next/image";
import { LINE_ADD_FRIEND_URL, LINE_QR_SRC } from "@/lib/site";

/**
 * LINE, as a footer link and as the add-us panel under a sent form.
 *
 * Two surfaces in one file because they share a mark and a single URL, and because the
 * reason for both is the same reason: an enquiry that ends in an inbox is a thread we
 * cannot reopen, and a LINE friend is a channel we can. The footer link is for a visitor
 * who would rather not fill anything in at all; the panel is for the moment just after
 * someone has, which is the only moment they are certain to be paying attention.
 *
 * Both read the account from LINE_BASIC_ID in src/lib/site.ts, which is also what the QR
 * in public/ is an image of. The three move together or not at all.
 *
 * The mark is not in icon.tsx and that is deliberate. That set is stroke-only in
 * currentColor by spec, and this is a brand colour with a fill, so it is not an icon by
 * the set's own definition. logo.tsx is the precedent: a mark lives beside the set rather
 * than inside it. It is also not LINE's logo, which is their artwork to supply and not
 * ours to redraw: it is a chat bubble in LINE's published green, under the word LINE,
 * which is what the label says. If their media kit artwork is ever dropped into public/,
 * this is the one file that changes.
 */

/**
 * LINE's brand green, read off LINE's own account.line.biz on 15/11/2026.
 *
 * Inline rather than a token in globals.css, because the palette there is this site's
 * design system and a third party's brand colour is not part of it. A token would invite
 * reuse somewhere LINE is not involved.
 */
const LINE_GREEN = "#06C755";

export type LineLabels = {
  title: string;
  body: string;
  cta: string;
  qrAlt: string;
};

/** The bubble, white on the green chip. aria-hidden: the label beside it carries the meaning. */
function LineGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
      <path d="M12 3.75c-4.69 0-8.5 3.08-8.5 6.88 0 3.41 3.02 6.26 7.11 6.8.27.06.65.18.74.42.08.21.05.54.03.76l-.12.72c-.04.22-.17.84.74.46 1.86-.78 5.4-3.19 6.66-5.15a6.3 6.3 0 0 0 1.34-3.86c0-3.8-3.81-6.88-8.5-6.88Z" />
    </svg>
  );
}

/** The green chip the glyph always sits in, so the mark is never a bare shape on the page. */
function LineChip({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={`inline-flex items-center justify-center rounded-md ${className ?? "h-4.5 w-4.5"}`}
      style={{ backgroundColor: LINE_GREEN }}
    >
      <LineGlyph className="h-3 w-3 text-white" />
    </span>
  );
}

/**
 * The footer's LINE link. Same visual weight as the email address beside it: LINE is a way
 * to reach us, not a campaign.
 */
export function LineFooterLink({ label }: { label: string }) {
  return (
    <a
      href={LINE_ADD_FRIEND_URL}
      target="_blank"
      rel="noreferrer"
      className="hit inline-flex items-center gap-2 text-[13.5px] text-white/80 hover:text-white"
    >
      <LineChip />
      {label}
    </a>
  );
}

/**
 * The panel under a sent enquiry: the QR, the reason, and the button.
 *
 * Only the two forms that carry a real enquiry use it, the contact form and the renter
 * request form, and only once they have been sent. A newsletter signup does not: an email
 * address is not an enquiry, and a LINE friend with no requirement behind them is work
 * without a lead. Paul's call, 15/11/2026. That is also why this only ever renders on a
 * light panel, and why there is no dark variant: the one caller that sat on ink was the
 * host newsletter.
 *
 * The QR is not decoration and not a duplicate of the button. On a desktop browser the
 * add-friend URL cannot open the app, so for anyone who has just filled the form in on a
 * laptop the code is the only thing that works, and they have a phone in reach.
 */
export function LineFollowPanel({ labels }: { labels: LineLabels }) {
  return (
    <div className="mt-6 flex flex-col gap-4 rounded-panel border border-hairline p-4 sm:flex-row sm:items-center">
      {/* unoptimized: a QR is a grid of hard edges and the optimizer's job is to soften
          and recompress, which is the one thing that can stop a code scanning. */}
      <Image
        src={LINE_QR_SRC}
        alt={labels.qrAlt}
        width={132}
        height={132}
        unoptimized
        className="h-33 w-33 shrink-0 self-start rounded-lg sm:self-center"
      />
      <div>
        <p className="font-display text-[15px] font-bold tracking-[-0.015em]">{labels.title}</p>
        <p className="mt-1 text-[13.5px] leading-relaxed text-muted">{labels.body}</p>
        <a
          href={LINE_ADD_FRIEND_URL}
          target="_blank"
          rel="noreferrer"
          className="mt-3 inline-flex items-center gap-2 rounded-full px-3.5 py-2 text-[13px] font-semibold text-white transition-opacity hover:opacity-85"
          style={{ backgroundColor: LINE_GREEN }}
        >
          <LineGlyph className="h-4 w-4" />
          {labels.cta}
        </a>
      </div>
    </div>
  );
}
