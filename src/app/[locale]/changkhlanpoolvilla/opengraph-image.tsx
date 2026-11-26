import { isLocale } from "@/i18n";
import { AREAS } from "@/lib/areas";
import { heroDataUri } from "@/lib/og-hero";
import { CARD_SIZE, photoCard } from "@/lib/og-photo-card";
import { CHANG_KHLAN_POOL_VILLA } from "@/lib/property";

/**
 * The villa's own share card, through the shared photo-card renderer rather than a copy of
 * the Mae Rim House card. Language-neutral on purpose: every word on it is a proper noun in
 * Latin script, so one card serves all three locales and Satori never has to render a Thai
 * or Chinese glyph.
 *
 * The photographs are the owner's, from src/photos/changkhlanpoolvilla/.
 */

export const alt = `${CHANG_KHLAN_POOL_VILLA.title}, a five-bedroom private pool villa in Chang Khlan, Chiang Mai`;
export const size = CARD_SIZE;
export const contentType = "image/png";

export default async function Image({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) return new Response("Not found", { status: 404 });

  const photo = await heroDataUri(CHANG_KHLAN_POOL_VILLA.photoSet, []);
  const area = AREAS.find((item) => item.slug === CHANG_KHLAN_POOL_VILLA.areaSlug);

  return photoCard({
    photo,
    eyebrow: [area?.name, "Chiang Mai"].filter(Boolean).join(" · "),
    title: CHANG_KHLAN_POOL_VILLA.title,
  });
}
