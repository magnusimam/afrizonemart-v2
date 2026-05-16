'use client';

import { useGeo } from '@/components/providers/GeoProvider';
import { formatPriceNGN } from '@/lib/format';

interface DisplayPriceProps {
  amountNgn: number;
  /**
   * Origin country code (ISO-3166 alpha-2).
   *
   * 2026-05-16: this prop is now **ignored for rendering**. It used
   * to make the price render in the product's origin currency
   * (Nigerian product → ₦ regardless of the visitor's dropdown
   * selection) with a "See in {visitor-currency}" toggle. Magnus'
   * call: the header dropdown is now authoritative. Every price
   * everywhere renders in the visitor's selected currency.
   *
   * The prop is kept on the interface so call sites don't all need
   * to change in the same PR. A future cleanup can drop it.
   */
  originCountry?: string | null;
  /// When true, omit the secondary NGN-fallback caption to keep
  /// dense layouts (cards, PDP subtotals) tight.
  compact?: boolean;
  className?: string;
}

/**
 * Renders a product price in the visitor's selected currency.
 *
 * - Dropdown is authoritative. If the customer picks KES, every
 *   price shows in KES — including Nigerian products, South
 *   African products, everything.
 * - When the visitor's currency is NGN OR we don't have an FX rate
 *   for their currency, we fall back to the NGN canonical price.
 * - Stored prices are always NGN whole units (see Product.price);
 *   this component handles the conversion display layer.
 *
 * Checkout still charges NGN (Squad accepts USD for the non-NG
 * flow). Display ≠ settlement currency — that contract is in
 * ARCHITECTURE_TRACKER.md.
 */
export function DisplayPrice({
  amountNgn,
  compact,
  className,
}: DisplayPriceProps) {
  const { currency: visitorCurrency, fx } = useGeo();

  // NGN visitor → show NGN canonical, no conversion needed.
  if (visitorCurrency === 'NGN') {
    return <span className={className}>{formatPriceNGN(amountNgn)}</span>;
  }
  // No FX rate for the visitor's currency → fall back to NGN so we
  // never show a blank price.
  const rate = fx?.rates?.[visitorCurrency];
  if (typeof rate !== 'number') {
    return <span className={className}>{formatPriceNGN(amountNgn)}</span>;
  }

  const converted = amountNgn * rate;
  const formatted = formatLocal(converted, visitorCurrency);

  /// Compact mode (cards, dense PDP subtotals): just the converted
  /// price, with the NGN canonical in a hover tooltip so support
  /// can triage a customer's exact-amount question without asking
  /// them to switch currencies.
  if (compact) {
    return (
      <span className={className} title={formatPriceNGN(amountNgn)}>
        {formatted}
      </span>
    );
  }

  /// Full mode: primary price + small grey NGN-reference suffix.
  /// The reference helps customers reconcile against the gateway
  /// receipt (Squad still settles in NGN).
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
