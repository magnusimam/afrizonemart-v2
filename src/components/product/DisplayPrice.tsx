'use client';

import { useConvertFromNgn } from '@/components/providers/GeoProvider';
import { formatPriceNGN } from '@/lib/format';

interface DisplayPriceProps {
  amountNgn: number;
  /** When true, renders only the local currency line (no NGN suffix).
   *  Useful inside dense card layouts. */
  compact?: boolean;
  className?: string;
}

/**
 * Renders a price in the visitor's local currency with the canonical
 * NGN price as a secondary line (or hidden in `compact` mode).
 *
 * Display-only for v1 — checkout still charges NGN. See
 * ARCHITECTURE_TRACKER.md item #23 for the multi-currency contract path.
 */
export function DisplayPrice({ amountNgn, compact, className }: DisplayPriceProps) {
  const { converted, currency } = useConvertFromNgn(amountNgn);

  // FX not ready or unsupported currency — show NGN only (no jank).
  if (currency === 'NGN' || converted === null) {
    return <span className={className}>{formatPriceNGN(amountNgn)}</span>;
  }

  const formatted = formatLocal(converted, currency);

  if (compact) {
    return (
      <span className={className} title={formatPriceNGN(amountNgn)}>
        {formatted}
      </span>
    );
  }

  return (
    <span className={className}>
      <span>{formatted}</span>
      <span className="ml-1 text-xs text-gray-500">
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
