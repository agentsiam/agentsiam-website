import type { Dictionary } from "@/i18n";

/**
 * The direct-booking cancellation policy.
 *
 * The wording lives in the dictionaries, under the cx* keys, in all three languages. This
 * file holds the version a guest accepts and the plain forms the emails use.
 *
 * Bump the version on any change to the cx* wording or numbers. The version is what is
 * stored on the Stripe payment and the Beds24 booking as the terms that guest accepted, so
 * reusing it for different words would make the record say something it does not.
 *
 * Decided 02/11/2026. Source and reasoning:
 * agentsiam-consulting/as-work/2026-09-06-website-ui-ux-audit/cancellation-policy.md.
 */
export const CANCELLATION_POLICY_VERSION = "2026-11-02";

/** The policy as ordered blocks, so the page, the panel and the emails cannot drift. */
export function cancellationPolicy(t: Dictionary) {
  return {
    title: t.cxTitle,
    intro: [t.cxIntro, t.cxOverride],
    rules: [t.cxRule1, t.cxRule2, t.cxRule3],
    rebook: { title: t.cxRebookTitle, body: t.cxRebookBody },
    change: { title: t.cxChangeTitle, body: t.cxChangeBody },
    goodwill: t.cxGoodwill,
  };
}

export function cancellationPolicyText(t: Dictionary): string {
  const p = cancellationPolicy(t);
  return [
    p.title,
    ...p.intro,
    ...p.rules.map((rule) => `- ${rule}`),
    `${p.rebook.title} ${p.rebook.body}`,
    `${p.change.title} ${p.change.body}`,
    p.goodwill,
  ].join("\n\n");
}

export function cancellationPolicyHtml(t: Dictionary, escape: (value: string) => string): string {
  const p = cancellationPolicy(t);
  return [
    `<h3>${escape(p.title)}</h3>`,
    ...p.intro.map((line) => `<p>${escape(line)}</p>`),
    `<ul>${p.rules.map((rule) => `<li>${escape(rule)}</li>`).join("")}</ul>`,
    `<p><strong>${escape(p.rebook.title)}</strong> ${escape(p.rebook.body)}</p>`,
    `<p><strong>${escape(p.change.title)}</strong> ${escape(p.change.body)}</p>`,
    `<p>${escape(p.goodwill)}</p>`,
  ].join("");
}
