/**
 * A page of the feasibility report, rendered as a document rather than shipped as a
 * screenshot.
 *
 * The point of showing this at all: the product is "a written analysis with real numbers,
 * ending in a Go or a No-Go". Every competitor claims something similar and none of them
 * show you one. This is the nearest honest thing to showing one — the real structure, with
 * the figures held back.
 *
 * Three rules it has to keep:
 *
 * - **It says it is a sample, on the artefact itself**, not in a caption underneath that a
 *   screenshot would lose. The site's Terms already allow illustrative figures; they do not
 *   allow implying a sample is a client's real report.
 * - **The money is redacted, not invented.** Occupancy and breakeven percentages are shown
 *   because they demonstrate method (conservative case, breakeven below it). Baht figures
 *   are grey bars, because a number a reader could anchor on would be a made-up number.
 * - **No fee anywhere.** Same rule as the rest of this page: prices live in the price book.
 *
 * Built as markup rather than an image so it stays sharp at any size, reflows on a phone,
 * and can be read by a screen reader.
 */

const SECTIONS = [
  ["1. Market and demand analysis", "p. 3"],
  ["4. Business case, three scenarios", "p. 14"],
  ["2. Property assessment and positioning", "p. 8"],
  ["5. Against a long-term tenant", "p. 19"],
  ["3. Operating cost model", "p. 11"],
  ["6. Recommendation: Go or No-Go", "p. 22"],
];

const ROWS: { label: string; values: (string | null)[]; total?: boolean }[] = [
  { label: "Average nightly rate", values: [null, null, null] },
  { label: "Occupancy, annual", values: ["52%", "61%", "68%"] },
  { label: "Gross revenue", values: [null, null, null] },
  { label: "Operating cost", values: [null, null, null] },
  { label: "Net operating income", values: [null, null, null], total: true },
  { label: "Breakeven occupancy", values: ["41%", "41%", "41%"] },
];

/** A withheld figure. aria-label so a screen reader hears why the cell is empty. */
function Redacted() {
  return (
    <span
      role="img"
      aria-label="figure withheld in this sample"
      className="inline-block h-2.5 w-14 rounded-[3px] bg-[#d7d8e2] align-middle"
    />
  );
}

