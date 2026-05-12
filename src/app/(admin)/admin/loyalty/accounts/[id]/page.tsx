'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ChevronLeft, Coins } from 'lucide-react';
import {
  adminAdjustLoyaltyAccount,
  adminGetLoyaltyAccount,
  type LoyaltyAccountDetail,
  type LoyaltyTransactionType,
} from '@/lib/api/admin';

const TYPE_LABELS: Record<LoyaltyTransactionType, string> = {
  WELCOME_BONUS: 'Welcome bonus',
  EARN: 'Earned',
  REDEEM: 'Redeemed',
  REFUND_REVERSAL: 'Refund reversal',
  REDEEM_REFUND: 'Redeem refund',
  EXPIRY: 'Expired',
  ADMIN_ADJUSTMENT: 'Admin adjustment',
};

export default function LoyaltyAccountDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id ?? '';
  const [account, setAccount] = useState<LoyaltyAccountDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [adjustOpen, setAdjustOpen] = useState(false);

  const refresh = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const data = await adminGetLoyaltyAccount(id);
      setAccount(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  if (loading) {
    return <div className="p-6 font-sans text-sm text-muted">Loading…</div>;
  }
  if (!account) {
    return (
      <div className="p-6">
        <p className="font-sans text-sm text-danger">
          {error ?? 'Account not found.'}
        </p>
        <Link
          href="/admin/loyalty/accounts"
          className="mt-3 inline-flex items-center gap-1 text-sm text-navy hover:text-amber"
        >
          <ChevronLeft size={14} /> Back to accounts
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 md:px-6 md:py-8">
      <Link
        href="/admin/loyalty/accounts"
        className="mb-3 inline-flex items-center gap-1 font-sans text-sm text-navy hover:text-amber"
      >
        <ChevronLeft size={14} /> Back to accounts
      </Link>

      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <Coins size={28} className="text-amber" aria-hidden />
          <div>
            <h1 className="font-raleway text-2xl font-bold text-navy md:text-3xl">
              {account.user?.name || account.user?.email || account.userId}
            </h1>
            <p className="font-sans text-sm text-muted">
              {account.user?.email}
              {account.user?.phone ? ` · ${account.user.phone}` : ''}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setAdjustOpen(true)}
          className="rounded-btn bg-amber px-5 py-2.5 font-raleway text-sm font-bold uppercase tracking-btn text-navy transition-colors hover:bg-amber-dark"
        >
          Adjust coins
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatTile label="Current tier" value={account.currentTier} />
        <StatTile label="Balance" value={account.coinBalance.toString()} suffix="coins" />
        <StatTile label="Lifetime earned" value={account.lifetimeCoinsEarned.toString()} />
        <StatTile label="Lifetime redeemed" value={account.lifetimeCoinsRedeemed.toString()} />
      </div>

      <section className="mt-6 overflow-hidden rounded-card border border-border bg-white">
        <div className="border-b border-border bg-page px-4 py-3">
          <h2 className="font-raleway text-sm font-bold uppercase tracking-btn text-navy">
            Transaction ledger (last 100)
          </h2>
        </div>
        {account.transactions.length === 0 ? (
          <div className="px-4 py-6 text-center font-sans text-sm text-muted">
            No transactions yet. Auto-enrollment + earn flow ships in PR 2.
          </div>
        ) : (
          <table className="w-full text-left font-sans text-sm">
            <thead className="text-xs uppercase tracking-btn text-muted">
              <tr>
                <th className="px-4 py-2">When</th>
                <th className="px-4 py-2">Type</th>
                <th className="px-4 py-2 text-right">Δ Coins</th>
                <th className="px-4 py-2 text-right">Balance</th>
                <th className="px-4 py-2">Reason / Cause</th>
              </tr>
            </thead>
            <tbody>
              {account.transactions.map((tx) => (
                <tr key={tx.id} className="border-t border-border">
                  <td className="px-4 py-2 text-xs text-muted">
                    {new Date(tx.createdAt).toLocaleString()}
                  </td>
                  <td className="px-4 py-2">{TYPE_LABELS[tx.type]}</td>
                  <td
                    className={`px-4 py-2 text-right font-bold ${
                      tx.delta >= 0 ? 'text-success' : 'text-danger'
                    }`}
                  >
                    {tx.delta > 0 ? `+${tx.delta}` : tx.delta}
                  </td>
                  <td className="px-4 py-2 text-right">{tx.balanceAfter}</td>
                  <td className="px-4 py-2 text-xs text-muted">
                    {tx.reason ?? tx.causeOrderId ?? '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {adjustOpen ? (
        <AdjustModal
          accountId={account.id}
          balance={account.coinBalance}
          onClose={() => setAdjustOpen(false)}
          onSaved={() => {
            setAdjustOpen(false);
            void refresh();
          }}
        />
      ) : null}
    </div>
  );
}

function StatTile({
  label,
  value,
  suffix,
}: {
  label: string;
  value: string;
  suffix?: string;
}) {
  return (
    <div className="rounded-card border border-border bg-white p-4">
      <p className="font-raleway text-[10px] font-bold uppercase tracking-btn text-muted">
        {label}
      </p>
      <p className="mt-1 font-raleway text-xl font-bold text-navy md:text-2xl">
        {value}{' '}
        {suffix ? (
          <span className="font-sans text-xs font-normal text-muted">{suffix}</span>
        ) : null}
      </p>
    </div>
  );
}

function AdjustModal({
  accountId,
  balance,
  onClose,
  onSaved,
}: {
  accountId: string;
  balance: number;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [delta, setDelta] = useState<number>(0);
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    setError(null);
    if (delta === 0) {
      setError('Delta cannot be zero.');
      return;
    }
    if (reason.trim().length < 3) {
      setError('Please give a reason (3+ chars). Logged in the audit trail.');
      return;
    }
    if (delta < 0 && balance + delta < 0) {
      setError(`Debit too large. Current balance is ${balance}.`);
      return;
    }
    setSaving(true);
    try {
      await adminAdjustLoyaltyAccount(accountId, delta, reason.trim());
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-30 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-card bg-white p-5 shadow-card-hover"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="mb-3 font-raleway text-lg font-bold text-navy">
          Manual coin adjustment
        </h3>
        <p className="mb-4 font-sans text-xs text-muted">
          Positive number = credit (gift / goodwill). Negative = debit
          (correction / fraud clawback). Audit-logged.
        </p>

        <label className="mb-3 flex flex-col gap-1">
          <span className="font-raleway text-xs font-bold uppercase tracking-btn text-muted">
            Coins (Δ)
          </span>
          <input
            type="number"
            value={delta}
            onChange={(e) => setDelta(Number(e.target.value))}
            className="rounded-input border border-border bg-white px-3 py-2 font-raleway text-sm text-navy focus:border-navy focus:outline-none"
            autoFocus
          />
        </label>

        <label className="mb-3 flex flex-col gap-1">
          <span className="font-raleway text-xs font-bold uppercase tracking-btn text-muted">
            Reason (required)
          </span>
          <input
            type="text"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Compensation for delayed order AZM-3142"
            className="rounded-input border border-border bg-white px-3 py-2 font-sans text-sm focus:border-navy focus:outline-none"
          />
        </label>

        {error ? (
          <p className="mb-3 rounded-card border border-danger bg-danger/10 p-2 font-sans text-xs text-danger">
            {error}
          </p>
        ) : null}

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-btn border border-border px-4 py-2 font-raleway text-xs font-bold uppercase tracking-btn text-muted hover:bg-page"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => void handleSave()}
            disabled={saving}
            className="rounded-btn bg-navy px-4 py-2 font-raleway text-xs font-bold uppercase tracking-btn text-white disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Apply adjustment'}
          </button>
        </div>
      </div>
    </div>
  );
}
