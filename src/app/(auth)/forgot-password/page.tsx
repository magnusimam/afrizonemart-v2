'use client';

import Link from 'next/link';
import { type FormEvent, useState } from 'react';
import { CheckCircle2, Loader2, Mail } from 'lucide-react';
import { AuthCard } from '@/components/auth/AuthCard';
import { friendlyAuthError, requestPasswordReset } from '@/lib/api/auth';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await requestPasswordReset(email);
      setSubmitted(true);
    } catch (err) {
      // The API always returns 204 even for unknown emails (anti-enum), so
      // anything that surfaces here is a real network/server failure.
      setError(friendlyAuthError(err, 'Could not send reset link. Try again in a moment.'));
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <AuthCard
        title="Check your email"
        subtitle="We've sent a password reset link to your email"
        footer={
          <>
            Didn&apos;t get it?{' '}
            <button
              type="button"
              onClick={() => {
                setSubmitted(false);
                setError(null);
              }}
              className="font-bold text-navy hover:underline"
            >
              Try again
            </button>
          </>
        }
      >
        <div className="flex flex-col items-center gap-4 py-4 text-center">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-success/15 text-success">
            <CheckCircle2 size={32} aria-hidden />
          </span>
          <p className="font-sans text-sm leading-relaxed text-charcoal">
            Open your inbox and click the link to reset your password. The link expires in 60 minutes.
          </p>
          <Link
            href="/login"
            className="inline-flex min-h-[44px] items-center justify-center rounded-btn border-2 border-navy bg-white px-6 py-2.5 font-raleway text-xs font-bold uppercase tracking-btn text-navy transition-colors hover:bg-navy hover:text-white active:bg-navy active:text-white"
          >
            Back to Sign In
          </Link>
        </div>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title="Forgot your password?"
      subtitle="Enter your email and we'll send you a reset link"
      footer={
        <>
          Remembered it?{' '}
          <Link href="/login" className="font-bold text-navy hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1.5">
          <span className="font-raleway text-xs font-bold uppercase tracking-btn text-navy">
            Email
          </span>
          <div className="relative">
            <Mail
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted"
              aria-hidden
            />
            <input
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full min-h-[44px] rounded-input border border-border bg-white py-2.5 pl-9 pr-3 font-sans text-base text-charcoal placeholder:text-muted focus:border-navy focus:outline-none md:text-sm"
              autoComplete="email"
              inputMode="email"
              autoCapitalize="off"
              autoCorrect="off"
              spellCheck={false}
              enterKeyHint="send"
            />
          </div>
        </label>

        {error && (
          <p
            role="alert"
            className="rounded-card border border-danger/30 bg-danger/5 px-3 py-2 font-sans text-xs text-danger"
          >
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-btn bg-navy py-3 font-raleway text-sm font-bold uppercase tracking-btn text-white shadow-card transition-colors hover:bg-amber hover:text-navy active:bg-amber active:text-navy disabled:cursor-not-allowed disabled:opacity-70"
        >
          {submitting && <Loader2 size={16} className="animate-spin" aria-hidden />}
          {submitting ? 'Sending…' : 'Send Reset Link'}
        </button>
      </form>
    </AuthCard>
  );
}
