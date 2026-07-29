import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Business Services | AgentSiam",
};

const pillars = [
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

export default function BusinessServicesPage() {
  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-16">
      <p className="font-mono text-xs font-medium uppercase tracking-widest text-muted">
        For businesses entering the Thai market
      </p>
      <h1 className="mt-4 max-w-2xl text-3xl font-bold text-text sm:text-4xl">
        Setup, sourcing, ecommerce, and growth.
      </h1>
      <p className="mt-4 max-w-2xl text-muted">
        AgentSiam&rsquo;s primary focus right now is short-term rental
        management &mdash; see{" "}
        <a href="/" className="underline hover:text-primary">
          the homepage
        </a>{" "}
        for that. These four services are still available for businesses
        entering Thailand more broadly.
      </p>

      <div className="mt-12 grid gap-6 sm:grid-cols-2">
        {pillars.map((pillar) => (
          <div
            key={pillar.name}
            className="overflow-hidden rounded-2xl border border-border"
          >
            <div className={`${pillar.accent} h-1.5 w-full`} />
            <div className="p-6">
              <h2 className="text-lg font-semibold text-text">
                {pillar.hook}
              </h2>
              <p className="mt-1 text-sm font-medium text-muted">
                {pillar.name}
              </p>
              <p className="mt-3 text-sm leading-relaxed text-muted">
                {pillar.body}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-12">
        <a
          href="/contact"
          className="inline-block rounded-full bg-ink px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary"
        >
          Get in touch
        </a>
      </div>
    </div>
  );
}
