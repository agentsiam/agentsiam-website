import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { TranslationNote } from "@/components/translation-note";
import { getDictionary } from "@/i18n";
import { isLocale, localePath, type Locale } from "@/i18n/config";
import { pageMeta } from "@/lib/site";

/**
 * The secondary consulting line. It is linked from the footer only -- never promoted to
 * the primary nav -- because rental management is the day-to-day business. The four
 * pillars are AgentSiam's own, not the handoff's generic set.
 */

export async function generateMetadata({
  params,
}: PageProps<"/[locale]">): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return pageMeta({
    title: "Business services",
    description:
      "For businesses entering Thailand: company setup and compliance, OEM and supply chain, ecommerce launch on LINE, TikTok, Shopee and Lazada, and growth.",
    path: "/business-services",
    locale,
  });
}

const PILLARS = [
  {
    hook: "Structured and compliant from day one.",
    name: "Business Setup & Compliance Advisory",
    body: "We coordinate company registration, licensing and tax setup with legal and accounting partners, so the paperwork is right before you open rather than fixed after an inspection.",
    accent: "bg-ink",
  },
  {
    hook: "From product idea to market-ready goods.",
    name: "OEM & Supply Chain Enablement",
    body: "We help you find and vet manufacturers, manage sampling, and get production ready inside Thailand's manufacturing ecosystem.",
    accent: "bg-teal",
  },
  {
    hook: "Live on LINE, TikTok, Shopee, Lazada.",
    name: "Ecommerce & Local Platform Launch",
    body: "We set up your store, connect local payment methods, and localize content for the platforms Thai shoppers actually use.",
    accent: "bg-pink",
  },
  {
    hook: "Strategy connected to execution.",
    name: "Growth, Marketing & Operations Integration",
    body: "Localized branding and marketing, wired into the operational workflows that actually run day to day.",
    accent: "bg-secondary",
  },
];

export default async function BusinessServicesPage({ params }: PageProps<"/[locale]">) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = getDictionary(locale);
  const href = (path: string) => localePath(locale as Locale, path);

  return (
    <div>
      <TranslationNote locale={locale} />

      <div className="mx-auto w-full max-w-[1000px] px-5 pb-20 pt-14">
        <span className="eyebrow">{t.businessServices}</span>
        <h1 className="mt-3.5 max-w-[660px] font-headline text-[clamp(26px,4.5vw,34px)] font-extrabold leading-[1.14] tracking-[-0.03em]">
          Consulting work, alongside the rentals.
        </h1>
        <p className="mt-3.5 max-w-[600px] text-[15.5px] leading-relaxed text-body">
          A secondary line of work, listed here rather than in the main navigation because
          rental management is what we do day to day. For that, see{" "}
          <Link href={href("/how-it-works")} className="text-primary hover:underline">
            how it works
          </Link>
          .
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-[repeat(auto-fit,minmax(260px,1fr))]">
          {PILLARS.map((pillar) => (
            <article
              key={pillar.name}
              className="overflow-hidden rounded-panel border border-hairline"
            >
              <div className={`${pillar.accent} h-1.5 w-full`} />
              <div className="flex flex-col gap-1.5 px-6 py-5.5">
                <h2 className="font-display text-lg font-bold tracking-[-0.015em]">
                  {pillar.hook}
                </h2>
                <p className="text-[13px] font-medium text-muted">{pillar.name}</p>
                <p className="mt-1 text-sm leading-relaxed text-body">{pillar.body}</p>
              </div>
            </article>
          ))}
        </div>

        <Link href={href("/contact")} className="pill-primary mt-8">
          {t.navContact}
        </Link>
      </div>
    </div>
  );
}
