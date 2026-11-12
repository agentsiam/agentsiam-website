/**
 * The form primitives the admin's forms share.
 *
 * Pulled out of the candidate form when the owner pipeline and the property pool arrived,
 * so that four forms look like one tool rather than four. Nothing here knows what a record
 * is; it knows what a labelled input looks like.
 */

export const INPUT =
  "mt-1 w-full rounded-box border border-border bg-bg px-3 py-2 text-sm text-text";

export function Label({
  htmlFor,
  label,
  hint,
}: {
  htmlFor: string;
  label: string;
  hint?: string;
}) {
  return (
    <label htmlFor={htmlFor} className="block">
      <span className="block text-xs font-semibold text-muted">{label}</span>
      {hint ? <span className="block text-xs text-muted">{hint}</span> : null}
    </label>
  );
}
