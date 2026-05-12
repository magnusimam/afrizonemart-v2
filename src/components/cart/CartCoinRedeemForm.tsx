'use client';

import { useEffect, useState } from 'react';
import { Coins, Info, X } from 'lucide-react';
import { useCartStore } from '@/stores/cartStore';
import { getMyLoyalty, type LoyaltyMeResponse } from '@/lib/api/loyalty';
import { formatPriceNGN } from '@/lib/format';

interface Props {
  productSubtotal: number;
  /// Disabled when the customer isn't logged in. Surfaces a hint
  /// to sign in for rewards rather than rendering a half-working
  /// input.
  disabled?: boolean;
}

/**
 * "Apply Afrizone Coins" panel on the cart page. Pulls the live
 * balance + redemption rules from /api/loyalty/me, lets the
 * customer enter how many coins to use, persists the request to
 * cartStore so it survives reloads, and surfaces the NGN savings
 * inline.
 *
 * Server is the source of truth on validation — this form mirrors
 * the rules (min, max %, max balance) client-side for UX only.
 * placeOrder re-validates and rejects mismatches.
 */
export function CartCoinRedeemForm({ productSubtotal, disabled }: Props) {
  const coinRedeemRequest = useCartStore((s) => s.coinRedeemRequest);
  const setCoinRedeemRequest = useCartStore((s) => s.setCoinRedeemRequest);
  const [loyalty, setLoyalty] = useState<LoyaltyMeResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState<string>(
    coinRedeemRequest > 0 ? String(coinRedeemRequest) : '',
  );

  useEffect(() => {
    if (disabled) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    void getMyLoyalty()
      .then((r) => {
        if (!cancelled) setLoyalty(r);
      })
      .catch(() => {
        if (!cancelled) setLoyalty(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [disabled]);

  // Whenever the cart subtotal changes, re-check whether the current
  // request is still valid (max % cap could now be lower). Clamp
  // down silently so the customer isn't left with a stale invalid
  // request that placeOrder will reject.
  useEffect(() => {
    if (!loyalty || !loyalty.enrolled) return;
    const cfg = loyalty.config;
    const balance = loyalty.account.coinBalance;
    const maxNgn = Math.floor((productSubtotal * cfg.maxOrderRedeemPercent) / 100);
    const maxCoinsByCap = Math.floor(maxNgn / cfg.coinValueNgn);
    const ceilingCoins = Math.min(balance, maxCoinsByCap);
    if (coinRedeemRequest > ceilingCoins) {
      setCoinRedeemRequest(ceilingCoins);
      setDraft(ceilingCoins > 0 ? String(ceilingCoins) : '');
    }
  }, [productSubtotal, loyalty, coinRedeemRequest, setCoinRedeemRequest]);

  if (disabled) {
    return (
      <div className="rounded-card border border-border bg-page p-4 font-sans text-xs text-muted">
        Sign in to use Afrizone Coins on this order.
      </div>
    );
  }

  if (loading) {
    return (
      <div className="rounded-card border border-border bg-white p-4 font-sans text-xs text-muted">
        Checking your coin balance…
      </div>
    );
  }

  if (!loyalty || !loyalty.enrolled || loyalty.account.coinBalance <= 0) {
    return null;
  }

  const { account, config } = loyalty;
  const balance = account.coinBalance;
  const maxNgn = Math.floor(
    (productSubtotal * config.maxOrderRedeemPercent) / 100,
  );
  const maxCoinsByCap = Math.floor(maxNgn / config.coinValueNgn);
  const ceilingCoins = Math.min(balance, maxCoinsByCap);

  const parsed = Number(draft);
  const wantsCoins = Number.isFinite(parsed) && parsed > 0;
  const tooFewCoins = wantsCoins && parsed < config.minRedeemCoins;
  const tooManyCoins = wantsCoins && parsed > ceilingCoins;
  const valid = !wantsCoins || (!tooFewCoins && !tooManyCoins);

  const applyCoins = (n: number) => {
    if (n <= 0) {
      setCoinRedeemRequest(0);
      setDraft('');
      return;
    }
    const clamped = Math.max(config.minRedeemCoins, Math.min(ceilingCoins, n));
    setCoinRedeemRequest(clamped);
    setDraft(String(clamped));
  };

  const ngnValue =
    coinRedeemRequest > 0 ? coinRedeemRequest * config.coinValueNgn : 0;

  return (
    <div className="rounded-card border border-amber bg-amber/5 p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Coins size={18} className="text-amber" aria-hidden />
          <h3 className="font-raleway text-sm font-bold text-navy">
            Apply Afrizone Coins
          </h3>
        </div>
        <span className="font-sans text-xs text-muted">
          Balance: <strong className="text-navy">{balance.toLocaleString()}</strong> coins
        </span>
      </div>

      {coinRedeemRequest > 0 ? (
        <div className="mb-3 flex items-center justify-between rounded-input border border-success bg-success/10 px-3 py-2 font-sans text-sm">
          <span className="text-success">
            Applying <strong>{coinRedeemRequest.toLocaleString()}</strong> coins
            = <strong>{formatPriceNGN(ngnValue)}</strong> off
          </span>
          <button
            type="button"
            onClick={() => applyCoins(0)}
            className="flex items-center gap-1 font-bold uppercase text-xs tracking-btn text-muted hover:text-danger"
            aria-label="Remove coin redemption"
          >
            <X size={14} aria-hidden /> Remove
          </button>
        </div>
      ) : null}

      <div className="flex flex-col gap-2 md:flex-row md:items-center">
        <input
          type="number"
          inputMode="numeric"
          min={config.minRedeemCoins}
          max={ceilingCoins}
          step={1}
          placeholder={`Enter coins (min ${config.minRedeemCoins})`}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          className="flex-1 rounded-input border border-border bg-white px-3 py-2 font-raleway text-sm text-navy focus:border-navy focus:outline-none"
        />
        <button
          type="button"
          onClick={() => applyCoins(parsed)}
          disabled={!valid || !wantsCoins}
          className="rounded-btn bg-navy px-4 py-2 font-raleway text-xs font-bold uppercase tracking-btn text-white transition-colors hover:bg-navy-dark disabled:opacity-50"
        >
          Apply
        </button>
        <button
          type="button"
          onClick={() => applyCoins(ceilingCoins)}
          className="rounded-btn border border-amber px-4 py-2 font-raleway text-xs font-bold uppercase tracking-btn text-navy transition-colors hover:bg-amber"
        >
          Use Max ({ceilingCoins.toLocaleString()})
        </button>
      </div>

      {tooFewCoins ? (
        <p className="mt-2 font-sans text-xs text-danger">
          Minimum redemption is {config.minRedeemCoins} coins.
        </p>
      ) : tooManyCoins ? (
        <p className="mt-2 font-sans text-xs text-danger">
          Max {ceilingCoins.toLocaleString()} coins on this order (capped at{' '}
          {config.maxOrderRedeemPercent}% of subtotal or your balance).
        </p>
      ) : (
        <p className="mt-2 flex items-start gap-1 font-sans text-xs text-muted">
          <Info size={12} className="mt-0.5 shrink-0" aria-hidden />
          1 coin = {formatPriceNGN(config.coinValueNgn)}. Pay up to{' '}
          {config.maxOrderRedeemPercent}% of the product subtotal with coins
          (shipping excluded).
        </p>
      )}
    </div>
  );
}
