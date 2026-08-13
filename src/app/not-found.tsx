import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Page not found",
  // A 404 should never be indexed, and should never be the canonical for a real URL.
  robots: { index: false, follow: false },
};

const suggestions = [
  { href: "/", label: "Home" },
  { href: "/how-it-works", label: "How it works" },
  { href: "/lotushouse", label: "Lotus House" },
  { href: "/contact", label: "Contact" },
];

export default function NotFound() {
  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-24">
      <p className="font-mono text-xs font-medium uppercase tracking-widest text-muted">
        Error 404
      </p>
      <h1 className="mt-5 text-3xl font-bold tracking-tight text-text sm:text-4xl">
        That page isn&rsquo;t here.
      </h1>
      <p className="mt-4 max-w-xl text-muted">
        The link may be out of date, or the address may have a typo in it.
        Everything on the site is one of these:
      </p>

      <ul className="mt-8 flex flex-wrap gap-3">
        {suggestions.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              className="inline-block rounded-full border border-border px-5 py-2.5 text-sm font-medium text-text transition-colors hover:border-primary hover:text-primary"
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>

      <div className="mt-10">
        <Link
          href="/contact"
          className="inline-block rounded-full bg-ink px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary"
        >
          Tell us what you were looking for
        </Link>
      </div>
    </div>
  );
}
