'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { AlertTriangle, Trash2, Loader2 } from 'lucide-react';
import { deleteAccount } from '@/lib/api/auth';
import { HttpApiError } from '@/lib/api/client';
import { useAuthStore } from '@/stores/authStore';

/**
 * Web account-deletion page.
 *
 * Public URL referenced from the Privacy Policy and the Play
 * Console listing's "Data deletion request" field. Same UX as the
 * mobile DeleteAccountScreen: walkthrough of what gets removed vs
 * kept, optional reason capture, typed-phrase confirmation gate.
 *
 * Auth requirement: the customer must be signed in. If they're
 * not, redirect to /login with `next=/account/delete` so they
 * come back here after.
 */
const REQUIRED_PHRASE = 'DELETE MY ACCOUNT';

export default function DeleteAccountPage() {
  const router = useRouter();
  const accessToken = useAuthStore((s) => s.accessToken);
  const user = useAuthStore((s) => s.user);
  const clear = useAuthStore((s) => s.clear);

  const [confirmation, setConfirmation] = useState('');
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /// Gate behind auth — non-authed users get bounced to /login
  /// with a return URL so they come back here after signing in.
  useEffect(() => {
    if (!user) {
      router.replace(`/login?next=${encodeURIComponent('/account/delete')}`);
    }
  }, [user, router]);

  const canSubmit =
    confirmation.trim().toUpperCase() === REQUIRED_PHRASE && !busy;

  const onSubmit = async () => {
    if (!canSubmit || !accessToken) return;
    setBusy(true);
    setError(null);
    try {
      await deleteAccount(accessToken, {
        confirmation: confirmation.trim(),
        reason: reason.trim() || null,
      });
      clear();
      router.replace('/?accountDeleted=1');
    } catch (e) {
      if (e instanceof HttpApiError) {
        setError(e.message);
      } else {
        setError(
          e instanceof Error ? e.message : 'Could not delete your account.',
        );
      }
      setBusy(false);
    }
  };

  if (!user) return null;

  return (
    <main className="bg-page pb-16">
      <header className="border-b border-border bg-white">
        <div className="mx-auto max-w-2xl px-4 py-8">
          <p className="font-raleway text-xs font-semibold uppercase tracking-btn text-danger">
            Danger zone
          </p>
          <h1 className="mt-2 font-raleway text-2xl font-bold text-navy md:text-3xl">
            Delete your Afrizonemart account
          </h1>
          <p className="mt-2 font-sans text-sm text-muted">
            This is permanent. Read what gets removed and what stays
            below, then type the confirmation phrase to continue.
          </p>
        </div>
      </header>

      <div className="mx-auto max-w-2xl space-y-5 px-4 py-8">
        <section className="rounded-card border border-danger/30 bg-danger/5 p-5">
          <div className="flex items-start gap-3">
            <AlertTriangle
              size={20}
              className="mt-0.5 shrink-0 text-danger"
              aria-hidden
            />
            <div className="font-sans text-sm text-charcoal">
              <p className="font-bold text-danger">Cannot be undone</p>
              <p className="mt-1">
                Once you confirm, you will not be able to sign back
                in with the credentials below. Any orders you have in
                progress will continue with the shipping snapshot we
                already captured, but you won&apos;t be able to track
                them from this account.
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-card border border-border bg-white p-5">
          <h2 className="font-raleway text-base font-bold text-navy">
            What gets removed
          </h2>
          <ul className="mt-3 list-disc space-y-2 pl-5 font-sans text-sm leading-relaxed text-charcoal">
            <li>
              Your name, phone number, and email — replaced with
              anonymous placeholders.
            </li>
            <li>Your saved addresses, wishlist, and shopping cart.</li>
            <li>Your Continental Coins balance — reset to zero.</li>
            <li>Push notifications on every device.</li>
            <li>Marketing email and SMS subscriptions.</li>
          </ul>
        </section>

        <section className="rounded-card border border-border bg-white p-5">
          <h2 className="font-raleway text-base font-bold text-navy">
            What stays for legal reasons
          </h2>
          <ul className="mt-3 list-disc space-y-2 pl-5 font-sans text-sm leading-relaxed text-charcoal">
            <li>
              Past order records — kept for accounting and tax (7-year
              retention). The customer name, phone, and shipping
              address on each order are anonymised.
            </li>
            <li>
              Past loyalty coin transactions — kept so refunds can claw
              back correctly. Balance zeroed.
            </li>
            <li>
              Published product reviews — text stays so other shoppers
              benefit. A future update will let you anonymise these
              too.
            </li>
          </ul>
          <p className="mt-3 font-sans text-xs text-muted">
            See our{' '}
            <Link href="/privacy" className="text-navy underline">
              Privacy Policy
            </Link>{' '}
            for full details.
          </p>
        </section>

        <section className="rounded-card border border-border bg-white p-5">
          <h2 className="font-raleway text-base font-bold text-navy">
            Tell us why{' '}
            <span className="font-sans text-xs font-medium text-muted">
              (optional)
            </span>
          </h2>
          <p className="mt-1 font-sans text-xs text-muted">
            Helps us improve. Never shared.
          </p>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value.slice(0, 500))}
            rows={3}
            placeholder="e.g. Too many emails, Got what I needed, …"
            disabled={busy}
            className="mt-3 w-full resize-y rounded-input border border-border bg-page px-3 py-2 font-sans text-sm text-charcoal placeholder:text-muted focus:border-navy focus:outline-none"
          />
        </section>

        <section className="rounded-card border border-danger/30 bg-white p-5">
          <h2 className="font-raleway text-base font-bold text-danger">
            Confirm
          </h2>
          <p className="mt-1 font-sans text-sm text-charcoal">
            Type{' '}
            <span className="font-bold text-navy">{REQUIRED_PHRASE}</span>{' '}
            exactly to enable the delete button.
          </p>
          <input
            value={confirmation}
            onChange={(e) => setConfirmation(e.target.value.toUpperCase())}
            disabled={busy}
            placeholder={REQUIRED_PHRASE}
            className="mt-3 w-full rounded-input border border-border bg-page px-3 py-3 font-mono text-base tracking-[0.15em] text-navy placeholder:font-sans placeholder:tracking-normal placeholder:text-muted focus:border-danger focus:outline-none"
          />
        </section>

        {error ? (
          <div
            role="alert"
            className="rounded-card border border-danger/30 bg-danger/10 px-4 py-3 font-sans text-sm text-danger"
          >
            {error}
          </div>
        ) : null}

        <button
          type="button"
          onClick={() => void onSubmit()}
          disabled={!canSubmit}
          className="inline-flex w-full items-center justify-center gap-2 rounded-btn bg-danger px-5 py-4 font-raleway text-sm font-bold uppercase tracking-btn text-white hover:bg-danger/90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {busy ? (
            <Loader2 size={18} className="animate-spin" aria-hidden />
          ) : (
            <Trash2 size={18} aria-hidden />
          )}
          {busy ? 'Deleting…' : 'Delete my account'}
        </button>
      </div>
    </main>
  );
}
