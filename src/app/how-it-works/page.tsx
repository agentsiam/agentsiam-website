import type { Metadata } from "next";
import { pageMeta } from "@/lib/site";
import Link from "next/link";

export const metadata: Metadata = pageMeta({
  title: "How it works",
  description:
    "Three services sold as a staircase, not a menu: a paid feasibility and ROI study, the non-hotel exemption filing, then OTA and direct booking management.",
  path: "/how-it-works",
});

export default function HowItWorksPage() {
  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-16">
      <h1 className="text-3xl font-bold text-text">How it works</h1>
      <p className="mt-4 max-w-2xl text-muted">
        Three services, sold as a staircase rather than a menu. Each step
        qualifies the property for the next, and the first step is paid, so
        it filters out a bad idea before it costs more than THB 16,000 to
        find out.
      </p>

      <div className="mt-10 space-y-10">
        <section>
          <span className="font-mono text-xs text-primary">01</span>
          <h2 className="mt-2 text-xl font-semibold text-text">
            Feasibility &amp; ROI study
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            One site visit, a written analysis report, and a one-hour online
            presentation. Covers market and demand analysis (location,
            competition, ADR, seasonality), property assessment and
            positioning, operating cost modelling, and a business case across
            up to three scenarios. Ends in a Go / No-Go recommendation &mdash;
            not an open-ended set of numbers.
          </p>
        </section>

        <section>
          <span className="font-mono text-xs text-primary">02</span>
          <h2 className="mt-2 text-xl font-semibold text-text">
            Vacation rental permission
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            Landed property &mdash; houses, townhomes, small buildings &mdash;
            has a real route to Thailand&rsquo;s non-hotel accommodation
            exemption: notify the District Office, pass a fire safety
            inspection, and hold a certificate valid five years. We assess
            eligibility and handle the filing under power of attorney. We
            cannot guarantee the outcome of a government decision.
          </p>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            A condominium unit has no path through this exemption. It can
            still be in scope if the building&rsquo;s juristic person
            confirms short-term rental is permitted &mdash; that confirmation
            is a precondition, not a formality.
          </p>
        </section>

        <section>
          <span className="font-mono text-xs text-primary">03</span>
          <h2 className="mt-2 text-xl font-semibold text-text">
            Vacation rental management
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            OTA channel management, a direct booking site, guest
            communication across the full stay, and coordination with local
            cleaning and maintenance vendors &mdash; run properly whether or
            not the owner lives in Chiang Mai.
          </p>
        </section>
      </div>

      <div className="mt-12">
        <Link
          href="/contact"
          className="inline-block rounded-full bg-ink px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary"
        >
          Start with a feasibility study
        </Link>
      </div>
    </div>
  );
}
