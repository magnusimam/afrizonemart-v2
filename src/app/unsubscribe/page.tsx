'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react';

/// Tracker #48 — public unsubscribe landing page.
///
/// Reached by clicking the unsubscribe link in any marketing email.
/// The signed token in the URL is the auth — no login required.
/// On mount we POST it to the API which flips the matching
/// marketingOptIn / smsOptIn flag to false.
///
/// Idempotent: clicking the link twice shows "you were already
/// unsubscribed". Forging a token without `JWT_SECRET` is rejected
/// with a "link is invalid" message.

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

type Outcome =
  | { kind: 'loading' }
  | { kind: 'done'; channel: string; email: string | null; changed: boolean }
  | { kind: 'error'; message: string };

export default function UnsubscribePage() {
  const params = useSearchParams();
  const token = params?.get('token') ?? null;
  const [state, setState] = useState<Outcome>({ kind: 'loading' });

  useEffect(() => {
    if (!token) {
      setState({ kind: 'error', message: 'No unsubscribe token in URL.' });
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch(
          `${API_BASE}/api/marketing/unsubscribe?token=${encodeURIComponent(token)}`,
          { method: 'GET' },
        );
        const body = await res.json().catch(() => null);
        if (cancelled) return;
        if (!res.ok) {
          setState({
            kind: 'error',
            message:
              (body && typeof body === 'object' && 'error' in body
                ? (body.error as { message?: string })?.message
                : null) ?? 'This unsubscribe link is invalid or expired.',
          });
          return;
        }
        setState({
          kind: 'done',
          channel: body.channel as string,
          email: (body.email as string | null) ?? null,
          changed: Boolean(body.changed),
        });
      } catch {
        if (!cancelled) {
          setState({
            kind: 'error',
            message: 'Network error — please try the link again in a minute.',
          });
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-page px-4 py-12">
      <div className="w-full max-w-md rounded-card border border-border bg-white p-8 shadow-card">
        {state.kind === 'loading' && (
          <div className="flex flex-col items-center gap-3 text-center">
            <Loader2 size={32} className="animate-spin text-navy" aria-hidden />
            <p className="font-sans text-sm text-muted">
              Updating your preferences…
            </p>
          </div>
        )}

        {state.kind === 'done' && (
          <div className="flex flex-col items-center gap-4 text-center">
            <CheckCircle2 size={40} className="text-success" aria-hidden />
            <h1 className="font-raleway text-2xl font-bold text-navy">
              {state.changed
                ? state.channel === 'sms'
                  ? 'SMS preferences updated'
                  : 'You’re unsubscribed'
                : 'You were already unsubscribed'}
            </h1>
            <p className="font-sans text-sm leading-relaxed text-charcoal">
              {state.changed ? (
                <>
                  We&rsquo;ve stopped marketing {state.channel === 'sms' ? 'SMS messages' : 'emails'}{' '}
                  to{' '}
                  {state.email ? (
                    <strong>{state.email}</strong>
                  ) : (
                    'your account'
                  )}
                  . Transactional messages (orders, shipping, receipts) will
                  still arrive — those aren&rsquo;t affected.
                </>
              ) : (
                <>
                  No change needed — you&rsquo;d already opted out. Order and
                  shipping emails will keep arriving as usual.
                </>
              )}
            </p>
            <Link
              href="/account/profile"
              className="rounded-btn bg-navy px-5 py-3 font-raleway text-xs font-bold uppercase tracking-btn text-white shadow-card hover:bg-amber hover:text-navy"
            >
              Manage preferences
            </Link>
          </div>
        )}

        {state.kind === 'error' && (
          <div className="flex flex-col items-center gap-4 text-center">
            <AlertTriangle size={36} className="text-amber" aria-hidden />
            <h1 className="font-raleway text-2xl font-bold text-navy">
              We couldn&rsquo;t process that link
            </h1>
            <p className="font-sans text-sm leading-relaxed text-charcoal">
              {state.message}
            </p>
            <Link
              href="/account/profile"
              className="rounded-btn bg-navy px-5 py-3 font-raleway text-xs font-bold uppercase tracking-btn text-white shadow-card hover:bg-amber hover:text-navy"
            >
              Manage preferences manually
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}
