"use client";

import Link from "next/link";
import Script from "next/script";
import { useEffect, useState, useSyncExternalStore } from "react";

/**
 * Google Analytics, and the one question this site asks before loading it.
 *
 * Vercel Analytics still runs on every page and is cookieless. Google Analytics is the
 * second measure, and it writes `_ga` cookies, so it is the first tag on this site that
 * stores something because a visitor arrived rather than because they asked for something.
 * That is allowed on these terms and no others:
 *
 * - **EEA, UK and Switzerland: asked first.** Nothing loads and nothing is stored until the
 *   visitor presses Accept. Decline is the same size, in the same place, one click away.
 *   Which countries ask is decided in src/app/api/consent-region/route.ts.
 * - **Everywhere else: loads on page view**, and the privacy policy says so in the same
 *   words, with a switch that turns it off for good on that browser.
 * - **Advertising storage is denied for everyone**, through Consent Mode. The property is
 *   linked to a Google Ads account, and without the denial gtag would set Ads cookies the
 *   privacy policy does not describe.
 *
 * The choice lives in localStorage and is written only when someone makes one. No choice
 * made means nothing written, which is what keeps a European visitor who ignores the banner
 * at zero storage.
 *
 * Unset `NEXT_PUBLIC_GA_MEASUREMENT_ID` renders nothing at all: no banner, no request to
 * the region route, no script.
 */

type Choice = "granted" | "denied";

const CHOICE_KEY = "as-analytics-consent";

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

/**
 * The stored choice is state React does not own, so it is read through
 * useSyncExternalStore, the same pattern as the WhatsApp prompt's dismissal. The banner in
 * the layout and the switch in the privacy policy share this store, so pressing one updates
 * the other without a reload.
 */
let choiceListeners: (() => void)[] = [];

function subscribeChoice(callback: () => void): () => void {
  choiceListeners.push(callback);
  return () => {
    choiceListeners = choiceListeners.filter((listener) => listener !== callback);
  };
}

function readChoice(): Choice | null {
  try {
    const value = window.localStorage.getItem(CHOICE_KEY);
    return value === "granted" || value === "denied" ? value : null;
  } catch {
    // Storage blocked (some private modes). Treated as no choice made, which asks again.
    return null;
  }
}

const choiceOnServer = () => null;

function writeChoice(choice: Choice) {
  try {
    window.localStorage.setItem(CHOICE_KEY, choice);
  } catch {
    // Storage blocked. The choice still holds for this page view through the listeners.
  }
  cachedChoice = choice;
  for (const listener of choiceListeners) listener();
}

/**
 * Set when a write fails, so a visitor whose browser refuses storage still gets the answer
 * they gave for as long as the page is open, instead of the banner reappearing on the
 * spot.
 */
let cachedChoice: Choice | null = null;
const readChoiceOrCached = () => readChoice() ?? cachedChoice;

/**
 * `_ga` and `_ga_<id>`, removed when someone turns Analytics off. gtag sets them on the
 * widest domain it can, so each parent domain of the current host is tried as well as the
 * host itself.
 */
