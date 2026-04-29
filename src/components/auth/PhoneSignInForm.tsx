'use client';

import { useState, type FormEvent } from 'react';
import { Loader2, Phone, ShieldCheck } from 'lucide-react';
import {
  AuthApiError,
  startPhoneVerification,
  verifyPhoneAndSignIn,
  type AuthResult,
} from '@/lib/api/auth';

/**
 * Two-step SMS sign-in: (1) phone → send OTP via Twilio Verify;
 * (2) 6-digit code → verify and issue our JWT + refresh cookie.
 *
 * Lightweight country-code picker — the most common African codes plus
 * a generic "other" that asks the user to type the full E.164 number.
 */

const COUNTRY_CODES: Array<{ code: string; flag: string; label: string }> = [
  { code: '+234', flag: '🇳🇬', label: 'Nigeria' },
  { code: '+254', flag: '🇰🇪', label: 'Kenya' },
  { code: '+27',  flag: '🇿🇦', label: 'South Africa' },
  { code: '+233', flag: '🇬🇭', label: 'Ghana' },
  { code: '+20',  flag: '🇪🇬', label: 'Egypt' },
  { code: '+212', flag: '🇲🇦', label: 'Morocco' },
  { code: '+251', flag: '🇪🇹', label: 'Ethiopia' },
  { code: '+255', flag: '🇹🇿', label: 'Tanzania' },
  { code: '+256', flag: '🇺🇬', label: 'Uganda' },
  { code: '+1',   flag: '🇺🇸', label: 'US / Canada' },
  { code: '+44',  flag: '🇬🇧', label: 'UK' },
];

interface Props {
  onSuccess: (result: AuthResult) => void;
}

export function PhoneSignInForm({ onSuccess }: Props) {
  const [step, setStep] = useState<'phone' | 'code'>('phone');
  const [dial, setDial] = useState('+234');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const fullPhone = dial + phone.replace(/\D/g, '').replace(/^0+/, '');

  const onSendCode = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!/^\+\d{8,15}$/.test(fullPhone)) {
      setError('Enter a valid mobile number including country code.');
      return;
    }
    setSubmitting(true);
    try {
      await startPhoneVerification(fullPhone);
      setStep('code');
    } catch (err) {
      setError(
        err instanceof AuthApiError
          ? err.message
          : 'Could not send a code right now. Try again.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  const onVerify = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!/^\d{4,8}$/.test(code.trim())) {
      setError('Enter the code we sent you.');
      return;
    }
    setSubmitting(true);
    try {
      const r = await verifyPhoneAndSignIn(fullPhone, code.trim());
      onSuccess(r);
    } catch (err) {
      setError(
        err instanceof AuthApiError
          ? err.message
          : 'Could not verify the code. Try again.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (step === 'phone') {
    return (
      <form onSubmit={onSendCode} className="flex flex-col gap-3">
        <label className="flex flex-col gap-1.5">
          <span className="font-raleway text-xs font-bold uppercase tracking-btn text-navy">
            Mobile number
          </span>
          <div className="flex gap-2">
            <select
              value={dial}
              onChange={(e) => setDial(e.target.value)}
              className="rounded-input border border-border bg-white px-2 py-2.5 font-sans text-sm focus:border-navy focus:outline-none"
              aria-label="Country code"
            >
              {COUNTRY_CODES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.flag} {c.code}
                </option>
              ))}
            </select>
            <div className="relative flex-1">
              <Phone
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted"
                aria-hidden
              />
              <input
                required
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="8012345678"
                inputMode="numeric"
                autoComplete="tel"
                className="w-full rounded-input border border-border bg-white py-2.5 pl-9 pr-3 font-sans text-sm text-charcoal placeholder:text-muted focus:border-navy focus:outline-none"
              />
            </div>
          </div>
          <span className="font-sans text-[11px] text-muted">
            We&rsquo;ll text you a 6-digit code. Standard SMS rates may apply.
          </span>
        </label>
        {error && (
          <p
            role="alert"
            className="rounded-input border border-danger/30 bg-danger/5 px-3 py-2 font-sans text-xs text-danger"
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
          {submitting ? 'Sending…' : 'Send Code'}
        </button>
      </form>
    );
  }

  return (
    <form onSubmit={onVerify} className="flex flex-col gap-3">
      <p className="font-sans text-sm text-charcoal">
        We sent a code to <span className="font-semibold text-navy">{fullPhone}</span>.
      </p>
      <label className="flex flex-col gap-1.5">
        <span className="font-raleway text-xs font-bold uppercase tracking-btn text-navy">
          Verification code
        </span>
        <div className="relative">
          <ShieldCheck
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted"
            aria-hidden
          />
          <input
            required
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
            placeholder="123456"
            inputMode="numeric"
            autoFocus
            autoComplete="one-time-code"
            className="w-full rounded-input border border-border bg-white py-2.5 pl-9 pr-3 font-mono text-lg tracking-[0.4em] text-charcoal placeholder:text-muted focus:border-navy focus:outline-none"
          />
        </div>
      </label>
      {error && (
        <p
          role="alert"
          className="rounded-input border border-danger/30 bg-danger/5 px-3 py-2 font-sans text-xs text-danger"
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
        {submitting ? 'Verifying…' : 'Verify & Sign In'}
      </button>
      <button
        type="button"
        onClick={() => {
          setStep('phone');
          setCode('');
          setError(null);
        }}
        className="font-sans text-xs text-muted hover:text-navy"
      >
        ← Use a different number
      </button>
    </form>
  );
}
