import { getDictionary } from "@/i18n";
import { isLocale } from "@/i18n/config";
import { heroDataUri } from "@/lib/og-hero";
import { CARD_SIZE, photoCard } from "@/lib/og-photo-card";
import { FEATURED_PROPERTY } from "@/lib/property";

/**
 * The share card for the monthly house-for-rent page, a renter page that was sharing the
 * owner-pitch card. Words are the page's own eyebrow and h1, read from the English
 * dictionary. Photo is the Lotus House living room: it is the one house we run ourselves
 * with a photographed interior, and the page's promise is a home, not a listing.
 */

export const size = CARD_SIZE;
export const contentType = "image/png";
export const alt = "Houses for rent in Chiang Mai, by the month. AgentSiam.";

export default async function Image({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) return new Response("Not found", { status: 404 });
  const t = getDictionary("en");
  const photo = await heroDataUri(FEATURED_PROPERTY.slug, ["20240411_052358"]);
  return photoCard({ photo, eyebrow: t.hfrEyebrow, title: t.hfrH1 });
}
