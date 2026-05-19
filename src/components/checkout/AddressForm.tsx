'use client';

import { useState } from 'react';
import { COUNTRIES, COUNTRY_CODES, getCountry } from '@/lib/countries';
import { COUNTRY_REGIONS } from '@/lib/checkout-data';
import type { ShippingAddress } from '@/stores/checkoutStore';

interface AddressFormProps {
  initial?: Partial<ShippingAddress>;
  onChange: (address: ShippingAddress) => void;
}

export function AddressForm({ initial, onChange }: AddressFormProps) {
  const [form, setForm] = useState<ShippingAddress>({
    firstName: initial?.firstName ?? '',
    lastName: initial?.lastName ?? '',
    email: initial?.email ?? '',
    phone: initial?.phone ?? '',
    country: initial?.country ?? 'NG',
    region: initial?.region ?? '',
    city: initial?.city ?? '',
    street: initial?.street ?? '',
    apartment: initial?.apartment ?? '',
    postalCode: initial?.postalCode ?? '',
    instructions: initial?.instructions ?? '',
  });

  const country = getCountry(form.country);
  const regions = COUNTRY_REGIONS[form.country as keyof typeof COUNTRY_REGIONS];

  const update = <K extends keyof ShippingAddress>(key: K, value: ShippingAddress[K]) => {
    const next = { ...form, [key]: value };
    setForm(next);
    onChange(next);
  };

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <Field label="First Name" required>
        <input
          required
          type="text"
          value={form.firstName}
          onChange={(e) => update('firstName', e.target.value)}
          className={inputClass}
          autoComplete="given-name"
        />
      </Field>
      <Field label="Last Name" required>
        <input
          required
          type="text"
          value={form.lastName}
          onChange={(e) => update('lastName', e.target.value)}
          className={inputClass}
          autoComplete="family-name"
        />
      </Field>

      <Field label="Email" required>
        <input
          required
          type="email"
          value={form.email}
          onChange={(e) => update('email', e.target.value)}
          className={inputClass}
          autoComplete="email"
          inputMode="email"
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck={false}
          enterKeyHint="next"
        />
      </Field>

      <Field label="Phone" required>
        <div className="flex gap-2">
          <span className="flex shrink-0 items-center gap-1 rounded-input border border-border bg-page px-3 font-sans text-sm">
            <span aria-hidden>{country?.flag}</span>
            <span className="text-charcoal">{country?.dial}</span>
          </span>
          <input
            required
            type="tel"
            value={form.phone}
            onChange={(e) => update('phone', e.target.value.replace(/[^\d ]/g, ''))}
            placeholder="80 1234 5678"
            className={inputClass}
            autoComplete="tel"
            inputMode="tel"
            enterKeyHint="next"
          />
        </div>
      </Field>

      <Field label="Country" required className="md:col-span-2">
        <select
          required
          value={form.country}
          onChange={(e) => {
            update('country', e.target.value);
            update('region', '');
          }}
          className={`${inputClass} cursor-pointer`}
          autoComplete="country"
        >
          {COUNTRY_CODES.map((code) => {
            const c = COUNTRIES[code];
            return (
              <option key={code} value={code}>
                {c.flag} {c.name} ({c.dial})
              </option>
            );
          })}
        </select>
      </Field>

      <Field label={regions ? 'State / Region' : 'Region'} required>
        {regions ? (
          <select
            required
            value={form.region}
            onChange={(e) => update('region', e.target.value)}
            className={`${inputClass} cursor-pointer`}
          >
            <option value="" disabled>
              Select a region
            </option>
            {regions.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        ) : (
          <input
            required
            type="text"
            value={form.region}
            onChange={(e) => update('region', e.target.value)}
            className={inputClass}
            placeholder="State / Region"
          />
        )}
      </Field>

      <Field label="City" required>
        <input
          required
          type="text"
          value={form.city}
          onChange={(e) => update('city', e.target.value)}
          className={inputClass}
          autoComplete="address-level2"
        />
      </Field>

      <Field label="Street Address" required className="md:col-span-2">
        <input
          required
          type="text"
          value={form.street}
          onChange={(e) => update('street', e.target.value)}
          className={inputClass}
          placeholder="House / building number and street name"
          autoComplete="street-address"
        />
      </Field>

      <Field label="Apartment / Suite (optional)">
        <input
          type="text"
          value={form.apartment ?? ''}
          onChange={(e) => update('apartment', e.target.value)}
          className={inputClass}
        />
      </Field>

      <Field label="Postal Code (optional)">
        <input
          type="text"
          value={form.postalCode ?? ''}
          onChange={(e) => update('postalCode', e.target.value)}
          className={inputClass}
          autoComplete="postal-code"
          inputMode="numeric"
        />
      </Field>

      <Field label="Delivery Instructions (optional)" className="md:col-span-2">
        <textarea
          rows={2}
          value={form.instructions ?? ''}
          onChange={(e) => update('instructions', e.target.value)}
          className={inputClass}
          placeholder="Gate code, landmark, leave-with-security, etc."
        />
      </Field>
    </div>
  );
}

/// Inputs are `text-base` (16px) on mobile to suppress iOS Safari's
/// zoom-on-focus, then back down to text-sm at md:+. min-h-[44px]
/// puts every input on the touch-target floor regardless of vertical
/// padding/line-height drift. The same class is reused by every
/// input + select + textarea on the form for consistency.
const inputClass =
  'w-full min-h-[44px] rounded-input border border-border bg-white px-3 py-2.5 font-sans text-base text-charcoal placeholder:text-muted focus:border-navy focus:outline-none md:text-sm';

function Field({
  label,
  required,
  className = '',
  children,
}: {
  label: string;
  required?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <label className={`flex flex-col gap-1.5 ${className}`}>
      <span className="font-raleway text-xs font-bold uppercase tracking-btn text-navy">
        {label}
        {required ? <span className="text-danger"> *</span> : null}
      </span>
      {children}
    </label>
  );
}
