'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { type FormEvent, useEffect, useState } from 'react';
import { CheckCircle2, Eye, EyeOff, KeyRound, Lock } from 'lucide-react';
import { friendlyAuthError, resetPassword } from '@/lib/api/auth';

/**
 * Supplier "set your password" — the landing for the invite link. Consumes
 * the one-time token (issued by the bulk-import invite) via the existing
 * reset-password endpoint, then sends them to the supplier sign-in.
 */
export default function SupplierSetPasswordPage() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const [missingToken, setMissingToken] = useState(false);

  useEffect(() => {
    const t = new URLSearchParams(window.location.search).get('token');
    setToken(t);
    setMissingToken(!t);
    // Take the token out of the address bar once we hold it. It's a
    // credential: leaving it there puts it in browser history, in any
    // screenshot of this page, and in the Referer header of anything the
    // supplier clicks next. Replace rather than push so Back doesn't
    // resurrect it.
    if (t) {
      window.history.replaceState(null, '', window.location.pathname);
    }
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!token) {
      setError('This link is missing its token. Please use the link from your invite email.');
      return;
    }
    // Mirror the rule stated under the field (and enforced by the API), so a
    // weak password fails here with guidance instead of as a server error.
    if (password.length < 8) {
      setError('Use at least 8 characters.');
      return;
    }
    if (!/[0-9]|[^A-Za-z0-9]|[A-Z]/.test(password)) {
      setError('Add a number, a symbol, or a capital letter.');
      return;
    }
    if (password !== confirm) {
      setError('The two passwords don’t match.');
      return;
    }
    setSubmitting(true);
    try {
      await resetPassword(token, password);
      setDone(true);
      setTimeout(() => router.push('/supplier/login'), 1800);
    } catch (err) {
      setError(friendlyAuthError(err, 'This link is invalid or has expired. Request a new one from the sign-in page.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-navy via-navy to-[#0a1942] px-4 py-12">
      <div className="w-full max-w-md rounded-card border border-white/10 bg-white/5 p-8 shadow-card backdrop-blur">
        <div className="mb-6 flex flex-col items-center gap-3 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-amber/15 text-amber">
            <KeyRound size={22} aria-hidden />
          </span>
          <div>
            <h1 className="font-raleway text-2xl font-bold text-white">Set your password</h1>
            <p className="mt-1 font-sans text-sm text-white/60">
              Choose a password to access your supplier dashboard
            </p>
          </div>
        </div>

        {done ? (
          <div className="flex flex-col items-center gap-3 text-center">
            <CheckCircle2 size={40} aria-hidden className="text-success" />
            <p className="font-sans text-sm text-white/80">
              Password set! Taking you to sign-in…
            </p>
            <Link href="/supplier/login" className="font-raleway text-sm font-bold text-amber hover:text-white">
              Go to sign-in now
            </Link>
          </div>
        ) : missingToken ? (
          <div role="alert" className="rounded-input border border-danger/30 bg-danger/15 px-4 py-3 text-center font-sans text-sm text-white">
            This link is missing its invite token. Open the link from your
            invite email, or{' '}
            <Link href="/forgot-password" className="font-bold text-amber hover:text-white">
              request a new one
            </Link>
            .
          </div>
        ) : (
          <>
            {error && (
              <div role="alert" className="mb-4 rounded-input border border-danger/30 bg-danger/15 px-3 py-2.5 font-sans text-sm text-white">
                {error}
              </div>
            )}
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <label className="flex flex-col gap-1.5">
                <span className="font-raleway text-[11px] font-bold uppercase tracking-btn text-white/70">New password</span>
                <div className="relative">
                  <input
                    required
                    type={showPwd ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="new-password"
                    autoFocus
                    className={`${inputClass} pr-10`}
                  />
                  <button type="button" onClick={() => setShowPwd((v) => !v)} aria-label={showPwd ? 'Hide password' : 'Show password'} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-white">
                    {showPwd ? <EyeOff size={16} aria-hidden /> : <Eye size={16} aria-hidden />}
                  </button>
                </div>
                <span className="font-sans text-[11px] text-white/40">
                  At least 8 characters, with a number, symbol, or capital letter.
                </span>
              </label>

              <label className="flex flex-col gap-1.5">
                <span className="font-raleway text-[11px] font-bold uppercase tracking-btn text-white/70">Confirm password</span>
                <input
                  required
                  type={showPwd ? 'text' : 'password'}
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  autoComplete="new-password"
                  className={inputClass}
                />
              </label>

              <button
                type="submit"
                disabled={submitting}
                className="mt-2 flex items-center justify-center gap-2 rounded-btn bg-amber py-3 font-raleway text-sm font-bold uppercase tracking-btn text-navy shadow-card transition-colors hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Lock size={14} aria-hidden /> {submitting ? 'Setting…' : 'Set password & continue'}
              </button>
            </form>
          </>
        )}

        <p className="mt-6 text-center font-sans text-xs text-white/50">
          Already set it?{' '}
          <Link href="/supplier/login" className="font-bold text-white hover:text-amber">
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}

const inputClass =
  'w-full rounded-input border border-white/15 bg-white/10 px-3 py-2.5 font-sans text-sm text-white placeholder:text-white/40 focus:border-amber focus:outline-none';
