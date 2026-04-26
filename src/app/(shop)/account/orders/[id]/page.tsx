import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronRight, Copy, Home as HomeIcon, MessageCircle, Package } from 'lucide-react';
import { ChatBubble } from '@/components/layout/ChatBubble';
import { Footer } from '@/components/layout/Footer';
import { Header } from '@/components/layout/Header';
import { AccountSidebar } from '@/components/account/AccountSidebar';
import { OrderStatusBadge } from '@/components/account/OrderStatusBadge';
import { OrderTracker } from '@/components/account/OrderTracker';
import { formatPriceNGN } from '@/lib/format';
import { getCountry } from '@/lib/countries';
import { MOCK_USER, getMockOrder } from '@/lib/mock-data';

interface PageProps {
  params: { id: string };
}

export default function OrderDetailPage({ params }: PageProps) {
  const order = getMockOrder(params.id);
  if (!order) notFound();

  const country = getCountry(order.shippingAddress.country);

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
              <Link href="/account" className="hover:text-navy">
                Account
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
              <span className="font-medium text-charcoal">{order.id}</span>
            </li>
          </ol>
        </nav>

        <div className="mx-auto max-w-site px-4 py-6 md:py-10">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:gap-8">
            <div className="lg:col-span-3">
              <AccountSidebar
                active="/account/orders"
                userFirstName={MOCK_USER.firstName}
                userLastName={MOCK_USER.lastName}
              />
            </div>

            <div className="flex flex-col gap-5 lg:col-span-9 lg:gap-6">
              <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <h1 className="font-raleway text-2xl font-bold text-navy md:text-3xl">
                    Order {order.id}
                  </h1>
                  <p className="font-sans text-sm text-muted">
                    Placed on {order.placedAt} · {order.paymentMethod}
                  </p>
                </div>
                <OrderStatusBadge status={order.status} />
              </header>

              <section className="rounded-card border border-border bg-white p-5 shadow-card md:p-6">
                <h2 className="mb-5 font-raleway text-lg font-bold text-navy md:text-xl">
                  Track Your Package
                </h2>
                <OrderTracker status={order.status} />
                {order.trackingNumber ? (
                  <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-card border border-border bg-page p-3">
                    <div className="flex flex-col">
                      <span className="font-raleway text-[10px] font-bold uppercase tracking-btn text-muted">
                        Tracking Number
                      </span>
                      <span className="font-raleway text-sm font-bold text-navy">
                        {order.trackingNumber}
                      </span>
                      <span className="font-sans text-xs text-muted">
                        Carrier: {order.carrier}
                      </span>
                    </div>
                    <button
                      type="button"
                      className="flex items-center gap-1.5 rounded-btn border border-navy bg-white px-3 py-1.5 font-raleway text-xs font-bold uppercase tracking-btn text-navy hover:bg-navy hover:text-white"
                    >
                      <Copy size={12} aria-hidden />
                      Copy
                    </button>
                  </div>
                ) : null}
              </section>

              <section className="rounded-card border border-border bg-white p-5 shadow-card md:p-6">
                <h2 className="mb-4 font-raleway text-lg font-bold text-navy md:text-xl">
                  Items in this order
                </h2>
                <div className="flex flex-col divide-y divide-border">
                  {order.items.map((item) => {
                    const c = getCountry(item.origin);
                    return (
                      <div
                        key={item.productId}
                        className="flex items-center gap-3 py-3 first:pt-0 last:pb-0"
                      >
                        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-card bg-page">
                          <Package size={28} strokeWidth={1.25} className="text-border" aria-hidden />
                        </div>
                        <div className="flex flex-1 flex-col gap-0.5">
                          <Link
                            href={`/product/${item.slug}`}
                            className="font-raleway text-sm font-semibold leading-snug text-navy hover:underline md:text-base"
                          >
                            {item.name}
                          </Link>
                          {item.variant ? (
                            <span className="font-sans text-xs text-muted">{item.variant}</span>
                          ) : null}
                          <div className="flex items-center gap-2">
                            <span className="font-sans text-xs text-muted">
                              Qty: {item.quantity}
                            </span>
                            {c ? (
                              <span className="font-sans text-xs text-muted">
                                · {c.flag} {c.name}
                              </span>
                            ) : null}
                          </div>
                        </div>
                        <span className="font-raleway text-sm font-bold text-navy md:text-base">
                          {formatPriceNGN(item.price * item.quantity)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </section>

              <div className="grid grid-cols-1 gap-5 md:grid-cols-2 md:gap-6">
                <section className="rounded-card border border-border bg-white p-5 shadow-card md:p-6">
                  <h2 className="mb-3 font-raleway text-base font-bold text-navy md:text-lg">
                    Shipping Address
                  </h2>
                  <p className="font-sans text-sm leading-relaxed text-charcoal">
                    {order.shippingAddress.fullName}
                    <br />
                    {order.shippingAddress.line1}
                    <br />
                    {order.shippingAddress.city}, {order.shippingAddress.region}
                    <br />
                    {country?.flag} {country?.name ?? order.shippingAddress.country}
                  </p>
                </section>

                <section className="rounded-card border border-border bg-white p-5 shadow-card md:p-6">
                  <h2 className="mb-3 font-raleway text-base font-bold text-navy md:text-lg">
                    Payment & Total
                  </h2>
                  <dl className="flex flex-col gap-2 font-sans text-sm">
                    <Row label="Subtotal" value={formatPriceNGN(order.total - 1500)} />
                    <Row label="Shipping" value={formatPriceNGN(1500)} />
                    <Row label="Total" value={formatPriceNGN(order.total)} bold />
                    <Row label="Method" value={order.paymentMethod} />
                  </dl>
                </section>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 rounded-card border border-border bg-white p-5 shadow-card">
                <div className="flex items-center gap-3">
                  <MessageCircle size={20} className="text-navy" aria-hidden />
                  <div>
                    <p className="font-raleway text-sm font-bold text-navy">
                      Need help with this order?
                    </p>
                    <p className="font-sans text-xs text-muted">
                      Our team responds within 30 minutes, 24×7.
                    </p>
                  </div>
                </div>
                <Link
                  href="/contact"
                  className="rounded-btn bg-navy px-5 py-2 font-raleway text-xs font-bold uppercase tracking-btn text-white hover:bg-amber hover:text-navy"
                >
                  Contact Support
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
      <ChatBubble />
    </>
  );
}

function Row({
  label,
  value,
  bold = false,
}: {
  label: string;
  value: string;
  bold?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-charcoal">{label}</dt>
      <dd
        className={`font-raleway ${
          bold ? 'text-base font-bold text-navy' : 'text-sm font-semibold text-navy'
        }`}
      >
        {value}
      </dd>
    </div>
  );
}
