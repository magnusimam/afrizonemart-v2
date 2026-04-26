'use client';

import { useState } from 'react';
import { Check, Copy, Hash, Smartphone, Wallet } from 'lucide-react';
import {
  COUNTRIES,
  COUNTRY_CODES,
  getCountry,
} from '@/lib/countries';
import {
  MOBILE_MONEY_PROVIDERS,
  NIGERIAN_BANKS,
  USSD_CODES,
  type PaymentMethodId,
} from '@/lib/checkout-data';

const inputClass =
  'w-full rounded-input border border-border bg-white px-3 py-2.5 font-sans text-sm text-charcoal placeholder:text-muted focus:border-navy focus:outline-none';

interface Props {
  method: PaymentMethodId;
  total: number;
}

export function PaymentMethodForm({ method, total }: Props) {
  switch (method) {
    case 'card':
      return <CardForm />;
    case 'mobile-money':
      return <MobileMoneyForm />;
    case 'bank-transfer':
      return <BankTransferDetails total={total} />;
    case 'ussd':
      return <UssdInstructions total={total} />;
    case 'crypto':
      return <CryptoPayment />;
    case 'pay-on-delivery':
      return <PayOnDeliveryConfirm />;
    default:
      return null;
  }
}

function CardForm() {
  const [number, setNumber] = useState('');
  const formatted = number
    .replace(/\D/g, '')
    .slice(0, 19)
    .replace(/(.{4})/g, '$1 ')
    .trim();

  const brand = detectCardBrand(number);

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <Field label="Card Number" required className="md:col-span-2">
        <div className="relative">
          <input
            required
            type="text"
            value={formatted}
            onChange={(e) => setNumber(e.target.value)}
            placeholder="1234 5678 9012 3456"
            inputMode="numeric"
            maxLength={23}
            className={inputClass}
          />
          {brand ? (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 rounded-input bg-navy/5 px-2 py-0.5 font-raleway text-[10px] font-bold uppercase tracking-btn text-navy">
              {brand}
            </span>
          ) : null}
        </div>
      </Field>
      <Field label="Cardholder Name" required>
        <input required type="text" placeholder="As shown on card" className={inputClass} autoComplete="cc-name" />
      </Field>
      <Field label="Expiry (MM/YY)" required>
        <input
          required
          type="text"
          placeholder="MM/YY"
          maxLength={5}
          className={inputClass}
          autoComplete="cc-exp"
        />
      </Field>
      <Field label="CVV" required>
        <input
          required
          type="text"
          placeholder="3-4 digits"
          maxLength={4}
          inputMode="numeric"
          className={inputClass}
          autoComplete="cc-csc"
        />
      </Field>
      <p className="font-sans text-xs text-muted md:col-span-2">
        🔒 Your card details are encrypted and processed securely. We never store your full card number.
      </p>
    </div>
  );
}

function detectCardBrand(num: string): string | null {
  const n = num.replace(/\D/g, '');
  if (!n) return null;
  if (n.startsWith('4')) return 'Visa';
  if (/^5[1-5]/.test(n) || /^2[2-7]/.test(n)) return 'Mastercard';
  if (/^3[47]/.test(n)) return 'Amex';
  if (n.startsWith('5061') || n.startsWith('6500')) return 'Verve';
  return null;
}

