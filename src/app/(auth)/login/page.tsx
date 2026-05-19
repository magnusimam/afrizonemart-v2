'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { type FormEvent, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { AuthCard } from '@/components/auth/AuthCard';
import { GoogleSignInButton } from '@/components/auth/GoogleSignInButton';
import { PhoneSignInForm } from '@/components/auth/PhoneSignInForm';
import { friendlyAuthError, loginUser, type AuthResult } from '@/lib/api/auth';
import { useAuthStore } from '@/stores/authStore';
import { safeReturnUrl } from '@/lib/safe-redirect';

type Method = 'email' | 'phone';

export default function LoginPage() {
  const router = useRouter();
  const setSession = useAuthStore((s) => s.setSession);

  const [method, setMethod] = useState<Method>('email');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const finishSignIn = (result: AuthResult) => {
    setSession(result);
    const returnUrl = new URLSearchParams(window.location.search).get('returnUrl');
    // 2026-05-09: customer-facing /login always lands in /account,
    // even for admins. Admins who want admin-mode go to /admin/login;
    // signing in here means they want their shopping account. The
    // previous role-based fallback surprised admins who clicked the
    // customer header's "Sign in" link and ended up in the admin
    // console.
    //
    // `returnUrl` still wins — an admin returning from /admin/orders
    // after a session expiry redirected them through /login still
    // lands back at /admin/orders.
    //
    // Phase 11.3 (audit C3): safeReturnUrl rejects protocol-relative
    // (`//evil.com`) and absolute off-origin URLs that the previous
    // `startsWith('/')` check let through.
    router.push(safeReturnUrl(returnUrl, '/account'));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const result = await loginUser({ email, password });
      finishSignIn(result);
    } catch (err) {
      setError(friendlyAuthError(err, 'Sign-in failed. Please try again.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthCard
      title="Welcome back"
      subtitle="Sign in to continue shopping across Africa"
      footer={
        <>
          New to Afrizonemart?{' '}
          <Link href="/register" className="font-bold text-navy hover:underline">
            Create an account
          </Link>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        {/* Google sign-in (top — highest conversion path) */}
        <GoogleSignInButton onSuccess={finishSignIn} onError={(m) => setError(m)} />

        <div className="relative my-1 flex items-center">
          <span className="h-px flex-1 bg-border" />
          <span className="px-3 font-raleway text-xs font-semibold uppercase tracking-btn text-muted">
            or
          </span>
          <span className="h-px flex-1 bg-border" />
        </div>

        {/* Method picker — Email vs Phone. min-h-[44px] keeps the
            two buttons on the tap floor; text stays text-xs so the
            "Email + Password" label fits without wrapping at 360px. */}
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => {
              setMethod('email');
              setError(null);
            }}
            className={`inline-flex min-h-[44px] items-center justify-center rounded-btn border px-4 font-raleway text-xs font-bold uppercase tracking-btn transition-colors ${
              method === 'email'
                ? 'border-navy bg-navy text-white'
                : 'border-border bg-white text-charcoal hover:border-navy active:border-navy'
            }`}
          >
            Email + Password
          </button>
          <button
            type="button"
            onClick={() => {
              setMethod('phone');
              setError(null);
            }}
            className={`inline-flex min-h-[44px] items-center justify-center rounded-btn border px-4 font-raleway text-xs font-bold uppercase tracking-btn transition-colors ${
              method === 'phone'
                ? 'border-navy bg-navy text-white'
                : 'border-border bg-white text-charcoal hover:border-navy active:border-navy'
            }`}
          >
            Phone + SMS
          </button>
        </div>

        {error && (
          <div
            role="alert"
            className="rounded-input border border-danger/30 bg-danger/5 px-3 py-2 font-sans text-sm text-danger"
          >
            {error}
          </div>
        )}

        {method === 'phone' ? (
          <PhoneSignInForm onSuccess={finishSignIn} />
        ) : (
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Field label="Email">
          <input
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className={inputClass}
            autoComplete="username"
            inputMode="email"
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false}
            enterKeyHint="next"
          />
        </Field>

        <Field
          label="Password"
          right={
            <Link
              href="/forgot-password"
              className="font-raleway text-xs font-bold uppercase tracking-btn text-navy hover:underline"
            >
              Forgot?
            </Link>
          }
        >
          <div className="relative">
            <input
              required
              type={showPwd ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className={`${inputClass} pr-12`}
              autoComplete="current-password"
              enterKeyHint="go"
            />
            <button
              type="button"
              onClick={() => setShowPwd((v) => !v)}
              aria-label={showPwd ? 'Hide password' : 'Show password'}
              className="absolute right-1 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center text-muted hover:text-navy"
            >
              {showPwd ? <EyeOff size={18} aria-hidden /> : <Eye size={18} aria-hidden />}
            </button>
          </div>
        </Field>

        <label className="-m-2 flex cursor-pointer items-center gap-2 rounded p-2 font-sans text-sm text-charcoal hover:bg-page">
          <input type="checkbox" className="h-5 w-5 cursor-pointer accent-navy" />
          Keep me signed in
        </label>

        <button
          type="submit"
          disabled={submitting}
          className="inline-flex min-h-[48px] items-center justify-center rounded-btn bg-navy py-3 font-raleway text-sm font-bold uppercase tracking-btn text-white shadow-card transition-colors hover:bg-amber hover:text-navy active:bg-amber active:text-navy disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? 'Signing in…' : 'Sign In'}
        </button>
      </form>
        )}
      </div>
    </AuthCard>
  );
}

/// text-base (16px) on mobile prevents iOS Safari's zoom-on-focus.
/// min-h-[44px] keeps every input on the tap-target floor.
const inputClass =
  'w-full min-h-[44px] rounded-input border border-border bg-white px-3 py-2.5 font-sans text-base text-charcoal placeholder:text-muted focus:border-navy focus:outline-none md:text-sm';

function Field({
  label,
  right,
  children,
}: {
  label: string;
  right?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="flex items-center justify-between gap-3">
        <span className="font-raleway text-xs font-bold uppercase tracking-btn text-navy">
          {label}
        </span>
        {right}
      </span>
      {children}
    </label>
  );
}
