import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EnquiryPropertyPage } from "@/components/enquiry-property-page";
import { getDictionary } from "@/i18n";
import { isLocale, type Locale } from "@/i18n/config";
import { CHANG_KHLAN_POOL_VILLA } from "@/lib/property";
import { pageMeta, routeOgImage } from "@/lib/site";
import { alt as ogAlt } from "./opengraph-image";

/**
 * A house we do not manage, listed for enquiry only under S7 renter introduction. The
 * layout, and the reason this file is four lines of its own rather than two hundred, is in
 * src/components/enquiry-property-page.tsx.
 */

export async function generateMetadata({
  params,
}: PageProps<"/[locale]">): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = getDictionary(locale);
  return pageMeta({
    title: t.metaCkpvTitle,
    description: t.metaCkpvDesc,
    path: "/changkhlanpoolvilla",
    locale,
    image: routeOgImage(locale, "/changkhlanpoolvilla", ogAlt),
  });
}

export default async function ChangKhlanPoolVillaPage({ params }: PageProps<"/[locale]">) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return <EnquiryPropertyPage locale={locale as Locale} property={CHANG_KHLAN_POOL_VILLA} />;
}
