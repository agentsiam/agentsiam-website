import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LocalGuide } from "@/components/local-guide";
import { getDictionary } from "@/i18n";
import { isLocale, LOCALES } from "@/i18n/config";
import { GUIDE_PLACES } from "@/lib/guide.generated";
import { COSMOS_HOUSE_PREVIEW } from "@/lib/property";
import { pageMeta } from "@/lib/site";

/**
 * The Cosmos House local guide: the same places as Lotus House's, with walking and driving
 * times routed from this house. Not bookable yet, so the "book direct" prompts are off, and
 * noindex like the property page until it opens.
 */

export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/cosmoshouse/local-guide">): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = getDictionary(locale);

  return pageMeta({
    title: t.metaGuideTitle.replace("{property}", COSMOS_HOUSE_PREVIEW.title),
    description: t.metaGuideDesc
      .replace("{n}", String(GUIDE_PLACES.length))
      .replace("{property}", COSMOS_HOUSE_PREVIEW.title),
    path: "/cosmoshouse/local-guide",
    locale,
    placeholder: true,
  });
}

export default async function CosmosLocalGuidePage({
  params,
  searchParams,
}: PageProps<"/[locale]/cosmoshouse/local-guide">) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return (
    <LocalGuide
      locale={locale}
      query={await searchParams}
      property={COSMOS_HOUSE_PREVIEW}
      bookable={false}
    />
  );
}
