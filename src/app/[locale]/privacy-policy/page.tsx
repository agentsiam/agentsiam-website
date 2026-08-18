import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { TranslationNote } from "@/components/translation-note";
import { getDictionary } from "@/i18n";
import { isLocale } from "@/i18n/config";
import { CONTACT_EMAIL, POLICY_UPDATED, pageMeta } from "@/lib/site";

/**
 * Existing policy text, kept verbatim apart from one sentence: the enquiry paragraph now
 * lists the fields the rebuilt contact form actually collects (name, email, phone or LINE,
 * property type, neighbourhood) instead of the old first name / last name / service set. A
 * privacy policy that describes the wrong fields is worse than a plain one, so the text
 * follows the form. Every other paragraph is unchanged.
 *
 * Not translated -- see the note on the terms page.
 */

export async function generateMetadata({
  params,
}: PageProps<"/[locale]">): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = getDictionary(locale);
  return pageMeta({
    title: t.metaPrivacyTitle,
    description: t.metaPrivacyDesc,
    path: "/privacy-policy",
    locale,
  });
}

export default async function PrivacyPolicyPage({ params }: PageProps<"/[locale]">) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = getDictionary(locale);

  return (
    <div>
      <TranslationNote locale={locale} />

      <div className="mx-auto w-full max-w-[820px] px-5 pb-22 pt-14">
        <span className="eyebrow">{t.legalEyebrow}</span>
        <h1 className="mt-3.5 font-headline text-[clamp(24px,4vw,32px)] font-extrabold leading-[1.14] tracking-[-0.03em]">
          Privacy Policy
        </h1>
        <p className="mt-2.5 text-sm text-muted">
          {t.lastUpdated} {POLICY_UPDATED}
        </p>

        <div className="mt-8 text-[15px] leading-relaxed text-body [&_h2]:mt-8 [&_h2]:font-display [&_h2]:text-lg [&_h2]:font-bold [&_h2]:tracking-[-0.015em] [&_h2]:text-text [&_li]:mt-1 [&_p]:mt-3 [&_ul]:mt-3 [&_ul]:list-inside [&_ul]:list-disc">
          <p>
            This policy explains what AgentSiam does with personal information collected
            through this website. It covers this site only. It does not cover the booking
            platforms a property may also be listed on, each of which handles guest data
            under its own policy.
          </p>

          <h2>Who is responsible for your data</h2>
          <p>
            AgentSiam, registered in Bangkok, Thailand at 922/11 Rama 9 Road, Huaykwang,
            Bangkapi, Bangkok 10310, is the data controller for information submitted
            through this site. For any question about this policy, or to exercise the rights
            below, write to{" "}
            <a className="text-primary hover:underline" href={`mailto:${CONTACT_EMAIL}`}>
              {CONTACT_EMAIL}
            </a>
            .
          </p>

          <h2>What we collect, and why</h2>
          <p>
            <strong>Enquiries.</strong> When you send the contact form we receive your name,
            email address, the phone number or LINE handle if you supply one, the property
            type and neighbourhood you selected, and the content of your message. We use it
            for one purpose: to answer you and, if the enquiry becomes an engagement, to
            carry out the work you asked about. The lawful basis is your consent, and the
            steps taken at your request before entering a contract.
          </p>
          <p>
            <strong>Property owner information.</strong> If you engage us for a feasibility
            study, a vacation rental permission filing or management, we collect the further
            information that work requires, including property details and the identity and
            ownership documents a filing needs. That is collected in the course of the
            engagement, not through this website, and is used to perform the contract and to
            meet legal obligations.
          </p>
          <p>
            <strong>Bookings.</strong> When you request or make a booking on this site we
            receive your name, email address, the phone number or LINE handle if you supply
            one, your arrival and departure dates, the number of guests and any message you
            write. We pass those details to the reservation system that holds our bookings,
            and we use them to confirm and host your stay. The lawful basis is the
            performance of your booking contract and the steps taken at your request before
            it is entered. Where we must register you as a lodger, and notify the immigration
            authorities of a foreign national&rsquo;s stay, the basis is our legal obligation
            as an accommodation operator.
          </p>
          <p>
            <strong>Card payments.</strong> Card details are entered into a form served by
            our payment provider and go directly to them. They do not pass through this
            website, and we never see or store a card number. We receive confirmation that a
            payment succeeded, the amount, and a reference we can use to trace or refund it.
            Our payment provider also collects device and behavioural information of its own
            to detect fraud, for which it acts as an independent controller under its own
            policy rather than on our instructions.
          </p>
          <p>
            <strong>Guests of properties we manage.</strong> Where a stay is booked through a
            travel platform rather than this site, that platform collects the guest&rsquo;s
            details under its own policy, and we receive from it only what is needed to host
            the stay and to keep the guest records Thai law requires of an accommodation
            operator.
          </p>
          <p>
            <strong>Site measurement.</strong> We use cookieless analytics. It records page
            views and aggregate traffic patterns, without cookies, without a persistent
            identifier and without profiling. It is not used to track you across other
            websites.
          </p>

          <h2>Cookies</h2>
          <p>
            This site sets no advertising, profiling or analytics cookies of its own, which
            is why you are not asked to dismiss a cookie banner. Our payment provider sets
            its own cookies when you begin a payment, to keep the payment session working and
            to detect fraud, under its own policy. They appear only once you start paying,
            not while you are browsing, they are necessary for a payment to be taken, and
            they are not used for advertising.
          </p>

          <h2>Who else sees it</h2>
          <p>
            We do not sell personal data and we do not share it for advertising. It is
            disclosed only to:
          </p>
          <ul>
            <li>
              service providers who operate parts of this site on our behalf, being our
              hosting provider, our transactional email provider and our mailbox provider,
              each processing on our instructions
            </li>
            <li>
              the reservation system that holds our bookings, when you enquire about or book
              a stay
            </li>
            <li>
              our payment provider, when you pay for a booking
            </li>
            <li>
              Thai government offices, where a filing we make for you requires it
            </li>
            <li>
              professional advisers, or any authority, where the law requires disclosure
            </li>
          </ul>
          <p>
            Some of these providers operate servers outside Thailand. Where personal data is
            transferred abroad, we use providers that apply recognised safeguards for
            international transfers.
          </p>

          <h2>How long we keep it</h2>
          <p>
            Enquiries that do not become engagements are kept for up to two years from your
            last message, then deleted. Booking records are kept for five years, which is the
            minimum the Thai Accounting Act and the Revenue Code require for the accounts and
            tax records a paid booking creates. Lodger registration is kept for at least one
            year in the form the Hotel Act requires. Records connected to an owner engagement
            are kept for the length of the engagement and for the same accounting and tax
            periods afterwards. You can ask us to delete an enquiry sooner; we cannot delete
            records we are required by those rules to keep, and we will say so if that is the
            case.
          </p>

          <h2>Your rights</h2>
          <p>
            Under Thailand&rsquo;s Personal Data Protection Act you may ask us to give you a
            copy of the personal data we hold about you, correct it, delete it, restrict or
            object to how we use it, or transfer it elsewhere, and you may withdraw consent
            at any time. Withdrawing consent does not affect processing already carried out.
            Write to{" "}
            <a className="text-primary hover:underline" href={`mailto:${CONTACT_EMAIL}`}>
              {CONTACT_EMAIL}
            </a>{" "}
            and we will respond within 30 days. If you are not satisfied with our answer,
            you may complain to the Personal Data Protection Committee in Thailand.
          </p>

          <h2>Security</h2>
          <p>
            Data sent through this site travels over an encrypted connection and is held in
            access-controlled accounts. No system is perfectly secure, so please do not send
            identity documents or other sensitive information through the contact form. We
            will tell you the right channel. Card numbers are the one thing we have
            deliberately made it impossible for us to receive: the payment fields are served
            by our payment provider, and what you type into them never reaches this
            site&rsquo;s servers.
          </p>

          <h2>Children</h2>
          <p>
            This site is not directed at children and we do not knowingly collect personal
            data from anyone under 20 without the consent their guardian must give under
            Thai law. If you believe a child has sent us information, write to us and we
            will delete it.
          </p>

          <h2>Changes</h2>
          <p>
            If this policy changes we will update the date at the top of this page. Material
            changes affecting how we use information you have already sent will be notified
            to you directly where we hold an address for you.
          </p>
        </div>
      </div>
    </div>
  );
}
