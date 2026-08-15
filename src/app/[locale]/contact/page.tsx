import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getDictionary } from "@/i18n";
import { isLocale, localePath, type Locale } from "@/i18n/config";
import { pickPhoto } from "@/lib/photos";
import { LOTUS_HOUSE } from "@/lib/property";
import { CONTACT_EMAIL, pageMeta } from "@/lib/site";
import { ContactForm } from "./contact-form";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]">): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return pageMeta({
    title: "Contact",
    description:
      "Tell us about your property in Chiang Mai and we will come back to you about a feasibility study, a permission filing or full management.",
    path: "/contact",
    locale,
  });
}

export default async function ContactPage({ params }: PageProps<"/[locale]">) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = getDictionary(locale);
  const href = (path: string) => localePath(locale as Locale, path);

  const asidePhoto = pickPhoto(LOTUS_HOUSE.slug, "IMG_5724");
  const steps = [t.nextStep1, t.nextStep2, t.nextStep3];

  return (
    <div className="mx-auto w-full max-w-[1000px] px-5 pb-20 pt-14">
      <span className="eyebrow">{t.contactEyebrow}</span>
      <h1 className="mt-3.5 max-w-[640px] font-headline text-[clamp(26px,4.5vw,36px)] font-extrabold leading-[1.12] tracking-[-0.03em]">
        {t.contactTitle}
      </h1>
      <p className="mt-3.5 max-w-[560px] text-[15.5px] leading-relaxed text-body">
        {t.contactSub}
      </p>

      <div className="mt-8.5 grid items-start gap-10 min-[900px]:grid-cols-[1fr_340px]">
        <ContactForm
          t={t}
          locale={locale}
          homeHref={href("/")}
          privacyHref={href("/privacy-policy")}
        />

        <aside className="overflow-hidden rounded-panel bg-surface">
          {/* An owner filling in this form is deciding whether we are real. One photograph
              of a property we actually run answers that faster than the copy does. */}
          {asidePhoto ? (
            <div className="relative aspect-4/3">
              <Image
                src={asidePhoto.src}
                alt={asidePhoto.alt || LOTUS_HOUSE.title}
                placeholder="blur"
                fill
                sizes="(min-width: 900px) 340px, 100vw"
                className="object-cover"
              />
            </div>
          ) : null}

          <div className="p-6">
            <h2 className="text-xs font-semibold uppercase tracking-[0.06em] text-muted">
              {t.whatHappensNext}
            </h2>
            <ol className="mt-3.5 flex flex-col gap-3.5">
              {steps.map((step, index) => (
                <li key={step} className="flex gap-3">
                  <span className="font-mono font-semibold text-primary">
                    {index + 1}
                  </span>
                  <span className="text-sm leading-relaxed">{step}</span>
                </li>
              ))}
            </ol>

            <div className="mt-5 space-y-3 border-t border-hairline pt-4 text-[13.5px] leading-relaxed text-muted">
              {/* Two redirections the design asks for: guests do not belong in an owner
                intake, and neither do business-services enquiries. Both are plain text
                links -- cross-audience never gets button styling. */}
              <p>
                {t.guestQnNote}{" "}
                <Link
                  href={href(`/${LOTUS_HOUSE.slug}`)}
                  className="font-semibold text-primary hover:text-secondary"
                >
                  {LOTUS_HOUSE.title} →
                </Link>
              </p>
              <p>
                {t.businessNote}{" "}
                <a
                  className="text-primary hover:underline"
                  href={`mailto:${CONTACT_EMAIL}`}
                >
                  {CONTACT_EMAIL}
                </a>
                .
              </p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
