'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
  ArrowUpRight,
  CheckCircle2,
  CircleDashed,
  Clock,
  Coins,
  ImagePlus,
  Package,
  ShoppingBag,
  TrendingUp,
  Users,
  XCircle,
} from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import {
  effectiveCapabilities,
  type Capability,
  type CapabilitySet,
  type StaffRole,
} from '@/lib/permissions';
import { internGetMyStats } from '@/lib/api/admin';

export default function AdminDashboardPage() {
  const user = useAuthStore((s) => s.user);
  const role = (user?.role ?? 'CUSTOMER') as StaffRole;
  const caps = effectiveCapabilities(role, user?.permissions);
  const firstName = user?.name?.split(' ')[0] ?? (role === 'ADMIN' ? 'Admin' : 'there');
  const jobTitle = user?.jobTitle ?? null;

  // Routing logic — interns are STAFF with the products.image-only
  // capability, possibly without much else. Show them the earnings
  // dashboard. Other STAFF (image-team leads, content editors etc.)
  // get a generic role-aware dashboard. ADMIN keeps the full view.
  const isImageIntern =
    role === 'STAFF' && caps.has('products.image-only') && !caps.has('orders.read');

  if (role === 'ADMIN') {
    return <AdminDashboard firstName={firstName} />;
  }
  if (isImageIntern) {
    return <InternDashboard firstName={firstName} jobTitle={jobTitle} />;
  }
  return <StaffDashboard firstName={firstName} jobTitle={jobTitle} caps={caps} />;
}

// =================================================================
// ADMIN dashboard — full revenue + orders snapshot
// =================================================================
function AdminDashboard({ firstName }: { firstName: string }) {
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
      </header>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard Icon={TrendingUp} label="Revenue (30d)" value="—" hint="Reports module" />
        <StatCard Icon={ShoppingBag} label="Orders" value="—" hint="Live count from /admin/orders" />
        <StatCard Icon={Package} label="Products" value="—" hint="Live count from /admin/products" />
        <StatCard Icon={Users} label="Customers" value="—" hint="Live count from /admin/customers" />
      </section>
    </div>
  );
}

// =================================================================
// INTERN dashboard — own progress + earnings
// =================================================================
function InternDashboard({
  firstName,
  jobTitle,
}: {
  firstName: string;
  jobTitle: string | null;
}) {
  const [data, setData] = useState<Awaited<ReturnType<typeof internGetMyStats>> | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    internGetMyStats()
      .then(setData)
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load your stats'));
  }, []);

  // Eyebrow line falls back to "Image team · Dashboard" when no
  // explicit title is set, otherwise shows the admin-set title.
  const eyebrow = jobTitle ? `${jobTitle} · Dashboard` : 'Image team · Dashboard';

  return (
    <div className="px-8 py-10">
      <header className="mb-8 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="font-raleway text-xs font-semibold uppercase tracking-btn text-amber">
            {eyebrow}
          </p>
          <h1 className="font-raleway text-3xl font-bold text-navy">
            Hi, {firstName}
          </h1>
          <p className="mt-1 font-sans text-sm text-muted">
            Your queue, your progress, and what you&apos;ve earned so far.
          </p>
        </div>
        <Link
          href="/admin/intern-queue"
          className="flex items-center gap-2 rounded-btn bg-navy px-4 py-2 font-raleway text-xs font-bold uppercase tracking-btn text-white hover:bg-amber hover:text-navy"
        >
          <ImagePlus size={14} aria-hidden /> Open my queue
        </Link>
      </header>

      {error && (
        <div className="mb-6 rounded-card border border-danger/30 bg-danger/10 px-4 py-3 font-sans text-sm text-danger">
          {error}
        </div>
      )}

      {/* Earnings */}
      <section className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <EarningsCard
          label="Earned so far"
          ngn={data?.earnings.earnedNgn ?? null}
          hint="Approved submissions × locked-in pay rate."
          accent
        />
        <EarningsCard
          label="In review"
          ngn={data?.earnings.pendingNgn ?? null}
          hint="Pending submissions you'll be paid for once approved."
        />
        <EarningsCard
          label="Current pay rate"
          ngn={data?.earnings.currentRateNgn ?? null}
          perItem
          hint="Per approved product. Set by admin."
        />
      </section>

      {/* Progress */}
      <section className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <ProgressTile
          Icon={CircleDashed}
          label="To do"
          count={data?.stats.todo}
          tone="muted"
        />
        <ProgressTile
          Icon={Clock}
          label="In review"
          count={data?.stats.pending}
          tone="amber"
        />
        <ProgressTile
          Icon={CheckCircle2}
          label="Approved"
          count={data?.stats.approved}
          tone="success"
        />
        <ProgressTile
          Icon={XCircle}
          label="Rejected"
          count={data?.stats.rejected}
          tone="danger"
        />
      </section>

      {data && data.stats.assigned === 0 && (
        <p className="mt-6 rounded-card border border-border bg-page px-4 py-3 font-sans text-sm text-muted">
          You don&apos;t have any products assigned yet. Once the admin assigns
          products to your bucket they&apos;ll appear in your queue.
        </p>
      )}
    </div>
  );
}

