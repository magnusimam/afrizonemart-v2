'use client';

import { useRouter } from 'next/navigation';
import { type FormEvent, useEffect, useState } from 'react';
import { Eye, EyeOff, Lock, Building2 } from 'lucide-react';
import { AuthApiError, loginUser, type AuthResult } from '@/lib/api/auth';
import { useAuthStore } from '@/stores/authStore';

/**
 * Supplier sign-in page. Sits in the (supplier-auth) route group so the
 * RequireSupplier gate doesn't run on this page (would loop). Mirrors
 * the admin-login layout: navy gradient backdrop, a single email +
 * password form, and a redirect-back if already signed in.
 */
export default function SupplierLoginPage() {
  const router = useRouter();
  const setSession = useAuthStore((s) => s.setSession);
  const clearSession = useAuthStore((s) => s.clear);
  const user = useAuthStore((s) => s.user);
  const accessToken = useAuthStore((s) => s.accessToken);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Already signed in as supplier/admin → straight to the portal.
  useEffect(() => {
    if (user && accessToken && (user.role === 'SUPPLIER' || user.role === 'ADMIN')) {
      const returnUrl = new URLSearchParams(window.location.search).get('returnUrl');
      router.replace(returnUrl && returnUrl.startsWith('/supplier') ? returnUrl : '/supplier/dashboard');
    }
  }, [user, accessToken, router]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const result: AuthResult = await loginUser({ email, password });

      if (result.user.role !== 'SUPPLIER' && result.user.role !== 'ADMIN') {
        clearSession();
        setError(
          'This account is not registered as a supplier. Customers sign in at /login; admin staff at /admin/login.',
        );
        return;
      }

      setSession(result);
      const returnUrl = new URLSearchParams(window.location.search).get('returnUrl');
      router.push(returnUrl && returnUrl.startsWith('/supplier') ? returnUrl : '/supplier/dashboard');
    } catch (err) {
      setError(
        err instanceof AuthApiError ? err.message : 'Sign-in failed. Please try again.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-navy via-navy to-[#0a1942] px-4 py-12">
      <div className="w-full max-w-md rounded-card border border-white/10 bg-white/5 p-8 shadow-card backdrop-blur">
        <div className="mb-6 flex flex-col items-center gap-3 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-amber/15 text-amber">
            <Building2 size={22} aria-hidden />
          </span>
          <div>
            <h1 className="font-raleway text-2xl font-bold text-white">
              Afrizonemart Supplier Portal
            </h1>
            <p className="mt-1 font-sans text-sm text-white/60">
              Vendor onboarding · sign in to your supplier account
            </p>
          </div>
        </div>

        {error && (
          <div
            role="alert"
            className="mb-4 rounded-input border border-danger/30 bg-danger/15 px-3 py-2 font-sans text-sm text-white"
          >
            {error}
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

          <button
            type="submit"
            disabled={submitting}
            className="mt-2 flex items-center justify-center gap-2 rounded-btn bg-amber py-3 font-raleway text-sm font-bold uppercase tracking-btn text-navy shadow-card transition-colors hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Lock size={14} aria-hidden /> {submitting ? 'Signing in…' : 'Sign in to supplier portal'}
          </button>
        </form>

        <p className="mt-6 text-center font-sans text-xs text-white/40">
          Don&apos;t have a supplier account yet? Reach the team at{' '}
          <a href="mailto:suppliers@afrizonemart.com" className="font-bold text-white hover:text-amber">
            suppliers@afrizonemart.com
          </a>
        </p>
      </div>
    </main>
  );
}

const inputClass =
  'w-full rounded-input border border-white/15 bg-white/10 px-3 py-2.5 font-sans text-sm text-white placeholder:text-white/40 focus:border-amber focus:outline-none';
