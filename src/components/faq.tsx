/**
 * The accordion from the handoff, built on <details>/<summary> rather than useState.
 *
 * Native disclosure gives keyboard support, screen-reader semantics and find-in-page
 * (browsers open a closed <details> to reveal a match) for free, and it renders open
 * content into the HTML, so the answers are indexable. The design's + / − affordance is
 * kept via the open: variant.
 */
export function Faq({ items }: { items: { q: string; a: string }[] }) {
  return (
    <div className="mt-5 border-t border-hairline">
      {items.map((item) => (
        <details key={item.q} className="group border-b border-hairline">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4.5 marker:content-none">
            <span className="text-[15.5px] font-semibold">{item.q}</span>
            <span className="flex h-7.5 w-7.5 shrink-0 items-center justify-center rounded-full border-[1.5px] border-hairline text-base group-open:border-ink group-open:bg-ink group-open:text-white">
              <span className="group-open:hidden">+</span>
              <span className="hidden group-open:inline">−</span>
            </span>
          </summary>
          <p className="max-w-[760px] pb-5 text-[14.5px] leading-relaxed text-body">
            {item.a}
          </p>
        </details>
      ))}
    </div>
  );
}
