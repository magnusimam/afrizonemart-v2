'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  BarChart3,
  Boxes,
  ClipboardList,
  FileClock,
  Home,
  LogOut,
  Mail,
  PercentCircle,
  Plug,
  Settings,
  ShieldCheck,
  ShoppingBag,
  Tags,
  Truck,
  Users,
  type LucideIcon,
} from 'lucide-react';
import { logoutUser } from '@/lib/api/auth';
import { useAuthStore } from '@/stores/authStore';

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  disabled?: boolean;
}

const NAV: NavItem[] = [
  { href: '/admin', label: 'Dashboard', icon: Home },
  { href: '/admin/orders', label: 'Orders', icon: ShoppingBag },
  { href: '/admin/products', label: 'Products', icon: Boxes },
  { href: '/admin/categories', label: 'Categories', icon: Tags },
  { href: '/admin/reviews', label: 'Reviews', icon: ClipboardList },
  { href: '/admin/customers', label: 'Customers', icon: Users },
  { href: '/admin/staff', label: 'Staff & Roles', icon: ShieldCheck },
  { href: '/admin/coupons', label: 'Discounts', icon: PercentCircle },
  { href: '/admin/shipping', label: 'Shipping', icon: Truck },
  { href: '/admin/reports', label: 'Reports', icon: BarChart3 },
  { href: '/admin/webhooks', label: 'Webhooks', icon: Plug },
  { href: '/admin/notifications', label: 'Notifications', icon: Mail },
  { href: '/admin/audit', label: 'Audit Log', icon: FileClock },
  { href: '/admin/settings', label: 'Settings', icon: Settings },
];

export function AdminSidebar() {
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

  return (
    <aside className="flex w-60 shrink-0 flex-col gap-1 border-r border-white/10 bg-navy py-6 text-white">
      <div className="px-5 pb-6">
        <Link href="/admin" className="flex flex-col gap-0.5">
          <span className="font-raleway text-xs font-semibold uppercase tracking-btn text-amber">
            Afrizonemart
          </span>
          <span className="font-raleway text-lg font-bold leading-tight">
            Admin Console
          </span>
        </Link>
      </div>

      <nav className="flex flex-1 flex-col gap-0.5 px-2">
        {NAV.map(({ href, label, icon: Icon, disabled }) => {
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
  );
}