function clearAnalyticsCookies() {
  const names = document.cookie
    .split(";")
    .map((part) => part.split("=")[0].trim())
    .filter((name) => name === "_ga" || name.startsWith("_ga_"));
  const labels = window.location.hostname.split(".");
  const domains = [""];
  for (let i = 0; i < labels.length - 1; i++) domains.push(`; domain=.${labels.slice(i).join(".")}`);
  for (const name of names) {
    for (const domain of domains) {
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/${domain}`;
    }
  }
}

export type ConsentLabels = {
  label: string;
  body: string;
  accept: string;
  decline: string;
  policy: string;
};

export function AnalyticsConsent({
  measurementId,
  labels,
  policyHref,
}: {
  measurementId: string;
  labels: ConsentLabels;
  policyHref: string;
}) {
  const choice = useSyncExternalStore(subscribeChoice, readChoiceOrCached, choiceOnServer);
  const [region, setRegion] = useState<"unknown" | "ask" | "no-ask">("unknown");

  // Asked only when there is no stored choice. The layout stays mounted across client
  // navigations, so this is one request per full page load, not one per page.
  useEffect(() => {
    if (!measurementId || choice !== null || region !== "unknown") return;
    let cancelled = false;
    fetch("/api/consent-region", { cache: "no-store" })
      .then((response) => (response.ok ? response.json() : { required: true }))
      .then((data: { required?: boolean }) => {
        if (!cancelled) setRegion(data.required === false ? "no-ask" : "ask");
      })
      .catch(() => {
        if (!cancelled) setRegion("ask");
      });
    return () => {
      cancelled = true;
    };
  }, [measurementId, choice, region]);

  // Once gtag is on the page, a later change of mind goes through Consent Mode rather than
  // a reload. Next loads a Script with a given id once per page session, so turning
  // Analytics back on after turning it off cannot rely on the script running again.
  useEffect(() => {
    // Clearing does not need gtag: a visitor can carry _ga cookies from an earlier
    // session with no stored choice, so Analytics is not loaded when they decline.
    if (choice === "denied") clearAnalyticsCookies();
    if (typeof window.gtag !== "function") return;
    if (choice === "denied") {
      window.gtag("consent", "update", { analytics_storage: "denied" });
    } else if (choice === "granted") {
      window.gtag("consent", "update", { analytics_storage: "granted" });
    }
  }, [choice]);

  if (!measurementId) return null;

  const load = choice === "granted" || (choice === null && region === "no-ask");
  const ask = choice === null && region === "ask";

  return (
    <>
      {load ? (
        <>
          <Script id="ga-init" strategy="afterInteractive">
            {`window.dataLayer=window.dataLayer||[];
function gtag(){dataLayer.push(arguments);}
gtag('consent','default',{ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied',analytics_storage:'granted'});
gtag('js',new Date());
gtag('config',${JSON.stringify(measurementId)});`}
          </Script>
          <Script
            id="ga-lib"
            strategy="afterInteractive"
            src={`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`}
          />
        </>
      ) : null}

      {ask ? (
        // Not a modal and no focus trap: the page stays usable with the question unanswered,
        // and unanswered means declined. z-index clears the map controls (Leaflet's top pane
        // is 1000) and the WhatsApp launcher.
        <div
          role="region"
          aria-label={labels.label}
          className="fixed inset-x-4 bottom-4 z-1100 rounded-panel border border-hairline bg-bg p-4 shadow-lg sm:right-auto sm:max-w-sm print:hidden"
        >
          <p className="text-[13px] leading-relaxed text-body">
            {labels.body}{" "}
            <Link href={policyHref} className="text-primary underline">
              {labels.policy}
            </Link>
          </p>
          <div className="mt-3 flex items-center gap-2">
            <button
              type="button"
              onClick={() => writeChoice("granted")}
              className="rounded-full border border-ink bg-ink px-4 py-2 text-[13px] font-semibold text-bg transition-opacity hover:opacity-85"
            >
              {labels.accept}
            </button>
            <button
              type="button"
              onClick={() => writeChoice("denied")}
              className="rounded-full border border-ink bg-bg px-4 py-2 text-[13px] font-semibold text-ink transition-colors hover:bg-surface"
            >
              {labels.decline}
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}

/**
 * The switch in the privacy policy. Open to every visitor, not only the ones who were
 * asked: someone outside Europe who never saw a banner can still turn Analytics off, and
 * someone who pressed Accept can take it back as easily as they gave it.
 *
 * English only, like the policy text around it.
 */
export function AnalyticsChoice() {
  // The stored choice cannot be known on the server, so the server snapshot is its own
  // value and renders nothing, rather than rendering "no choice" and flipping on hydration.
  const choice = useSyncExternalStore(subscribeChoice, readChoiceOrCached, () => "server" as const);

  if (choice === "server") return null;

  const status =
    choice === "granted"
      ? "Google Analytics is on for this browser."
      : choice === "denied"
        ? "Google Analytics is off for this browser."
        : "You have not made a choice on this browser, so the default for your location applies.";

  return (
    <p className="rounded-panel border border-hairline bg-surface p-4">
      {status}{" "}
      <span className="mt-3 flex flex-wrap gap-2">
        {choice !== "denied" ? (
          <button
            type="button"
            onClick={() => writeChoice("denied")}
            className="rounded-full border border-ink bg-bg px-4 py-2 text-[13px] font-semibold text-ink transition-colors hover:bg-surface-2"
          >
            Turn Google Analytics off
          </button>
        ) : null}
        {choice !== "granted" ? (
          <button
            type="button"
            onClick={() => writeChoice("granted")}
            className="rounded-full border border-ink bg-bg px-4 py-2 text-[13px] font-semibold text-ink transition-colors hover:bg-surface-2"
          >
            Turn Google Analytics on
          </button>
        ) : null}
      </span>
    </p>
  );
}
