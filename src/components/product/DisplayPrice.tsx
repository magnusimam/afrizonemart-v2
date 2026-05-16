'use client';

import { useGeo } from '@/components/providers/GeoProvider';
import { currencyForCountryCode } from '@/lib/countries';
import { formatPriceNGN } from '@/lib/format';

interface DisplayPriceProps {
  amountNgn: number;
  /**
   * Origin country code (ISO-3166 alpha-2). Honoured **only when the
   * visitor has not explicitly picked a currency from the header
   * dropdown**. The Nigerian-first feel is fixed by showing each
   * product in its origin country's currency by default; the moment
   * the visitor selects something from the dropdown we honour their
   * choice across every price.
   *
   * - `originCountry` omitted (cart / checkout / admin) →
   *   visitor-currency mode, full stop.
   */
  originCountry?: string | null;
  /// When true, omit the secondary NGN-fallback caption to keep
  /// dense layouts (cards, PDP subtotals) tight.
  compact?: boolean;
  className?: string;
}

/**
 * 2026-05-16 — two-mode price renderer:
 *
 *   1. **Default** (visitor hasn't touched the dropdown): each
 *      product shows in its origin country's currency. Nigerian
 *      products → ₦. South African → R. Kenyan → KSh. Makes the
 *      platform feel pan-African on first impression instead of
 *      "Nigeria with a currency converter".
 *
 *   2. **Visitor-set** (the moment they pick from the dropdown):
 *      every price across the platform — cards, PDP, related,
 *      shelves, cart — renders in the visitor's chosen currency.
 *      `originCountry` is ignored.
 *
 * The "explicit user set" signal lives on `GeoState.currencyUserSet`
 * — true only after `setCurrency()` was called from the header
 * dropdown. The edge-middleware-set cookie (`azm_currency` from IP)
 * does NOT flip it to true; only an explicit human pick does.
 *
 * Fallbacks:
 *  - In origin-currency mode, if we don't have an FX rate for the
 *    origin's currency, fall back to NGN canonical (so unfamiliar
 *    origins never blank out).
 *  - In visitor-currency mode, NGN visitor or missing FX → NGN
 *    canonical.
 *
 * Stored prices are always NGN whole units; this component handles
 * the conversion display layer. Checkout settles NGN; display ≠
 * settlement currency (see ARCHITECTURE_TRACKER.md).
 */
export function DisplayPrice({
  amountNgn,
  originCountry,
  compact,
  className,
}: DisplayPriceProps) {
  const { currency: visitorCurrency, currencyUserSet, fx } = useGeo();

  // ---- Visitor explicitly picked from the dropdown ----
  // Their selection is now authoritative for every price on the
  // platform, regardless of any product's origin.
  if (currencyUserSet) {
    return renderInCurrency({
      amountNgn,
      currency: visitorCurrency,
      fx,
      compact,
      className,
      // We don't show the "(₦X)" reference when the visitor
      // explicitly chose their currency — they're past the
      // first-impression context and the cleaner number is easier
      // to scan. Cart / checkout pages still get NGN context via
      // their own line items.
      showNgnReference: false,
    });
  }

  // ---- Default (no explicit pick) ----
  // Render in the product's origin currency when one was passed.
  // The "originCountry omitted" path is used by cart/checkout/admin
  // and falls through to the visitor-currency render below.
  if (originCountry) {
    const originCurrency = currencyForCountryCode(originCountry);
    if (originCurrency) {
      return renderInCurrency({
        amountNgn,
        currency: originCurrency,
        fx,
        compact,
        className,
        // First-impression rendering — keep the NGN reference so
        // customers always know the canonical settlement price.
        showNgnReference: true,
      });
    }
  }

  // ---- Cart / checkout / admin path: visitor currency by default.
  return renderInCurrency({
    amountNgn,
    currency: visitorCurrency,
    fx,
    compact,
    className,
    showNgnReference: false,
  });
}

interface RenderArgs {
  amountNgn: number;
  currency: string;
  fx: ReturnType<typeof useGeo>['fx'];
  compact?: boolean;
  className?: string;
  showNgnReference: boolean;
}

function renderInCurrency({
  amountNgn,
  currency,
  fx,
  compact,
  className,
  showNgnReference,
}: RenderArgs) {
  // NGN target currency → no conversion.
  if (currency === 'NGN') {
    return <span className={className}>{formatPriceNGN(amountNgn)}</span>;
  }
  const rate = fx?.rates?.[currency];
  if (typeof rate !== 'number') {
    // No FX rate available for this currency → fall back to NGN so
    // we never show a blank or "NaN" price.
    return <span className={className}>{formatPriceNGN(amountNgn)}</span>;
  }
  const converted = amountNgn * rate;
  const formatted = formatLocal(converted, currency);

  if (compact) {
    return (
      <span className={className} title={formatPriceNGN(amountNgn)}>
        {formatted}
      </span>
    );
  }
  if (!showNgnReference) {
    return <span className={className}>{formatted}</span>;
  }
  return (
    <span className={className}>
      <span>{formatted}</span>
      <span className="ml-1 text-xs text-muted">
        ({formatPriceNGN(amountNgn)})
      </span>
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
