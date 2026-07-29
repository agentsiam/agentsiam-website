import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy | AgentSiam",
};

export default function PrivacyPolicyPage() {
  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-16">
      <h1 className="text-3xl font-bold text-text">Privacy Policy</h1>
      <p className="mt-4 rounded-lg border border-secondary/40 bg-secondary/10 p-4 text-sm text-text">
        <strong>TODO &mdash; not ported yet.</strong> A live{" "}
        <code>/privacy-policy</code> page exists on agentsiam.com, but its
        content wasn&rsquo;t checked or copied over for this prototype pass.
        Personal data handling (owner data, guest data, lead form
        submissions) deserves a deliberate look at that real text rather than
        a template filled in blind. This page is a placeholder until that
        happens.
      </p>
    </div>
  );
}
