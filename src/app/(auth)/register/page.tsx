'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { type FormEvent, useEffect, useState } from 'react';
import { Eye, EyeOff, Gift } from 'lucide-react';
import { AuthCard } from '@/components/auth/AuthCard';
import { GoogleSignInButton } from '@/components/auth/GoogleSignInButton';
import { COUNTRIES, COUNTRY_CODES, getCountry } from '@/lib/countries';
import { friendlyAuthError, registerUser, type AuthResult } from '@/lib/api/auth';
import { PASSWORD_RULE_HINT, validatePasswordStrength } from '@/lib/auth/password';
import { useAuthStore } from '@/stores/authStore';
import {
  TRACK,
  identifyUser,
  trackEvent,
} from '@/components/providers/AnalyticsProvider';

const REFERRAL_STORAGE_KEY = 'azm-referral-code';

export default function RegisterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const setSession = useAuthStore((s) => s.setSession);

  /// 2026-05-16 Phase 2 — capture ?ref=<code> if it's on the URL,
  /// or rehydrate from sessionStorage (so a customer can land on
  /// /products via the referral link, browse around, then sign up
  /// and still get attributed). Cleared from storage on successful
  /// signup.
  const [referralCode, setReferralCode] = useState<string | null>(null);
  useEffect(() => {
    const fromUrl = searchParams?.get('ref');
    if (fromUrl) {
      setReferralCode(fromUrl);
      try {
        sessionStorage.setItem(REFERRAL_STORAGE_KEY, fromUrl);
      } catch {
        /* SSR / private mode */
      }
    } else {
      try {
        const stored = sessionStorage.getItem(REFERRAL_STORAGE_KEY);
        if (stored) setReferralCode(stored);
      } catch {
        /* SSR / private mode */
      }
    }
  }, [searchParams]);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [country, setCountry] = useState('NG');
  const [showPwd, setShowPwd] = useState(false);
  const [marketingOptIn, setMarketingOptIn] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const c = getCountry(country);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    // Phase 11.3 (audit M6): client-side mirror of the server's
    // password-strength rule. Saves a round-trip and shows the rule
    // inline before submit. Server still re-validates as the gate.
    const strengthError = validatePasswordStrength(password);
    if (strengthError) {
      setError(strengthError);
      return;
    }

    setSubmitting(true);

    // country/phone are captured locally but not yet persisted server-side —
    // the User schema doesn't have those fields yet. See ARCHITECTURE_TRACKER
    // → Followups for the schema extension that will store them.
    void country;
    void phone;

    const fullName = [firstName, lastName].map((s) => s.trim()).filter(Boolean).join(' ');

    try {
      const result = await registerUser({
        email,
        password,
        name: fullName || undefined,
        /// Tracker #48 — only send true when the customer ticked the
        /// box. Defaulting to false on the server too means a missing
        /// field never opts anyone in.
        marketingOptIn: marketingOptIn || undefined,
        /// 2026-05-16 Phase 2 — referral attribution. Server silently
        /// ignores unknown codes; signup never fails because of a bad
        /// ref.
        referralCode: referralCode ?? undefined,
      });
      try {
        sessionStorage.removeItem(REFERRAL_STORAGE_KEY);
      } catch {
        /* SSR / private mode */
      }
      setSession(result);
      trackEvent(TRACK.SIGNUP_COMPLETED, {
        method: 'email',
        marketing_opt_in: !!marketingOptIn,
        from_referral: !!referralCode,
      });
      identifyUser(result.user.id);
      router.push('/account');
    } catch (err) {
      setError(friendlyAuthError(err, 'Could not create your account. Please try again.'));
    } finally {
      setSubmitting(false);
    }
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
        {referralCode && (
          /* 2026-05-16 — confirmation that a referral is being
             tracked. Doesn't validate the code (server does);
             just tells the customer they'll get the ₦500-off
             welcome coupon on first paid order. */
          <div className="flex items-start gap-2 rounded-card border border-amber bg-amber/10 p-3 font-sans text-xs text-charcoal">
            <Gift size={16} className="mt-0.5 shrink-0 text-amber" aria-hidden />
            <span>
              You&apos;re signing up with a referral code (
              <code className="font-mono">{referralCode}</code>). When you
              place your first paid order you&apos;ll get ₦500 off automatically.
            </span>
          </div>
        )}
        {error && (
          <div
            role="alert"
            className="rounded-input border border-danger/30 bg-danger/5 px-3 py-2 font-sans text-sm text-danger"
          >
            {error}
          </div>
        )}

        {/* Google one-tap is the fastest path — promote it above the
         * email/password form so customers bypass the (rate-limited)
         * /register endpoint when possible. The form is still
         * available below as the fallback. */}
        <GoogleSignInButton
          text="signup_with"
          onSuccess={(result: AuthResult) => {
            setSession(result);
            router.push('/account');
          }}
          onError={(message) => setError(message)}
        />

        <div className="relative my-1 flex items-center">
          <span className="h-px flex-1 bg-border" />
          <span className="px-3 font-raleway text-xs font-semibold uppercase tracking-btn text-muted">
            or sign up with email
          </span>
          <span className="h-px flex-1 bg-border" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="First Name">
            <input
              required
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className={inputClass}
              autoComplete="given-name"
            />
          </Field>
          <Field label="Last Name">
            <input
              required
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className={inputClass}
              autoComplete="family-name"
            />
          </Field>
        </div>

        <Field label="Email">
          <input
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className={inputClass}
            autoComplete="email"
            inputMode="email"
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false}
            enterKeyHint="next"
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
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="80 1234 5678"
              className={inputClass}
              autoComplete="tel"
              inputMode="tel"
              enterKeyHint="next"
            />
          </div>
        </Field>

        <Field label="Password">
          <div className="relative">
            <input
              required
              type={showPwd ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 8 characters"
              minLength={8}
              className={`${inputClass} pr-10`}
              autoComplete="new-password"
              aria-describedby="password-rule"
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
          <p id="password-rule" className="mt-1 font-sans text-xs text-muted">
            {PASSWORD_RULE_HINT}
          </p>
        </Field>

        <label className="flex items-start gap-2 font-sans text-xs leading-relaxed text-charcoal">
          <input
            required
            type="checkbox"
            className="mt-0.5 h-5 w-5 shrink-0 cursor-pointer accent-navy"
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

        {/* Tracker #48 — marketing opt-in. Unticked by default; only
            sent to the API when the customer explicitly ticks it. */}
        <label className="flex items-start gap-2 font-sans text-xs leading-relaxed text-charcoal">
          <input
            type="checkbox"
            checked={marketingOptIn}
            onChange={(e) => setMarketingOptIn(e.target.checked)}
            className="mt-0.5 h-5 w-5 shrink-0 cursor-pointer accent-navy"
          />
          Send me deals, restock alerts, and African-product spotlights by
          email. You can unsubscribe with one click any time.
        </label>

        <button
          type="submit"
          disabled={submitting}
          className="inline-flex min-h-[48px] items-center justify-center rounded-btn bg-navy py-3 font-raleway text-sm font-bold uppercase tracking-btn text-white shadow-card transition-colors hover:bg-amber hover:text-navy active:bg-amber active:text-navy disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? 'Creating account…' : 'Create Account'}
        </button>
      </form>
    </AuthCard>
  );
}

/// text-base (16px) on mobile to prevent iOS Safari zoom-on-focus.
/// min-h-[44px] keeps every input on the tap-target floor.
const inputClass =
  'w-full min-h-[44px] rounded-input border border-border bg-white px-3 py-2.5 font-sans text-base text-charcoal placeholder:text-muted focus:border-navy focus:outline-none md:text-sm';

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
