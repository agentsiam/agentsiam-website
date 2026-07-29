import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 py-8 text-sm text-muted sm:flex-row sm:items-center sm:justify-between">
        <span className="font-[family-name:var(--font-unbounded)] font-extrabold text-text">
          Agent<span className="text-primary">Siam</span>
        </span>
        <ul className="flex flex-wrap gap-x-6 gap-y-2">
          <li>
            <Link href="/business-services" className="hover:text-primary">
              Business services
            </Link>
          </li>
          <li>
            <Link href="/privacy-policy" className="hover:text-primary">
              Privacy Policy
            </Link>
          </li>
          <li>
            <Link href="/terms-and-conditions" className="hover:text-primary">
              Terms &amp; Conditions
            </Link>
          </li>
        </ul>
        <span>&copy; 2026 AgentSiam</span>
      </div>
    </footer>
  );
}
