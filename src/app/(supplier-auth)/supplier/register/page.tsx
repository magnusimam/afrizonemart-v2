'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { type FormEvent, useEffect, useState } from 'react';
import { Building2, Eye, EyeOff } from 'lucide-react';
import { AuthApiError, registerSupplier } from '@/lib/api/auth';
import { useAuthStore } from '@/stores/authStore';

/// Public supplier registration form. Creates a SUPPLIER user + Supplier
/// row at currentStage=1 via POST /api/auth/supplier/register, sets the
/// returned session in the auth store, and routes to /supplier/dashboard
/// so they land in the portal logged in.
export default function SupplierRegisterPage() {
  const router = useRouter();
  const setSession = useAuthStore((s) => s.setSession);
  const user = useAuthStore((s) => s.user);
  const accessToken = useAuthStore((s) => s.accessToken);

  const [name, setName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [country, setCountry] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // If they're already a supplier or admin, skip to the portal.
  useEffect(() => {
    if (user && accessToken && (user.role === 'SUPPLIER' || user.role === 'ADMIN')) {
      router.replace('/supplier/dashboard');
    }
  }, [user, accessToken, router]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const result = await registerSupplier({
        name: name.trim(),
        companyName: companyName.trim(),
        email: email.trim(),
        password,
        contactPhone: contactPhone.trim() || undefined,
        country: country.trim() || undefined,
      });
      setSession(result);
      router.push('/supplier/dashboard');
    } catch (err) {
      setError(
        err instanceof AuthApiError ? err.message : 'Registration failed. Try again.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-navy via-navy to-[#0a1942] px-4 py-12">
      <div className="w-full max-w-lg rounded-card border border-white/10 bg-white/5 p-8 shadow-card backdrop-blur">
        <div className="mb-6 flex flex-col items-center gap-3 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-amber/15 text-amber">
            <Building2 size={22} aria-hidden />
          </span>
          <div>
            <h1 className="font-raleway text-2xl font-bold text-white">
              Apply to supply Afrizonemart
            </h1>
            <p className="mt-1 font-sans text-sm text-white/60">
              Tell us a bit about you and your company. Our Sourcing Unit
              reviews every application.
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
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Your name" required>
              <input
                required
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="name"
                placeholder="e.g. Aisha Bello"
                className={inputClass}
              />
            </Field>
            <Field label="Company name" required>
              <input
                required
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                autoComplete="organization"
                placeholder="e.g. Bello Naturals Ltd"
                className={inputClass}
              />
            </Field>
          </div>

          <Field label="Work email" required>
            <input
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              className={inputClass}
            />
          </Field>

          <Field label="Password" required hint="Min 8 characters">
            <div className="relative">
              <input
                required
                type={showPwd ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={8}
                autoComplete="new-password"
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
          </Field>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Contact phone" hint="Optional, can add later">
              <input
                type="tel"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                autoComplete="tel"
                placeholder="+234 ..."
                className={inputClass}
              />
            </Field>
            <Field label="Country" hint="ISO 2-letter code (NG, GH, KE…)">
              <input
                type="text"
                value={country}
                onChange={(e) => setCountry(e.target.value.toUpperCase())}
                maxLength={2}
                placeholder="NG"
                className={inputClass}
              />
            </Field>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="mt-2 flex items-center justify-center gap-2 rounded-btn bg-amber py-3 font-raleway text-sm font-bold uppercase tracking-btn text-navy shadow-card transition-colors hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? 'Creating account…' : 'Create supplier account'}
          </button>
        </form>

        <p className="mt-6 text-center font-sans text-xs text-white/40">
          Already have a supplier account?{' '}
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

function Field({
  label,
  required,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="font-raleway text-[11px] font-bold uppercase tracking-btn text-white/70">
        {label}
        {required && <span className="ml-0.5 text-amber">*</span>}
      </span>
      {children}
      {hint && <span className="font-sans text-[11px] text-white/40">{hint}</span>}
    </label>
  );
}
