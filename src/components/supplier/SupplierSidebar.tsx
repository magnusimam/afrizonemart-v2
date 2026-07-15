'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Home,
  HelpCircle,
  LayoutGrid,
  LifeBuoy,
  LogOut,
  Package,
  User,
  X,
} from 'lucide-react';
import { logoutUser } from '@/lib/api/auth';
import { useAuthStore } from '@/stores/authStore';

interface NavItem {
  href: string;
  label: string;
  icon: typeof Home;
}

const NAV: NavItem[] = [
  { href: '/supplier/dashboard', label: 'Dashboard', icon: Home },
  { href: '/supplier/piqs', label: 'My PIQs', icon: Package },
  { href: '/supplier/support', label: 'Support', icon: LifeBuoy },
  { href: '/supplier/profile', label: 'Profile', icon: User },
];

interface Props {
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

export function SupplierSidebar({ mobileOpen = false, onMobileClose }: Props) {
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
    router.push('/supplier/login');
  };

  const greeting = user?.name?.split(' ')[0] ?? 'there';
  const dashboardHref = '/supplier/dashboard';

  return (
    <>
      {/* Mobile backdrop */}
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
        {/* Mobile close button */}
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
            href={dashboardHref}
            onClick={onMobileClose}
            className="flex flex-col gap-0.5"
          >
            <span className="font-raleway text-xs font-semibold uppercase tracking-btn text-amber">
              Afrizonemart
            </span>
            <span className="font-raleway text-lg font-bold leading-tight">
              Supplier Portal
            </span>
          </Link>
        </div>

        {/* Greeting strip — surfaces who's logged in. */}
        <div className="mx-3 mb-4 rounded-md border border-white/10 bg-white/5 px-3 py-2">
          <p className="font-raleway text-[11px] font-semibold uppercase tracking-btn text-amber">
            Hi, {greeting}
          </p>
          <p className="mt-0.5 font-sans text-xs text-white/70">
            {user?.email ?? 'Supplier account'}
          </p>
        </div>

        <nav className="flex flex-1 flex-col gap-0.5 px-2">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active =
              pathname === href || (href !== '/supplier' && pathname.startsWith(href));
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
            <LayoutGrid size={12} aria-hidden /> Storefront
          </Link>
          <Link
            href="/supplier/support"
            onClick={onMobileClose}
            className="flex items-center gap-2 rounded-md px-3 py-2 font-sans text-xs text-white/60 hover:bg-white/10 hover:text-white"
          >
            <HelpCircle size={12} aria-hidden /> Need help?
          </Link>
          <div className="flex items-center justify-between gap-3 rounded-md border border-white/10 bg-white/5 px-3 py-2">
            <div className="flex flex-col leading-tight">
              <span className="font-raleway text-xs font-bold text-white">
                {user?.name?.split(' ')[0] ?? 'Supplier'}
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
