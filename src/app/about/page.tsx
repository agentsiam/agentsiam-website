import type { Metadata } from "next";
import { pageMeta } from "@/lib/site";

export const metadata: Metadata = pageMeta({
  title: "About",
  description:
    "AgentSiam is registered in Bangkok and run by two co-founders, working landed property in Chiang Mai: feasibility studies, permission filings and management.",
  path: "/about",
  placeholder: true,
});

export default function AboutPage() {
  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-16">
      <h1 className="text-3xl font-bold text-text">About AgentSiam</h1>
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
