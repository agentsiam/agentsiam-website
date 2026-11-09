import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { OutletIndex } from "@/components/outlet-index";
import { isLocale, type Locale } from "@/i18n/config";
import { outletCopy, OUTLETS } from "@/lib/editorial";
import { pageMeta } from "@/lib/site";

/**
 * Journal of Chiang Mai: the outlet index.
 *
 * Thin by design. The masthead, the standfirst and the article list all come from
 * src/lib/editorial.ts, and the layout comes from <OutletIndex>, so publishing a piece
 * touches one file and this one never changes.
 *
 * The locales it is published in are declared on the outlet and passed to pageMeta here, so
 * the page's own hreflang tags and the sitemap agree. editorial.ts carries the reasoning.
 */

const OUTLET = "journal" as const;
const PATH = "/journal";

export async function generateMetadata({ params }: PageProps<"/[locale]">): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const outlet = OUTLETS[OUTLET];
  const masthead = outletCopy(outlet, locale);
  return pageMeta({
    title: masthead.metaTitle,
    description: masthead.metaDesc,
    path: PATH,
    locale,
    publishedIn: outlet.publishedIn,
  });
}

export default async function OutletIndexPage({ params }: PageProps<"/[locale]">) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return <OutletIndex outlet={OUTLET} locale={locale as Locale} />;
}
