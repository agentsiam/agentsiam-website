"use client";

/** Opens the browser's print dialog, which also offers "Save as PDF" on every major browser. */
export function PrintButton({ label }: { label: string }) {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="inline-flex min-h-11 items-center rounded-full border border-hairline px-4 py-1.5 text-[13px] font-semibold transition-colors hover:border-ink print:hidden"
    >
      {label}
    </button>
  );
}
