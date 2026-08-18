import { redirect } from 'next/navigation';

/**
 * Supplier sign-in is the storefront sign-in.
 *
 * There is one account per person — a supplier is just an AZM user with a
 * SupplierProfile attached (`SupplierProfile.userId @unique`), so there was
 * never a second credential to collect. This page used to render its own
 * email/password form that called the same `loginUser()` as `/login`; two
 * forms for one credential is how you get a password manager filling a stale
 * entry on one of them and a baffling "Invalid email or password" on a
 * password that demonstrably works on the other.
 *
 * It also meant the supplier door was the only one without Google or phone
 * sign-in, so any account created that way could never reach the portal.
 *
 * The route stays because plenty of things link here — the marketing nav, the
 * public /suppliers landing, the register and set-password pages, and the
 * invite email the API sends (`invite.service.ts`). They all keep working;
 * they just arrive at the single real login now.
 *
 * Server-side redirect rather than a client `useEffect` so there's no flash
 * of a redirecting page and no dependency on JS.
 */
export default function SupplierLoginRedirect({
  searchParams,
}: {
  searchParams: { returnUrl?: string | string[] };
}) {
  const raw = Array.isArray(searchParams.returnUrl)
    ? searchParams.returnUrl[0]
    : searchParams.returnUrl;

  // `safeReturnUrl` is client-only (it needs window.location.origin to compare
  // origins) so the same guarantee is enforced inline here: a single leading
  // slash, and confined to the supplier area. This rejects protocol-relative
  // "//evil.com" and any absolute off-origin URL.
  const isSafe =
    typeof raw === 'string' && raw.startsWith('/supplier') && !raw.startsWith('//');

  const target = isSafe ? raw : '/supplier/dashboard';

  redirect(`/login?returnUrl=${encodeURIComponent(target)}`);
}
