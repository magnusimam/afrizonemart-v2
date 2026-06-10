'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  BarChart3,
  Banknote,
  Boxes,
  ClipboardList,
  Coins,
  CreditCard,
  Eye,
  FileClock,
  Home,
  LayoutGrid,
  LogOut,
  FileText,
  Flag,
  GitBranch,
  Globe2,
  Gift,
  ImagePlus,
  Pencil,
  LayoutPanelTop,
  Mail,
  MailOpen,
  Newspaper,
  PercentCircle,
  Plug,
  Settings,
  ShieldCheck,
  ShoppingBag,
  Tag,
  Tags,
  Truck,
  Users,
  X,
  type LucideIcon,
} from 'lucide-react';
import { logoutUser } from '@/lib/api/auth';
import { useAuthStore } from '@/stores/authStore';
import { effectiveCapabilities, type Capability, type StaffRole } from '@/lib/permissions';

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  disabled?: boolean;
  /// Capability that gates this item. Undefined = always visible to
  /// any role admitted to the admin router (Dashboard fits this — it's
  /// the landing page for everyone with admin access).
  cap?: Capability;
}

const NAV: NavItem[] = [
  { href: '/admin', label: 'Dashboard', icon: Home },
  { href: '/admin/orders', label: 'Orders', icon: ShoppingBag, cap: 'orders.read' },
  { href: '/admin/products', label: 'Products', icon: Boxes, cap: 'products.read' },
  { href: '/admin/categories', label: 'Categories', icon: Tags, cap: 'categories.write' },
  { href: '/admin/reviews', label: 'Reviews', icon: ClipboardList, cap: 'reviews.moderate' },
  { href: '/admin/customers', label: 'Customers', icon: Users, cap: 'customers.read' },
  { href: '/admin/staff', label: 'Staff & Roles', icon: ShieldCheck, cap: 'staff.manage' },
  { href: '/admin/interns', label: 'Intern queue', icon: ImagePlus, cap: 'intern.review' },
  { href: '/admin/product-submissions-review', label: 'Product submissions', icon: ClipboardList, cap: 'intern.review' },
  { href: '/admin/intern-payouts', label: 'Intern payouts', icon: Banknote, cap: 'payouts.write' },
  { href: '/admin/intern-queue', label: 'My image queue', icon: ImagePlus, cap: 'products.image-only' },
  { href: '/admin/product-submissions', label: 'Submit a product', icon: FileText, cap: 'products.submit' },
  { href: '/admin/brand-logos', label: 'Brand logos', icon: ImagePlus, cap: 'products.write' },
  { href: '/admin/coupons', label: 'Coupons', icon: PercentCircle, cap: 'coupons.write' },
  { href: '/admin/discounts', label: 'Discounts', icon: Tag, cap: 'products.write' },
  { href: '/admin/shipping', label: 'Shipping', icon: Truck, cap: 'shipping.write' },
  { href: '/admin/payment-gateways', label: 'Payment Gateways', icon: CreditCard, cap: 'payment-gateways.write' },
  { href: '/admin/payment-methods', label: 'Payment Methods', icon: CreditCard, cap: 'payment-gateways.write' },
  { href: '/admin/reports', label: 'Reports', icon: BarChart3, cap: 'reports.read' },
  { href: '/admin/webhooks', label: 'Webhooks', icon: Plug, cap: 'webhooks.write' },
  { href: '/admin/notifications', label: 'Notifications', icon: Mail, cap: 'notifications.write' },
  { href: '/admin/email-templates', label: 'Email Templates', icon: MailOpen, cap: 'email-templates.write' },
  { href: '/admin/custom-fields', label: 'Custom Fields', icon: LayoutGrid, cap: 'custom-fields.write' },
  { href: '/admin/feature-flags', label: 'Feature Flags', icon: Flag, cap: 'feature-flags.write' },
  { href: '/admin/loyalty', label: 'Continental Rewards', icon: Coins, cap: 'loyalty.read' },
  { href: '/admin/wrap', label: 'Afrizonemart Wrap', icon: Gift, cap: 'content.write' },
  { href: '/admin/business-rules', label: 'Business Rules', icon: GitBranch, cap: 'business-rules.write' },
  { href: '/admin/shelves', label: 'Shelves', icon: LayoutPanelTop, cap: 'products.write' },
  { href: '/admin/pages', label: 'Pages', icon: FileText, cap: 'cms-pages.write' },
  { href: '/admin/content', label: 'Site content', icon: Pencil, cap: 'content.write' },
  { href: '/admin/category-heroes', label: 'Category Heroes', icon: ImagePlus, cap: 'content.write' },
  { href: '/admin/home-collections', label: 'Home Collections', icon: LayoutGrid, cap: 'content.write' },
  { href: '/admin/category-subtabs', label: 'Category Sub-tabs', icon: Tags, cap: 'content.write' },
  { href: '/admin/landing-pages', label: 'Landing Pages', icon: Globe2, cap: 'content.write' },
  { href: '/admin/blog', label: 'Blog', icon: Newspaper, cap: 'blog.write' },
  { href: '/admin/audit', label: 'Audit Log', icon: FileClock, cap: 'audit.read' },
  { href: '/admin/views', label: 'View Analytics', icon: Eye, cap: 'analytics.read' },
  { href: '/admin/settings', label: 'Settings', icon: Settings, cap: 'settings.write' },
];