function MobileMoneyForm() {
  const [countryCode, setCountryCode] = useState<string>('NG');
  const country = getCountry(countryCode);
  const providers = MOBILE_MONEY_PROVIDERS.filter((p) =>
    p.countries.includes(countryCode as never),
  );
  const [provider, setProvider] = useState<string>(providers[0]?.code ?? '');

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <Field label="Country" required>
        <select
          required
          value={countryCode}
          onChange={(e) => {
            setCountryCode(e.target.value);
            const ps = MOBILE_MONEY_PROVIDERS.filter((p) =>
              p.countries.includes(e.target.value as never),
            );
            setProvider(ps[0]?.code ?? '');
          }}
          className={`${inputClass} cursor-pointer`}
        >
          {COUNTRY_CODES.filter((c) =>
            MOBILE_MONEY_PROVIDERS.some((p) => p.countries.includes(c)),
          ).map((c) => (
            <option key={c} value={c}>
              {COUNTRIES[c].flag} {COUNTRIES[c].name}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Provider" required>
        {providers.length > 0 ? (
          <select
            required
            value={provider}
            onChange={(e) => setProvider(e.target.value)}
            className={`${inputClass} cursor-pointer`}
          >
            {providers.map((p) => (
              <option key={p.code} value={p.code}>
                {p.name}
              </option>
            ))}
          </select>
        ) : (
          <input
            disabled
            placeholder="No mobile money providers in this country"
            className={inputClass}
          />
        )}
      </Field>
      <Field label="Phone Number" required className="md:col-span-2">
        <div className="flex gap-2">
          <span className="flex shrink-0 items-center gap-1 rounded-input border border-border bg-page px-3 font-sans text-sm">
            <span aria-hidden>{country?.flag}</span>
            <span className="text-charcoal">{country?.dial}</span>
          </span>
          <input
            required
            type="tel"
            placeholder="80 1234 5678"
            className={inputClass}
          />
        </div>
      </Field>
      <p className="flex items-center gap-2 font-sans text-xs text-muted md:col-span-2">
        <Smartphone size={14} aria-hidden />
        On submit you&apos;ll receive a payment prompt on your phone — approve to complete the order.
      </p>
    </div>
  );
}

function BankTransferDetails({ total }: { total: number }) {
  const reference = `AZM-${Date.now().toString().slice(-8)}`;
  return (
    <div className="flex flex-col gap-3">
      <div className="rounded-card border border-border bg-page p-4">
        <p className="mb-3 font-raleway text-sm font-bold text-navy">
          Transfer to this account
        </p>
        <dl className="flex flex-col gap-2.5">
          <Row label="Bank" value="GTBank" />
          <Row label="Account Name" value="Afrizonemart Distribution Ltd" />
          <Row label="Account Number" value="0123456789" copyable />
          <Row label="Amount" value={`NGN ${total.toLocaleString()}`} />
          <Row label="Payment Reference" value={reference} copyable highlight />
        </dl>
      </div>
      <p className="font-sans text-xs text-muted">
        ⚠️ Use the exact reference above so we can match your transfer to this order automatically.
      </p>
    </div>
  );
}

function UssdInstructions({ total }: { total: number }) {
  const [bank, setBank] = useState(NIGERIAN_BANKS[0]);
  const code = USSD_CODES[bank]?.replace('[Amount]', total.toString()) ?? null;

  return (
    <div className="flex flex-col gap-4">
      <Field label="Your Bank" required>
        <select
          required
          value={bank}
          onChange={(e) => setBank(e.target.value)}
          className={`${inputClass} cursor-pointer`}
        >
          {NIGERIAN_BANKS.map((b) => (
            <option key={b}>{b}</option>
          ))}
        </select>
      </Field>

      {code ? (
        <div className="rounded-card border-2 border-navy/20 bg-amber/15 p-4 text-center">
          <Hash size={28} className="mx-auto mb-2 text-navy" aria-hidden />
          <p className="font-raleway text-xs font-semibold uppercase tracking-btn text-navy">
            Dial this code on your registered phone:
          </p>
          <p className="my-2 font-raleway text-2xl font-bold text-navy md:text-3xl">
            {code}
          </p>
          <p className="font-sans text-xs text-muted">
            Then enter your PIN when prompted. We&apos;ll verify within 30 seconds.
          </p>
        </div>
      ) : (
        <p className="font-sans text-sm text-muted">
          USSD instructions for this bank are coming soon. Try Bank Transfer instead.
        </p>
      )}
    </div>
  );
}

function CryptoPayment() {
  const [coin, setCoin] = useState<'BTC' | 'USDT' | 'ETH'>('USDT');
  const addresses = {
    BTC: 'bc1q4afrizonemart7example8address9',
    USDT: '0x7Afri80zoneMart9Example4Address1Usdt',
    ETH: '0x7Afri80zoneMart9Example4Address1Eth0',
  };

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <Field label="Cryptocurrency" required>
        <div className="grid grid-cols-3 gap-2">
          {(['BTC', 'USDT', 'ETH'] as const).map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCoin(c)}
              aria-pressed={coin === c}
              className={`rounded-btn border-2 py-2 font-raleway text-xs font-bold uppercase tracking-btn transition-colors ${
                coin === c
                  ? 'border-navy bg-navy text-white'
                  : 'border-border bg-white text-navy hover:border-navy'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </Field>
      <Field label="Wallet Address (send to)" className="md:col-span-2">
        <Row value={addresses[coin]} copyable label="" />
      </Field>
      <p className="flex items-center gap-2 font-sans text-xs text-muted md:col-span-2">
        <Wallet size={14} aria-hidden />
        Send the exact total in {coin}. We&apos;ll confirm 1 confirmation usually within 5 minutes.
      </p>
    </div>
  );
}

function PayOnDeliveryConfirm() {
  return (
    <div className="rounded-card border-2 border-success/30 bg-success/10 p-5">
      <div className="mb-2 flex items-center gap-2">
        <Check size={20} className="text-success" aria-hidden />
        <p className="font-raleway text-base font-bold text-success">
          Pay on Delivery selected
        </p>
      </div>
      <p className="font-sans text-sm leading-relaxed text-charcoal">
        Our courier will collect payment in cash or by card terminal at delivery. Available within Lagos, Nairobi, and Accra. A small NGN500 service fee applies.
      </p>
    </div>
  );
}

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
      {label ? (
        <span className="font-raleway text-xs font-bold uppercase tracking-btn text-navy">
          {label}
          {required ? <span className="text-danger"> *</span> : null}
        </span>
      ) : null}
      {children}
    </label>
  );
}

function Row({
  label,
  value,
  copyable = false,
  highlight = false,
}: {
  label?: string;
  value: string;
  copyable?: boolean;
  highlight?: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard not available */
    }
  };

  return (
    <div className="flex items-center justify-between gap-3">
      {label ? (
        <dt className="font-sans text-xs text-muted">{label}</dt>
      ) : null}
      <div
        className={`flex items-center gap-2 rounded-input ${
          highlight ? 'bg-amber/30 px-2.5 py-1' : ''
        }`}
      >
        <dd className="break-all font-raleway text-sm font-bold text-navy">
          {value}
        </dd>
        {copyable ? (
          <button
            type="button"
            onClick={handleCopy}
            aria-label={`Copy ${label}`}
            className="flex h-7 w-7 items-center justify-center rounded-input bg-navy text-white transition-colors hover:bg-amber hover:text-navy"
          >
            {copied ? <Check size={12} aria-hidden /> : <Copy size={12} aria-hidden />}
          </button>
        ) : null}
      </div>
    </div>
  );
}
