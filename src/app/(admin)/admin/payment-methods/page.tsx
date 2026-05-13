'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { Plus, Save, Trash2, X } from 'lucide-react';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { toast } from '@/components/admin/Toast';
import {
  adminCreatePaymentBankAccount,
  adminDeletePaymentBankAccount,
  adminListPaymentBankAccounts,
  adminListPaymentMethods,
  adminUpdatePaymentBankAccount,
  adminUpdatePaymentMethod,
  type AdminPaymentBankAccount,
  type AdminPaymentBankAccountInput,
  type AdminPaymentMethod,
  type AdminPaymentMethodCode,
  type AdminPaymentMethodUpdate,
} from '@/lib/api/admin';

/// Tracker #46 — single page that owns both halves of the
/// customer-facing payment config:
///
///   1. Methods list — toggle each method on/off, edit copy +
///      per-method `details` JSON (USSD codes, crypto wallets,
///      mobile-money providers, POD cities/fee).
///   2. Bank Accounts — separate CRUD for the rows shown to bank
///      transfer customers, one per currency / country.

const CURRENCIES = [
  'NGN', 'GHS', 'KES', 'UGX', 'TZS', 'ZAR', 'RWF', 'ZMW',
  'XAF', 'XOF',
  'USD', 'EUR', 'GBP',
];

