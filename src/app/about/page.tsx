import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About | AgentSiam",
};

export default function AboutPage() {
  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-16">
      <h1 className="text-3xl font-bold text-text">About AgentSiam</h1>
      <p className="mt-4 rounded-lg border border-secondary/40 bg-secondary/10 p-4 text-sm text-text">
        <strong>TODO &mdash; placeholder.</strong> Real founder bios, company
        story, and photography aren&rsquo;t drafted yet. Structural stub only,
        so the nav link doesn&rsquo;t 404.
      </p>
      <p className="mt-6 max-w-xl text-muted">
        AgentSiam is registered in Bangkok and run by two co-founders. The
        home market is Chiang Mai, where the team runs feasibility studies,
        handles vacation rental permission filings, and manages short-term
        rental properties &mdash; landed houses, townhomes and small
        buildings.
      </p>
    </div>
  );
}
