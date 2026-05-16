'use client';

import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Loader2 } from 'lucide-react';
import { AccountSidebar } from '@/components/account/AccountSidebar';
import { AccountMobileNav } from '@/components/account/AccountMobileNav';
import { SafeBoundary } from '@/components/common/SafeBoundary';
import { COUNTRIES, COUNTRY_CODES } from '@/lib/countries';
import { friendlyAuthError, updateMe } from '@/lib/api/auth';
import { useAuthStore } from '@/stores/authStore';

/**
 * /account/profile — live data, real save.
 *
 * Replaces the previous fully-mocked version that defaulted every
 * field to a hardcoded "Adaeze Okonkwo" and had no submit handler.
 *
 * Today: name + phone are editable and persist via
 * `PATCH /api/auth/me`. Email is read-only (changing it would need a
 * re-verify flow we haven't built). Region/currency/language/time-
 * zone are placeholders for now — they need a `UserPreferences`
 * model that doesn't exist yet, so they're disabled with a "Coming
 * soon" pill rather than pretending to save.
 */

const PHONE_HINT = 'E.164 format, e.g. +2348012345678';

export default function ProfilePage() {
  const user = useAuthStore((s) => s.user);
  const accessToken = useAuthStore((s) => s.accessToken);
  const setUser = useAuthStore((s) => s.setUser);

  // Hydrate form once the auth store rehydrates from cookie/refresh.
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  /// Tracker #48 — marketing consent toggles live alongside the
  /// rest of the profile form so the dirty-check + save-button
  /// trigger on changes to either flag.
  const [marketingOptIn, setMarketingOptIn] = useState(false);
  const [smsOptIn, setSmsOptIn] = useState(false);
  /// 2026-05-16 Phase 2 — birth date drives the loyalty birthday
  /// bonus cron. Empty string = not set / clear.
  const [birthDate, setBirthDate] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setName(user.name ?? '');
      setPhone(user.phone ?? '');
      setMarketingOptIn(user.marketingOptIn ?? false);
      setSmsOptIn(user.smsOptIn ?? false);
      setBirthDate(user.birthDate ?? '');
    }
  }, [user]);

  // First/last split — purely cosmetic for the sidebar header. We
  // store and edit `name` as a single field; users can include
  // whatever their preferred presentation is.
  const { first, last } = useMemo(() => {
    const [f, ...rest] = (user?.name ?? '').split(' ');
    return { first: f ?? '', last: rest.join(' ') };
  }, [user?.name]);

  const dirty =
    (user?.name ?? '') !== name ||
    (user?.phone ?? '') !== phone ||
    (user?.marketingOptIn ?? false) !== marketingOptIn ||
    (user?.smsOptIn ?? false) !== smsOptIn ||
    (user?.birthDate ?? '') !== birthDate;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!accessToken || !dirty) return;
    setError(null);
    setSuccess(null);
    setSubmitting(true);
    try {
      const updated = await updateMe(accessToken, {
        // Only send fields that actually changed.
        ...((user?.name ?? '') !== name ? { name: name.trim() } : {}),
        ...((user?.phone ?? '') !== phone
          ? phone.trim()
            ? { phone: phone.trim() }
            : {}
          : {}),
        ...((user?.marketingOptIn ?? false) !== marketingOptIn
          ? { marketingOptIn }
          : {}),
        ...((user?.smsOptIn ?? false) !== smsOptIn ? { smsOptIn } : {}),
        ...((user?.birthDate ?? '') !== birthDate
          ? { birthDate: birthDate ? birthDate : null }
          : {}),
      });
      setUser(updated);
      setSuccess('Profile updated.');
    } catch (err) {
      setError(friendlyAuthError(err, 'Could not save your profile. Try again.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="bg-page pb-12">
      <div className="mx-auto max-w-site px-4 py-6 md:py-10">
        <SafeBoundary name="account:mobile-nav" fallback={null}>
          <AccountMobileNav active="/account/profile" />
        </SafeBoundary>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:gap-8">
          <div className="lg:col-span-3">
            <SafeBoundary name="account:sidebar" fallback={null}>
              <AccountSidebar
                active="/account/profile"
                userFirstName={first || 'You'}
                userLastName={last}
              />
            </SafeBoundary>
          </div>

          <form
            onSubmit={handleSubmit}
            className="flex flex-col gap-5 lg:col-span-9"
          >
            <header>
              <h1 className="font-raleway text-2xl font-bold text-navy md:text-3xl">
                Profile Settings
              </h1>
              <p className="font-sans text-sm text-muted md:text-base">
                Manage your personal information.
              </p>
            </header>

            {error && (
              <div
                role="alert"
                className="rounded-input border border-danger/30 bg-danger/5 px-3 py-2 font-sans text-sm text-danger"
              >
                {error}
              </div>
            )}
            {success && (
              <div
                role="status"
                className="rounded-input border border-success/30 bg-success/5 px-3 py-2 font-sans text-sm text-success"
              >
                {success}
              </div>
            )}

            <Section title="Personal Information">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Field label="Full Name">
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name as you'd like it displayed"
                    className={inputClass}
                    autoComplete="name"
                    maxLength={100}
                  />
                </Field>
                <Field label="Phone" hint={PHONE_HINT}>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+2348012345678"
                    className={inputClass}
                    autoComplete="tel"
                  />
                </Field>
                <Field label="Email">
                  <input
                    type="email"
                    value={user?.email ?? ''}
                    readOnly
                    disabled
                    className={`${inputClass} cursor-not-allowed bg-page text-muted`}
                  />
                  <span className="mt-1 font-sans text-xs text-muted">
                    Email changes require a verification flow we
                    haven&apos;t built yet. Reach out to support if you
                    need it changed.
                  </span>
                </Field>
                <Field
                  label="Birthday"
                  hint="Used for your Continental Rewards birthday bonus. Only the month + day matter."
                >
                  <input
                    type="date"
                    value={birthDate}
                    onChange={(e) => setBirthDate(e.target.value)}
                    max={new Date().toISOString().slice(0, 10)}
                    className={inputClass}
                    autoComplete="bday"
                  />
                </Field>
              </div>
            </Section>

            <Section
              title="Communication Preferences"
              caption="Decide how Afrizonemart reaches out. Transactional emails (orders, shipping, receipts) are sent regardless — these toggles only affect marketing."
            >
              <div className="flex flex-col gap-3">
                <label className="flex items-start gap-3 rounded-input border border-border bg-page p-3">
                  <input
                    type="checkbox"
                    checked={marketingOptIn}
                    onChange={(e) => setMarketingOptIn(e.target.checked)}
                    className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer accent-navy"
                  />
                  <span className="flex flex-col leading-snug">
                    <span className="font-raleway text-sm font-bold text-navy">
                      Marketing emails
                    </span>
                    <span className="font-sans text-xs text-muted">
                      Deals, new arrivals, restock alerts, African-product
                      spotlights. One-click unsubscribe in every email.
                    </span>
                  </span>
                </label>
                <label className="flex items-start gap-3 rounded-input border border-border bg-page p-3">
                  <input
                    type="checkbox"
                    checked={smsOptIn}
                    onChange={(e) => setSmsOptIn(e.target.checked)}
                    className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer accent-navy"
                  />
                  <span className="flex flex-col leading-snug">
                    <span className="font-raleway text-sm font-bold text-navy">
                      SMS / WhatsApp
                    </span>
                    <span className="font-sans text-xs text-muted">
                      Time-sensitive deals + delivery updates by SMS. You can
                      reply STOP any time to opt out.
                    </span>
                  </span>
                </label>
              </div>
            </Section>

            <Section
              title="Region & Currency"
              caption="Personalises prices and delivery options across the site."
              comingSoon
            >
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Field label="Country">
                  <select
                    disabled
                    defaultValue="NG"
                    className={`${inputClass} cursor-not-allowed opacity-60`}
                  >
                    {COUNTRY_CODES.map((c) => (
                      <option key={c} value={c}>
                        {COUNTRIES[c].flag} {COUNTRIES[c].name}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Currency">
                  <select
                    disabled
                    defaultValue="NGN"
                    className={`${inputClass} cursor-not-allowed opacity-60`}
                  >
                    <option value="NGN">NGN — Nigerian Naira</option>
                  </select>
                </Field>
              </div>
            </Section>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="submit"
                disabled={!dirty || submitting}
                className="flex items-center gap-2 rounded-btn bg-navy px-6 py-3 font-raleway text-sm font-bold uppercase tracking-btn text-white shadow-card hover:bg-amber hover:text-navy disabled:cursor-not-allowed disabled:opacity-50"
              >
                {submitting && <Loader2 size={16} className="animate-spin" aria-hidden />}
                {submitting ? 'Saving…' : 'Save Changes'}
              </button>
              {!dirty && !success && (
                <span className="font-sans text-xs text-muted">
                  Nothing to save yet — edit a field above.
                </span>
              )}
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}

const inputClass =
  'w-full rounded-input border border-border bg-white px-3 py-2.5 font-sans text-sm text-charcoal placeholder:text-muted focus:border-navy focus:outline-none';

function Section({
  title,
  caption,
  comingSoon,
  children,
}: {
  title: string;
  caption?: string;
  comingSoon?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-4 rounded-card border border-border bg-white p-5 shadow-card md:p-6">
      <header className="flex items-center justify-between gap-3">
        <div>
          <h2 className="font-raleway text-lg font-bold text-navy md:text-xl">
            {title}
          </h2>
          {caption ? (
            <p className="mt-1 font-sans text-sm text-muted">{caption}</p>
          ) : null}
        </div>
        {comingSoon ? (
          <span className="shrink-0 rounded-input bg-amber/15 px-2 py-1 font-raleway text-[10px] font-bold uppercase tracking-btn text-navy">
            Coming Soon
          </span>
        ) : null}
      </header>
      {children}
    </section>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="font-raleway text-xs font-bold uppercase tracking-btn text-navy">
        {label}
      </span>
      {children}
      {hint ? (
        <span className="font-sans text-xs text-muted">{hint}</span>
      ) : null}
    </label>
  );
}
