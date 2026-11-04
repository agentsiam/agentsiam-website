import { getDictionary } from "@/i18n";
import { isLocale } from "@/i18n/config";
import { heroDataUri } from "@/lib/og-hero";
import { CARD_SIZE, photoCard } from "@/lib/og-photo-card";
import { FEATURED_PROPERTY } from "@/lib/property";

/**
 * The renter share card, for the homepage and /properties.
 *
 * Before this, both shared the site-wide card in src/app/opengraph-image.tsx, which is the
 * owner pitch ("Know if it's worth it before you commit to it. Feasibility study, vacation
 * rental permission, and management."). The homepage turned renter-first on 03/11/2026 and
 * kept that card, so pasting agentsiam.com into a guest group showed an offer to someone
 * who came to rent. Same mismatch the guide and neighbourhood cards fixed.
 *
 * It lives under /properties because a file-based card cannot sit at the locale root next
 * to the site-wide one; the homepage names it explicitly through routeOgImage.
 *
 * The words are the homepage hero's own, read from the English dictionary so they cannot
 * drift from it. The photo is the living room the hero uses, not the terrace tub shot the
 * property card leads with.
 */

export const size = CARD_SIZE;
export const contentType = "image/png";
export const alt = "A home in Chiang Mai, for a week or a year. AgentSiam.";

export default async function Image({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) return new Response("Not found", { status: 404 });
  const t = getDictionary("en");
  const photo = await heroDataUri(FEATURED_PROPERTY.slug, ["20240411_052358"]);
  return photoCard({
    photo,
    eyebrow: t.heroEyebrow,
    title: `${t.heroTitleA} ${t.heroTitleB}`,
  });
}
