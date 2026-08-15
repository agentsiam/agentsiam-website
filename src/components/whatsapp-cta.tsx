"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import type { Dictionary } from "@/i18n";

/**
 * The floating "talk to us" prompt on the guide.
 *
 * The guide is shared with people who have not booked anything, which is the whole reason
 * it is worth having on our own domain rather than behind a check-in email. So it needs a
 * way to turn a reader into a conversation, and WhatsApp is where that conversation
 * actually happens in Thailand.
 *
 * It starts collapsed as a button and expands once, after a delay long enough that the
 * reader has started reading. A prompt that arrives before anyone has seen the page is an
 * interruption; one that arrives after they have scrolled a bit is an offer.
 *
 * Dismissing collapses it for the rest of the session rather than forever. Forever needs a
 * cookie and a consent banner, and the analytics on this site are cookieless specifically
 * so there is neither.
 */

const EXPAND_AFTER_MS = 12_000;
const DISMISS_KEY = "as-guide-whatsapp-dismissed";

/**
 * Whether the prompt has been dismissed lives in sessionStorage, not in React, so it is
 * read through useSyncExternalStore: that is the hook designed for state React does not
 * own, and it takes a separate server snapshot, which is what keeps hydration honest.
 * Reading it in an effect and calling setState would render the prompt, then hide it.
 */
let dismissListeners: (() => void)[] = [];

function subscribeDismissed(callback: () => void): () => void {
  dismissListeners.push(callback);
  return () => {
    dismissListeners = dismissListeners.filter((listener) => listener !== callback);
  };
}

const readDismissed = () => window.sessionStorage.getItem(DISMISS_KEY) === "1";
const dismissedOnServer = () => false;

export function WhatsAppCta({
  number,
  t,
  context,
}: {
  /** Digits only, country code, no plus. Empty renders nothing at all. */
  number: string;
  t: Dictionary;
  /** Appended to the prefilled message so a reply arrives with the page already known. */
  context?: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const dismissed = useSyncExternalStore(subscribeDismissed, readDismissed, dismissedOnServer);

  useEffect(() => {
    if (dismissed) return;
    // setState inside a timer callback, not in the effect body: this is the effect
    // reacting to something happening later, which is what effects are for.
    const timer = window.setTimeout(() => setExpanded(true), EXPAND_AFTER_MS);
    return () => window.clearTimeout(timer);
  }, [dismissed]);

  if (!number) return null;

  const message = context ? `${t.guideAskPrefill} (${context})` : t.guideAskPrefill;
  const href = `https://wa.me/${number}?text=${encodeURIComponent(message)}`;

  const close = () => {
    setExpanded(false);
    window.sessionStorage.setItem(DISMISS_KEY, "1");
    for (const listener of dismissListeners) listener();
  };

  return (
    <div className="fixed bottom-4 right-4 z-500 flex max-w-[calc(100vw-2rem)] flex-col items-end gap-2 print:hidden">
      {expanded && !dismissed ? (
        <div className="w-72 rounded-panel border border-hairline bg-bg p-4 shadow-lg">
          <p className="font-display text-[15px] font-bold tracking-[-0.015em]">
            {t.guideAskTitle}
          </p>
          <p className="mt-1 text-[13px] text-muted">{t.guideAskBody}</p>
          <div className="mt-3 flex items-center gap-3">
            <a
              href={href}
              target="_blank"
              rel="noreferrer"
              className="rounded-full bg-ink px-3.5 py-2 text-[13px] font-semibold text-bg transition-opacity hover:opacity-85"
            >
              {t.guideAskCta}
            </a>
            <button type="button" onClick={close} className="text-[13px] text-muted underline">
              {t.guideAskDismiss}
            </button>
          </div>
        </div>
      ) : null}

      <a
        href={href}
        target="_blank"
        rel="noreferrer"
        className="rounded-full border border-hairline bg-bg px-4 py-2.5 text-[13px] font-semibold shadow-lg transition-colors hover:border-ink"
      >
        <span aria-hidden="true">💬</span> {t.guideAskTitle}
      </a>
    </div>
  );
}
