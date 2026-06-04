'use client';

import { Suspense, useEffect, useState, useCallback, type FormEvent } from 'react';
import { useSearchParams } from 'next/navigation';
import { Check, Loader2, Package, X } from 'lucide-react';
import { HttpApiError } from '@/lib/api/client';

/**
 * Public courier delivery-confirmation page.
 *
 * Lives outside the (shop) / (admin) layouts so it stays a small,
 * standalone surface that loads fast on a rider's mobile browser
 * over patchy data. No auth, no nav, no analytics scripts — IP
 * rate-limiting on the api side is the abuse defence.
 *
 * Two ways the rider lands here:
 *   1. **QR scan** — the customer's app encodes a URL like
 *      `https://afrizonemart.com/courier/scan?t=<JWT>` inside the
 *      QR. Modern phone cameras decode URLs and open them, so the
 *      rider just points their camera at the customer's screen.
 *      `?t=` triggers an immediate auto-confirm.
 *   2. **Type OTP** — when the camera can't read or there's no QR
 *      (offline customer phone, glare, broken screen), the rider
 *      taps "Type code instead" and keys in the 6-digit OTP that
 *      sits underneath the customer's QR.
 *
 * The page is intentionally large-text + finger-friendly. Riders
 * are doing this one-handed at someone's door.
 */
export default function CourierScanPage() {
  return (
    <Suspense fallback={null}>
      <CourierScanInner />
    </Suspense>
  );
}

function CourierScanInner() {
  const params = useSearchParams();
  const tokenFromUrl = params.get('t') ?? null;

  const [mode, setMode] = useState<'auto' | 'otp'>(
    tokenFromUrl ? 'auto' : 'otp',
  );
  const [otp, setOtp] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<
    | { state: 'success'; orderNumber: string; firstName: string | null }
    | { state: 'error'; message: string }
    | { state: 'idle' }
  >({ state: 'idle' });

  const submit = useCallback(
    async (body: { token?: string; otp?: string }) => {
      setSubmitting(true);
      try {
        const apiBase = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';
        const res = await fetch(`${apiBase}/api/courier/confirm`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        if (!res.ok) {
          let message = `Request failed (${res.status})`;
          try {
            const json = (await res.json()) as {
              error?: { message?: string };
            };
            if (json.error?.message) message = json.error.message;
          } catch {
            /* not JSON */
          }
          throw new HttpApiError(res.status, 'COURIER_CONFIRM', message);
        }
        const json = (await res.json()) as {
          orderNumber: string;
          customerFirstName: string | null;
        };
        setResult({
          state: 'success',
          orderNumber: json.orderNumber,
          firstName: json.customerFirstName,
        });
      } catch (err) {
        setResult({
          state: 'error',
          message: err instanceof Error ? err.message : 'Could not confirm.',
        });
      } finally {
        setSubmitting(false);
      }
    },
    [],
  );

  /// Auto-submit when a `?t=...` token is in the URL — that's the
  /// QR-scan path. Runs exactly once on mount.
  useEffect(() => {
    if (mode === 'auto' && tokenFromUrl) {
      void submit({ token: tokenFromUrl });
    }
    /// Intentionally empty deps — we want the auto-submit on first
    /// mount only. Re-entering OTP mode shouldn't trigger another
    /// token submission.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleOtpSubmit = (e: FormEvent) => {
    e.preventDefault();
    const clean = otp.replace(/\D/g, '');
    if (clean.length < 4) return;
    void submit({ otp: clean });
  };

  return (
    <main className="min-h-screen bg-navy text-white">
      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col px-4 pb-10 pt-12">
        <header className="mb-8 flex flex-col items-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-full border border-white/20 bg-white/5">
            <Package size={28} className="text-amber" aria-hidden />
          </div>
          <h1 className="font-raleway text-2xl font-bold">Afrizonemart</h1>
          <p className="font-sans text-sm text-white/70">Delivery confirmation</p>
        </header>

        {result.state === 'success' ? (
          <SuccessCard
            orderNumber={result.orderNumber}
            firstName={result.firstName}
          />
        ) : result.state === 'error' ? (
          <ErrorCard
            message={result.message}
            onTryAgain={() => {
              setResult({ state: 'idle' });
              setMode('otp');
              setOtp('');
            }}
          />
        ) : submitting && mode === 'auto' ? (
          <InlineSpinner label="Confirming delivery…" />
        ) : (
          <form
            onSubmit={handleOtpSubmit}
            className="flex flex-col gap-4 rounded-card border border-white/10 bg-white/5 p-6"
          >
            <div>
              <p className="font-raleway text-xs font-bold uppercase tracking-btn text-amber">
                Step 1
              </p>
              <p className="mt-1 font-sans text-sm text-white/90">
                Ask the customer for their 6-digit delivery code, OR open
                your phone camera and scan the QR on their screen.
              </p>
            </div>

            <label className="flex flex-col gap-2">
              <span className="font-raleway text-[11px] font-bold uppercase tracking-btn text-white/70">
                Enter code
              </span>
              <input
                value={otp}
                onChange={(e) =>
                  setOtp(e.target.value.replace(/\D/g, '').slice(0, 8))
                }
                inputMode="numeric"
                pattern="[0-9]*"
                autoComplete="one-time-code"
                autoFocus
                maxLength={8}
                placeholder="123 456"
                className="rounded-input border border-white/20 bg-white/10 px-4 py-4 text-center font-mono text-3xl tracking-[0.4em] text-white placeholder:text-white/30 focus:border-amber focus:outline-none"
              />
            </label>

            <button
              type="submit"
              disabled={submitting || otp.replace(/\D/g, '').length < 4}
              className="inline-flex items-center justify-center gap-2 rounded-btn bg-amber px-5 py-4 font-raleway text-base font-bold uppercase tracking-btn text-navy disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? (
                <Loader2 size={18} className="animate-spin" aria-hidden />
              ) : null}
              {submitting ? 'Confirming…' : 'Confirm delivery'}
            </button>

            <p className="text-center font-sans text-xs text-white/50">
              Bookmark this page once. It works for every delivery.
            </p>
          </form>
        )}
      </div>
    </main>
  );
}

