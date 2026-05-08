'use client';

import { useState } from 'react';
import { useGeo } from '@/components/providers/GeoProvider';
import { currencyForCountryCode } from '@/lib/countries';
import { formatPriceNGN } from '@/lib/format';

interface DisplayPriceProps {
  amountNgn: number;
  /// Origin country code (ISO-3166 alpha-2). When provided AND the
  /// country maps to a currency we have FX rates for, the price
  /// renders in the **origin** currency instead of the visitor's
  /// selected currency. A "See in {visitor-currency}" toggle is
  /// rendered next to the price for any visitor whose currency
  /// differs from the origin's. When omitted (cart, checkout, admin),
  /// the legacy "show in visitor's currency, fall back to NGN"
  /// behaviour is preserved.
  originCountry?: string | null;
  /// When true, renders only the local currency line (no NGN suffix).
  /// Useful inside dense card layouts.
  compact?: boolean;
  className?: string;
}

/**
 * Renders a product price.
 *
 * Two display modes:
 *  - **Origin-currency mode** (when `originCountry` is passed and
 *    maps to a currency with FX rates): primary line in the origin
 *    country's currency; a small "See in {VISITOR_CURRENCY}" toggle
 *    that reveals the converted equivalent on click.
 *  - **Visitor-currency mode** (cart, checkout, admin — anywhere
 *    `originCountry` is omitted): primary line in the visitor's
 *    currency picked from the header switcher, NGN fallback.
 *
 * Display-only — checkout still charges NGN (Squad accepts USD for
 * the non-NG flow). See ARCHITECTURE_TRACKER.md item #23 for the
 * multi-currency contract path.
 */
export function DisplayPrice({
  amountNgn,
  originCountry,
  compact,
  className,
}: DisplayPriceProps) {
  const { currency: visitorCurrency, fx } = useGeo();
  const originCurrency = currencyForCountryCode(originCountry);

  // ---- Origin-currency mode ----
  // Only takes the path if origin maps to a currency AND we have a
  // rate for it (NGN itself is always available; everything else
  // depends on the FX snapshot being loaded).
  const originRate =
    originCurrency === 'NGN'
      ? 1
      : originCurrency && fx?.rates?.[originCurrency];
  if (originCurrency && typeof originRate === 'number') {
    const originAmount = amountNgn * originRate;
    return (
      <OriginPrice
        originAmount={originAmount}
        originCurrency={originCurrency}
        visitorCurrency={visitorCurrency}
        amountNgn={amountNgn}
        fxRates={fx?.rates}
        compact={!!compact}
        className={className}
      />
    );
  }

  // ---- Visitor-currency mode (legacy behaviour, cart/checkout) ----
  const visitorRate =
    visitorCurrency === 'NGN' ? 1 : fx?.rates?.[visitorCurrency];
  if (visitorCurrency === 'NGN' || typeof visitorRate !== 'number') {
    return <span className={className}>{formatPriceNGN(amountNgn)}</span>;
  }
  const visitorAmount = amountNgn * visitorRate;
  const visitorFormatted = formatLocal(visitorAmount, visitorCurrency);
  if (compact) {
    return (
      <span className={className} title={formatPriceNGN(amountNgn)}>
        {visitorFormatted}
      </span>
    );
  }
  return (
    <span className={className}>
      <span>{visitorFormatted}</span>
      <span className="ml-1 text-xs text-gray-500">
        ({formatPriceNGN(amountNgn)})
      </span>
    </span>
  );
}

interface OriginPriceProps {
  originAmount: number;
  originCurrency: string;
  visitorCurrency: string;
  amountNgn: number;
  fxRates?: Record<string, number>;
  compact: boolean;
  className?: string;
}

function OriginPrice({
  originAmount,
  originCurrency,
  visitorCurrency,
  amountNgn,
  fxRates,
  compact,
  className,
}: OriginPriceProps) {
  const [showConversion, setShowConversion] = useState(false);
  const originFormatted = formatLocal(originAmount, originCurrency);

  const visitorRate =
    visitorCurrency === 'NGN' ? 1 : fxRates?.[visitorCurrency];
  const visitorAvailable = typeof visitorRate === 'number';
  const sameAsVisitor = visitorCurrency === originCurrency;

  // Compact mode: dense card layouts. No toggle UI — just the primary
  // line + a tooltip with the NGN canonical price for support triage.
  if (compact) {
    return (
      <span className={className} title={formatPriceNGN(amountNgn)}>
        {originFormatted}
      </span>
    );
  }

  // Same currency as visitor's preference → no toggle needed; their
  // selected currency already matches the origin's.
  if (sameAsVisitor || !visitorAvailable) {
    return <span className={className}>{originFormatted}</span>;
  }

  const visitorAmount = amountNgn * (visitorRate as number);
  const visitorFormatted = formatLocal(visitorAmount, visitorCurrency);

  return (
    <span className={`inline-flex flex-wrap items-baseline gap-x-2 gap-y-0.5 ${className ?? ''}`}>
      <span>{originFormatted}</span>
      {showConversion ? (
        <button
          type="button"
          onClick={() => setShowConversion(false)}
          className="font-sans text-xs font-normal text-muted hover:text-navy"
          aria-label="Hide currency conversion"
        >
          ≈ <span className="font-semibold text-navy">{visitorFormatted}</span>
          <span className="ml-1 text-[10px] uppercase tracking-btn">(hide)</span>
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setShowConversion(true)}
          className="font-sans text-xs font-normal text-muted underline-offset-2 hover:text-navy hover:underline"
        >
          See in {visitorCurrency}
        </button>
      )}
    </span>
  );
}

const FORMATTERS = new Map<string, Intl.NumberFormat>();

function formatLocal(amount: number, currency: string): string {
  let fmt = FORMATTERS.get(currency);
  if (!fmt) {
    try {
      fmt = new Intl.NumberFormat('en', {
        style: 'currency',
        currency,
        maximumFractionDigits: amount >= 1000 ? 0 : 2,
      });
    } catch {
      // Currency code not in ICU — fall back to plain number + code.
      return `${currency} ${amount.toFixed(2)}`;
    }
    FORMATTERS.set(currency, fmt);
  }
  return fmt.format(amount);
}
