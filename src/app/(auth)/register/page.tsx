'use client';

import Link from 'next/link';
import { type FormEvent, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { AuthCard } from '@/components/auth/AuthCard';
import { SocialLoginButtons } from '@/components/auth/SocialLoginButtons';
import { COUNTRIES, COUNTRY_CODES, getCountry } from '@/lib/countries';

export default function RegisterPage() {
  const [showPwd, setShowPwd] = useState(false);
  const [country, setCountry] = useState('NG');
  const c = getCountry(country);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
  };

  return (
    <AuthCard
      title="Create your account"
      subtitle="Join Afrizonemart and shop everything made in Africa"
      footer={
        <>
          Already have an account?{' '}
          <Link href="/login" className="font-bold text-navy hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-3">
          <Field label="First Name">
            <input
              required
              type="text"
              className={inputClass}
              autoComplete="given-name"
            />
          </Field>
          <Field label="Last Name">
            <input
              required
              type="text"
              className={inputClass}
              autoComplete="family-name"
            />
          </Field>
        </div>

        <Field label="Email">
          <input
            required
            type="email"
            placeholder="you@example.com"
            className={inputClass}
            autoComplete="email"
          />
        </Field>

        <Field label="Country">
          <select
            required
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            className={`${inputClass} cursor-pointer`}
          >
            {COUNTRY_CODES.map((code) => {
              const cc = COUNTRIES[code];
              return (
                <option key={code} value={code}>
                  {cc.flag} {cc.name}
                </option>
              );
            })}
          </select>
        </Field>

        <Field label="Phone">
          <div className="flex gap-2">
            <span className="flex shrink-0 items-center gap-1 rounded-input border border-border bg-page px-3 font-sans text-sm">
              <span aria-hidden>{c?.flag}</span>
              <span className="text-charcoal">{c?.dial}</span>
            </span>
            <input
              required
              type="tel"
              placeholder="80 1234 5678"
              className={inputClass}
              autoComplete="tel"
            />
          </div>
        </Field>

        <Field label="Password">
          <div className="relative">
            <input
              required
              type={showPwd ? 'text' : 'password'}
              placeholder="At least 8 characters"
              minLength={8}
              className={`${inputClass} pr-10`}
              autoComplete="new-password"
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

        <label className="flex items-start gap-2 font-sans text-xs leading-relaxed text-charcoal">
          <input
            required
            type="checkbox"
            className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer accent-navy"
          />
          I agree to the AfriZoneMart{' '}
          <Link href="/legal/terms" className="font-semibold text-navy underline">
            Terms
          </Link>{' '}
          and{' '}
          <Link href="/legal/privacy" className="font-semibold text-navy underline">
            Privacy Policy
          </Link>
          .
        </label>

        <button
          type="submit"
          className="rounded-btn bg-navy py-3 font-raleway text-sm font-bold uppercase tracking-btn text-white shadow-card transition-colors hover:bg-amber hover:text-navy"
        >
          Create Account
        </button>

        <div className="relative my-2 flex items-center">
          <span className="h-px flex-1 bg-border" />
          <span className="px-3 font-raleway text-xs font-semibold uppercase tracking-btn text-muted">
            or
          </span>
          <span className="h-px flex-1 bg-border" />
        </div>

        <SocialLoginButtons mode="sign-up" />
      </form>
    </AuthCard>
  );
}

const inputClass =
  'w-full rounded-input border border-border bg-white px-3 py-2.5 font-sans text-sm text-charcoal placeholder:text-muted focus:border-navy focus:outline-none';

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="font-raleway text-xs font-bold uppercase tracking-btn text-navy">
        {label}
      </span>
      {children}
    </label>
  );
}
