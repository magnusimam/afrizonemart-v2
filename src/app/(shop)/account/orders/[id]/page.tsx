'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ChevronRight, Home as HomeIcon, Package } from 'lucide-react';
import { ChatBubble } from '@/components/layout/ChatBubble';
import { Footer } from '@/components/layout/Footer';
import { Header } from '@/components/layout/Header';
import { AccountSidebar } from '@/components/account/AccountSidebar';
import { OrderStatusBadge } from '@/components/account/OrderStatusBadge';
import { formatPriceNGN } from '@/lib/format';
import { getCountry } from '@/lib/countries';
import { getOrder, type Order } from '@/lib/api/orders';
import { HttpApiError } from '@/lib/api/client';
import { useAuthStore } from '@/stores/authStore';
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

  useEffect(() => {
    void (async () => {
      try {
        setOrder(await getOrder(params.id));
      } catch (e) {
        if (e instanceof HttpApiError && e.status === 404) {
          setError('Order not found.');
        } else {
          setError(e instanceof Error ? e.message : 'Could not load order');
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [params.id]);

  const [first, ...rest] = (user?.name ?? user?.email ?? '').split(' ');
  const lastName = rest.join(' ');
  const country = order ? getCountry(order.shipCountry) : null;

  return (
    <>
      <Header />
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
            <div className="lg:col-span-3">
              <AccountSidebar
                active="/account/orders"
                userFirstName={first || 'You'}
                userLastName={lastName}
              />
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
      <Footer />
      <ChatBubble />
    </>
  );
}
