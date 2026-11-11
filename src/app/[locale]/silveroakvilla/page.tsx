import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EnquiryPropertyPage } from "@/components/enquiry-property-page";
import { getDictionary } from "@/i18n";
import { isLocale, type Locale } from "@/i18n/config";
import { SILVER_OAK_VILLA } from "@/lib/property";
import { pageMeta, routeOgImage } from "@/lib/site";
import { alt as ogAlt } from "./opengraph-image";

/**
 * One of K. Mike's pool villas, listed for enquiry only. The layout, and the reason this
 * file is four lines of its own rather than two hundred, is in
 * src/components/enquiry-property-page.tsx.
 */

export async function generateMetadata({
  params,
}: PageProps<"/[locale]">): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = getDictionary(locale);
  return pageMeta({
    title: t.metaSilverOakTitle,
    description: t.metaSilverOakDesc,
    path: "/silveroakvilla",
    locale,
    image: routeOgImage(locale, "/silveroakvilla", ogAlt),
  });
}

export default async function SilverOakVillaPage({ params }: PageProps<"/[locale]">) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return <EnquiryPropertyPage locale={locale as Locale} property={SILVER_OAK_VILLA} />;
}
