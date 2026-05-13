'use client';

import { useState } from 'react';
import { Check, Copy, Hash, Lock, Smartphone, Truck, Wallet } from 'lucide-react';
import type { PaymentMethodId } from '@/lib/checkout-data';
import type {
  PaymentBankAccount,
  PaymentMethodConfig,
} from '@/lib/api/payment-methods';

/// Tracker #46 — every form on this page now reads from the API.
///
/// The card / mobile-money / USSD / crypto fields used to be
/// collected on this page and discarded — Squad's hosted checkout
/// captures the real details after redirect. They've been replaced
/// with a short notice so the customer understands what happens
/// next and isn't confused by data-entry that goes nowhere.
///
/// Bank-transfer + pay-on-delivery are the only methods that keep
/// real on-page content because the displayed values are
/// load-bearing (the customer literally has to transfer to the
/// displayed account number) — both now driven by admin config.

interface Props {
  method: PaymentMethodId;
  total: number;
  config: PaymentMethodConfig | null;
  bankAccounts: PaymentBankAccount[];
}

export function PaymentMethodForm({ method, total, config, bankAccounts }: Props) {
  switch (method) {
    case 'card':
      return <GatewayRedirectNotice label="card" />;
    case 'mobile-money':
      return <GatewayRedirectNotice label="mobile money" />;
    case 'bank-transfer':
      return <BankTransferDetails total={total} accounts={bankAccounts} />;
    case 'ussd':
      return <UssdInstructions total={total} config={config} />;
    case 'crypto':
      return <CryptoPayment config={config} />;
    case 'pay-on-delivery':
      return <PayOnDeliveryConfirm config={config} />;
    default:
      return null;
  }
}

/// Replaces the old CardForm / MobileMoneyForm — card / mobile-money
/// fields are collected by Squad on the next page, not us.
function GatewayRedirectNotice({ label }: { label: string }) {
  return (
    <div className="flex items-start gap-3 rounded-card border-2 border-navy/15 bg-navy/5 p-4">
      <Lock size={20} className="mt-0.5 shrink-0 text-navy" aria-hidden />
      <div className="flex flex-col gap-1">
        <p className="font-raleway text-sm font-bold text-navy">
          You&apos;ll enter your {label} details on the next screen
        </p>
        <p className="font-sans text-xs leading-relaxed text-charcoal">
          When you tap Pay, we&apos;ll send you to our secure payment partner
          to complete this {label} payment. Your details never touch our
          servers.
        </p>
      </div>
    </div>
  );
}

function BankTransferDetails({
  total,
  accounts,
}: {
  total: number;
  accounts: PaymentBankAccount[];
}) {
  const reference = `AZM-${Date.now().toString().slice(-8)}`;
  if (accounts.length === 0) {
    return (
      <div className="rounded-card border border-amber bg-amber/10 p-4 font-sans text-sm text-charcoal">
        Bank transfer isn&apos;t fully configured yet. Please pick another
        payment method, or contact support.
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-3">
      {accounts.map((acc) => (
        <div key={acc.id} className="rounded-card border border-border bg-page p-4">
          <p className="mb-3 font-raleway text-sm font-bold text-navy">
            Transfer to this account
          </p>
          <dl className="flex flex-col gap-2.5">
            <Row label="Bank" value={acc.bankName} />
            <Row label="Account Name" value={acc.accountName} />
            <Row label="Account Number" value={acc.accountNumber} copyable />
            <Row
              label="Amount"
              value={`${acc.currency} ${total.toLocaleString()}`}
            />
            <Row label="Payment Reference" value={reference} copyable highlight />
            {acc.instructions ? (
              <p className="mt-1 font-sans text-xs leading-relaxed text-muted">
                {acc.instructions}
              </p>
            ) : null}
          </dl>
        </div>
      ))}
      <p className="font-sans text-xs text-muted">
        ⚠️ Use the exact reference above so we can match your transfer to this order automatically.
      </p>
    </div>
  );
}

function UssdInstructions({
  total,
  config,
}: {
  total: number;
  config: PaymentMethodConfig | null;
}) {
  const codes =
    (config?.details?.codes as Record<string, string> | undefined) ?? {};
  const banks = Object.keys(codes);
  const [bank, setBank] = useState(banks[0] ?? '');
  const codeTemplate = bank ? codes[bank] : null;
  const code = codeTemplate?.replace('[Amount]', total.toString()) ?? null;

  if (banks.length === 0) {
    return (
      <div className="rounded-card border border-amber bg-amber/10 p-4 font-sans text-sm text-charcoal">
        No USSD codes configured. Try Bank Transfer or Card instead.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <label className="flex flex-col gap-1.5">
        <span className="font-raleway text-xs font-bold uppercase tracking-btn text-navy">
          Your Bank
          <span className="text-danger"> *</span>
        </span>
        <select
          value={bank}
          onChange={(e) => setBank(e.target.value)}
          className="w-full rounded-input border border-border bg-white px-3 py-2.5 font-sans text-sm text-charcoal placeholder:text-muted focus:border-navy focus:outline-none cursor-pointer"
        >
          {banks.map((b) => (
            <option key={b}>{b}</option>
          ))}
        </select>
      </label>

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
      ) : null}
    </div>
  );
}

