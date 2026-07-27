'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { type FormEvent, useEffect, useState } from 'react';
import { Eye, EyeOff, Lock, Store } from 'lucide-react';
import { friendlyAuthError, loginUser, type AuthResult } from '@/lib/api/auth';
import { getSupplierMe } from '@/lib/api/supplier';
import { HttpApiError } from '@/lib/api/client';
import { useAuthStore } from '@/stores/authStore';
import { safeReturnUrl } from '@/lib/safe-redirect';

/**
 * Supplier sign-in. Suppliers use their existing AZM account — login goes
 * through the shared `/api/auth/login`, then we confirm the account has a
 * supplier profile (`GET /api/suppliers/me`). If it doesn't, we keep them
 * signed in and offer "Apply to supply" (the authed apply attaches a profile
 * to their account).
 */
export default function SupplierLoginPage() {
  const router = useRouter();
  const setSession = useAuthStore((s) => s.setSession);
  const user = useAuthStore((s) => s.user);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notSupplier, setNotSupplier] = useState(false);

  const destination = () => {
    const returnUrl = new URLSearchParams(window.location.search).get('returnUrl');
    return safeReturnUrl(returnUrl, '/supplier/dashboard', {
      requirePrefix: '/supplier',
    });
  };

  // Already signed in as a supplier → skip the form.
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    getSupplierMe()
      .then(() => {
        if (!cancelled) router.replace(destination());
      })
      .catch(() => {
        /* not a supplier (or not reachable) — stay on the page */
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setNotSupplier(false);
    setSubmitting(true);
    try {
      const result: AuthResult = await loginUser({ email, password });
      setSession(result);

      try {
        await getSupplierMe();
      } catch (err) {
        if (err instanceof HttpApiError && err.status === 404) {
          setNotSupplier(true);
          setError('This account isn’t registered as a supplier yet.');
          return;
        }
        throw err;
      }

      router.push(destination());
    } catch (err) {
      setError(friendlyAuthError(err, 'Sign-in failed. Please try again.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-navy via-navy to-[#0a1942] px-4 py-12">
      <div className="w-full max-w-md rounded-card border border-white/10 bg-white/5 p-8 shadow-card backdrop-blur">
        <div className="mb-6 flex flex-col items-center gap-3 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-amber/15 text-amber">
            <Store size={22} aria-hidden />
          </span>
          <div>
            <h1 className="font-raleway text-2xl font-bold text-white">
              Supplier sign-in
            </h1>
            <p className="mt-1 font-sans text-sm text-white/60">
              Manage your products, PIQs, and onboarding journey
            </p>
          </div>
        </div>

        {error && (
          <div
            role="alert"
            className="mb-4 rounded-input border border-danger/30 bg-danger/15 px-3 py-2.5 font-sans text-sm text-white"
          >
            {error}
            {notSupplier && (
              <>
                {' '}
                <Link href="/supplier/register" className="font-bold text-amber hover:text-white">
                  Apply to supply →
                </Link>
              </>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <label className="flex flex-col gap-1.5">
            <span className="font-raleway text-[11px] font-bold uppercase tracking-btn text-white/70">
              Email
            </span>
            <input
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="username"
              autoFocus
              className={inputClass}
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="font-raleway text-[11px] font-bold uppercase tracking-btn text-white/70">
              Password
            </span>
            <div className="relative">
              <input
                required
                type={showPwd ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                className={`${inputClass} pr-10`}
              />
              <button
                type="button"
                onClick={() => setShowPwd((v) => !v)}
                aria-label={showPwd ? 'Hide password' : 'Show password'}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-white"
              >
                {showPwd ? <EyeOff size={16} aria-hidden /> : <Eye size={16} aria-hidden />}
              </button>
            </div>
          </label>

          <div className="flex justify-end">
            <Link
              href="/forgot-password"
              className="font-sans text-xs text-white/60 hover:text-amber"
            >
              Forgot password?
            </Link>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="mt-1 flex items-center justify-center gap-2 rounded-btn bg-amber py-3 font-raleway text-sm font-bold uppercase tracking-btn text-navy shadow-card transition-colors hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Lock size={14} aria-hidden /> {submitting ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p className="mt-6 text-center font-sans text-xs text-white/50">
          New supplier?{' '}
          <Link href="/supplier/register" className="font-bold text-white hover:text-amber">
            Apply to supply
          </Link>
        </p>
      </div>
    </main>
  );
}

const inputClass =
  'w-full rounded-input border border-white/15 bg-white/10 px-3 py-2.5 font-sans text-sm text-white placeholder:text-white/40 focus:border-amber focus:outline-none';
