"use client";

import { createContext, useContext, type ReactNode } from "react";
import { DEFAULT_LOCALE, type Locale } from "@/i18n/config";

/**
 * The handful of strings the 404 boundary needs, carried down from the layout.
 *
 * A not-found boundary is not a page: it receives no `params` and cannot be told which
 * locale it is rendering in. The obvious fix was to make it a client component and read
 * `usePathname()`, and that is what it did. The cost was out of all proportion. A client
 * component importing `getDictionary` pulls all three dictionaries into the shared
 * JavaScript chunk, which every route on this site downloads: 189KB raw, 55KB gzipped,
 * on pages like /destinations that render no client component at all and would otherwise
 * ship none of their own JavaScript.
 *
 * Two other routes were tried and are recorded here so nobody spends the afternoon again:
 *
 * - Reading the locale from a request header set by `src/proxy.ts`. It works, and it lets
 *   the boundary be a server component, but `headers()` inside a boundary opts the whole
 *   route tree out of prerendering. The build went from 60 static routes to 0.
 * - Copying six strings per language into the boundary. No client dictionary and no lost
 *   prerendering, but eighteen values duplicated out of the file that is supposed to be
 *   the only place any string is written, with nothing to stop them drifting.
 *
 * So the layout, which does know the locale, passes the six strings down through a
 * context. One source of truth, six strings on the wire instead of 778, no dictionary in
 * any client bundle, and every route still prerenders.
 */

export type NotFoundStrings = {
  locale: Locale;
  eyebrow: string;
  title: string;
  body: string;
  cta: string;
  howItWorks: string;
  contact: string;
};

/**
 * The fallback is English and exists only so the type is not nullable. It is never the
 * value a reader sees: the provider wraps every route in the layout, above the boundary.
 */
const FALLBACK: NotFoundStrings = {
  locale: DEFAULT_LOCALE,
  eyebrow: "Error 404",
  title: "That page isn't here.",
  body: "The link may be out of date, or the address may have a typo in it.",
  cta: "Tell us what you need",
  howItWorks: "How it works",
  contact: "Contact",
};

const NotFoundContext = createContext<NotFoundStrings>(FALLBACK);

export function NotFoundStringsProvider({
  value,
  children,
}: {
  value: NotFoundStrings;
  children: ReactNode;
}) {
  return <NotFoundContext.Provider value={value}>{children}</NotFoundContext.Provider>;
}

export function useNotFoundStrings(): NotFoundStrings {
  return useContext(NotFoundContext);
}