interface CryptoWallet {
  coin: string;
  address: string;
  label?: string;
}

function CryptoPayment({ config }: { config: PaymentMethodConfig | null }) {
  const wallets =
    (config?.details?.wallets as CryptoWallet[] | undefined) ?? [];
  const [coin, setCoin] = useState<string>(wallets[0]?.coin ?? '');
  const selected = wallets.find((w) => w.coin === coin) ?? wallets[0] ?? null;

  if (wallets.length === 0) {
    return (
      <div className="rounded-card border border-amber bg-amber/10 p-4 font-sans text-sm text-charcoal">
        Crypto payments aren&apos;t available right now. Try another method.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <label className="flex flex-col gap-1.5">
        <span className="font-raleway text-xs font-bold uppercase tracking-btn text-navy">
          Cryptocurrency
          <span className="text-danger"> *</span>
        </span>
        <div
          className="grid gap-2"
          style={{ gridTemplateColumns: `repeat(${Math.min(wallets.length, 3)}, minmax(0, 1fr))` }}
        >
          {wallets.map((w) => (
            <button
              key={w.coin}
              type="button"
              onClick={() => setCoin(w.coin)}
              aria-pressed={coin === w.coin}
              className={`rounded-btn border-2 py-2 font-raleway text-xs font-bold uppercase tracking-btn transition-colors ${
                coin === w.coin
                  ? 'border-navy bg-navy text-white'
                  : 'border-border bg-white text-navy hover:border-navy'
              }`}
            >
              {w.coin}
            </button>
          ))}
        </div>
      </label>
      {selected ? (
        <label className="flex flex-col gap-1.5 md:col-span-2">
          <span className="font-raleway text-xs font-bold uppercase tracking-btn text-navy">
            Wallet Address (send to)
          </span>
          <Row value={selected.address} copyable />
        </label>
      ) : null}
      <p className="flex items-center gap-2 font-sans text-xs text-muted md:col-span-2">
        <Wallet size={14} aria-hidden />
        Send the exact total in {selected?.coin ?? 'crypto'}. We&apos;ll
        confirm 1 confirmation usually within 5 minutes.
      </p>
    </div>
  );
}

interface PayOnDeliveryDetails {
  feeNgn?: number;
  cities?: string[];
}

function PayOnDeliveryConfirm({ config }: { config: PaymentMethodConfig | null }) {
  const details = (config?.details as PayOnDeliveryDetails | undefined) ?? {};
  const cities = details.cities ?? [];
  const fee = details.feeNgn ?? 0;
  return (
    <div className="rounded-card border-2 border-success/30 bg-success/10 p-5">
      <div className="mb-2 flex items-center gap-2">
        <Truck size={20} className="text-success" aria-hidden />
        <p className="font-raleway text-base font-bold text-success">
          Pay on Delivery selected
        </p>
      </div>
      <p className="font-sans text-sm leading-relaxed text-charcoal">
        Our courier will collect payment in cash or by card terminal at delivery.
        {cities.length > 0
          ? ` Available within ${cities.join(', ')}.`
          : ''}
        {fee > 0
          ? ` A small NGN${fee.toLocaleString()} service fee applies.`
          : ''}
      </p>
    </div>
  );
}

/// Local Row helper — was previously shared with the old card form
/// that's been retired.
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
            aria-label={`Copy ${label ?? 'value'}`}
            className="flex h-7 w-7 items-center justify-center rounded-input bg-navy text-white transition-colors hover:bg-amber hover:text-navy"
          >
            {copied ? <Check size={12} aria-hidden /> : <Copy size={12} aria-hidden />}
          </button>
        ) : null}
      </div>
    </div>
  );
}

// Suppress unused warning if Smartphone icon ever needed re-instated.
void Smartphone;
