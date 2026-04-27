'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ChevronRight, Heart, MapPin, Package, Sparkles, User } from 'lucide-react';
import { ChatBubble } from '@/components/layout/ChatBubble';
import { Footer } from '@/components/layout/Footer';
import { Header } from '@/components/layout/Header';
import { AccountSidebar } from '@/components/account/AccountSidebar';
import { OrderStatusBadge } from '@/components/account/OrderStatusBadge';
import { formatPriceNGN } from '@/lib/format';
import { listOrders, type Order } from '@/lib/api/orders';
import { useAuthStore } from '@/stores/authStore';
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

export default function AccountDashboardPage() {
  const user = useAuthStore((s) => s.user);
  const [orders, setOrders] = useState<Order[] | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const r = await listOrders();
        setOrders(r.items);
      } catch {
        setOrders([]);
      }
    })();
  }, []);

  const recentOrders = (orders ?? []).slice(0, 3);
  const orderCount = orders?.length ?? 0;
  const [first, ...rest] = (user?.name ?? user?.email ?? '').split(' ');
  const lastName = rest.join(' ');
  const memberSince = user
    ? new Date(user.createdAt).toLocaleDateString(undefined, {
        month: 'long',
        year: 'numeric',
      })
    : '';

  return (
    <>
      <Header />
      <main className="bg-page pb-12">
        <div className="mx-auto max-w-site px-4 py-6 md:py-10">
          <div className="mb-6 flex flex-col gap-1 md:mb-8">
            <p className="font-raleway text-xs font-semibold uppercase tracking-btn text-amber">
              My Account
            </p>
            <h1 className="font-raleway text-2xl font-bold text-navy md:text-3xl">
              Habari, {first || 'there'} 👋
            </h1>
            {memberSince && (
              <p className="font-sans text-sm text-muted md:text-base">
                Member since {memberSince}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:gap-8">
            <div className="lg:col-span-3">
              <AccountSidebar
                active="/account"
                userFirstName={first || 'You'}
                userLastName={lastName}
              />
            </div>

            <div className="flex flex-col gap-6 lg:col-span-9">
              <section className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
                <StatCard Icon={Package} label="Orders" value={orderCount.toString()} />
                <StatCard Icon={Heart} label="Wishlist" value="0" />
                <StatCard Icon={MapPin} label="Addresses" value="0" />
                <StatCard Icon={Sparkles} label="Points" value="0" amber />
              </section>

              <section className="rounded-card border border-border bg-white p-5 shadow-card md:p-6">
                <header className="mb-4 flex items-center justify-between gap-3">
                  <h2 className="font-raleway text-lg font-bold text-navy md:text-xl">
                    Recent Orders
                  </h2>
                  <Link
                    href="/account/orders"
                    className="flex items-center gap-1 font-raleway text-xs font-bold uppercase tracking-btn text-navy hover:underline"
                  >
                    View all <ChevronRight size={14} aria-hidden />
                  </Link>
                </header>
                {orders == null ? (
                  <p className="font-sans text-sm text-muted">Loading…</p>
                ) : recentOrders.length === 0 ? (
                  <p className="font-sans text-sm text-muted">
                    No orders yet —{' '}
                    <Link href="/" className="font-bold text-navy hover:underline">
                      start shopping
                    </Link>
                    .
                  </p>
                ) : (
                  <div className="flex flex-col gap-3">
                    {recentOrders.map((o) => (
                      <Link
                        key={o.id}
                        href={`/account/orders/${o.orderNumber}`}
                        className="flex flex-wrap items-center justify-between gap-3 rounded-card border border-border p-3 transition-colors hover:bg-page md:p-4"
                      >
                        <div className="flex flex-col gap-1">
                          <span className="font-raleway text-sm font-bold text-navy md:text-base">
                            {o.orderNumber}
                          </span>
                          <span className="font-sans text-xs text-muted">
                            {new Date(o.createdAt).toLocaleDateString()} ·{' '}
                            {o.items.reduce((s, i) => s + i.quantity, 0)} item
                            {o.items.length === 1 ? '' : 's'}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <OrderStatusBadge status={statusToUi(o.status)} />
                          <span className="font-raleway text-sm font-bold text-navy md:text-base">
                            {formatPriceNGN(o.total)}
                          </span>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </section>

              <section className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-5">
                <QuickAction
                  Icon={MapPin}
                  href="/account/addresses"
                  title="Manage Addresses"
                  description="Saved delivery locations"
                />
                <QuickAction
                  Icon={Heart}
                  href="/account/wishlist"
                  title="Your Wishlist"
                  description="Items you've saved for later"
                />
                <QuickAction
                  Icon={User}
                  href="/account/profile"
                  title="Profile Settings"
                  description="Email, password, language, currency"
                />
                <QuickAction
                  Icon={Sparkles}
                  href="/account/rewards"
                  title="Continental Rewards"
                  description="Earn points on every order"
                  highlight
                />
              </section>
            </div>
          </div>
        </div>
      </main>
      <Footer />
      <ChatBubble />
    </>
  );
}

function StatCard({
  Icon,
  label,
  value,
  amber = false,
}: {
  Icon: typeof Package;
  label: string;
  value: string;
  amber?: boolean;
}) {
  return (
    <div
      className={`flex flex-col gap-2 rounded-card p-4 shadow-card md:p-5 ${
        amber ? 'bg-amber text-navy' : 'border border-border bg-white text-navy'
      }`}
    >
      <Icon size={22} strokeWidth={1.75} aria-hidden />
      <span className="font-raleway text-xs font-semibold uppercase tracking-btn">
        {label}
      </span>
      <span className="font-raleway text-2xl font-bold leading-none md:text-3xl">
        {value}
      </span>
    </div>
  );
}

function QuickAction({
  Icon,
  href,
  title,
  description,
  highlight = false,
}: {
  Icon: typeof Package;
  href: string;
  title: string;
  description: string;
  highlight?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`group flex items-center gap-4 rounded-card p-4 transition-shadow hover:shadow-card-hover md:p-5 ${
        highlight
          ? 'bg-navy text-white shadow-card'
          : 'border border-border bg-white shadow-card text-navy'
      }`}
    >
      <span
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
          highlight ? 'bg-amber text-navy' : 'bg-amber/15 text-navy'
        }`}
      >
        <Icon size={20} aria-hidden />
      </span>
      <div className="flex flex-1 flex-col">
        <span className={`font-raleway text-base font-bold ${highlight ? 'text-white' : 'text-navy'}`}>
          {title}
        </span>
        <span className={`font-sans text-xs ${highlight ? 'text-white/80' : 'text-muted'}`}>
          {description}
        </span>
      </div>
      <ChevronRight
        size={18}
        className={`transition-transform group-hover:translate-x-1 ${
          highlight ? 'text-amber' : 'text-navy'
        }`}
        aria-hidden
      />
    </Link>
  );
}
