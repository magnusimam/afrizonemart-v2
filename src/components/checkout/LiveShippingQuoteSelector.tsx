'use client';

import { useEffect, useState } from 'react';
import { Package, Truck, Zap } from 'lucide-react';
import {
  fetchShippingQuotes,
  type ShippingQuote,
  type ShippingQuoteCartItem,
  type ShippingQuoteDestination,
} from '@/lib/api/shipping';
import { formatPriceNGN } from '@/lib/format';

/**
 * Phase 11 — Live shipping selector.
 *
 * Replaces the old static DELIVERY_METHODS list. Calls
 * `POST /api/shipping/quote` whenever the destination or cart changes
 * and renders the returned options as selectable radio cards. The
 * picked quote is bubbled up via `onChange` so the parent can persist
 * { provider, rateId, label, amountNgn, etaDaysMin, etaDaysMax } in
 * checkoutStore.
 *
 * Failure modes:
 * - No country → blank state, "Add a delivery address first."
 * - Empty cart → blank state.
 * - API error → inline error, [Retry] button.
 * - Zero quotes → "No shipping rates configured for this destination
 *   yet — admin should set one up."
 */
interface Props {
  destination: ShippingQuoteDestination | null;
  items: ShippingQuoteCartItem[];
  selectedRateId?: string | null;
  selectedProvider?: string | null;
  onChange: (quote: ShippingQuote | null) => void;
}

export function LiveShippingQuoteSelector({
  destination,
  items,
  selectedRateId,
  selectedProvider,
  onChange,
}: Props) {
  const [quotes, setQuotes] = useState<ShippingQuote[]>([]);
  const [meta, setMeta] = useState<{ weightKg: number; subtotalNgn: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Keyed string used by the effect dep array — the destination object
  // is recreated on every parent render, so we hash a stable key.
  const destKey = destination
    ? [destination.country, destination.city, destination.state, destination.postcode]
        .map((s) => (s ?? '').trim().toLowerCase())
        .join('|')
    : '';
  const itemsKey = items.map((i) => `${i.productId}:${i.qty}`).join(',');

  useEffect(() => {
    if (!destination?.country || items.length === 0) {
      setQuotes([]);
      setMeta(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchShippingQuotes(destination, items)
      .then((r) => {
        if (cancelled) return;
        setQuotes(r.quotes);
        setMeta({ weightKg: r.weightKg, subtotalNgn: r.subtotalNgn });
        // Auto-select the first (cheapest) quote when there's no
        // current selection, OR when the previous selection isn't in
        // the new list (destination change invalidates picks).
        const currentStillValid = r.quotes.some(
          (q) =>
            (q.rateId ?? null) === (selectedRateId ?? null) &&
            q.provider === selectedProvider,
        );
        if (!currentStillValid) {
          onChange(r.quotes[0] ?? null);
        }
      })
      .catch((e) => {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : 'Failed to load shipping options');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // We intentionally compare via stable string keys, not the
    // identity of `destination` / `items` which change every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [destKey, itemsKey]);

  if (!destination?.country) {
    return (
      <p className="rounded-card border border-dashed border-border px-4 py-6 text-center font-sans text-sm text-muted">
        Add a delivery address above to see shipping options.
      </p>
    );
  }

  if (items.length === 0) {
    return (
      <p className="rounded-card border border-dashed border-border px-4 py-6 text-center font-sans text-sm text-muted">
        Your cart is empty.
      </p>
    );
  }

  if (loading) {
    return (
      <p className="rounded-card border border-border bg-page px-4 py-3 font-sans text-sm text-muted">
        Calculating shipping…
      </p>
    );
  }

  if (error) {
    return (
      <div className="rounded-card border border-danger/30 bg-danger/5 px-4 py-3 font-sans text-sm text-danger">
        {error}{' '}
        <button
          type="button"
          onClick={() => {
            // Force a re-fetch by toggling state — simplest path.
            setError(null);
            setLoading(true);
            fetchShippingQuotes(destination, items)
              .then((r) => {
                setQuotes(r.quotes);
                setMeta({ weightKg: r.weightKg, subtotalNgn: r.subtotalNgn });
                onChange(r.quotes[0] ?? null);
              })
              .catch((e) =>
                setError(e instanceof Error ? e.message : 'Retry failed'),
              )
              .finally(() => setLoading(false));
          }}
          className="ml-2 underline hover:no-underline"
        >
          Retry
        </button>
      </div>
    );
  }

  if (quotes.length === 0) {
    return (
      <div className="rounded-card border border-amber bg-amber/10 px-4 py-3 font-sans text-sm text-charcoal">
        No shipping rates are configured for {destination.country}
        {destination.city ? ` (${destination.city})` : ''} yet. Reach out
        to support to enable delivery to your area, or pick a different
        country.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {meta && (
        <p className="font-sans text-[11px] text-muted">
          Cart total: {meta.weightKg.toFixed(2)}kg · {formatPriceNGN(meta.subtotalNgn)}
        </p>
      )}
      {quotes.map((q) => {
        const isSelected =
          (q.rateId ?? null) === (selectedRateId ?? null) &&
          q.provider === selectedProvider;
        const Icon = pickIcon(q);
        return (
          <button
            key={`${q.provider}:${q.rateId ?? q.label}`}
            type="button"
            onClick={() => onChange(q)}
            aria-pressed={isSelected}
            className={`flex items-start gap-3 rounded-card border-2 p-4 text-left transition-all ${
              isSelected
                ? 'border-navy bg-navy/5 shadow-card'
                : 'border-border bg-white hover:border-navy/40'
            }`}
          >
            <span
              className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
                isSelected ? 'border-navy bg-navy' : 'border-border bg-white'
              }`}
              aria-hidden
            >
              {isSelected && <span className="h-2 w-2 rounded-full bg-white" />}
            </span>
            <Icon
              size={28}
              strokeWidth={1.5}
              className={`shrink-0 ${isSelected ? 'text-amber' : 'text-navy'}`}
              aria-hidden
            />
            <div className="flex flex-1 flex-col gap-0.5">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <span className="font-raleway text-sm font-bold text-navy md:text-base">
                  {q.label}
                </span>
                <span className="font-raleway text-base font-bold text-navy">
                  {q.amountNgn === 0 ? (
                    <span className="text-success">Free</span>
                  ) : (
                    formatPriceNGN(q.amountNgn)
                  )}
                </span>
              </div>
              <p className="font-sans text-xs text-muted">
                {formatEta(q)}
                {q.provider !== 'manual' && ` · via ${q.provider.toUpperCase()}`}
              </p>
            </div>
          </button>
        );
      })}
    </div>
  );
}

function formatEta(q: ShippingQuote): string {
  if (q.etaDaysMin === q.etaDaysMax) {
    return q.etaDaysMin === 0
      ? 'Same-day delivery'
      : q.etaDaysMin === 1
        ? 'Next-day delivery'
        : `${q.etaDaysMin} days`;
  }
  return `${q.etaDaysMin}–${q.etaDaysMax} days`;
}

function pickIcon(q: ShippingQuote): typeof Truck {
  // Lightweight visual hint based on the quote name. Pure cosmetic.
  const lc = q.label.toLowerCase();
  if (lc.includes('express') || q.etaDaysMax <= 1) return Zap;
  if (lc.includes('international') || q.etaDaysMin >= 7) return Truck;
  return Package;
}
