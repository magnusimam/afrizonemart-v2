import { Check } from 'lucide-react';
import { buildOrderTimeline, type TimelineStage } from '@/lib/orderTimeline';
import type { Order } from '@/lib/api/orders';

/**
 * Visual stage timeline for a customer order — the answer to
 * "where's my order?" without making the customer parse a status
 * word.
 *
 * Vertical list: indicator dot/check on the left, stage label +
 * timestamp on the right. A vertical connector links consecutive
 * rows. State drives colour:
 *
 *   done      — filled amber dot with check
 *   current   — outlined amber ring, slightly larger
 *   upcoming  — muted dot, dashed connector to the next
 *   skipped   — muted, dashed
 *
 * Branched endings (Cancelled / Refunded) live at the bottom and
 * use their own colour so they don't read as part of the forward
 * journey.
 *
 * Same `buildOrderTimeline` logic backs the mobile screen
 * (afrizonemart-mobile/src/lib/orderTimeline.ts) — keep both files
 * in sync.
 */
export interface OrderTimelineProps {
  order: Order;
}

export function OrderTimeline({ order }: OrderTimelineProps) {
  const stages = buildOrderTimeline(order);
  return (
    <ol className="flex flex-col">
      {stages.map((stage, i) => (
        <Row
          key={stage.key}
          stage={stage}
          isFirst={i === 0}
          isLast={i === stages.length - 1}
        />
      ))}
    </ol>
  );
}

function Row({
  stage,
  isFirst,
  isLast,
}: {
  stage: TimelineStage;
  isFirst: boolean;
  isLast: boolean;
}) {
  const isCancelled = stage.key === 'cancelled';
  const isRefunded = stage.key === 'refunded';
  const isMuted = stage.state === 'upcoming' || stage.state === 'skipped';
  const connectorMuted = isMuted;

  return (
    <li className="flex items-stretch gap-3">
      {/* Indicator column */}
      <div className="flex w-5 flex-col items-center">
        <div
          className={[
            'w-px flex-1',
            isFirst ? 'bg-transparent' : '',
            !isFirst && connectorMuted ? 'border-l border-dashed border-border' : '',
            !isFirst && !connectorMuted ? 'bg-border' : '',
          ].join(' ')}
          style={{ minHeight: 8 }}
        />
        <Dot stage={stage} />
        <div
          className={[
            'w-px flex-1',
            isLast ? 'bg-transparent' : '',
            !isLast && connectorMuted ? 'border-l border-dashed border-border' : '',
            !isLast && !connectorMuted ? 'bg-border' : '',
          ].join(' ')}
          style={{ minHeight: 8 }}
        />
      </div>

      {/* Label column */}
      <div className="flex-1 pb-4">
        <p
          className={[
            'font-raleway',
            stage.state === 'current'
              ? 'text-base font-bold'
              : 'text-sm font-semibold',
            isCancelled
              ? 'text-danger'
              : isRefunded
                ? 'text-charcoal'
                : isMuted
                  ? 'text-muted'
                  : 'text-navy',
          ].join(' ')}
        >
          {stage.label}
        </p>
        {stage.at ? (
          <p className="font-sans text-xs text-muted">{formatTimestamp(stage.at)}</p>
        ) : null}
        {stage.note ? (
          <p className="font-sans text-xs italic text-muted">{stage.note}</p>
        ) : null}
      </div>
    </li>
  );
}

function Dot({ stage }: { stage: TimelineStage }) {
  const isCancelled = stage.key === 'cancelled';
  const isRefunded = stage.key === 'refunded';

  if (stage.state === 'done') {
    return (
      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber text-white">
        <Check size={12} aria-hidden />
      </span>
    );
  }

  if (stage.state === 'current') {
    return (
      <span
        className={[
          'flex h-5 w-5 items-center justify-center rounded-full border-2 bg-white',
          isCancelled
            ? 'border-danger'
            : isRefunded
              ? 'border-border'
              : 'border-amber',
        ].join(' ')}
      >
        <span
          className={[
            'h-2 w-2 rounded-full',
            isCancelled ? 'bg-danger' : isRefunded ? 'bg-charcoal' : 'bg-amber',
          ].join(' ')}
        />
      </span>
    );
  }

  /// upcoming OR skipped
  return <span className="my-1 inline-block h-3 w-3 rounded-full bg-border" />;
}

function formatTimestamp(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}
