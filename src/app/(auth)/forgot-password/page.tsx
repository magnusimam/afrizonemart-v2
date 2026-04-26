'use client';

import Link from 'next/link';
import { type FormEvent, useState } from 'react';
import { CheckCircle2, Mail } from 'lucide-react';
import { AuthCard } from '@/components/auth/AuthCard';

export default function ForgotPasswordPage() {
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
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
              onClick={() => setSubmitted(false)}
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
            Open your inbox and click the link to reset your password. The link expires in 30 minutes.
          </p>
          <Link
            href="/login"
            className="rounded-btn border-2 border-navy bg-white px-6 py-2.5 font-raleway text-xs font-bold uppercase tracking-btn text-navy transition-colors hover:bg-navy hover:text-white"
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
              placeholder="you@example.com"
              className="w-full rounded-input border border-border bg-white py-2.5 pl-9 pr-3 font-sans text-sm text-charcoal placeholder:text-muted focus:border-navy focus:outline-none"
              autoComplete="email"
            />
          </div>
        </label>

        <button
          type="submit"
          className="rounded-btn bg-navy py-3 font-raleway text-sm font-bold uppercase tracking-btn text-white shadow-card transition-colors hover:bg-amber hover:text-navy"
        >
          Send Reset Link
        </button>
      </form>
    </AuthCard>
  );
}
