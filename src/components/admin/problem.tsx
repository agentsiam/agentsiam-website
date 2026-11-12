/**
 * What the screen says when it cannot read the document store.
 *
 * Always the store's own words rather than a generic apology: the message names the file,
 * and since 12/11/2026 it also tells a token that cannot see the repository apart from a
 * file that is not there. That distinction is the whole value of the panel.
 */
export function Problem({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-panel border border-hairline bg-wash-red p-5 text-sm text-deep-red">
      {children}
    </div>
  );
}
