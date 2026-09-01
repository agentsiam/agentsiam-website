/**
 * One JSON-LD block, rendered as a plain <script type="application/ld+json">.
 *
 * A native script tag rather than next/script: JSON-LD is data, not executable code, and
 * next/script exists to schedule execution. This is what the Next JSON-LD guide in
 * node_modules/next/dist/docs/01-app/02-guides/json-ld.md recommends.
 *
 * JSON.stringify does not escape HTML, so a "<" arriving from a dictionary string or a
 * photo caption could close the script element early and inject markup. Replacing it with
 * its unicode escape is the mitigation the same guide names, and it is valid JSON either
 * way, so a parser reads exactly what was intended.
 */
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, "\\u003c"),
      }}
    />
  );
}
