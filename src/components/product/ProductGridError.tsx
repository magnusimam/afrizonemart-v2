import { AlertCircle, RefreshCw } from 'lucide-react';

interface Props {
  message?: string;
  onRetry?: () => void;
}

/**
 * Inline error state for product grids. Matches the visual language of
 * other empty/error states (rounded card on page-bg).
 */
export function ProductGridError({ message, onRetry }: Props) {
  return (
    <div className="col-span-full flex flex-col items-center justify-center gap-4 rounded-card border border-danger/20 bg-danger/5 px-4 py-10 text-center">
      <AlertCircle size={32} className="text-danger" aria-hidden />
      <div className="flex flex-col gap-1">
        <p className="font-raleway text-base font-bold text-navy">
          Couldn&apos;t load products right now
        </p>
        <p className="font-sans text-sm text-muted">
          {message ??
            'The catalog service didn\'t answer. Try again in a moment.'}
        </p>
      </div>
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="flex items-center gap-1.5 rounded-btn border border-navy bg-white px-4 py-2 font-raleway text-xs font-bold uppercase tracking-btn text-navy transition-colors hover:bg-navy hover:text-white"
        >
          <RefreshCw size={14} aria-hidden />
          Try Again
        </button>
      ) : null}
    </div>
  );
}
