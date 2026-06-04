import type { OrderStatus } from '@/lib/api/orders';

const STYLES: Record<OrderStatus, { bg: string; text: string; label: string }> = {
  PENDING_PAYMENT: { bg: 'bg-amber/20', text: 'text-navy', label: 'Pending payment' },
  PAID: { bg: 'bg-success/15', text: 'text-success', label: 'Paid' },
  FULFILLING: { bg: 'bg-navy/15', text: 'text-navy', label: 'Fulfilling' },
  SHIPPED: { bg: 'bg-navy/15', text: 'text-navy', label: 'Shipped' },
  OUT_FOR_DELIVERY: { bg: 'bg-amber/30', text: 'text-navy', label: 'Out for delivery' },
  DELIVERED: { bg: 'bg-success/20', text: 'text-success', label: 'Delivered' },
  CANCELLED: { bg: 'bg-border', text: 'text-muted', label: 'Cancelled' },
  REFUNDED: { bg: 'bg-danger/15', text: 'text-danger', label: 'Refunded' },
};

export function OrderStatusPill({ status }: { status: OrderStatus }) {
  const s = STYLES[status];
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 font-raleway text-[11px] font-bold uppercase tracking-btn ${s.bg} ${s.text}`}
    >
      {s.label}
    </span>
  );
}
