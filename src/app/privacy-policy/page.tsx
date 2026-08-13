import type { Metadata } from "next";
import { CONTACT_EMAIL, POLICY_UPDATED, pageMeta } from "@/lib/site";

export const metadata: Metadata = pageMeta({
  title: "Privacy policy",
  description:
    "How AgentSiam collects, uses and stores the information you send through this site, and the rights you have over it under Thailand's PDPA.",
  path: "/privacy-policy",
});

export default function PrivacyPolicyPage() {
  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-16">
      <h1 className="text-3xl font-bold text-text">Privacy Policy</h1>
      <p className="mt-2 text-sm text-muted">Last updated {POLICY_UPDATED}</p>

      <div className="prose mt-8 max-w-none text-sm leading-relaxed text-muted [&_h2]:mt-8 [&_h2]:text-base [&_h2]:font-semibold [&_h2]:text-text [&_li]:mt-1 [&_p]:mt-3 [&_ul]:mt-3 [&_ul]:list-inside [&_ul]:list-disc">
        <p>
          This policy explains what AgentSiam does with personal information
          collected through this website. It covers this site only. It does not
          cover the booking platforms a property may also be listed on, each of
          which handles guest data under its own policy.
        </p>

        <h2>Who is responsible for your data</h2>
        <p>
          AgentSiam, registered in Bangkok, Thailand at 922/11 Rama 9 Road,
          Huaykwang, Bangkapi, Bangkok 10310, is the data controller for
          information submitted through this site. For any question about this
          policy, or to exercise the rights below, write to{" "}
          <a
            className="text-primary hover:underline"
            href={`mailto:${CONTACT_EMAIL}`}
          >
            {CONTACT_EMAIL}
          </a>
          .
        </p>

        <h2>What we collect, and why</h2>
        <p>
          <strong>Enquiries.</strong> When you send the contact form we receive
          your first and last name, email address, phone number if you supply
          one, the service you selected, and the content of your message. We use
          it for one purpose: to answer you and, if the enquiry becomes an
          engagement, to carry out the work you asked about. The lawful basis is
          your consent, and the steps taken at your request before entering a
          contract.
        </p>
        <p>
          <strong>Property owner information.</strong> If you engage us for a
          feasibility study, a vacation rental permission filing or management,
          we collect the further information that work requires, including
          property details and the identity and ownership documents a filing
          needs. That is collected in the course of the engagement, not through
          this website, and is used to perform the contract and to meet legal
          obligations.
        </p>
        <p>
          <strong>Guest information.</strong> Guests who book a property we
          manage provide their details to the booking platform or to the booking
          system on the property page. We receive from that system only what is
          needed to host the stay and to keep the guest records Thai law
          requires of an accommodation operator.
        </p>
        <p>
          <strong>Site measurement.</strong> We use cookieless analytics. It
          records page views and aggregate traffic patterns, without cookies,
          without a persistent identifier and without profiling. It is not used
          to track you across other websites.
        </p>

        <h2>Cookies</h2>
        <p>
          This site sets no advertising, profiling or analytics cookies of its
          own, which is why you are not asked to dismiss a cookie banner. The
          booking system on a property page may set its own cookies when you
          interact with it, under its own policy.
        </p>

        <h2>Who else sees it</h2>
        <p>
          We do not sell personal data and we do not share it for advertising.
          It is disclosed only to:
        </p>
        <ul>
          <li>
            service providers who operate parts of this site on our behalf,
            being our hosting provider, our transactional email provider and our
            mailbox provider, each processing on our instructions
          </li>
          <li>
            the booking system used on a property page, where you use it to
            enquire or book
          </li>
          <li>
            Thai government offices, where a filing we make for you requires it
          </li>
          <li>
            professional advisers, or any authority, where the law requires
            disclosure
          </li>
        </ul>
        <p>
          Some of these providers operate servers outside Thailand. Where
          personal data is transferred abroad, we use providers that apply
          recognised safeguards for international transfers.
        </p>

        <h2>How long we keep it</h2>
        <p>
          Enquiries that do not become engagements are kept for up to two years
          from your last message, then deleted. Records connected to an
          engagement are kept for the length of the engagement and for the
          period Thai accounting, tax and accommodation record-keeping rules
          require afterwards. You can ask us to delete an enquiry sooner.
        </p>

        <h2>Your rights</h2>
        <p>
          Under Thailand&rsquo;s Personal Data Protection Act you may ask us to
          give you a copy of the personal data we hold about you, correct it,
          delete it, restrict or object to how we use it, or transfer it
          elsewhere, and you may withdraw consent at any time. Withdrawing
          consent does not affect processing already carried out. Write to{" "}
          <a
            className="text-primary hover:underline"
            href={`mailto:${CONTACT_EMAIL}`}
          >
            {CONTACT_EMAIL}
          </a>{" "}
          and we will respond within 30 days. If you are not satisfied with our
          answer, you may complain to the Personal Data Protection Committee in
          Thailand.
        </p>

        <h2>Security</h2>
        <p>
          Data sent through this site travels over an encrypted connection and
          is held in access-controlled accounts. No system is perfectly secure,
          so please do not send identity documents, financial details or other
          sensitive information through the contact form. We will tell you the
          right channel.
        </p>

        <h2>Children</h2>
        <p>
          This site is not directed at children and we do not knowingly collect
          personal data from anyone under 20 without the consent their guardian
          must give under Thai law. If you believe a child has sent us
          information, write to us and we will delete it.
        </p>

        <h2>Changes</h2>
        <p>
          If this policy changes we will update the date at the top of this
          page. Material changes affecting how we use information you have
          already sent will be notified to you directly where we hold an address
          for you.
        </p>
      </div>
    </div>
  );
}
