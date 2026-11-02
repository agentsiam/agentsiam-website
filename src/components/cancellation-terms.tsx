import type { Dictionary } from "@/i18n";
import { cancellationPolicy } from "@/lib/cancellation-policy";

/**
 * The cancellation policy in full. Rendered on the terms page and, in the guest's
 * language, on the booking step where it is accepted. The full text is on that step on
 * purpose: a link to the terms beside a checkbox is what Stripe names as insufficient
 * evidence in a dispute.
 */
export function CancellationTerms({
  t,
  heading: Heading = "h3",
  headingClassName,
}: {
  t: Dictionary;
  heading?: "h2" | "h3";
  headingClassName?: string;
}) {
  const p = cancellationPolicy(t);
  return (
    <>
      <Heading className={headingClassName}>{p.title}</Heading>
      {p.intro.map((line) => (
        <p key={line}>{line}</p>
      ))}
      <ul className="mt-3 list-disc space-y-1 pl-5">
        {p.rules.map((rule) => (
          <li key={rule}>{rule}</li>
        ))}
      </ul>
      <p>
        <strong>{p.rebook.title}</strong> {p.rebook.body}
      </p>
      <p>
        <strong>{p.change.title}</strong> {p.change.body}
      </p>
      <p>{p.goodwill}</p>
    </>
  );
}
