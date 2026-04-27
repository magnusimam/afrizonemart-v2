'use client';

import { ArrowUpRight, Package, ShoppingBag, TrendingUp, Users } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';

export default function AdminDashboardPage() {
  const user = useAuthStore((s) => s.user);
  const firstName = user?.name?.split(' ')[0] ?? 'Admin';

  return (
    <div className="px-8 py-10">
      <header className="mb-8 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="font-raleway text-xs font-semibold uppercase tracking-btn text-amber">
            Dashboard
          </p>
          <h1 className="font-raleway text-3xl font-bold text-navy">
            Welcome back, {firstName}
          </h1>
          <p className="mt-1 font-sans text-sm text-muted">
            Real metrics will appear here as orders, products, and customers
            flow through the system.
          </p>
        </div>
        <span className="rounded-full bg-amber/20 px-3 py-1 font-raleway text-[11px] font-bold uppercase tracking-btn text-navy">
          Phase 0 · Foundation
        </span>
      </header>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          Icon={TrendingUp}
          label="Revenue (30d)"
          value="—"
          hint="Wires up with the Reports module (Phase 6)"
        />
        <StatCard
          Icon={ShoppingBag}
          label="Orders"
          value="—"
          hint="Live count lands with the Orders Ops module (Phase 2)"
        />
        <StatCard
          Icon={Package}
          label="Products"
          value="—"
          hint="Live count lands with the Catalog module (Phase 1)"
        />
        <StatCard
          Icon={Users}
          label="Customers"
          value="—"
          hint="Live count lands with the Customers module (Phase 3)"
        />
      </section>

      <section className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Panel
          title="Roadmap"
          subtitle="Phases shipping next, in order"
        >
          <ol className="flex flex-col gap-3 font-sans text-sm">
            {ROADMAP.map((step) => (
              <li
                key={step.label}
                className="flex items-start gap-3 rounded-card border border-border bg-page p-3"
              >
                <span
                  className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full font-raleway text-[11px] font-bold ${
                    step.done
                      ? 'bg-success text-white'
                      : step.next
                        ? 'bg-amber text-navy'
                        : 'bg-border text-muted'
                  }`}
                >
                  {step.done ? '✓' : step.phase}
                </span>
                <div className="flex flex-col">
                  <span className="font-raleway font-semibold text-navy">
                    {step.label}
                  </span>
                  <span className="text-xs text-muted">{step.detail}</span>
                </div>
              </li>
            ))}
          </ol>
        </Panel>

        <Panel
          title="What's gated, what's open"
          subtitle="Live behaviour right now"
        >
          <ul className="flex flex-col gap-3 font-sans text-sm leading-relaxed text-charcoal">
            <li>
              ✅ Admin route group exists; only users with role{' '}
              <code className="rounded bg-page px-1 text-xs">ADMIN</code> can
              access — others get bounced to <code>/account</code>.
            </li>
            <li>
              ✅ Promote / demote via{' '}
              <code className="rounded bg-page px-1 text-xs">
                npm run make-admin -- email@example.com
              </code>{' '}
              from the API repo.
            </li>
            <li>
              ✅ Logging in as an admin redirects here automatically; the
              storefront still works at <code>/</code>.
            </li>
            <li>
              ⏳ Sidebar items marked <span className="font-bold">Soon</span>{' '}
              are placeholders — each one lights up as its phase ships.
            </li>
          </ul>
        </Panel>
      </section>
    </div>
  );
}

const ROADMAP = [
  { phase: 0, label: 'Foundation', detail: 'Role gate, AdminShell, login redirect, dashboard placeholder', done: true, next: false },
  { phase: 1, label: 'Catalog editing', detail: 'Products + Categories + Reviews moderation', done: false, next: true },
  { phase: 2, label: 'Orders ops', detail: 'List, detail, status updates, notes, refunds', done: false, next: false },
  { phase: 3, label: 'Customers', detail: 'List, profile, order history, lifetime value', done: false, next: false },
  { phase: 4, label: 'Discounts + Shipping', detail: 'Coupons, shipping zones & rates', done: false, next: false },
  { phase: 5, label: 'Settings + Audit + Webhooks', detail: 'Store config, audit log, outbound webhooks', done: false, next: false },
  { phase: 6, label: 'Reports', detail: 'Sales, low-stock, top customers', done: false, next: false },
  { phase: 7, label: 'Feature flags + Rules engine', detail: 'Closes Principles #2 and #3', done: false, next: false },
];

function StatCard({
  Icon,
  label,
  value,
  hint,
}: {
  Icon: typeof Package;
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-card border border-border bg-white p-5 shadow-card">
      <header className="flex items-center justify-between gap-3">
        <span className="font-raleway text-xs font-semibold uppercase tracking-btn text-muted">
          {label}
        </span>
        <Icon size={18} className="text-navy" aria-hidden />
      </header>
      <span className="font-raleway text-3xl font-bold leading-none text-navy">
        {value}
      </span>
      <span className="font-sans text-[11px] leading-snug text-muted">{hint}</span>
    </div>
  );
}

function Panel({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-4 rounded-card border border-border bg-white p-6 shadow-card">
      <header className="flex items-center justify-between gap-3 border-b border-border pb-3">
        <div className="flex flex-col">
          <h2 className="font-raleway text-lg font-bold text-navy">{title}</h2>
          {subtitle && (
            <span className="font-sans text-xs text-muted">{subtitle}</span>
          )}
        </div>
        <ArrowUpRight size={16} className="text-muted" aria-hidden />
      </header>
      {children}
    </section>
  );
}
