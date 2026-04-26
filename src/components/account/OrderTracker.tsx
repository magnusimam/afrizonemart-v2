import { Check, MapPin, Package, ShoppingBag, Truck } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { OrderStatus } from '@/lib/mock-data';

interface Step {
  key: OrderStatus;
  label: string;
  caption: string;
  Icon: LucideIcon;
}

const STEPS: Step[] = [
  { key: 'paid', label: 'Order Placed', caption: 'Payment confirmed', Icon: ShoppingBag },
  { key: 'processing', label: 'Processing', caption: 'Packing your items', Icon: Package },
  { key: 'shipped', label: 'Shipped', caption: 'Picked up by courier', Icon: Truck },
  { key: 'out-for-delivery', label: 'Out for Delivery', caption: 'On the way to you', Icon: MapPin },
  { key: 'delivered', label: 'Delivered', caption: 'Received & signed', Icon: Check },
];

const STATUS_INDEX: Record<OrderStatus, number> = {
  pending: 0,
  paid: 0,
  processing: 1,
  shipped: 2,
  'out-for-delivery': 3,
  delivered: 4,
  cancelled: -1,
};

interface OrderTrackerProps {
  status: OrderStatus;
}

export function OrderTracker({ status }: OrderTrackerProps) {
  const activeIndex = STATUS_INDEX[status];

  if (status === 'cancelled') {
    return (
      <div className="rounded-card border-2 border-danger/30 bg-danger/10 p-5 text-center">
        <p className="font-raleway text-sm font-bold uppercase tracking-btn text-danger">
          This order was cancelled
        </p>
        <p className="mt-1 font-sans text-sm text-charcoal">
          Refund processed within 5-7 business days.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <ol className="flex min-w-[640px] items-start gap-2 md:min-w-0 md:gap-4">
        {STEPS.map((step, i) => {
          const done = i < activeIndex;
          const active = i === activeIndex;
          return (
            <li key={step.key} className="flex flex-1 flex-col items-center text-center">
              <div className="flex w-full items-center">
                <span className={`h-px flex-1 ${i === 0 ? 'opacity-0' : done || active ? 'bg-navy' : 'bg-border'}`} aria-hidden />
                <span
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full font-raleway text-sm font-bold transition-colors md:h-12 md:w-12 ${
                    done
                      ? 'bg-navy text-white'
                      : active
                        ? 'bg-amber text-navy ring-4 ring-amber/30'
                        : 'bg-page text-muted ring-1 ring-border'
                  }`}
                >
                  {done ? (
                    <Check size={18} strokeWidth={3} aria-hidden />
                  ) : (
                    <step.Icon size={18} aria-hidden />
                  )}
                </span>
                <span
                  className={`h-px flex-1 ${
                    i === STEPS.length - 1
                      ? 'opacity-0'
                      : done
                        ? 'bg-navy'
                        : 'bg-border'
                  }`}
                  aria-hidden
                />
              </div>
              <span
                className={`mt-2 font-raleway text-xs font-bold ${
                  active ? 'text-navy' : 'text-charcoal'
                }`}
              >
                {step.label}
              </span>
              <span className="mt-0.5 font-sans text-[10px] leading-tight text-muted md:text-xs">
                {step.caption}
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
