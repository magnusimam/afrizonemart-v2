import Link from 'next/link';
import { ChevronRight, Package, Search } from 'lucide-react';
import { ChatBubble } from '@/components/layout/ChatBubble';
import { Footer } from '@/components/layout/Footer';
import { Header } from '@/components/layout/Header';
import { AccountSidebar } from '@/components/account/AccountSidebar';
import { OrderStatusBadge } from '@/components/account/OrderStatusBadge';
import { formatPriceNGN } from '@/lib/format';
import { MOCK_ORDERS, MOCK_USER } from '@/lib/mock-data';

export default function OrdersPage() {
  return (
    <>
      <Header />
      <main className="bg-page pb-12">
        <div className="mx-auto max-w-site px-4 py-6 md:py-10">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:gap-8">
            <div className="lg:col-span-3">
              <AccountSidebar
                active="/account/orders"
                userFirstName={MOCK_USER.firstName}
                userLastName={MOCK_USER.lastName}
              />
            </div>

            <div className="flex flex-col gap-5 lg:col-span-9">
              <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <h1 className="font-raleway text-2xl font-bold text-navy md:text-3xl">
                    Your Orders
                  </h1>
                  <p className="font-sans text-sm text-muted md:text-base">
                    {MOCK_ORDERS.length} total orders
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

              <div className="flex flex-wrap gap-2">
                {(['all', 'processing', 'shipped', 'delivered', 'cancelled'] as const).map(
                  (f) => (
                    <button
                      key={f}
                      type="button"
                      className={`rounded-full px-4 py-1.5 font-raleway text-xs font-bold uppercase tracking-btn transition-colors ${
                        f === 'all'
                          ? 'bg-navy text-white'
                          : 'border border-border bg-white text-navy hover:border-navy'
                      }`}
                    >
                      {f}
                    </button>
                  ),
                )}
              </div>

              <div className="flex flex-col gap-3 md:gap-4">
                {MOCK_ORDERS.map((o) => (
                  <article
                    key={o.id}
                    className="rounded-card border border-border bg-white p-4 shadow-card transition-shadow hover:shadow-card-hover md:p-5"
                  >
                    <header className="mb-3 flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
                      <div className="flex flex-col gap-1">
                        <span className="font-raleway text-base font-bold text-navy">
                          Order {o.id}
                        </span>
                        <span className="font-sans text-xs text-muted">
                          Placed on {o.placedAt}
                        </span>
                      </div>
                      <OrderStatusBadge status={o.status} />
                    </header>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                      <div className="flex flex-col gap-1">
                        <span className="font-raleway text-[10px] font-bold uppercase tracking-btn text-muted">
                          Items
                        </span>
                        <span className="font-raleway text-sm font-semibold text-navy">
                          {o.itemCount} item{o.itemCount === 1 ? '' : 's'}
                        </span>
                        <span className="line-clamp-2 font-sans text-xs text-charcoal">
                          {o.items.map((it) => it.name).join(', ')}
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
                          {o.paymentMethod}
                        </span>
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="font-raleway text-[10px] font-bold uppercase tracking-btn text-muted">
                          {o.status === 'delivered' ? 'Delivered' : 'Estimated'}
                        </span>
                        <span className="font-raleway text-sm font-semibold text-navy">
                          {o.estimatedDelivery}
                        </span>
                        {o.trackingNumber ? (
                          <span className="font-sans text-xs text-muted">
                            Tracking: {o.trackingNumber}
                          </span>
                        ) : null}
                      </div>
                    </div>

                    <footer className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-3">
                      <span className="font-sans text-xs text-muted">
                        Shipping to {o.shippingAddress.city}, {o.shippingAddress.region}
                      </span>
                      <div className="flex flex-wrap items-center gap-2">
                        {o.status === 'delivered' ? (
                          <button
                            type="button"
                            className="rounded-btn border border-navy bg-white px-4 py-1.5 font-raleway text-xs font-bold uppercase tracking-btn text-navy hover:bg-navy hover:text-white"
                          >
                            Reorder
                          </button>
                        ) : null}
                        <Link
                          href={`/account/orders/${o.id}`}
                          className="flex items-center gap-1 rounded-btn bg-navy px-4 py-1.5 font-raleway text-xs font-bold uppercase tracking-btn text-white transition-colors hover:bg-amber hover:text-navy"
                        >
                          View Details <ChevronRight size={14} aria-hidden />
                        </Link>
                      </div>
                    </footer>
                  </article>
                ))}
              </div>

              {MOCK_ORDERS.length === 0 ? (
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
      <Footer />
      <ChatBubble />
    </>
  );
}
