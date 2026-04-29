'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { type FormEvent, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { AuthCard } from '@/components/auth/AuthCard';
import { GoogleSignInButton } from '@/components/auth/GoogleSignInButton';
import { PhoneSignInForm } from '@/components/auth/PhoneSignInForm';
import { AuthApiError, loginUser, type AuthResult } from '@/lib/api/auth';
import { useAuthStore } from '@/stores/authStore';

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
    const fallback = result.user.role === 'ADMIN' ? '/admin' : '/account';
    router.push(returnUrl && returnUrl.startsWith('/') ? returnUrl : fallback);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const result = await loginUser({ email, password });
      finishSignIn(result);
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

        {/* Method picker — Email vs Phone */}
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => {
              setMethod('email');
              setError(null);
            }}
            className={`rounded-btn border px-4 py-2 font-raleway text-xs font-bold uppercase tracking-btn transition-colors ${
              method === 'email'
                ? 'border-navy bg-navy text-white'
                : 'border-border bg-white text-charcoal hover:border-navy'
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
            className={`rounded-btn border px-4 py-2 font-raleway text-xs font-bold uppercase tracking-btn transition-colors ${
              method === 'phone'
                ? 'border-navy bg-navy text-white'
                : 'border-border bg-white text-charcoal hover:border-navy'
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
              className={`${inputClass} pr-10`}
              autoComplete="current-password"
            />
            <button
              type="button"
              onClick={() => setShowPwd((v) => !v)}
              aria-label={showPwd ? 'Hide password' : 'Show password'}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-navy"
            >
              {showPwd ? <EyeOff size={18} aria-hidden /> : <Eye size={18} aria-hidden />}
            </button>
          </div>
        </Field>

        <label className="flex items-center gap-2 font-sans text-sm text-charcoal">
          <input type="checkbox" className="h-4 w-4 cursor-pointer accent-navy" />
          Keep me signed in
        </label>

        <button
          type="submit"
          disabled={submitting}
          className="rounded-btn bg-navy py-3 font-raleway text-sm font-bold uppercase tracking-btn text-white shadow-card transition-colors hover:bg-amber hover:text-navy disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? 'Signing in…' : 'Sign In'}
        </button>
      </form>
        )}
      </div>
    </AuthCard>
  );
}

const inputClass =
  'w-full rounded-input border border-border bg-white px-3 py-2.5 font-sans text-sm text-charcoal placeholder:text-muted focus:border-navy focus:outline-none';

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
