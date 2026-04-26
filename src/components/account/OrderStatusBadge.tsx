import {
  ORDER_STATUS_COLOR,
  ORDER_STATUS_LABEL,
  type OrderStatus,
} from '@/lib/mock-data';

interface OrderStatusBadgeProps {
  status: OrderStatus;
}

export function OrderStatusBadge({ status }: OrderStatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-input px-2.5 py-1 font-raleway text-[10px] font-bold uppercase tracking-btn md:text-xs ${ORDER_STATUS_COLOR[status]}`}
    >
      {ORDER_STATUS_LABEL[status]}
    </span>
  );
}