export default function AdminPaymentMethodsPage() {
  const [methods, setMethods] = useState<AdminPaymentMethod[]>([]);
  const [accounts, setAccounts] = useState<AdminPaymentBankAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<AdminPaymentMethod | null>(null);
  const [editingAccount, setEditingAccount] = useState<AdminPaymentBankAccount | null>(null);
  const [showAccountForm, setShowAccountForm] = useState(false);
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void (async () => {
      try {
        const [m, a] = await Promise.all([
          adminListPaymentMethods(),
          adminListPaymentBankAccounts(),
        ]);
        if (!cancelled) {
          setMethods(m.items);
          setAccounts(a.items);
        }
      } catch (e) {
        if (!cancelled) toast(e instanceof Error ? e.message : 'Failed to load', 'error');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [refresh]);

  const toggleActive = async (m: AdminPaymentMethod) => {
    try {
      await adminUpdatePaymentMethod(m.id, {
        label: m.label,
        description: m.description,
        icon: m.icon,
        isActive: !m.isActive,
        isPopular: m.isPopular,
        sortOrder: m.sortOrder,
        details: m.details,
      });
      setRefresh((k) => k + 1);
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Toggle failed', 'error');
    }
  };

  const togglePopular = async (m: AdminPaymentMethod) => {
    try {
      await adminUpdatePaymentMethod(m.id, {
        label: m.label,
        description: m.description,
        icon: m.icon,
        isActive: m.isActive,
        isPopular: !m.isPopular,
        sortOrder: m.sortOrder,
        details: m.details,
      });
      setRefresh((k) => k + 1);
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Toggle failed', 'error');
    }
  };

  const deleteAccount = async (a: AdminPaymentBankAccount) => {
    if (!confirm(`Delete the ${a.bankName} (${a.accountNumber}) account?`)) return;
    try {
      await adminDeletePaymentBankAccount(a.id);
      toast('Account removed', 'success');
      setRefresh((k) => k + 1);
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Delete failed', 'error');
    }
  };

  return (
    <div className="px-8 py-10">
      <AdminPageHeader
        title="Payment methods"
        subtitle="Manage the payment options customers see at checkout, plus the bank accounts they're shown for bank transfers."
      />

      <section className="mb-10">
        <h2 className="mb-3 font-raleway text-base font-bold text-navy">Methods</h2>
        {loading ? (
          <p className="font-sans text-sm text-muted">Loading…</p>
        ) : (
          <div className="overflow-x-auto rounded-card border border-border bg-white shadow-card">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-page">
                  <Th>Method</Th>
                  <Th>Description</Th>
                  <Th align="center">Popular</Th>
                  <Th align="center">Active</Th>
                  <Th align="right">Sort</Th>
                  <Th></Th>
                </tr>
              </thead>
              <tbody>
                {methods.map((m) => (
                  <tr key={m.id} className="border-b border-border last:border-0">
                    <Td>
                      <div className="flex flex-col leading-tight">
                        <span className="font-raleway text-sm font-bold text-navy">
                          {m.label}
                        </span>
                        <span className="font-mono text-[10px] text-muted">{m.code}</span>
                      </div>
                    </Td>
                    <Td>
                      <span className="font-sans text-xs text-charcoal">{m.description}</span>
                    </Td>
                    <Td align="center">
                      <Toggle
                        on={m.isPopular}
                        onClick={() => togglePopular(m)}
                        label="Popular"
                      />
                    </Td>
                    <Td align="center">
                      <Toggle
                        on={m.isActive}
                        onClick={() => toggleActive(m)}
                        label="Active"
                      />
                    </Td>
                    <Td align="right">
                      <span className="font-mono text-xs text-muted">{m.sortOrder}</span>
                    </Td>
                    <Td align="right">
                      <button
                        type="button"
                        onClick={() => setEditing(m)}
                        className="rounded-btn border border-navy bg-white px-3 py-1.5 font-raleway text-[10px] font-bold uppercase tracking-btn text-navy hover:bg-navy hover:text-white"
                      >
                        Edit
                      </button>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-raleway text-base font-bold text-navy">Bank accounts</h2>
          <button
            type="button"
            onClick={() => {
              setEditingAccount(null);
              setShowAccountForm(true);
            }}
            className="flex items-center gap-2 rounded-btn bg-navy px-4 py-2 font-raleway text-xs font-bold uppercase tracking-btn text-white shadow-card hover:bg-amber hover:text-navy"
          >
            <Plus size={14} aria-hidden />
            New account
          </button>
        </div>
        {accounts.length === 0 ? (
          <p className="rounded-card border border-amber bg-amber/10 p-4 font-sans text-sm text-charcoal">
            No bank accounts yet. Customers who pick Bank Transfer at checkout will
            see a placeholder. Add one with the button above.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-card border border-border bg-white shadow-card">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-page">
                  <Th>Bank</Th>
                  <Th>Account name</Th>
                  <Th>Account no.</Th>
                  <Th align="center">Currency</Th>
                  <Th align="center">Country</Th>
                  <Th align="center">Active</Th>
                  <Th></Th>
                </tr>
              </thead>
              <tbody>
                {accounts.map((a) => (
                  <tr key={a.id} className="border-b border-border last:border-0">
                    <Td>
                      <span className="font-raleway text-sm font-semibold text-navy">
                        {a.bankName}
                      </span>
                    </Td>
                    <Td>
                      <span className="font-sans text-xs text-charcoal">{a.accountName}</span>
                    </Td>
                    <Td>
                      <span className="font-mono text-xs text-charcoal">{a.accountNumber}</span>
                    </Td>
                    <Td align="center">
                      <span className="font-mono text-xs text-charcoal">{a.currency}</span>
                    </Td>
                    <Td align="center">
                      <span className="font-mono text-xs text-muted">{a.country ?? '—'}</span>
                    </Td>
                    <Td align="center">
                      <span className={`inline-flex rounded-full border px-2 py-0.5 font-raleway text-[10px] font-bold uppercase tracking-btn ${a.isActive ? 'border-success/30 bg-success/10 text-success' : 'border-muted/30 bg-muted/10 text-muted'}`}>
                        {a.isActive ? 'On' : 'Off'}
                      </span>
                    </Td>
                    <Td align="right">
                      <div className="flex justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingAccount(a);
                            setShowAccountForm(true);
                          }}
                          className="rounded-btn border border-navy bg-white px-3 py-1.5 font-raleway text-[10px] font-bold uppercase tracking-btn text-navy hover:bg-navy hover:text-white"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteAccount(a)}
                          className="rounded p-1 text-muted hover:bg-danger/10 hover:text-danger"
                          aria-label="Delete account"
                        >
                          <Trash2 size={14} aria-hidden />
                        </button>
                      </div>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {editing && (
        <MethodEditDialog
          method={editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            setRefresh((k) => k + 1);
          }}
        />
      )}

      {showAccountForm && (
        <BankAccountFormDialog
          editing={editingAccount}
          onClose={() => {
            setShowAccountForm(false);
            setEditingAccount(null);
          }}
          onSaved={() => {
            setShowAccountForm(false);
            setEditingAccount(null);
            setRefresh((k) => k + 1);
          }}
        />
      )}
    </div>
  );
}

function Th({ children, align = 'left' }: { children?: React.ReactNode; align?: 'left' | 'right' | 'center' }) {
  return (
    <th
      className={`px-4 py-2.5 font-raleway text-[10px] font-bold uppercase tracking-btn text-muted ${align === 'right' ? 'text-right' : align === 'center' ? 'text-center' : 'text-left'}`}
    >
      {children}
    </th>
  );
}

function Td({ children, align = 'left' }: { children?: React.ReactNode; align?: 'left' | 'right' | 'center' }) {
  return (
    <td
      className={`px-4 py-3 ${align === 'right' ? 'text-right' : align === 'center' ? 'text-center' : 'text-left'}`}
    >
      {children}
    </td>
  );
}

function Toggle({ on, onClick, label }: { on: boolean; onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={on}
      aria-label={`Toggle ${label}`}
      className={`inline-flex h-5 w-9 cursor-pointer items-center rounded-full border-2 transition-colors ${
        on ? 'border-success/40 bg-success/20' : 'border-muted/30 bg-muted/10'
      }`}
    >
      <span
        className={`block h-3 w-3 rounded-full transition-transform ${
          on ? 'translate-x-4 bg-success' : 'translate-x-1 bg-muted'
        }`}
      />
    </button>
  );
}

// -----------------------------------------------------------------
// Per-method editor — knows how to render type-specific details
// (USSD codes, crypto wallets, mobile-money providers, POD details).
// -----------------------------------------------------------------

function MethodEditDialog({
  method,
  onClose,
  onSaved,
}: {
  method: AdminPaymentMethod;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [label, setLabel] = useState(method.label);
  const [description, setDescription] = useState(method.description);
  const [sortOrder, setSortOrder] = useState(method.sortOrder);
  const [isActive, setIsActive] = useState(method.isActive);
  const [isPopular, setIsPopular] = useState(method.isPopular);
  const [details, setDetails] = useState<Record<string, unknown>>(method.details);
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErr(null);
    try {
      const body: AdminPaymentMethodUpdate = {
        label,
        description,
        icon: method.icon,
        isActive,
        isPopular,
        sortOrder,
        details,
      };
      await adminUpdatePaymentMethod(method.id, body);
      toast('Method updated', 'success');
      onSaved();
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog title={`Edit ${method.label}`} onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-6">
        <Field label="Label">
          <input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            required
            className={inputClass}
          />
        </Field>
        <Field label="Description (shown under the method card)">
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            rows={2}
            className={inputClass}
          />
        </Field>
        <div className="grid grid-cols-3 gap-3">
          <Field label="Sort order">
            <input
              type="number"
              value={sortOrder}
              onChange={(e) => setSortOrder(Number(e.target.value))}
              className={inputClass}
            />
          </Field>
          <Field label="Active">
            <select
              value={isActive ? 'on' : 'off'}
              onChange={(e) => setIsActive(e.target.value === 'on')}
              className={inputClass}
            >
              <option value="on">On</option>
              <option value="off">Off</option>
            </select>
          </Field>
          <Field label="Popular badge">
            <select
              value={isPopular ? 'on' : 'off'}
              onChange={(e) => setIsPopular(e.target.value === 'on')}
              className={inputClass}
            >
              <option value="on">On</option>
              <option value="off">Off</option>
            </select>
          </Field>
        </div>

        <MethodDetailsEditor
          code={method.code}
          details={details}
          onChange={setDetails}
        />

        {err && (
          <p role="alert" className="rounded border border-danger/30 bg-danger/5 px-3 py-2 font-sans text-xs text-danger">
            {err}
          </p>
        )}

        <div className="mt-2 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-btn border border-border bg-white px-4 py-2 font-raleway text-xs font-bold uppercase tracking-btn text-charcoal hover:bg-page"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="flex items-center gap-2 rounded-btn bg-navy px-4 py-2 font-raleway text-xs font-bold uppercase tracking-btn text-white hover:bg-amber hover:text-navy disabled:opacity-50"
          >
            <Save size={12} aria-hidden />
            {submitting ? 'Saving…' : 'Save'}
          </button>
        </div>
      </form>
    </Dialog>
  );
}

function MethodDetailsEditor({
  code,
  details,
  onChange,
}: {
  code: AdminPaymentMethodCode;
  details: Record<string, unknown>;
  onChange: (d: Record<string, unknown>) => void;
}) {
  if (code === 'USSD') {
    const codes = (details.codes as Record<string, string> | undefined) ?? {};
    const banks = Object.keys(codes);
    return (
      <div className="rounded border border-border bg-page p-4">
        <p className="mb-2 font-raleway text-xs font-bold uppercase tracking-btn text-navy">
          USSD codes
        </p>
        <p className="mb-3 font-sans text-xs text-muted">
          Use <code>[Amount]</code> as a placeholder — it&apos;s replaced with the order
          total at checkout.
        </p>
        {banks.map((bank) => (
          <div key={bank} className="mb-2 flex gap-2">
            <input
              value={bank}
              onChange={(e) => {
                const nv = { ...codes };
                const val = nv[bank];
                delete nv[bank];
                nv[e.target.value] = val;
                onChange({ ...details, codes: nv });
              }}
              className={`${inputClass} flex-1`}
              placeholder="Bank"
            />
            <input
              value={codes[bank]}
              onChange={(e) =>
                onChange({ ...details, codes: { ...codes, [bank]: e.target.value } })
              }
              className={`${inputClass} flex-1`}
              placeholder="*XXX*000*[Amount]#"
            />
            <button
              type="button"
              onClick={() => {
                const nv = { ...codes };
                delete nv[bank];
                onChange({ ...details, codes: nv });
              }}
              className="rounded p-2 text-muted hover:bg-danger/10 hover:text-danger"
              aria-label="Remove"
            >
              <X size={14} aria-hidden />
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() =>
            onChange({ ...details, codes: { ...codes, 'New Bank': '*000*000*[Amount]#' } })
          }
          className="mt-1 flex items-center gap-1 rounded-btn border border-navy bg-white px-3 py-1.5 font-raleway text-[10px] font-bold uppercase tracking-btn text-navy hover:bg-navy hover:text-white"
        >
          <Plus size={12} aria-hidden />
          Add bank
        </button>
      </div>
    );
  }

  if (code === 'CRYPTO') {
    const wallets =
      (details.wallets as Array<{ coin: string; address: string; label?: string }> | undefined) ??
      [];
    return (
      <div className="rounded border border-border bg-page p-4">
        <p className="mb-3 font-raleway text-xs font-bold uppercase tracking-btn text-navy">
          Wallets
        </p>
        {wallets.map((w, i) => (
          <div key={i} className="mb-2 grid grid-cols-3 gap-2">
            <input
              value={w.coin}
              onChange={(e) => {
                const next = wallets.slice();
                next[i] = { ...w, coin: e.target.value.toUpperCase() };
                onChange({ ...details, wallets: next });
              }}
              className={inputClass}
              placeholder="BTC"
            />
            <input
              value={w.address}
              onChange={(e) => {
                const next = wallets.slice();
                next[i] = { ...w, address: e.target.value };
                onChange({ ...details, wallets: next });
              }}
              className={`${inputClass} col-span-2`}
              placeholder="Wallet address"
            />
            <button
              type="button"
              onClick={() => {
                const next = wallets.filter((_, k) => k !== i);
                onChange({ ...details, wallets: next });
              }}
              className="col-span-3 self-start rounded p-1 text-muted hover:bg-danger/10 hover:text-danger"
              aria-label="Remove"
            >
              <X size={14} aria-hidden />
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() =>
            onChange({ ...details, wallets: [...wallets, { coin: 'BTC', address: '' }] })
          }
          className="mt-1 flex items-center gap-1 rounded-btn border border-navy bg-white px-3 py-1.5 font-raleway text-[10px] font-bold uppercase tracking-btn text-navy hover:bg-navy hover:text-white"
        >
          <Plus size={12} aria-hidden />
          Add wallet
        </button>
      </div>
    );
  }

  if (code === 'PAY_ON_DELIVERY') {
    const fee = (details.feeNgn as number | undefined) ?? 0;
    const cities = (details.cities as string[] | undefined) ?? [];
    return (
      <div className="grid grid-cols-2 gap-3 rounded border border-border bg-page p-4">
        <Field label="Service fee (NGN)">
          <input
            type="number"
            value={fee}
            onChange={(e) => onChange({ ...details, feeNgn: Number(e.target.value) })}
            className={inputClass}
          />
        </Field>
        <Field label="Available cities (comma-separated)">
          <input
            value={cities.join(', ')}
            onChange={(e) =>
              onChange({
                ...details,
                cities: e.target.value.split(',').map((s) => s.trim()).filter(Boolean),
              })
            }
            className={inputClass}
            placeholder="Lagos, Nairobi, Accra"
          />
        </Field>
      </div>
    );
  }

  if (code === 'MOBILE_MONEY') {
    const providers =
      (details.providers as Array<{ code: string; name: string; countries: string[] }> | undefined) ??
      [];
    return (
      <div className="rounded border border-border bg-page p-4">
        <p className="mb-3 font-raleway text-xs font-bold uppercase tracking-btn text-navy">
          Mobile-money providers (display-only — Squad handles the actual flow)
        </p>
        {providers.map((p, i) => (
          <div key={i} className="mb-2 grid grid-cols-3 gap-2">
            <input
              value={p.name}
              onChange={(e) => {
                const next = providers.slice();
                next[i] = { ...p, name: e.target.value };
                onChange({ ...details, providers: next });
              }}
              className={inputClass}
              placeholder="M-Pesa"
            />
            <input
              value={p.code}
              onChange={(e) => {
                const next = providers.slice();
                next[i] = { ...p, code: e.target.value };
                onChange({ ...details, providers: next });
              }}
              className={inputClass}
              placeholder="mpesa"
            />
            <input
              value={p.countries.join(',')}
              onChange={(e) => {
                const next = providers.slice();
                next[i] = {
                  ...p,
                  countries: e.target.value
                    .split(',')
                    .map((s) => s.trim().toUpperCase())
                    .filter(Boolean),
                };
                onChange({ ...details, providers: next });
              }}
              className={inputClass}
              placeholder="KE,TZ,UG"
            />
          </div>
        ))}
        <button
          type="button"
          onClick={() =>
            onChange({
              ...details,
              providers: [...providers, { code: '', name: '', countries: [] }],
            })
          }
          className="mt-1 flex items-center gap-1 rounded-btn border border-navy bg-white px-3 py-1.5 font-raleway text-[10px] font-bold uppercase tracking-btn text-navy hover:bg-navy hover:text-white"
        >
          <Plus size={12} aria-hidden />
          Add provider
        </button>
      </div>
    );
  }

  // CARD + BANK_TRANSFER — nothing per-method-specific here.
  // Bank transfer details live in the separate Bank Accounts section.
  return (
    <p className="rounded border border-border bg-page p-3 font-sans text-xs text-muted">
      No per-method details for this type.
      {code === 'BANK_TRANSFER'
        ? ' Manage bank accounts in the section below.'
        : code === 'CARD'
          ? ' Card details are collected by Squad on the redirect page.'
          : ''}
    </p>
  );
}

// -----------------------------------------------------------------
// Bank account create / edit form
// -----------------------------------------------------------------

function BankAccountFormDialog({
  editing,
  onClose,
  onSaved,
}: {
  editing: AdminPaymentBankAccount | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [bankName, setBankName] = useState(editing?.bankName ?? '');
  const [accountName, setAccountName] = useState(editing?.accountName ?? '');
  const [accountNumber, setAccountNumber] = useState(editing?.accountNumber ?? '');
  const [currency, setCurrency] = useState(editing?.currency ?? 'NGN');
  const [country, setCountry] = useState(editing?.country ?? '');
  const [instructions, setInstructions] = useState(editing?.instructions ?? '');
  const [isActive, setIsActive] = useState(editing?.isActive ?? true);
  const [sortOrder, setSortOrder] = useState(editing?.sortOrder ?? 0);
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErr(null);
    try {
      const body: AdminPaymentBankAccountInput = {
        bankName,
        accountName,
        accountNumber,
        currency: currency.toUpperCase(),
        country: country ? country.toUpperCase() : null,
        instructions: instructions || null,
        isActive,
        sortOrder,
      };
      if (editing) {
        await adminUpdatePaymentBankAccount(editing.id, body);
        toast('Account updated', 'success');
      } else {
        await adminCreatePaymentBankAccount(body);
        toast('Account added', 'success');
      }
      onSaved();
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog title={editing ? 'Edit bank account' : 'New bank account'} onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-6">
        <Field label="Bank">
          <input
            value={bankName}
            onChange={(e) => setBankName(e.target.value)}
            required
            className={inputClass}
            placeholder="GTBank"
          />
        </Field>
        <Field label="Account name">
          <input
            value={accountName}
            onChange={(e) => setAccountName(e.target.value)}
            required
            className={inputClass}
            placeholder="Afrizonemart Distribution Ltd"
          />
        </Field>
        <Field label="Account number">
          <input
            value={accountNumber}
            onChange={(e) => setAccountNumber(e.target.value)}
            required
            className={inputClass}
            placeholder="0123456789"
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Currency">
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className={inputClass}
            >
              {CURRENCIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </Field>
          <Field label="Country (optional, ISO-2)">
            <input
              value={country}
              maxLength={2}
              onChange={(e) => setCountry(e.target.value.toUpperCase())}
              className={inputClass}
              placeholder="NG"
            />
          </Field>
        </div>
        <Field label="Notes (shown under the account details)">
          <textarea
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            rows={2}
            className={inputClass}
            placeholder="Optional: swift code, sort code, transfer notes…"
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Active">
            <select
              value={isActive ? 'on' : 'off'}
              onChange={(e) => setIsActive(e.target.value === 'on')}
              className={inputClass}
            >
              <option value="on">On</option>
              <option value="off">Off</option>
            </select>
          </Field>
          <Field label="Sort order">
            <input
              type="number"
              value={sortOrder}
              onChange={(e) => setSortOrder(Number(e.target.value))}
              className={inputClass}
            />
          </Field>
        </div>

        {err && (
          <p role="alert" className="rounded border border-danger/30 bg-danger/5 px-3 py-2 font-sans text-xs text-danger">
            {err}
          </p>
        )}

        <div className="mt-2 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-btn border border-border bg-white px-4 py-2 font-raleway text-xs font-bold uppercase tracking-btn text-charcoal hover:bg-page"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="flex items-center gap-2 rounded-btn bg-navy px-4 py-2 font-raleway text-xs font-bold uppercase tracking-btn text-white hover:bg-amber hover:text-navy disabled:opacity-50"
          >
            <Save size={12} aria-hidden />
            {submitting ? 'Saving…' : 'Save'}
          </button>
        </div>
      </form>
    </Dialog>
  );
}

// -----------------------------------------------------------------
// Tiny shared bits
// -----------------------------------------------------------------

const inputClass =
  'w-full rounded-input border border-border bg-white px-3 py-2 font-sans text-sm text-charcoal placeholder:text-muted focus:border-navy focus:outline-none';

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="font-raleway text-xs font-bold uppercase tracking-btn text-navy">
        {label}
      </span>
      {children}
    </label>
  );
}

function Dialog({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-xl overflow-hidden rounded-card border border-border bg-white shadow-card-hover">
        <div className="flex items-center justify-between border-b border-border bg-page px-6 py-3">
          <h3 className="font-raleway text-sm font-bold text-navy">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded p-1 text-muted hover:bg-page hover:text-navy"
          >
            <X size={16} aria-hidden />
          </button>
        </div>
        <div className="max-h-[70vh] overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}
