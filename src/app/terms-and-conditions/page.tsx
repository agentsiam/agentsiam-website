import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms & Conditions | AgentSiam",
};

export default function TermsPage() {
  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-16">
      <h1 className="text-3xl font-bold text-text">Terms &amp; Conditions</h1>

      <p className="mt-4 rounded-lg border border-secondary/40 bg-secondary/10 p-4 text-sm text-text">
        <strong>Draft, not legal-ready.</strong> The base text below is
        carried over from the live site&rsquo;s existing Terms &amp;
        Conditions. The short-term-rental clauses (non-hotel exemption,
        booking terms) are new additions for this prototype and have not
        been reviewed by counsel &mdash; see{" "}
        <code>terms-and-conditions-DRAFT.md</code> in the agentsiam-consulting
        repo for the full reasoning.
      </p>

      <div className="prose mt-8 max-w-none text-sm leading-relaxed text-muted [&_h2]:mt-8 [&_h2]:text-base [&_h2]:font-semibold [&_h2]:text-text">
        <h2>Ownership of Intellectual Property, Copyrights, and Logos</h2>
        <p>
          All content published on this website, including text, graphics,
          logos, icons, images, and software, is the property of AgentSiam or
          its content suppliers and is protected by applicable intellectual
          property and copyright laws. You may not copy, reproduce,
          distribute, modify, display, or use any part of this website&rsquo;s
          content, trademarks, or logos without prior written consent from
          AgentSiam.
        </p>

        <h2>Short-term rental services</h2>
        <p>
          AgentSiam assesses eligibility and prepares and files vacation
          rental permission applications on a client&rsquo;s behalf where
          that is part of the engaged service.{" "}
          <strong>
            AgentSiam cannot guarantee the outcome of any government
            decision, licensing approval, or regulatory review
          </strong>
          , including Thailand&rsquo;s non-hotel accommodation exemption. Any
          revenue, occupancy, or return figure presented in a proposal or on
          this site is an illustration based on available market data, not a
          guarantee of performance.
        </p>
        <p>
          Bookings made through a property&rsquo;s listing are additionally
          governed by that booking&rsquo;s own terms presented at the time of
          booking, and by the property&rsquo;s house rules.
        </p>

        <h2>Form Submissions and Communication</h2>
        <p>
          By submitting any form on this website, you agree to provide
          accurate information and consent to being contacted by AgentSiam
          using the details you have provided.
        </p>

        <h2>Limitation of Liability</h2>
        <p>
          AgentSiam shall not be held liable for any direct, indirect,
          incidental, consequential, or punitive damages arising out of your
          use of this website or any services provided.
        </p>

        <h2>Governing Law</h2>
        <p>
          These Terms &amp; Conditions shall be governed by and construed in
          accordance with the laws of Thailand.
        </p>

        <h2>Disclaimer</h2>
        <p>
          The information provided on this website is for general
          informational purposes only. It is not intended as legal,
          financial, tax, or investment advice.
        </p>
      </div>
    </div>
  );
}