// =================================================================
// STAFF dashboard — quick links to whatever they have access to
// =================================================================
const STAFF_LINKS: Array<{ cap: Capability; href: string; label: string; description: string }> = [
  { cap: 'orders.read', href: '/admin/orders', label: 'Orders', description: 'View, update status, manage fulfilment.' },
  { cap: 'products.read', href: '/admin/products', label: 'Products', description: 'Browse and edit the catalog.' },
  { cap: 'reviews.moderate', href: '/admin/reviews', label: 'Reviews', description: 'Approve or reject customer reviews.' },
  { cap: 'customers.read', href: '/admin/customers', label: 'Customers', description: 'Find customers, view orders.' },
  { cap: 'content.write', href: '/admin/content', label: 'Site content', description: 'Edit homepage text and images.' },
  { cap: 'blog.write', href: '/admin/blog', label: 'Blog', description: 'Write and publish posts.' },
  { cap: 'cms-pages.write', href: '/admin/pages', label: 'Pages', description: 'Edit long-form CMS pages.' },
  { cap: 'coupons.write', href: '/admin/coupons', label: 'Discounts', description: 'Create and manage promo codes.' },
  { cap: 'reports.read', href: '/admin/reports', label: 'Reports', description: 'Sales and inventory reports.' },
  { cap: 'staff.manage', href: '/admin/staff', label: 'Staff & permissions', description: 'Manage who can access what.' },
];

function StaffDashboard({
  firstName,
  jobTitle,
  caps,
}: {
  firstName: string;
  jobTitle: string | null;
  caps: CapabilitySet;
}) {
  const visibleLinks = STAFF_LINKS.filter((l) => caps.has(l.cap));
  const eyebrow = jobTitle ? `${jobTitle} · Dashboard` : 'Staff · Dashboard';

  return (
    <div className="px-8 py-10">
      <header className="mb-8 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="font-raleway text-xs font-semibold uppercase tracking-btn text-amber">
            {eyebrow}
          </p>
          <h1 className="font-raleway text-3xl font-bold text-navy">
            Hi, {firstName}
          </h1>
          <p className="mt-1 font-sans text-sm text-muted">
            Here are the areas you have access to. Need access to something
            else? Ask the admin.
          </p>
        </div>
      </header>

      {visibleLinks.length === 0 ? (
        <p className="rounded-card border border-border bg-page px-4 py-3 font-sans text-sm text-muted">
          No sections have been granted to your account yet. Contact the admin
          who invited you.
        </p>
      ) : (
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {visibleLinks.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="group flex flex-col gap-2 rounded-card border border-border bg-white p-5 shadow-card transition hover:border-amber hover:shadow-md"
            >
              <header className="flex items-center justify-between gap-3">
                <span className="font-raleway text-base font-bold text-navy group-hover:text-amber">
                  {l.label}
                </span>
                <ArrowUpRight size={16} className="text-muted group-hover:text-amber" aria-hidden />
              </header>
              <p className="font-sans text-sm leading-snug text-charcoal/80">
                {l.description}
              </p>
            </Link>
          ))}
        </section>
      )}
    </div>
  );
}

// =================================================================
// Shared cards
// =================================================================
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

function EarningsCard({
  label,
  ngn,
  hint,
  perItem,
  accent,
}: {
  label: string;
  ngn: number | null;
  hint: string;
  perItem?: boolean;
  accent?: boolean;
}) {
  return (
    <div
      className={`flex flex-col gap-3 rounded-card border p-5 shadow-card ${
        accent ? 'border-amber bg-amber/10' : 'border-border bg-white'
      }`}
    >
      <header className="flex items-center justify-between gap-3">
        <span className="font-raleway text-xs font-semibold uppercase tracking-btn text-muted">
          {label}
        </span>
        <Coins size={18} className={accent ? 'text-amber' : 'text-navy'} aria-hidden />
      </header>
      <span className="font-raleway text-3xl font-bold leading-none text-navy">
        {ngn === null
          ? '—'
          : `₦${ngn.toLocaleString('en-NG')}${perItem ? ' / item' : ''}`}
      </span>
      <span className="font-sans text-[11px] leading-snug text-muted">{hint}</span>
    </div>
  );
}

function ProgressTile({
  Icon,
  label,
  count,
  tone,
}: {
  Icon: typeof Package;
  label: string;
  count: number | undefined;
  tone: 'muted' | 'amber' | 'success' | 'danger';
}) {
  const colour = {
    muted: 'text-muted',
    amber: 'text-amber',
    success: 'text-success',
    danger: 'text-danger',
  }[tone];
  return (
    <div className="flex flex-col gap-2 rounded-card border border-border bg-white p-4 shadow-card">
      <header className="flex items-center gap-2">
        <Icon size={14} className={colour} aria-hidden />
        <span className="font-raleway text-[11px] font-semibold uppercase tracking-btn text-muted">
          {label}
        </span>
      </header>
      <span className="font-raleway text-2xl font-bold leading-none text-navy">
        {count === undefined ? '—' : count}
      </span>
    </div>
  );
}
