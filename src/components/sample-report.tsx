import type { Dictionary } from "@/i18n";

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
 *
 * Every string comes from the dictionary. The whole component was English literals until
 * 06/09/2026, so a Thai or Chinese owner was shown the deliverable of a paid service in a
 * language they had not asked for, redaction label included. The percentages are not
 * strings and do not move: 52 / 61 / 68 and the 41 breakeven are the method on display.
 */

const SECTIONS = (t: Dictionary): [string, number][] => [
  [t.hwSrSec1, 3],
  [t.hwSrSec4, 14],
  [t.hwSrSec2, 8],
  [t.hwSrSec5, 19],
  [t.hwSrSec3, 11],
  [t.hwSrSec6, 22],
];

const ROWS = (
  t: Dictionary,
): { label: string; values: (string | null)[]; total?: boolean }[] => [
  { label: t.hwSrRowRate, values: [null, null, null] },
  { label: t.hwSrRowOccupancy, values: ["52%", "61%", "68%"] },
  { label: t.hwSrRowGross, values: [null, null, null] },
  { label: t.hwSrRowOpex, values: [null, null, null] },
  { label: t.hwSrRowNoi, values: [null, null, null], total: true },
  { label: t.hwSrRowBreakeven, values: ["41%", "41%", "41%"] },
];

/** A withheld figure. aria-label so a screen reader hears why the cell is empty. */
function Redacted({ label }: { label: string }) {
  return (
    <span
      role="img"
      aria-label={label}
      className="inline-block h-2.5 w-14 rounded-[3px] bg-[#d7d8e2] align-middle"
    />
  );
}

export function SampleReport({ t }: { t: Dictionary }) {
  const sections = SECTIONS(t);
  const rows = ROWS(t);

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
            <p className="eyebrow mt-1.5">{t.hwSrKicker}</p>
          </div>
          <p className="max-w-[330px] rounded-box border-[1.5px] border-dashed border-secondary bg-wash-red px-3 py-2">
            <span className="eyebrow text-deep-red">{t.hwSrSampleLabel}</span>
            <span className="mt-1 block text-[11.5px] leading-snug text-body">
              {t.hwSrSampleBody}
            </span>
          </p>
        </header>

        <h3 className="mt-6 font-headline text-[clamp(22px,3.4vw,30px)] font-extrabold leading-[1.12] tracking-[-0.03em] text-ink">
          {t.hwSrTitleA}
          <br />
          {t.hwSrTitleB}
        </h3>

        <dl className="mt-5 grid grid-cols-2 gap-4 rounded-box bg-surface px-5 py-4 sm:grid-cols-4">
          {[
            [t.hwSrFactProperty, t.hwSrFactPropertyValue],
            [t.neighbourhood, t.areaChangKhlan],
            [t.hwSrFactVisit, t.hwSrFactVisitValue],
            [t.hwSrFactVerdict, t.hwSrFactVerdictValue],
          ].map(([label, value]) => (
            <div key={label}>
              <dt className="eyebrow">{label}</dt>
              <dd className="mt-1 text-[15px] font-semibold text-ink">{value}</dd>
            </div>
          ))}
        </dl>

        {/* -- contents ---------------------------------------------------- */}
        <h4 className="mt-7 font-display text-lg font-bold tracking-[-0.02em] text-ink">
          {t.hwSrContentsTitle}
        </h4>
        <ul className="mt-3 grid gap-x-7 sm:grid-cols-2">
          {sections.map(([name, page]) => (
            <li
              key={name}
              className="flex justify-between gap-3 border-b border-hairline py-2 text-[13.5px]"
            >
              <span>{name}</span>
              <span className="font-mono text-xs text-muted">
                {t.hwSrPage.replace("{n}", String(page))}
              </span>
            </li>
          ))}
        </ul>

        {/* -- the scenario table ------------------------------------------ */}
        <h4 className="mt-7 font-display text-lg font-bold tracking-[-0.02em] text-ink">
          {t.hwSrCaseTitle}
        </h4>
        <p className="mt-1.5 text-[13px] leading-relaxed text-muted">
          {t.hwSrCaseIntro}
        </p>

        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[420px] border-collapse text-[13.5px]">
            <thead>
              <tr>
                {["", t.hwSrColConservative, t.hwSrColBase, t.hwSrColOptimistic].map(
                  (head, index) => (
                    <th
                      key={head || "row-label"}
                      scope="col"
                      className={`eyebrow pb-2.5 font-medium ${index === 0 ? "text-left" : "text-right"} ${
                        index === 2 ? "bg-surface" : ""
                      }`}
                    >
                      {head}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
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
                      {value ?? <Redacted label={t.hwSrRedacted} />}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <div className="rounded-box border border-hairline px-5 py-4">
            <h5 className="text-[13px] font-semibold text-ink">{t.hwSrAltTitle}</h5>
            <ul className="mt-2 space-y-1.5">
              {[t.hwSrAlt1, t.hwSrAlt2, t.hwSrAlt3].map((item) => (
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
            <h5 className="text-[13px] font-semibold text-ink">{t.hwSrMoversTitle}</h5>
            <ul className="mt-2 space-y-1.5">
              {[t.hwSrMover1, t.hwSrMover2, t.hwSrMover3].map((item) => (
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
          <p className="eyebrow text-deep-green">{t.hwSrRecTitle}</p>
          <p className="mt-1.5 font-display text-xl font-bold tracking-[-0.015em] text-ink">
            {t.hwSrRecVerdict}
          </p>
          <p className="mt-2 max-w-[820px] text-[13px] leading-relaxed text-body">
            {t.hwSrRecBody}
          </p>
        </div>

        <footer className="mt-5 flex flex-wrap justify-between gap-3 border-t border-hairline pt-3 font-mono text-[10.5px] text-muted">
          <span>AgentSiam Co., Ltd. · {t.homeCity}</span>
          <span>{t.hwSrFooterNote}</span>
        </footer>
      </div>
    </article>
  );
}
