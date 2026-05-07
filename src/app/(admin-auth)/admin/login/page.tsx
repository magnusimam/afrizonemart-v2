'use client';

import { useRouter } from 'next/navigation';
import { type FormEvent, useEffect, useState } from 'react';
import { Eye, EyeOff, Lock, ShieldCheck } from 'lucide-react';
import { AuthApiError, loginUser, type AuthResult } from '@/lib/api/auth';
import { useAuthStore } from '@/stores/authStore';
import { safeReturnUrl } from '@/lib/safe-redirect';

/**
 * Admin-only sign-in page. Sits outside the (admin) route group so the
 * `RequireAdmin` guard doesn't bounce visitors into a redirect loop.
 *
 * Differences from the customer-facing /login:
 *   - no Google / phone alternatives (customer methods, not admin policy)
 *   - no marketing copy, no "create account" link
 *   - successful CUSTOMER logins are rejected here ("not an admin
 *     account") rather than silently redirecting to /account
 *   - redirects already-authed admins straight to /admin so refreshing
 *     the page doesn't kick you out of the console
 */
export default function AdminLoginPage() {
  const router = useRouter();
  const setSession = useAuthStore((s) => s.setSession);
  const clearSession = useAuthStore((s) => s.clear);
  const user = useAuthStore((s) => s.user);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Already signed in as admin/staff → go straight to the console.
  useEffect(() => {
    if (user && (user.role === 'ADMIN' || user.role === 'STAFF')) {
      const returnUrl = new URLSearchParams(window.location.search).get('returnUrl');
      // Phase 11.3 (audit C3): safeReturnUrl + admin-only prefix.
      router.replace(safeReturnUrl(returnUrl, '/admin', { requirePrefix: '/admin' }));
    }
  }, [user, router]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const result: AuthResult = await loginUser({ email, password });

      if (result.user.role !== 'ADMIN' && result.user.role !== 'STAFF') {
        clearSession();
        setError('This account is not a staff account. Use the customer sign-in at /login.');
        return;
      }

      setSession(result);
      const returnUrl = new URLSearchParams(window.location.search).get('returnUrl');
      router.push(safeReturnUrl(returnUrl, '/admin', { requirePrefix: '/admin' }));
    } catch (err) {
      setError(
        err instanceof AuthApiError
          ? err.message
          : 'Sign-in failed. Please try again.',
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
            <ShieldCheck size={22} aria-hidden />
          </span>
          <div>
            <h1 className="font-raleway text-2xl font-bold text-white">
              Afrizonemart Admin
            </h1>
            <p className="mt-1 font-sans text-sm text-white/60">
              Restricted area · authorised staff only
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
            <Lock size={14} aria-hidden /> {submitting ? 'Signing in…' : 'Sign in to admin'}
          </button>
        </form>

        <p className="mt-6 text-center font-sans text-xs text-white/40">
          Looking for the customer sign-in?{' '}
          <a href="/login" className="font-bold text-white hover:text-amber">
            Click here
          </a>
        </p>
      </div>
    </main>
  );
}

const inputClass =
  'w-full rounded-input border border-white/15 bg-white/10 px-3 py-2.5 font-sans text-sm text-white placeholder:text-white/40 focus:border-amber focus:outline-none';
