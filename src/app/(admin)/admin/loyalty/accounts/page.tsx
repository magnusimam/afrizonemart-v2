'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Coins, Search } from 'lucide-react';
import {
  adminListLoyaltyAccounts,
  type LoyaltyAccountRow,
  type LoyaltyTier,
} from '@/lib/api/admin';

const TIERS: Array<{ key: LoyaltyTier; label: string; color: string }> = [
  { key: 'BLUE', label: 'Blue', color: 'bg-[#000066] text-white' },
  { key: 'GOLD', label: 'Gold', color: 'bg-amber text-navy' },
  { key: 'VIP', label: 'VIP', color: 'bg-pink text-white' },
  { key: 'AMBASSADOR', label: 'Ambassador', color: 'bg-success text-white' },
  { key: 'DORIME', label: 'Dorime', color: 'bg-charcoal text-amber' },
];

export default function LoyaltyAccountsPage() {
  const [items, setItems] = useState<LoyaltyAccountRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(25);
  const [q, setQ] = useState('');
  const [tier, setTier] = useState<LoyaltyTier | ''>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    void adminListLoyaltyAccounts({
      q: q.trim() || undefined,
      tier: tier || undefined,
      page,
      pageSize,
    })
      .then((data) => {
        if (cancelled) return;
        setItems(data.items);
        setTotal(data.total);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : String(err));
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [q, tier, page, pageSize]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 md:px-6 md:py-8">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Coins size={28} className="text-amber" aria-hidden />
          <div>
            <h1 className="font-raleway text-2xl font-bold text-navy md:text-3xl">
              Continental Rewards — Accounts
            </h1>
            <p className="font-sans text-sm text-muted">
              Customers enrolled in the loyalty program. Click an account to
              view their coin ledger + apply manual adjustments.
            </p>
          </div>
        </div>
        <Link
          href="/admin/loyalty/config"
          className="rounded-btn border border-navy px-4 py-2 font-raleway text-xs font-bold uppercase tracking-btn text-navy transition-colors hover:bg-navy hover:text-white"
        >
          ⚙ Config
        </Link>
      </div>

      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center">
        <div className="relative flex-1">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted"
            aria-hidden
          />
          <input
            type="search"
            placeholder="Search by email, name, or phone…"
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setPage(1);
            }}
            className="w-full rounded-input border border-border bg-white py-2 pl-9 pr-3 font-sans text-sm focus:border-navy focus:outline-none"
          />
        </div>
        <select
          value={tier}
          onChange={(e) => {
            setTier(e.target.value as LoyaltyTier | '');
            setPage(1);
          }}
          className="rounded-input border border-border bg-white px-3 py-2 font-sans text-sm focus:border-navy focus:outline-none"
        >
          <option value="">All tiers</option>
          {TIERS.map((t) => (
            <option key={t.key} value={t.key}>
              {t.label}
            </option>
          ))}
        </select>
      </div>

      {error ? (
        <div className="mb-4 rounded-card border border-danger bg-danger/10 p-3 font-sans text-sm text-danger">
          {error}
        </div>
      ) : null}

      <div className="overflow-hidden rounded-card border border-border bg-white">
        <table className="w-full text-left font-sans text-sm">
          <thead className="bg-page text-xs uppercase tracking-btn text-muted">
            <tr>
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Tier</th>
              <th className="px-4 py-3 text-right">Balance</th>
              <th className="px-4 py-3 text-right">Lifetime earned</th>
              <th className="px-4 py-3 text-right">Lifetime redeemed</th>
              <th className="px-4 py-3">Enrolled</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-muted">
                  Loading accounts…
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-muted">
                  No loyalty accounts yet. Accounts auto-create on a
                  customer&apos;s first paid order (once PR 2 ships).
                </td>
              </tr>
            ) : (
              items.map((acc) => {
                const tierDef = TIERS.find((t) => t.key === acc.currentTier);
                return (
                  <tr
                    key={acc.id}
                    className="border-t border-border transition-colors hover:bg-page"
                  >
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/loyalty/accounts/${acc.id}`}
                        className="font-medium text-navy hover:text-amber"
                      >
                        {acc.user?.name || acc.user?.email || acc.userId}
                      </Link>
                      <div className="text-xs text-muted">{acc.user?.email}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block rounded-input px-2 py-0.5 font-raleway text-[10px] font-bold uppercase tracking-btn ${
                          tierDef?.color ?? 'bg-muted text-white'
                        }`}
                      >
                        {tierDef?.label ?? acc.currentTier}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-raleway font-bold text-navy">
                      {acc.coinBalance}
                    </td>
                    <td className="px-4 py-3 text-right text-muted">
                      {acc.lifetimeCoinsEarned}
                    </td>
                    <td className="px-4 py-3 text-right text-muted">
                      {acc.lifetimeCoinsRedeemed}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted">
                      {new Date(acc.enrolledAt).toLocaleDateString()}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 ? (
        <div className="mt-4 flex items-center justify-between font-sans text-sm">
          <span className="text-muted">
            {total} total · page {page} of {totalPages}
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="rounded-btn border border-border bg-white px-3 py-1.5 font-raleway text-xs font-bold uppercase tracking-btn text-navy disabled:opacity-50"
            >
              ← Prev
            </button>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="rounded-btn border border-border bg-white px-3 py-1.5 font-raleway text-xs font-bold uppercase tracking-btn text-navy disabled:opacity-50"
            >
              Next →
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
