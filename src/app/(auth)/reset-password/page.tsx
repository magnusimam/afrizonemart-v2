'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { type FormEvent, useState } from 'react';
import { CheckCircle2, Eye, EyeOff, Loader2 } from 'lucide-react';
import { AuthCard } from '@/components/auth/AuthCard';
import { AuthApiError, resetPassword } from '@/lib/api/auth';

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') ?? '';

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [show, setShow] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  if (!token) {
    return (
      <AuthCard
        title="Invalid reset link"
        subtitle="The password reset link is missing its token."
        footer={
          <Link href="/forgot-password" className="font-bold text-navy hover:underline">
            Request a new link
          </Link>
        }
      >
        <p className="font-sans text-sm text-charcoal">
          Make sure you opened the link from the email exactly as it was sent — some
          email clients break long links across multiple lines.
        </p>
      </AuthCard>
    );
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    setSubmitting(true);
    try {
      await resetPassword(token, password);
      setDone(true);
      setTimeout(() => router.push('/login'), 2500);
    } catch (err) {
      setError(
        err instanceof AuthApiError
          ? err.message
          : 'Could not reset your password. The link may have expired.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <AuthCard
        title="Password updated"
        subtitle="You can now sign in with your new password."
      >
        <div className="flex flex-col items-center gap-4 py-4 text-center">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-success/15 text-success">
            <CheckCircle2 size={32} aria-hidden />
          </span>
          <p className="font-sans text-sm text-charcoal">
            Redirecting to sign in…
          </p>
        </div>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title="Choose a new password"
      subtitle="Pick something strong — at least 8 characters."
      footer={
        <Link href="/login" className="font-bold text-navy hover:underline">
          Back to sign in
        </Link>
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1.5">
          <span className="font-raleway text-xs font-bold uppercase tracking-btn text-navy">
            New password
          </span>
          <div className="relative">
            <input
              required
              type={show ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={8}
              className="w-full rounded-input border border-border bg-white py-2.5 pl-3 pr-10 font-sans text-sm text-charcoal placeholder:text-muted focus:border-navy focus:outline-none"
              autoComplete="new-password"
            />
            <button
              type="button"
              onClick={() => setShow((v) => !v)}
              aria-label={show ? 'Hide password' : 'Show password'}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-navy"
            >
              {show ? <EyeOff size={16} aria-hidden /> : <Eye size={16} aria-hidden />}
            </button>
          </div>
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="font-raleway text-xs font-bold uppercase tracking-btn text-navy">
            Confirm password
          </span>
          <input
            required
            type={show ? 'text' : 'password'}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            minLength={8}
            className="w-full rounded-input border border-border bg-white py-2.5 px-3 font-sans text-sm text-charcoal placeholder:text-muted focus:border-navy focus:outline-none"
            autoComplete="new-password"
          />
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
          className="flex items-center justify-center gap-2 rounded-btn bg-navy py-3 font-raleway text-sm font-bold uppercase tracking-btn text-white shadow-card transition-colors hover:bg-amber hover:text-navy disabled:cursor-not-allowed disabled:opacity-70"
        >
          {submitting && <Loader2 size={16} className="animate-spin" aria-hidden />}
          {submitting ? 'Updating…' : 'Update Password'}
        </button>
      </form>
    </AuthCard>
  );
}
