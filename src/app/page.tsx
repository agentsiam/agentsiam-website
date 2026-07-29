import Link from "next/link";

const steps = [
  {
    n: "01",
    title: "Feasibility & ROI study",
    body: "One site visit, a written analysis, a one-hour online presentation, and a Go / No-Go recommendation — not an open-ended set of numbers.",
  },
  {
    n: "02",
    title: "Vacation rental permission",
    body: "We assess eligibility, prepare the documents, and file with the District Office on your behalf. Landed property has a real route through the non-hotel exemption.",
  },
  {
    n: "03",
    title: "Vacation rental management",
    body: "OTA and direct-booking management, guest care, and local vendor coordination — run properly, whether or not you're in Chiang Mai.",
  },
];

export default function Home() {
  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="mx-auto w-full max-w-6xl px-6 pb-16 pt-20 sm:pt-28">
        <p className="font-mono text-xs font-medium uppercase tracking-widest text-muted">
          Chiang Mai &middot; Short-term rental management, landed property only
        </p>
        <h1 className="mt-5 max-w-3xl text-4xl font-bold leading-tight tracking-tight text-text sm:text-5xl">
          Know if it&rsquo;s worth it before you commit to it.
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted">
          AgentSiam runs the feasibility study, the permission, and the
          management for short-term rentals in Chiang Mai &mdash; houses,
          townhomes and small buildings, priced and scoped as three separate
          steps, so you only pay for the next one once the last one says go.
        </p>
        <div className="mt-8 flex flex-wrap items-center gap-4">
          <Link
            href="/contact"
            className="rounded-full bg-ink px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary"
          >
            Start with a feasibility study
          </Link>
          <Link
            href="/how-it-works"
            className="rounded-full px-6 py-3 text-sm font-semibold text-text underline decoration-border underline-offset-4 transition-colors hover:text-primary"
          >
            See how it works
          </Link>
        </div>
      </section>

      {/* The staircase */}
      <section className="border-t border-border bg-surface">
        <div className="mx-auto w-full max-w-6xl px-6 py-16">
          <h2 className="text-2xl font-bold text-text">
            Three steps, each one earning the next.
          </h2>
          <div className="mt-10 grid gap-6 sm:grid-cols-3">
            {steps.map((step) => (
              <div
                key={step.n}
                className="rounded-2xl border border-border bg-bg p-6"
              >
                <span className="font-mono text-xs text-primary">
                  {step.n}
                </span>
                <h3 className="mt-3 text-lg font-semibold text-text">
                  {step.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">
                  {step.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured property */}
      <section className="mx-auto w-full max-w-6xl px-6 py-16">
        <h2 className="text-2xl font-bold text-text">Live in Chiang Mai now</h2>
        <div className="mt-8 flex flex-col gap-6 rounded-2xl border border-border p-8 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-mono text-xs uppercase tracking-widest text-muted">
              Chang Khlan, near the Night Bazaar
            </p>
            <h3 className="mt-2 text-xl font-semibold text-text">
              Lotus House
            </h3>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted">
              A three-story townhouse with a rooftop terrace, 2 bedrooms and
              space for 4 guests &mdash; the property this whole approach was
              built around.
            </p>
          </div>
          <Link
            href="/lotushouse"
            className="whitespace-nowrap rounded-full bg-ink px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary"
          >
            View property
          </Link>
        </div>
      </section>
    </div>
  );
}
