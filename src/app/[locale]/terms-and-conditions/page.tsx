import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { TranslationNote } from "@/components/translation-note";
import { getDictionary } from "@/i18n";
import { isLocale } from "@/i18n/config";
import { POLICY_UPDATED, pageMeta } from "@/lib/site";

/**
 * The handoff ships this page as an empty stub with a "Not yet written" box, on the
 * grounds that generated boilerplate would look binding while being wrong. This site's
 * terms are already written, so the stub is discarded and the real text kept verbatim --
 * only the page shell changes. Any edit to the wording below is a legal change, not a
 * design one.
 *
 * Not translated. Legal text has to be drafted against Thai law in each language, and a
 * machine translation of terms would be exactly the "looks binding while being wrong"
 * failure the handoff warns about. Thai and Chinese show the pending note and the English.
 */

export async function generateMetadata({
  params,
}: PageProps<"/[locale]">): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return pageMeta({
    title: "Terms and conditions",
    description:
      "The terms covering AgentSiam's feasibility study, vacation rental permission and short-term rental management services, and use of this website.",
    path: "/terms-and-conditions",
    locale,
  });
}

export default async function TermsPage({ params }: PageProps<"/[locale]">) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = getDictionary(locale);

  return (
    <div>
      <TranslationNote locale={locale} />

      <div className="mx-auto w-full max-w-[820px] px-5 pb-22 pt-14">
        <span className="eyebrow">{t.legalEyebrow}</span>
        <h1 className="mt-3.5 font-headline text-[clamp(24px,4vw,32px)] font-extrabold leading-[1.14] tracking-[-0.03em]">
          Terms &amp; Conditions
        </h1>
        <p className="mt-2.5 text-sm text-muted">
          {t.lastUpdated} {POLICY_UPDATED}
        </p>

        <div className="mt-8 text-[15px] leading-relaxed text-body [&_h2]:mt-8 [&_h2]:font-display [&_h2]:text-lg [&_h2]:font-bold [&_h2]:tracking-[-0.015em] [&_h2]:text-text [&_p]:mt-3">
          <h2>Ownership of Intellectual Property, Copyrights, and Logos</h2>
          <p>
            All content published on this website, including text, graphics, logos, icons,
            images, and software, is the property of AgentSiam or its content suppliers and
            is protected by applicable intellectual property and copyright laws. You may not
            copy, reproduce, distribute, modify, display, or use any part of this
            website&rsquo;s content, trademarks, or logos without prior written consent from
            AgentSiam.
          </p>

          <h2>Short-term rental services</h2>
          <p>
            AgentSiam assesses eligibility and prepares and files vacation rental permission
            applications on a client&rsquo;s behalf where that is part of the engaged
            service.{" "}
            <strong>
              AgentSiam cannot guarantee the outcome of any government decision, licensing
              approval, or regulatory review
            </strong>
            , including Thailand&rsquo;s non-hotel accommodation exemption. Any revenue,
            occupancy, or return figure presented in a proposal or on this site is an
            illustration based on available market data, not a guarantee of performance.
          </p>
          <p>
            Bookings made through a property&rsquo;s listing are additionally governed by
            that booking&rsquo;s own terms presented at the time of booking, and by the
            property&rsquo;s house rules.
          </p>

          <h2>Form Submissions and Communication</h2>
          <p>
            By submitting any form on this website, you agree to provide accurate
            information and consent to being contacted by AgentSiam using the details you
            have provided.
          </p>

          <h2>Limitation of Liability</h2>
          <p>
            AgentSiam shall not be held liable for any direct, indirect, incidental,
            consequential, or punitive damages arising out of your use of this website or
            any services provided.
          </p>

          <h2>Governing Law</h2>
          <p>
            These Terms &amp; Conditions shall be governed by and construed in accordance
            with the laws of Thailand.
          </p>

          <h2>Disclaimer</h2>
          <p>
            The information provided on this website is for general informational purposes
            only. It is not intended as legal, financial, tax, or investment advice.
          </p>
        </div>
      </div>
    </div>
  );
}
