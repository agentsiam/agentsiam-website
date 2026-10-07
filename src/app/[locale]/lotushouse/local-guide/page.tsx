import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LocalGuide } from "@/components/local-guide";
import { getDictionary } from "@/i18n";
import { isLocale, LOCALES } from "@/i18n/config";
import { GUIDE_PLACES } from "@/lib/guide.generated";
import { LOTUS_HOUSE } from "@/lib/property";
import { pageMeta, routeOgImage } from "@/lib/site";
import { alt as ogAlt } from "./opengraph-image";

/** The Lotus House local guide. The page itself is src/components/local-guide.tsx. */

export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/lotushouse/local-guide">): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = getDictionary(locale);

  return pageMeta({
    title: t.metaGuideTitle.replace("{property}", LOTUS_HOUSE.title),
    description: t.metaGuideDesc
      .replace("{n}", String(GUIDE_PLACES.length))
      .replace("{property}", LOTUS_HOUSE.title),
    path: "/lotushouse/local-guide",
    locale,
    // The guide's own card, not the site-wide owner pitch. See
    // src/app/[locale]/lotushouse/local-guide/opengraph-image.tsx for why.
    image: routeOgImage(locale, "/lotushouse/local-guide", ogAlt),
  });
}

export default async function LocalGuidePage({
  params,
  searchParams,
}: PageProps<"/[locale]/lotushouse/local-guide">) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return <LocalGuide locale={locale} query={await searchParams} property={LOTUS_HOUSE} bookable />;
}
