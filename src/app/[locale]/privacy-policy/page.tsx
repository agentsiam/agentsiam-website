import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { TranslationNote } from "@/components/translation-note";
import { getDictionary } from "@/i18n";
import { isLocale } from "@/i18n/config";
import { AnalyticsChoice } from "@/components/analytics-consent";
import {
  CONTACT_EMAIL,
  CRISP_WEBSITE_ID,
  GA_MEASUREMENT_ID,
  POSTAL_ADDRESS,
  PRIVACY_UPDATED,
  policyUpdated,
  pageMeta,
} from "@/lib/site";

/**
 * Existing policy text, kept verbatim apart from one sentence: the enquiry paragraph now
 * lists the fields the rebuilt contact form actually collects (name, email, phone or LINE,
 * property type, neighbourhood) instead of the old first name / last name / service set. A
 * privacy policy that describes the wrong fields is worse than a plain one, so the text
 * follows the form. Every other paragraph is unchanged.
 *
 * The one exception is Google Analytics. Its measurement paragraph, its cookie paragraph and
 * its line under "Who else sees it" render only when NEXT_PUBLIC_GA_MEASUREMENT_ID is set,
 * and the original cookieless wording renders when it is not, for the same reason the chat
 * sentence is conditional. The retention periods in that text are the GA4 property's own
 * data retention settings, read from its admin screen: change one there and this changes too.
 *
 * The second exception is the newsletter paragraph under "What we collect, and why",
 * added 15/11/2026 in the same change as the sign-up on the two editorial hubs. A form
 * that links to this policy from its consent line while the policy does not describe what
 * the form just did is worse than a form with no link at all. **Draft: it has not been
 * signed off and has not been read by counsel.**
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

      {/* shape: legal-prose -- The policy in full. A legal document, where the narrative system has no business. */}
      <div className="mx-auto w-full max-w-(--container-read) px-5 pb-22 pt-14">
        <span className="eyebrow">{t.legalEyebrow}</span>
        <h1 className="mt-3.5 font-headline text-[clamp(24px,4vw,32px)] font-extrabold leading-[1.14] tracking-[-0.03em]">
          {t.privacy}
        </h1>
        <p className="mt-2.5 text-sm text-muted">
          {t.lastUpdated}{" "}
          {policyUpdated(locale, PRIVACY_UPDATED)}
        </p>

        <div className="mt-8 text-[15px] leading-relaxed text-body [&_h2]:mt-8 [&_h2]:font-display [&_h2]:text-lg [&_h2]:font-bold [&_h2]:tracking-[-0.015em] [&_h2]:text-text [&_li]:mt-1 [&_p]:mt-3 [&_ul]:mt-3 [&_ul]:list-inside [&_ul]:list-disc"
          lang={locale === "en" ? undefined : "en"}
        >
          <p>
            This policy explains what AgentSiam does with personal information collected
            through this website. It covers this site only. It does not cover the booking
            platforms a property may also be listed on, each of which handles guest data
            under its own policy.
          </p>

          <h2>Who is responsible for your data</h2>
          {/* Read from POSTAL_ADDRESS and district level, never its own copy. This
              paragraph carried a Bangkok street address until 14/11/2026: a city the
              company was never registered in, and a street at all, which came off the rest
              of the site on 08/11/2026 so that nothing published could locate the house.
              It drifted precisely because it was the one address here not derived from the
              constant. The full registered office stays public at the DBD, which is where
              a data subject entitled to it should be sent. */}
          <p>
            {POSTAL_ADDRESS.legalName}, registered in {POSTAL_ADDRESS.district},{" "}
            {POSTAL_ADDRESS.locality}, {POSTAL_ADDRESS.country}, is the data controller for
            information submitted through this site. Our registered office address is on
            public record at Thailand&rsquo;s Department of Business Development. For any
            question about this policy, or to exercise the rights below, write to{" "}
            <a className="text-primary hover:underline" href={`mailto:${CONTACT_EMAIL}`}>
              {CONTACT_EMAIL}
            </a>
            .
          </p>

          <h2>What we collect, and why</h2>
          <p>
            <strong>Enquiries.</strong> When you send the contact form we receive your name,
            email address, the phone number or LINE handle if you supply one, the property
            type and neighbourhood you selected, and the content of your message. With it we
            receive how you reached the site, as described under Cookies below: any campaign
            tags on the link you followed, the website that sent you, and the first page you
            opened. We use it
            for one purpose: to answer you and, if the enquiry becomes an engagement, to
            carry out the work you asked about. The lawful basis is your consent, and the
            steps taken at your request before entering a contract.
          </p>
          {/* The renter request form, added 21/11/2026. It collects far more than the
              contact form paragraph above names, and it links here from its consent line.
              The children's ages are stated with their purpose because the Children
              section below says the site does not knowingly collect children's data: these
              come from the adult making the request, about the people travelling with them.
              Draft: not signed off and not read by counsel. */}
          <p>
            <strong>Requests for a place to stay.</strong>{" "}
            When you send the request form
            for a monthly or longer stay we receive your name, the one way to reach you
            that you choose (an email address, a phone or WhatsApp number, or a LINE ID),
            the language you want to be answered in, your dates and how fixed they are, the
            area, the number of bedrooms and the budget you are looking for, the number of
            adults and children and, if you give them, the children&rsquo;s ages, what the
            home must have, who is travelling, whether you will have a vehicle, any pets,
            whether anyone smokes, how you found us, your message, and the page you sent it
            from. We use it for one purpose: to find you a home that fits and to answer you.
            We also keep a coded fingerprint of your email address, phone or WhatsApp number
            and LINE ID, made with a secret key so that it cannot be turned back into the
            details themselves, and compare it with the requests we received in the previous
            90 days, so that two requests from you are handled as one. The fingerprint is
            never passed to a property owner.
            The children&rsquo;s ages are used only to judge whether a home is suitable and
            safe for them, and are never linked to a child&rsquo;s name. If you tick the
            box that allows it, we may show a property owner or their co-host what you are
            looking for; your name and the way to reach you are passed to an owner only
            after that owner has accepted our introduction terms. The lawful basis is your
            consent, and the steps taken at your request before entering a contract.
          </p>
          {/* The two editorial hubs, /journal and /host-newsletter, added 15/11/2026 with
              the sign-up itself. Three things in here are unusual enough to be worth
              stating rather than leaving a reader to assume the ordinary case: the address
              reaches a mailbox and not a mailing-list provider, so there is no third party
              holding the list; it is not used to market the services this company sells;
              and withdrawing consent is replying, because a person reads that mailbox.
              All three are true only while the list stays a mailbox. The day a sending
              provider is chosen, this paragraph is the first thing that has to change, and
              "Who else sees it" gains a bullet naming it. */}
          <p>
            <strong>The journal and the host newsletter.</strong> When you give us an email
            address on one of our editorial pages we receive that address, which of the two
            pages you gave it on, and the language you were reading in. We use it for one
            purpose: to email you when we publish something new there. It is not added to
            any other list and it is not used to market our services to you. It does not
            reach a mailing-list provider either; it arrives in our own mailbox and stays
            there. The lawful basis is your consent, which you can withdraw at any time by
            replying to any issue and asking us to stop.
          </p>
          <p>
            <strong>Property owner information.</strong> If you engage us for a feasibility
            study, a vacation rental permission filing or management, we collect the further
            information that work requires, including property details and the identity and
            ownership documents a filing needs. That is collected in the course of the
            engagement, not through this website, and is used to perform the contract and to
            meet legal obligations.
          </p>
          {/* The space after </strong> is written as {" "} in this paragraph and in the
              guests one below, and nowhere else on this page. Both of those carry an
              &rsquo; and the others do not, which is the whole of the difference: a JSX
              text node holding an entity is split around it, and the leading space of the
              first part is then trimmed away with the line's indentation. So the page
              rendered "Bookings.When you request" and "we manage.Where a stay" from source
              that has a space in it, and a hexdump of the line proves the space is there.
              Verified 15/11/2026 against every lead-in on this page: the two with an
              entity lost the space and the rest kept it.
              {" "} is an expression rather than whitespace, so nothing can trim it. Add an
              entity to any other paragraph here and it needs the same treatment. */}
          <p>
            <strong>Bookings.</strong>{" "}
            When you request or make a booking on this site we
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
            <strong>Guests of properties we manage.</strong>{" "}
            Where a stay is booked through a
            travel platform rather than this site, that platform collects the guest&rsquo;s
            details under its own policy, and we receive from it only what is needed to host
            the stay and to keep the guest records Thai law requires of an accommodation
            operator.
          </p>
          <p>
            <strong>Messages you send us on WhatsApp.</strong> If you write to us on
            WhatsApp we receive the name on your WhatsApp profile, the number you write
            from, and what you write. Where you use a WhatsApp username, WhatsApp
            withholds your number and gives us your username and an identifier for you
            that works only with us, and we keep those in its place. Where you send a
            photograph, a document or a voice message we record that you sent one and its
            caption, not the file itself. We use all of it to answer you and to arrange or
            host your stay. The conversation is kept for us by Upstash, on servers in
            Singapore. WhatsApp is operated by Meta, which carries the message to us under
            its own policy, as it does any other WhatsApp message. The lawful basis is the
            steps taken at your request, and the performance of your booking where one
            follows.
          </p>
          {GA_MEASUREMENT_ID ? (
            <>
              <p>
                <strong>Site measurement.</strong> We use two analytics services. The first,
                provided by our hosting provider, is cookieless: it records page views and
                aggregate traffic patterns without cookies, without a persistent identifier
                and without profiling.
              </p>
              <p>
                The second is Google Analytics, which shows us how visitors find this site
                and which pages they use. It receives the pages you view, how you arrived,
                your device and browser type, and an approximate location. Google works out
                that location from your IP address and, by its own account, does not store
                the address. We have not turned on Google&rsquo;s advertising features, so
                this data is not used for advertising or to follow you across other
                websites. Google Analytics keeps event-level data for two months and
                user-level data for fourteen months; the aggregate reports built from it are
                kept longer. We use it because knowing which pages help people is how we
                decide what to improve.
              </p>
            </>
          ) : (
            <p>
              <strong>Site measurement.</strong> We use cookieless analytics. It records page
              views and aggregate traffic patterns, without cookies, without a persistent
              identifier and without profiling. It is not used to track you across other
              websites.
            </p>
          )}

          <h2>Cookies</h2>
          {GA_MEASUREMENT_ID ? (
            <>
              <p>
                Google Analytics sets two cookies of its own on this site: <code>_ga</code>,
                which tells one visitor from another, and a second whose name begins with{" "}
                <code>_ga_</code>, which keeps track of a visit. Each lasts up to two years,
                and many browsers delete them sooner. If you visit from the European Economic
                Area, the United Kingdom or Switzerland, we ask first, and neither cookie is
                set unless you accept. Everywhere else they are set when a page loads.
              </p>
              <p>
                Wherever you are, you can turn Google Analytics off for this browser here.
                Your choice is kept in your browser&rsquo;s local storage rather than in a
                cookie, so it lasts until you change it or clear your browser data.
              </p>
              <AnalyticsChoice />
              <p>
                Apart from those, this site sets no advertising, profiling or analytics
                cookies of its own. Our payment provider sets its own cookies when you begin
                a payment, to keep the payment session working and to detect fraud, under
                its own policy. They appear only once you start paying, not while you are
                browsing, they are necessary for a payment to be taken, and they are not
                used for advertising.
              </p>
            </>
          ) : (
            <p>
              This site sets no advertising, profiling or analytics cookies of its own, which
              is why you are not asked to dismiss a cookie banner. Our payment provider sets
              its own cookies when you begin a payment, to keep the payment session working and
              to detect fraud, under its own policy. They appear only once you start paying,
              not while you are browsing, they are necessary for a payment to be taken, and
              they are not used for advertising.
            </p>
          )}
          <p>
            When you arrive on this site from another website, or by a link that carries
            campaign tags, we keep those tags, the address of that website and the first page
            you opened in your browser&rsquo;s session storage. It is not a cookie, it holds
            nothing that identifies you, and your browser deletes it when you close the tab.
            It is never sent to us or anyone else on its own: it reaches us only if you send
            the property owner enquiry form, so that we know which page or campaign brought
            the enquiry.
          </p>
          {/* Only when the chat is actually configured. A privacy policy describing a
              provider the site is not running is as wrong as one that stays silent about a
              provider it is. */}
          {CRISP_WEBSITE_ID ? (
            <p>{t.privacyChatCookie}</p>
          ) : null}

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
              the private, access-controlled repository where we keep our record of each
              enquiry and request, hosted by GitHub
            </li>
            <li>
              a property owner or their co-host, for a request to stay where you have ticked
              the box that allows it, and only as described under What we collect above
            </li>
            <li>
              Upstash, which stores the WhatsApp conversations described above
            </li>
            <li>
              our payment provider, when you pay for a booking
            </li>
            {GA_MEASUREMENT_ID ? (
              <li>
                Google, which provides the analytics service described above, for the
                visitors it is switched on for
              </li>
            ) : null}
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
            Enquiries that do not become engagements are kept for up to two years from
            your last message, then deleted. An email address given for the journal or the
            host newsletter is kept until you ask us to stop sending them, and is deleted
            when you do. A WhatsApp conversation is kept for twelve
            months from your most recent message in it, then deleted, and we hold only
            the five hundred most recent messages of one at any time. Booking records
            are kept for five years, which is the minimum the Thai Accounting Act and
            the Revenue Code require for the accounts and tax records a paid booking
            creates. Lodger registration is kept for at least one year in the form the
            Hotel Act requires. Records connected to an owner engagement are kept for
            the length of the engagement and for the same accounting and tax periods
            afterwards. You can ask us to delete an enquiry sooner; we cannot delete
            records we are required by those rules to keep, and we will say so if that
            is the case.
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