function SuccessCard({
  orderNumber,
  firstName,
}: {
  orderNumber: string;
  firstName: string | null;
}) {
  return (
    <div className="flex flex-col items-center gap-4 rounded-card border border-success/30 bg-success/10 p-8 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-success/20">
        <Check size={32} className="text-success" aria-hidden />
      </div>
      <h2 className="font-raleway text-xl font-bold text-white">Delivered</h2>
      <p className="font-sans text-sm text-white/80">
        Order <span className="font-bold text-amber">{orderNumber}</span> is
        confirmed
        {firstName ? ` for ${firstName}` : ''}.
      </p>
      <p className="font-sans text-xs text-white/50">
        You can close this page. Refresh to confirm the next one.
      </p>
    </div>
  );
}

function ErrorCard({
  message,
  onTryAgain,
}: {
  message: string;
  onTryAgain: () => void;
}) {
  return (
    <div className="flex flex-col items-center gap-4 rounded-card border border-danger/30 bg-danger/10 p-8 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-danger/20">
        <X size={32} className="text-danger" aria-hidden />
      </div>
      <h2 className="font-raleway text-xl font-bold text-white">
        Couldn&apos;t confirm
      </h2>
      <p className="font-sans text-sm text-white/80">{message}</p>
      <button
        type="button"
        onClick={onTryAgain}
        className="rounded-btn border border-white/20 px-5 py-3 font-raleway text-sm font-bold uppercase tracking-btn text-white hover:bg-white/10"
      >
        Try a different code
      </button>
    </div>
  );
}

function InlineSpinner({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-card border border-white/10 bg-white/5 p-8 text-center">
      <Loader2 size={28} className="animate-spin text-amber" aria-hidden />
      <p className="font-sans text-sm text-white/80">{label}</p>
    </div>
  );
}
