import { redirect } from "next/navigation";
import { SignInForm } from "@/components/admin/sign-in-form";
import { currentSession, safeNext } from "@/lib/admin/guard";
import { ADMIN_CONFIGURED } from "@/lib/admin/session";

/**
 * The only admin URL that answers without a cookie.
 *
 * It says nothing about what is behind it: no lead names, no counts, no hint of what the
 * admin holds. An unconfigured admin says it is unconfigured rather than taking a
 * passphrase it could never check, which is the one case where being explicit is safer
 * than being vague: nobody can get in either way, and Paul needs to know why.
 */

export const dynamic = "force-dynamic";

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  const target = safeNext(next);

  if (await currentSession()) redirect(target);

  return (
    <div className="mx-auto max-w-[420px]">
      <h1
        className="text-xl font-semibold text-text"
        style={{ fontFamily: "var(--font-poppins), system-ui, sans-serif" }}
      >
        Sign in
      </h1>
      {ADMIN_CONFIGURED ? (
        <>
          <p className="mt-2 text-sm text-muted">
            Paul and Nils only. Your passphrase is the one in your password manager.
          </p>
          <SignInForm next={target} />
        </>
      ) : (
        <p className="mt-4 rounded-box border border-hairline bg-wash-red p-4 text-sm text-deep-red">
          This admin has no passphrases set, so nobody can sign in. ADMIN_COOKIE_SECRET and at
          least one of ADMIN_PASSPHRASE_PAUL or ADMIN_PASSPHRASE_NILS have to be set in the
          Vercel project, then redeployed. The README section on the renter shortlist admin has
          the full list.
        </p>
      )}
    </div>
  );
}