export function SampleReport() {
  return (
    <article className="relative overflow-hidden rounded-panel border border-hairline bg-bg shadow-sm">
      <div className="absolute inset-y-0 right-0 hidden w-2.5 bg-sand sm:block" />

      <div className="p-6 sm:p-9 sm:pr-12">
        {/* -- masthead ---------------------------------------------------- */}
        <header className="flex flex-wrap items-start justify-between gap-5">
          <div>
            <p className="font-display text-lg font-extrabold tracking-[-0.01em] text-ink">
              AgentSiam
            </p>
            <p className="eyebrow mt-1.5">Feasibility &amp; ROI study · Chiang Mai</p>
          </div>
          <p className="max-w-[330px] rounded-box border-[1.5px] border-dashed border-secondary bg-wash-red px-3 py-2">
            <span className="eyebrow text-deep-red">Sample — not a client report</span>
            <span className="mt-1 block text-[11.5px] leading-snug text-body">
              The structure and format of the report a client receives. Figures are
              illustrative, not a forecast for any property.
            </span>
          </p>
        </header>

        <h3 className="mt-6 font-headline text-[clamp(22px,3.4vw,30px)] font-extrabold leading-[1.12] tracking-[-0.03em] text-ink">
          Is short-let worth it
          <br />
          for this property?
        </h3>

        <dl className="mt-5 grid grid-cols-2 gap-4 rounded-box bg-surface px-5 py-4 sm:grid-cols-4">
          {[
            ["Property", "2-bed townhouse"],
            ["Neighbourhood", "Chang Khlan"],
            ["Site visit", "Completed"],
            ["Verdict", "Section 6"],
          ].map(([label, value]) => (
            <div key={label}>
              <dt className="eyebrow">{label}</dt>
              <dd className="mt-1 text-[15px] font-semibold text-ink">{value}</dd>
            </div>
          ))}
        </dl>

        {/* -- contents ---------------------------------------------------- */}
        <h4 className="mt-7 font-display text-lg font-bold tracking-[-0.02em] text-ink">
          What is in this report
        </h4>
        <ul className="mt-3 grid gap-x-7 sm:grid-cols-2">
          {SECTIONS.map(([name, page]) => (
            <li
              key={name}
              className="flex justify-between gap-3 border-b border-hairline py-2 text-[13.5px]"
            >
              <span>{name}</span>
              <span className="font-mono text-xs text-muted">{page}</span>
            </li>
          ))}
        </ul>

        {/* -- the scenario table ------------------------------------------ */}
        <h4 className="mt-7 font-display text-lg font-bold tracking-[-0.02em] text-ink">
          4 · Business case
        </h4>
        <p className="mt-1.5 text-[13px] leading-relaxed text-muted">
          Three scenarios. The verdict is judged on the conservative column, never the
          optimistic one.
        </p>

        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[420px] border-collapse text-[13.5px]">
            <thead>
              <tr>
                {["", "Conservative", "Base", "Optimistic"].map((head, index) => (
                  <th
                    key={head || "row-label"}
                    scope="col"
                    className={`eyebrow pb-2.5 font-medium ${index === 0 ? "text-left" : "text-right"} ${
                      index === 2 ? "bg-surface" : ""
                    }`}
                  >
                    {head}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ROWS.map((row) => (
                <tr key={row.label}>
                  <th
                    scope="row"
                    className={`border-t py-2.5 text-left font-normal ${
                      row.total ? "border-ink font-semibold text-ink" : "border-hairline"
                    }`}
                  >
                    {row.label}
                  </th>
                  {row.values.map((value, index) => (
                    <td
                      key={index}
                      className={`border-t py-2.5 text-right ${
                        row.total ? "border-ink font-semibold text-ink" : "border-hairline"
                      } ${index === 1 ? "bg-surface" : ""}`}
                    >
                      {value ?? <Redacted />}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <div className="rounded-box border border-hairline px-5 py-4">
            <h5 className="text-[13px] font-semibold text-ink">
              5 · The alternative we test against
            </h5>
            <ul className="mt-2 space-y-1.5">
              {[
                "A real long-term rental comparable, pulled in this street at the time of the study",
                "Net of the costs a tenant does not create: turnover, laundry, utilities, platform fees",
                "Short-let has to beat it on the conservative column to pass",
              ].map((item) => (
                <li key={item} className="flex gap-2 text-[12.5px] leading-snug">
                  <span aria-hidden="true" className="font-bold text-primary">
                    ·
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-box border border-hairline px-5 py-4">
            <h5 className="text-[13px] font-semibold text-ink">What moves the answer most</h5>
            <ul className="mt-2 space-y-1.5">
              {[
                "Bedroom count, then off-street parking in the outer ring",
                "Seasonality: burning season is modelled, not averaged away",
                "Owner use — every blocked week is priced",
              ].map((item) => (
                <li key={item} className="flex gap-2 text-[12.5px] leading-snug">
                  <span aria-hidden="true" className="font-bold text-primary">
                    ·
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* -- the verdict, which is the whole product --------------------- */}
        <div className="mt-5 rounded-box border-[1.5px] border-teal/50 bg-wash-green px-5 py-4">
          <p className="eyebrow text-deep-green">6 · Recommendation</p>
          <p className="mt-1.5 font-display text-xl font-bold tracking-[-0.015em] text-ink">
            Go — on the conservative case, with two conditions.
          </p>
          <p className="mt-2 max-w-[820px] text-[13px] leading-relaxed text-body">
            Short-let clears the long-term comparable with margin at 52% occupancy.
            Conditional on the non-hotel exemption being filed before listing, and on the fire
            safety items in section 2 being remedied. A projection is not a promise: occupancy
            moves with the season, the economy and the platforms, which is why the
            conservative column is the one that decides.
          </p>
        </div>

        <footer className="mt-5 flex flex-wrap justify-between gap-3 border-t border-hairline pt-3 font-mono text-[10.5px] text-muted">
          <span>AgentSiam Co., Ltd. · Chiang Mai</span>
          <span>Sample document · illustrative figures</span>
        </footer>
      </div>
    </article>
  );
}
