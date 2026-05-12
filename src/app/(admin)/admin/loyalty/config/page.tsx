'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Coins, Save } from 'lucide-react';
import {
  adminGetLoyaltyConfig,
  adminUpdateLoyaltyConfig,
  type LoyaltyConfigDto,
} from '@/lib/api/admin';

/**
 * Continental Rewards admin config page. Every economic knob lives
 * here. All writes are audit-logged server-side.
 *
 * Layout intent: group fields into four panels (Earn rate, Tier
 * thresholds, Coin economics, Expiry / window) so operators can
 * navigate the config without scrolling through one long form.
 */
export default function LoyaltyConfigPage() {
  const [cfg, setCfg] = useState<LoyaltyConfigDto | null>(null);
  const [draft, setDraft] = useState<LoyaltyConfigDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    void adminGetLoyaltyConfig()
      .then((data) => {
        if (cancelled) return;
        setCfg(data);
        setDraft(data);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : String(err));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const dirty = useMemo(() => {
    if (!cfg || !draft) return false;
    return (Object.keys(cfg) as Array<keyof LoyaltyConfigDto>).some(
      (k) => cfg[k] !== draft[k],
    );
  }, [cfg, draft]);

  const handleSave = async () => {
    if (!draft || !cfg) return;
    setSaving(true);
    setError(null);
    try {
      const patch: Partial<LoyaltyConfigDto> = {};
      for (const k of Object.keys(draft) as Array<keyof LoyaltyConfigDto>) {
        if (draft[k] !== cfg[k]) {
          (patch as Record<string, unknown>)[k] = draft[k];
        }
      }
      const updated = await adminUpdateLoyaltyConfig(patch);
      setCfg(updated);
      setDraft(updated);
      setSavedAt(Date.now());
      window.setTimeout(() => setSavedAt(null), 2500);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-6 font-sans text-sm text-muted">Loading…</div>;
  }
  if (!draft || !cfg) {
    return (
      <div className="p-6">
        <p className="font-sans text-sm text-danger">
          Could not load loyalty config: {error ?? 'unknown error'}
        </p>
      </div>
    );
  }

  const projectedEarn = (tierIndex: number) => {
    const raw = draft.baseEarnPerOrder * Math.pow(draft.tierMultiplier, tierIndex);
    return Math.floor(raw);
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 md:px-6 md:py-8">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Coins size={28} className="text-amber" aria-hidden />
          <div>
            <h1 className="font-raleway text-2xl font-bold text-navy md:text-3xl">
              Continental Rewards Config
            </h1>
            <p className="font-sans text-sm text-muted">
              Every economic knob for the Afrizone Coin loyalty program.
              Changes are audit-logged.
            </p>
          </div>
        </div>
        <Link
          href="/admin/loyalty/accounts"
          className="rounded-btn border border-navy px-4 py-2 font-raleway text-xs font-bold uppercase tracking-btn text-navy transition-colors hover:bg-navy hover:text-white"
        >
          View accounts →
        </Link>
      </div>

      {error ? (
        <div className="mb-4 rounded-card border border-danger bg-danger/10 p-3 font-sans text-sm text-danger">
          {error}
        </div>
      ) : null}

      <div className="space-y-6">
        {/* Earn rate panel */}
        <Panel title="Earn rate" subtitle="How many Afrizone Coins a customer earns per order, derived from base × multiplier^(tier-1).">
          <Field
            label="Base earn (Tier 1 — Blue)"
            value={draft.baseEarnPerOrder}
            unit="coins / order"
            onChange={(v) => setDraft({ ...draft, baseEarnPerOrder: v })}
          />
          <Field
            label="Tier multiplier"
            value={draft.tierMultiplier}
            step={0.1}
            unit="× per tier step"
            onChange={(v) => setDraft({ ...draft, tierMultiplier: v })}
          />
          <Field
            label="Welcome bonus on enrollment"
            value={draft.welcomeBonusCoins}
            unit="coins (one-time, on first paid order)"
            onChange={(v) => setDraft({ ...draft, welcomeBonusCoins: v })}
          />
          <div className="mt-3 rounded-card border border-border bg-page p-3">
            <p className="mb-2 font-raleway text-xs font-bold uppercase tracking-btn text-muted">
              Projected coins per order
            </p>
            <ul className="grid grid-cols-2 gap-2 font-sans text-sm text-charcoal sm:grid-cols-5">
              <li>Blue: <strong>{projectedEarn(0)}</strong></li>
              <li>Gold: <strong>{projectedEarn(1)}</strong></li>
              <li>VIP: <strong>{projectedEarn(2)}</strong></li>
              <li>Ambassador: <strong>{projectedEarn(3)}</strong></li>
              <li>Dorime: <strong>{projectedEarn(4)}</strong></li>
            </ul>
          </div>
        </Panel>

        {/* Tier thresholds */}
        <Panel title="Tier thresholds" subtitle={`Rolling ${draft.spendWindowMonths}-month spend (NGN) required to qualify for each tier. Must be monotonically increasing.`}>
          <Field
            label="Tier 2 — Continental Gold"
            value={draft.tier2GoldThreshold}
            unit="NGN"
            onChange={(v) => setDraft({ ...draft, tier2GoldThreshold: v })}
          />
          <Field
            label="Tier 3 — Continental VIP"
            value={draft.tier3VipThreshold}
            unit="NGN"
            onChange={(v) => setDraft({ ...draft, tier3VipThreshold: v })}
          />
          <Field
            label="Tier 4 — Continental Ambassador"
            value={draft.tier4AmbassadorThreshold}
            unit="NGN"
            onChange={(v) => setDraft({ ...draft, tier4AmbassadorThreshold: v })}
          />
          <Field
            label="Tier 5 — Continental Dorime"
            value={draft.tier5DorimeThreshold}
            unit="NGN"
            onChange={(v) => setDraft({ ...draft, tier5DorimeThreshold: v })}
          />
        </Panel>

        {/* Coin economics */}
        <Panel title="Coin economics" subtitle="How coins translate to money at checkout.">
          <Field
            label="Coin value"
            value={draft.coinValueNgn}
            unit="NGN per coin"
            onChange={(v) => setDraft({ ...draft, coinValueNgn: v })}
          />
          <Field
            label="Max coin payment per order"
            value={draft.maxOrderRedeemPercent}
            unit="% of product subtotal (excludes shipping)"
            onChange={(v) => setDraft({ ...draft, maxOrderRedeemPercent: v })}
          />
          <Field
            label="Minimum redemption"
            value={draft.minRedeemCoins}
            unit="coins (floor — prevents trivial micro-discounts)"
            onChange={(v) => setDraft({ ...draft, minRedeemCoins: v })}
          />
        </Panel>

        {/* Expiry / window */}
        <Panel title="Expiry & windows" subtitle="How long coins last, and how long tier-qualifying spend counts.">
          <Field
            label="Coin expiry"
            value={draft.coinExpiryMonths}
            unit="months from earn date"
            onChange={(v) => setDraft({ ...draft, coinExpiryMonths: v })}
          />
          <Field
            label="Tier qualification window"
            value={draft.spendWindowMonths}
            unit="rolling months of spend that counts toward tier"
            onChange={(v) => setDraft({ ...draft, spendWindowMonths: v })}
          />
        </Panel>
      </div>

      <div className="sticky bottom-0 mt-6 -mx-4 flex items-center justify-end gap-3 border-t border-border bg-white p-4 md:-mx-6 md:px-6">
        {savedAt ? (
          <span className="font-sans text-sm text-success">Saved ✓</span>
        ) : null}
        <button
          type="button"
          disabled={!dirty || saving}
          onClick={() => void handleSave()}
          className="flex items-center gap-2 rounded-btn bg-navy px-5 py-2.5 font-raleway text-sm font-bold uppercase tracking-btn text-white transition-colors hover:bg-navy-dark disabled:opacity-50"
        >
          <Save size={16} aria-hidden />
          {saving ? 'Saving…' : 'Save changes'}
        </button>
      </div>
    </div>
  );
}

function Panel({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-card border border-border bg-white p-4 md:p-5">
      <header className="mb-4">
        <h2 className="font-raleway text-lg font-bold text-navy">{title}</h2>
        {subtitle ? (
          <p className="mt-1 font-sans text-sm text-muted">{subtitle}</p>
        ) : null}
      </header>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

function Field({
  label,
  value,
  unit,
  step = 1,
  onChange,
}: {
  label: string;
  value: number;
  unit?: string;
  step?: number;
  onChange: (v: number) => void;
}) {
  return (
    <label className="flex flex-col gap-1 md:flex-row md:items-center md:gap-4">
      <span className="font-sans text-sm font-medium text-charcoal md:w-1/2">
        {label}
      </span>
      <div className="flex flex-1 items-center gap-2">
        <input
          type="number"
          value={value}
          step={step}
          onChange={(e) => {
            const next = Number(e.target.value);
            if (!Number.isNaN(next)) onChange(next);
          }}
          className="w-32 rounded-input border border-border bg-white px-3 py-1.5 font-raleway text-sm text-navy focus:border-navy focus:outline-none"
        />
        {unit ? (
          <span className="font-sans text-xs text-muted">{unit}</span>
        ) : null}
      </div>
    </label>
  );
}