interface AdminSidebarProps {
  /// Whether the drawer is open on mobile. Ignored on md+ (always visible).
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

export function AdminSidebar({ mobileOpen = false, onMobileClose }: AdminSidebarProps = {}) {
  const pathname = usePathname();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const accessToken = useAuthStore((s) => s.accessToken);
  const clear = useAuthStore((s) => s.clear);

  const handleLogout = async () => {
    if (accessToken) {
      try {
        await logoutUser(accessToken);
      } catch {
        /* ignore */
      }
    }
    clear();
    router.push('/login');
  };

  // Effective capability set this user has. ADMIN sees everything;
  // STAFF only sees items whose `cap` they were granted. Items without
  // a `cap` (Dashboard) are always visible.
  const caps = effectiveCapabilities(
    (user?.role ?? 'CUSTOMER') as StaffRole,
    user?.permissions,
  );
  const visibleNav = NAV.filter((item) => !item.cap || caps.has(item.cap));

  // Friendly first-name greeting; falls back to "Admin" when name is null.
  const greeting = user?.name?.split(' ')[0] ?? 'there';

  return (
    <>
      {/* Mobile-only backdrop. Tappable to close. Pointer-events go off
          when drawer is closed so it doesn't trap clicks on the page. */}
      <div
        aria-hidden
        onClick={onMobileClose}
        className={`fixed inset-0 z-30 bg-charcoal/60 transition-opacity md:hidden ${
          mobileOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
      />

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-72 max-w-[85vw] flex-col gap-1 overflow-y-auto border-r border-white/10 bg-navy py-6 text-white transition-transform duration-200 md:static md:w-60 md:max-w-none md:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
      {/* Close button only shows on mobile while drawer is open. */}
      <button
        type="button"
        onClick={onMobileClose}
        aria-label="Close menu"
        className="absolute right-2 top-2 rounded-md p-2 text-white/70 hover:bg-white/10 md:hidden"
      >
        <X size={18} aria-hidden />
      </button>

      <div className="px-5 pb-4">
        <Link
          href="/admin"
          onClick={onMobileClose}
          className="flex flex-col gap-0.5"
        >
          <span className="font-raleway text-xs font-semibold uppercase tracking-btn text-amber">
            Afrizonemart
          </span>
          <span className="font-raleway text-lg font-bold leading-tight">
            Admin Console
          </span>
        </Link>
      </div>

      {/* Greeting strip — surfaces who's logged in + their title/role. */}
      <div className="mx-3 mb-4 rounded-md border border-white/10 bg-white/5 px-3 py-2">
        <p className="font-raleway text-[11px] font-semibold uppercase tracking-btn text-amber">
          Hi, {greeting}
        </p>
        <p className="mt-0.5 font-sans text-xs text-white/70">
          {user?.jobTitle
            ? user.jobTitle
            : user?.role === 'STAFF'
              ? `${visibleNav.length} section${visibleNav.length === 1 ? '' : 's'} available to you`
              : user?.role === 'ADMIN'
                ? 'Full admin access'
                : user?.email}
        </p>
      </div>

      <nav className="flex flex-1 flex-col gap-0.5 px-2">
        {visibleNav.map(({ href, label, icon: Icon, disabled }) => {
          const active = pathname === href || (href !== '/admin' && pathname.startsWith(href));
          if (disabled) {
            return (
              <span
                key={href}
                title="Coming soon"
                className="flex items-center justify-between gap-3 rounded-md px-3 py-2 font-sans text-sm text-white/40"
              >
                <span className="flex items-center gap-3">
                  <Icon size={16} aria-hidden />
                  {label}
                </span>
                <span className="rounded-full bg-white/10 px-1.5 py-0.5 font-raleway text-[9px] font-bold uppercase tracking-btn">
                  Soon
                </span>
              </span>
            );
          }
          return (
            <Link
              key={href}
              href={href}
              onClick={onMobileClose}
              className={`flex items-center gap-3 rounded-md px-3 py-2 font-sans text-sm transition-colors ${
                active
                  ? 'bg-amber font-semibold text-navy'
                  : 'text-white/85 hover:bg-white/10 hover:text-white'
              }`}
            >
              <Icon size={16} aria-hidden />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto flex flex-col gap-2 px-3 pt-4">
        <Link
          href="/"
          onClick={onMobileClose}
          className="flex items-center gap-2 rounded-md px-3 py-2 font-sans text-xs text-white/60 hover:bg-white/10 hover:text-white"
        >
          ← Back to storefront
        </Link>
        <div className="flex items-center justify-between gap-3 rounded-md border border-white/10 bg-white/5 px-3 py-2">
          <div className="flex flex-col leading-tight">
            <span className="font-raleway text-xs font-bold text-white">
              {user?.name?.split(' ')[0] ?? 'Admin'}
            </span>
            <span className="font-sans text-[10px] text-white/50">{user?.email}</span>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            aria-label="Sign out"
            title="Sign out"
            className="rounded p-1 text-white/60 hover:bg-white/10 hover:text-danger"
          >
            <LogOut size={14} aria-hidden />
          </button>
        </div>
      </div>
    </aside>
    </>
  );
}
