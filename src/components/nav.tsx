import Link from "next/link";

const links = [
  { href: "/how-it-works", label: "How it works" },
  { href: "/about", label: "About" },
];

export function Nav() {
  return (
    <header className="border-b border-border">
      <nav className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-6 py-4">
        <Link
          href="/"
          className="font-[family-name:var(--font-unbounded)] text-lg font-extrabold tracking-tight text-text"
        >
          Agent<span className="text-primary">Siam</span>
        </Link>
        <ul className="hidden items-center gap-8 text-sm font-medium text-text sm:flex">
          <li>
            <Link href="/" className="hover:text-primary">
              Home
            </Link>
          </li>
          {links.map((link) => (
            <li key={link.href}>
              <Link href={link.href} className="hover:text-primary">
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
        <Link
          href="/contact"
          className="rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary"
        >
          Contact us
        </Link>
      </nav>
    </header>
  );
}
