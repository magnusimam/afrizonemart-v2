'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ChevronRight, Package, Search } from 'lucide-react';
import { AccountSidebar } from '@/components/account/AccountSidebar';
import { OrderStatusBadge } from '@/components/account/OrderStatusBadge';
import { formatPriceNGN } from '@/lib/format';
import { listOrders, type Order } from '@/lib/api/orders';
import { useAuthStore } from '@/stores/authStore';
import { SafeBoundary } from '@/components/common/SafeBoundary';
import type { OrderStatus as UiOrderStatus } from '@/types';

function statusToUi(s: Order['status']): UiOrderStatus {
  switch (s) {
    case 'PENDING_PAYMENT':
      return 'pending';
    case 'PAID':
      return 'paid';
    case 'FULFILLING':
      return 'processing';
    case 'SHIPPED':
      return 'shipped';
    case 'DELIVERED':
      return 'delivered';
    case 'CANCELLED':
    case 'REFUNDED':
      return 'cancelled';
  }
}

function paymentLabel(method: Order['paymentMethod']): string {
  switch (method) {
    case 'PAYSTACK':
      return 'Card / Paystack';
    case 'GTSQUAD':
      return 'Card / Squad';
    case 'BANK_TRANSFER':
      return 'Bank Transfer';
    case 'CASH_ON_DELIVERY':
      return 'Pay on Delivery';
  }
}

export default function OrdersPage() {
  const user = useAuthStore((s) => s.user);
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const r = await listOrders();
        setOrders(r.items);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Could not load orders');
        setOrders([]);
      }
    })();
  }, []);

  const [first, ...rest] = (user?.name ?? user?.email ?? '').split(' ');
  const lastName = rest.join(' ');

  return (
    <>
      <main className="bg-page pb-12">
        <div className="mx-auto max-w-site px-4 py-6 md:py-10">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:gap-8">
            <div className="lg:col-span-3">
              <SafeBoundary name="account:sidebar" fallback={null}>
                <AccountSidebar
                  active="/account/orders"
                  userFirstName={first || 'You'}
                  userLastName={lastName}
                />
              </SafeBoundary>
            </div>

            <div className="flex flex-col gap-5 lg:col-span-9">
              <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <h1 className="font-raleway text-2xl font-bold text-navy md:text-3xl">
                    Your Orders
                  </h1>
                  <p className="font-sans text-sm text-muted md:text-base">
                    {orders == null
                      ? 'Loading…'
                      : `${orders.length} total order${orders.length === 1 ? '' : 's'}`}
                  </p>
                </div>
                <div className="relative">
                  <Search
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-muted"
                    aria-hidden
                  />
                  <input
                    type="search"
                    placeholder="Search orders..."
                    className="w-full rounded-input border border-border bg-white py-2 pl-9 pr-3 font-sans text-sm text-charcoal placeholder:text-muted focus:border-navy focus:outline-none md:w-64"
                  />
                </div>
              </header>

              {error && (
                <div
                  role="alert"
                  className="rounded-card border border-danger/30 bg-danger/5 px-4 py-3 font-sans text-sm text-danger"
                >
                  {error}
                </div>
              )}

              <div className="flex flex-col gap-3 md:gap-4">
                {(orders ?? []).map((o) => (
                  <SafeBoundary
                    key={o.id}
                    name="account:order-row"
                    fallback={
                      <div className="rounded-card border border-amber bg-amber/10 p-4 font-sans text-sm text-charcoal">
                        One order couldn&apos;t render. Refresh to try again.
                      </div>
                    }
                  >
                  <article
                    className="rounded-card border border-border bg-white p-4 shadow-card transition-shadow hover:shadow-card-hover md:p-5"
                  >
                    <header className="mb-3 flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
                      <div className="flex flex-col gap-1">
                        <span className="font-raleway text-base font-bold text-navy">
                          Order {o.orderNumber}
                        </span>
                        <span className="font-sans text-xs text-muted">
                          Placed on {new Date(o.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <OrderStatusBadge status={statusToUi(o.status)} />
                    </header>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                      <div className="flex flex-col gap-1">
                        <span className="font-raleway text-[10px] font-bold uppercase tracking-btn text-muted">
                          Items
                        </span>
                        <span className="font-raleway text-sm font-semibold text-navy">
                          {o.items.reduce((s, i) => s + i.quantity, 0)} item{o.items.length === 1 ? '' : 's'}
                        </span>
                        <span className="line-clamp-2 font-sans text-xs text-charcoal">
                          {o.items.map((it) => it.productName).join(', ')}
                        </span>
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="font-raleway text-[10px] font-bold uppercase tracking-btn text-muted">
                          Total
                        </span>
                        <span className="font-raleway text-lg font-bold text-navy">
                          {formatPriceNGN(o.total)}
                        </span>
                        <span className="font-sans text-xs text-muted">
                          {paymentLabel(o.paymentMethod)}
                        </span>
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="font-raleway text-[10px] font-bold uppercase tracking-btn text-muted">
                          Shipping to
                        </span>
                        <span className="font-raleway text-sm font-semibold text-navy">
                          {o.shipCity}, {o.shipCountry}
                        </span>
                      </div>
                    </div>

                    <footer className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-3">
                      <span className="font-sans text-xs text-muted">
                        {o.shipFullName}
                      </span>
                      <Link
                        href={`/account/orders/${o.id}`}
                        className="flex items-center gap-1 rounded-btn bg-navy px-4 py-1.5 font-raleway text-xs font-bold uppercase tracking-btn text-white transition-colors hover:bg-amber hover:text-navy"
                      >
                        View Details <ChevronRight size={14} aria-hidden />
                      </Link>
                    </footer>
                  </article>
                  </SafeBoundary>
                ))}
              </div>

              {orders != null && orders.length === 0 && !error ? (
                <div className="flex flex-col items-center gap-3 rounded-card border border-border bg-white p-12 text-center">
                  <Package size={36} className="text-border" aria-hidden />
                  <p className="font-raleway text-base font-bold text-navy">
                    No orders yet
                  </p>
                  <Link
                    href="/"
                    className="rounded-btn bg-navy px-6 py-3 font-raleway text-xs font-bold uppercase tracking-btn text-white hover:bg-amber hover:text-navy"
                  >
                    Start Shopping
                  </Link>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
