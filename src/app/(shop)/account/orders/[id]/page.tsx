'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ChevronRight, Home as HomeIcon, Package, Star } from 'lucide-react';
import { AccountSidebar } from '@/components/account/AccountSidebar';
import { OrderStatusBadge } from '@/components/account/OrderStatusBadge';
import { OrderTimeline } from '@/components/account/OrderTimeline';
import { formatPriceNGN } from '@/lib/format';
import { getCountry } from '@/lib/countries';
import {
  confirmDeliveryAsCustomer,
  getOrder,
  type Order,
} from '@/lib/api/orders';
import { HttpApiError } from '@/lib/api/client';
import { useAuthStore } from '@/stores/authStore';
import { SafeBoundary } from '@/components/common/SafeBoundary';
import type { OrderStatus as UiOrderStatus } from '@/types';

interface PageProps {
  params: { id: string };
}

function statusToUi(s: Order['status']): UiOrderStatus {
  switch (s) {
    case 'PENDING_PAYMENT':
      return 'pending';
    case 'PAID':
      return 'paid';
    case 'FULFILLING':
      return 'processing';
    case 'SHIPPED':
    case 'OUT_FOR_DELIVERY':
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

export default function OrderDetailPage({ params }: PageProps) {
  const user = useAuthStore((s) => s.user);
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Audit.8 — live status: poll the order every 12s while it's still
  // in motion (not delivered/cancelled). Stops polling once the order
  // reaches a terminal state.
  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const tick = async () => {
      if (cancelled) return;
      try {
        const next = await getOrder(params.id);
        if (cancelled) return;
        setOrder(next);
        const isTerminal =
          next.status === 'DELIVERED' ||
          next.status === 'CANCELLED' ||
          next.status === 'REFUNDED';
        if (!isTerminal) {
          timer = setTimeout(() => void tick(), 12_000);
        }
      } catch (e) {
        if (cancelled) return;
        if (e instanceof HttpApiError && e.status === 404) {
          setError('Order not found.');
        } else {
          setError(e instanceof Error ? e.message : 'Could not load order');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void tick();

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [params.id]);

  const [first, ...rest] = (user?.name ?? user?.email ?? '').split(' ');
  const lastName = rest.join(' ');
  const country = order ? getCountry(order.shipCountry) : null;

  return (
    <>
      <main className="bg-page pb-12">
        <nav aria-label="Breadcrumb" className="border-b border-border bg-page">
          <ol className="mx-auto flex max-w-site items-center gap-1.5 px-4 py-3 font-sans text-xs text-muted md:text-sm">
            <li>
              <Link href="/" className="flex items-center gap-1 hover:text-navy">
                <HomeIcon size={14} aria-hidden /> Home
              </Link>
            </li>
            <li aria-hidden>
              <ChevronRight size={12} className="text-border" />
            </li>
            <li>
              <Link href="/account/orders" className="hover:text-navy">
                Orders
              </Link>
            </li>
            <li aria-hidden>
              <ChevronRight size={12} className="text-border" />
            </li>
            <li>
              <span className="font-medium text-charcoal">
                {order?.orderNumber ?? params.id}
              </span>
            </li>
          </ol>
        </nav>

        <div className="mx-auto max-w-site px-4 py-6 md:py-10">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:gap-8">
            <div className="hidden lg:col-span-3 lg:block">
              <SafeBoundary name="account:sidebar" fallback={null}>
                <AccountSidebar
                  active="/account/orders"
                  userFirstName={first || 'You'}
                  userLastName={lastName}
                />
              </SafeBoundary>
            </div>

            <div className="flex flex-col gap-5 lg:col-span-9 lg:gap-6">
              {loading && (
                <p className="font-sans text-sm text-muted">Loading order…</p>
              )}

              {error && (
                <div
                  role="alert"
                  className="rounded-card border border-danger/30 bg-danger/5 px-4 py-3 font-sans text-sm text-danger"
                >
                  {error}
                </div>
              )}

              {order && (
                <>
                  <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      <h1 className="font-raleway text-2xl font-bold text-navy md:text-3xl">
                        Order {order.orderNumber}
                      </h1>
                      <p className="font-sans text-sm text-muted">
                        Placed on {new Date(order.createdAt).toLocaleString()} · {paymentLabel(order.paymentMethod)}
                      </p>
                    </div>
                    <OrderStatusBadge status={statusToUi(order.status)} />
                  </header>

                  <section className="rounded-card border border-border bg-white p-5 md:p-6">
                    <h2 className="mb-4 font-raleway text-lg font-bold text-navy">
                      Status
                    </h2>
                    <OrderTimeline order={order} />
                  </section>

                  {/* Show & Scan / customer-confirm block. Renders when
                      the order is SHIPPED or OUT_FOR_DELIVERY so the
                      customer either (a) sees their delivery code to
                      hand to the rider, or (b) can self-confirm. */}
                  {(order.status === 'SHIPPED' ||
                    order.status === 'OUT_FOR_DELIVERY') && (
                    <DeliveryConfirmBlock
                      order={order}
                      onConfirmed={(updated) => setOrder(updated)}
                    />
                  )}

                  {/* Rate-this-order CTA — same surface the mobile
                      app shows. Visible whenever the order is
                      DELIVERED so the customer always has a clear
                      entry into the review flow. */}
                  {order.status === 'DELIVERED' && (
                    <Link
                      href={`/account/orders/${order.id}/rate`}
                      className="flex items-center gap-4 rounded-card border border-amber/40 bg-amber/5 p-5 transition-colors hover:bg-amber/10 md:p-6"
                    >
                      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-amber/15">
                        <Star
                          size={22}
                          className="fill-amber text-amber"
                          aria-hidden
                        />
                      </span>
                      <span className="flex-1">
                        <span className="block font-raleway text-base font-bold text-navy">
                          Rate this order
                        </span>
                        <span className="block font-sans text-sm text-muted">
                          Help other shoppers and post verified reviews
                          for what you bought.
                        </span>
                      </span>
                      <ChevronRight
                        size={18}
                        className="shrink-0 text-amber"
                        aria-hidden
                      />
                    </Link>
                  )}

                  <section className="rounded-card border border-border bg-white p-5 md:p-6">
                    <h2 className="mb-4 flex items-center gap-2 font-raleway text-lg font-bold text-navy">
                      <Package size={18} aria-hidden /> Items
                    </h2>
                    <ul className="flex flex-col divide-y divide-border">
                      {order.items.map((it) => (
                        <li
                          key={it.id}
                          className="flex flex-wrap items-center justify-between gap-3 py-3"
                        >
                          <div className="flex flex-col">
                            <Link
                              href={`/product/${it.productSlug}`}
                              className="font-raleway text-sm font-semibold text-navy hover:text-amber"
                            >
                              {it.productName}
                            </Link>
                            <span className="font-sans text-xs text-muted">
                              {formatPriceNGN(it.unitPrice)} × {it.quantity}
                            </span>
                          </div>
                          <span className="font-raleway text-sm font-bold text-navy">
                            {formatPriceNGN(it.lineTotal)}
                          </span>
                        </li>
                      ))}
                    </ul>
                    <dl className="mt-4 flex flex-col gap-2 border-t border-border pt-4 font-sans text-sm">
                      <div className="flex justify-between">
                        <dt className="text-muted">Subtotal</dt>
                        <dd className="text-charcoal">{formatPriceNGN(order.subtotal)}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-muted">Shipping</dt>
                        <dd className="text-charcoal">{formatPriceNGN(order.shippingCost)}</dd>
                      </div>
                      <div className="flex justify-between font-raleway text-base font-bold">
                        <dt className="text-navy">Total</dt>
                        <dd className="text-navy">{formatPriceNGN(order.total)}</dd>
                      </div>
                    </dl>
                  </section>

                  <section className="rounded-card border border-border bg-white p-5 md:p-6">
                    <h2 className="mb-4 font-raleway text-lg font-bold text-navy">
                      Shipping to
                    </h2>
                    <address className="not-italic font-sans text-sm leading-relaxed text-charcoal">
                      <strong className="font-raleway font-semibold text-navy">
                        {order.shipFullName}
                      </strong>
                      <br />
                      {order.shipAddressLine}
                      <br />
                      {order.shipCity}
                      {country ? `, ${country.name}` : ` · ${order.shipCountry}`}
                      <br />
                      <span className="text-muted">{order.shipPhone}</span>
                    </address>
                  </section>
                </>
              )}
            </div>
          </div>
        </div>
      </main>
    </>
  );
}

/**
 * Customer's delivery-confirmation block.
 *
 * When the order is OUT_FOR_DELIVERY we render the 6-digit code
 * customers show their rider. (The full QR experience lives on
 * the mobile app — see DeliveryConfirmation screen there. Web is
 * mainly used at home / on desktop, not at the door, so the code
 * is the most useful element to render here.)
 *
 * When the order is SHIPPED or OUT_FOR_DELIVERY we always render
 * the "I received my order" button as a customer-side override —
 * it's the catch-all for missed scans / forgotten flips.
 */
function DeliveryConfirmBlock({
  order,
  onConfirmed,
}: {
  order: Order;
  onConfirmed: (updated: Order) => void;
}) {
  const isOutForDelivery = order.status === 'OUT_FOR_DELIVERY';
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = async () => {
    if (!confirm('Confirm that you received this order? This earns your Continental Coins.')) {
      return;
    }
    setConfirming(true);
    setError(null);
    try {
      await confirmDeliveryAsCustomer(order.id);
      /// Optimistic patch — the polling effect refetches in ~12s
      /// anyway, but flipping to DELIVERED right away makes the
      /// page feel responsive.
      onConfirmed({
        ...order,
        status: 'DELIVERED',
        deliveredAt: new Date().toISOString(),
        deliveredSource: 'customer',
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not confirm.');
      setConfirming(false);
    }
  };

  return (
    <section className="rounded-card border border-amber/30 bg-amber/5 p-5 md:p-6">
      {isOutForDelivery && order.deliveryOtp ? (
        <div className="mb-5">
          <p className="font-raleway text-xs font-bold uppercase tracking-btn text-amber">
            Your delivery code
          </p>
          <p className="mt-1 font-mono text-3xl tracking-[0.3em] text-navy">
            {order.deliveryOtp}
          </p>
          <p className="mt-1 font-sans text-xs text-muted">
            Show this code to your rider when they arrive. For the QR
            code, open the Afrizonemart mobile app.
          </p>
        </div>
      ) : null}

      <div className="flex flex-col gap-3 border-t border-amber/20 pt-4">
        <p className="font-sans text-sm text-charcoal">
          Already got your order? Tap to confirm and earn your
          Continental Coins.
        </p>
        <button
          type="button"
          onClick={() => void handleConfirm()}
          disabled={confirming}
          className="self-start rounded-btn bg-navy px-5 py-2.5 font-raleway text-sm font-bold uppercase tracking-btn text-white hover:bg-amber hover:text-navy disabled:cursor-not-allowed disabled:opacity-50"
        >
          {confirming ? 'Confirming…' : "I received my order"}
        </button>
        {error ? (
          <p className="font-sans text-sm text-danger">{error}</p>
        ) : null}
      </div>
    </section>
  );
}
