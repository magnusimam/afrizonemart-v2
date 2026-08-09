'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { type FormEvent, useState } from 'react';
import { ArrowRight, Store } from 'lucide-react';
import { AFRICAN_COUNTRIES } from '@/lib/supplier/piq-config';
import { applySupplier } from '@/lib/api/supplier';
import { HttpApiError } from '@/lib/api/client';
import { useAuthStore } from '@/stores/authStore';

/**
 * Supplier application — combined register + apply (Stage 2, Expression of
 * Interest). Creates the AZM account (if new) AND the supplier profile in
 * one call, signs the user in, and drops them into the portal at Stage 1.
 * An already-signed-in AZM user gets a profile attached to their account.
 */
export default function SupplierRegisterPage() {
  const router = useRouter();
  const setSession = useAuthStore((s) => s.setSession);
  // An already-signed-in AZM user gets the supplier profile attached to their
  // existing account — the API takes the authenticated user and ignores any
  // email/password in the body. The form used to demand both anyway, so
  // someone signed in could type a *different* email and silently get the
  // profile on their own account. Hide those fields instead.
  const signedInEmail = useAuthStore((s) => s.user?.email ?? null);

  const [companyName, setCompanyName] = useState('');
  const [contactName, setContactName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [country, setCountry] = useState('');
  const [category, setCategory] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emailTaken, setEmailTaken] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setEmailTaken(false);
    setSubmitting(true);
    try {
      const result = await applySupplier({
        // Omitted entirely when signed in — the API keys off the token.
        ...(signedInEmail ? {} : { email, password }),
        name: contactName,
        companyName,
        contactName,
        phone,
        country,
        category,
      });
      // New account → sign them in with the returned session.
      if (result.user && result.accessToken) {
        setSession({ user: result.user, accessToken: result.accessToken });
      }
      router.push('/supplier/dashboard');
    } catch (err) {
      if (err instanceof HttpApiError && err.status === 409) {
        setEmailTaken(true);
        setError('An account with this email already exists.');
      } else {
        setError(
          err instanceof HttpApiError
            ? err.message
            : 'Something went wrong submitting your application. Please try again.',
        );
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-navy via-navy to-[#0a1942] px-4 py-12">
      <div className="w-full max-w-lg rounded-card border border-white/10 bg-white/5 p-8 shadow-card backdrop-blur">
        <div className="mb-6 flex flex-col items-center gap-3 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-amber/15 text-amber">
            <Store size={22} aria-hidden />
          </span>
          <div>
            <h1 className="font-raleway text-2xl font-bold text-white">
              Apply to supply Afrizonemart
            </h1>
            <p className="mt-1 font-sans text-sm text-white/60">
              Tell us about your business — it takes a few minutes
            </p>
          </div>
        </div>

        {error && (
          <div
            role="alert"
            className="mb-4 rounded-input border border-danger/30 bg-danger/15 px-3 py-2.5 font-sans text-sm text-white"
          >
            {error}
            {emailTaken && (
              <>
                {' '}
                <Link href="/supplier/login" className="font-bold text-amber hover:text-white">
                  Sign in instead →
                </Link>
              </>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Company name" required>
              <input
                required
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className={inputClass}
                autoFocus
              />
            </Field>
            <Field label="Contact name" required>
              <input
                required
                type="text"
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                className={inputClass}
              />
            </Field>
            {signedInEmail ? (
              <Field label="Email">
                <p className="rounded-input border border-white/10 bg-white/5 px-3 py-2.5 font-sans text-sm text-white/70">
                  {signedInEmail}
                </p>
              </Field>
            ) : (
              <Field label="Email" required>
                <input
                  required
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="username"
                  className={inputClass}
                />
              </Field>
            )}
            <Field label="Phone" required>
              <input
                required
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className={inputClass}
              />
            </Field>
            <Field label="Country" required>
              <select
                required
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className={inputClass}
              >
                <option value="" disabled>
                  Select country
                </option>
                {AFRICAN_COUNTRIES.map((c) => (
                  <option key={c} value={c} className="text-navy">
                    {c}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Main product category" required>
              <select
                required
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className={inputClass}
              >
                <option value="" disabled>
                  Select category
                </option>
                {['Food', 'Fashion', 'Tech', 'Home', 'Health', 'Other'].map((c) => (
                  <option key={c} value={c} className="text-navy">
                    {c}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          {signedInEmail ? (
            <p className="rounded-input border border-white/10 bg-white/5 px-3 py-2.5 font-sans text-xs text-white/60">
              You’re signed in, so your application will be attached to this
              account — no new password needed.
            </p>
          ) : (
            <Field label="Password" required>
              <input
                required
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                className={inputClass}
              />
              <span className="font-sans text-[11px] text-white/40">
                At least 8 characters, with a number, symbol, or capital letter.
              </span>
            </Field>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="mt-2 flex items-center justify-center gap-2 rounded-btn bg-amber py-3 font-raleway text-sm font-bold uppercase tracking-btn text-navy shadow-card transition-colors hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? 'Submitting…' : 'Submit application'}
            <ArrowRight size={15} aria-hidden />
          </button>
        </form>

        <p className="mt-6 text-center font-sans text-xs text-white/50">
          Already a supplier?{' '}
          <Link href="/supplier/login" className="font-bold text-white hover:text-amber">
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="font-raleway text-[11px] font-bold uppercase tracking-btn text-white/70">
        {label}
        {required && <span className="text-amber"> *</span>}
      </span>
      {children}
    </label>
  );
}

const inputClass =
  'w-full rounded-input border border-white/15 bg-white/10 px-3 py-2.5 font-sans text-sm text-white placeholder:text-white/40 focus:border-amber focus:outline-none';
