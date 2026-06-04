/**
 * Order timeline — canonical stage list shared between the web
 * /account/orders/[id] page and the mobile OrderDetail screen. Keep
 * this file 1:1 with `afrizonemart-mobile/src/lib/orderTimeline.ts`
 * so the two apps can't drift on what "stage 3" means.
 *
 * Source data: customer `Order` (status + createdAt + cancelledAt +
 * refundedTotal + events). Output: an ordered list of stages with a
 * derived state per stage. The renderer is free to draw it however
 * it wants — the data layer is decoupled.
 *
 * Stages:
 *   1. Placed      — Order created. Timestamp = order.createdAt.
 *   2. Paid        — Payment confirmed. Timestamp from
 *                    `PAYMENT_RECEIVED` event when present, else
 *                    `STATUS_CHANGED → PAID`.
 *   3. Preparing   — Status FULFILLING.
 *   4. Shipped     — Status SHIPPED.
 *   5. Delivered   — Status DELIVERED.
 *
 * Branched endings:
 *   • Cancelled — when status === CANCELLED. Timestamp = cancelledAt.
 *   • Refunded  — when status === REFUNDED OR refundedTotal > 0.
 */
import type { Order, OrderEvent, OrderStatus } from './api/orders';

export type TimelineStageKey =
  | 'placed'
  | 'paid'
  | 'preparing'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'refunded';

export type TimelineState = 'done' | 'current' | 'upcoming' | 'skipped';

export interface TimelineStage {
  key: TimelineStageKey;
  label: string;
  state: TimelineState;
  at: string | null;
  note?: string;
}

const STATUS_RANK: Record<OrderStatus, number> = {
  PENDING_PAYMENT: 0,
  PAID: 1,
  FULFILLING: 2,
  SHIPPED: 3,
  DELIVERED: 4,
  CANCELLED: -1,
  REFUNDED: -1,
};

function findTransitionEvent(
  events: OrderEvent[],
  to: OrderStatus,
): OrderEvent | null {
  for (const e of events) {
    if (e.type === 'STATUS_CHANGED' && (e.payload as { to?: string })?.to === to) {
      return e;
    }
    if (to === 'PAID' && e.type === 'PAYMENT_RECEIVED') {
      return e;
    }
  }
  return null;
}

export function buildOrderTimeline(order: Order): TimelineStage[] {
  const events = order.events ?? [];
  const status = order.status;
  const isCancelled = status === 'CANCELLED';
  const isRefunded = status === 'REFUNDED' || (order.refundedTotal ?? 0) > 0;

  const currentRank = STATUS_RANK[status];

  const reachedRank = (() => {
    if (currentRank >= 0) return currentRank;
    let max = STATUS_RANK.PENDING_PAYMENT;
    for (const e of events) {
      if (e.type === 'PAYMENT_RECEIVED') {
        max = Math.max(max, STATUS_RANK.PAID);
        continue;
      }
      if (e.type === 'STATUS_CHANGED') {
        const to = (e.payload as { to?: string })?.to;
        if (to && to in STATUS_RANK) {
          const r = STATUS_RANK[to as OrderStatus];
          if (r >= 0) max = Math.max(max, r);
        }
      }
    }
    return max;
  })();

  const main: TimelineStage[] = [
    {
      key: 'placed',
      label: 'Placed',
      state: stageState(0, currentRank, reachedRank, isCancelled || isRefunded),
      at: order.createdAt,
    },
    {
      key: 'paid',
      label: 'Paid',
      state: stageState(1, currentRank, reachedRank, isCancelled || isRefunded),
      at: findTransitionEvent(events, 'PAID')?.createdAt ?? null,
    },
    {
      key: 'preparing',
      label: 'Preparing',
      state: stageState(2, currentRank, reachedRank, isCancelled || isRefunded),
      at: findTransitionEvent(events, 'FULFILLING')?.createdAt ?? null,
    },
    {
      key: 'shipped',
      label: 'Shipped',
      state: stageState(3, currentRank, reachedRank, isCancelled || isRefunded),
      at: findTransitionEvent(events, 'SHIPPED')?.createdAt ?? null,
    },
    {
      key: 'delivered',
      label: 'Delivered',
      state: stageState(4, currentRank, reachedRank, isCancelled || isRefunded),
      at: findTransitionEvent(events, 'DELIVERED')?.createdAt ?? null,
      note:
        isRefunded && !isCancelled && reachedRank >= STATUS_RANK.DELIVERED
          ? `Partial refund recorded`
          : undefined,
    },
  ];

  if (isCancelled) {
    main.push({
      key: 'cancelled',
      label: 'Cancelled',
      state: 'current',
      at: order.cancelledAt ?? order.updatedAt,
    });
  } else if (isRefunded) {
    main.push({
      key: 'refunded',
      label: 'Refunded',
      state: 'current',
      at:
        findTransitionEvent(events, 'REFUNDED')?.createdAt ??
        order.updatedAt,
    });
  }

  return main;
}

function stageState(
  stageRank: number,
  currentRank: number,
  reachedRank: number,
  branchedEnding: boolean,
): TimelineState {
  if (branchedEnding) {
    if (stageRank <= reachedRank) return 'done';
    return 'skipped';
  }
  if (stageRank < currentRank) return 'done';
  if (stageRank === currentRank) return 'current';
  return 'upcoming';
}

export function orderStatusSummary(order: Order): string {
  switch (order.status) {
    case 'PENDING_PAYMENT':
      return 'Awaiting payment';
    case 'PAID':
      return 'Paid — preparing your order';
    case 'FULFILLING':
      return 'Preparing your order';
    case 'SHIPPED':
      return 'On the way';
    case 'DELIVERED':
      return 'Delivered';
    case 'CANCELLED':
      return 'Cancelled';
    case 'REFUNDED':
      return 'Refunded';
    default:
      return order.status;
  }
}
