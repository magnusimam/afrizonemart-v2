import Link from 'next/link';
import {
  Heart,
  LayoutDashboard,
  LogOut,
  MapPin,
  Package,
  User,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface NavItem {
  href: string;
  label: string;
  Icon: LucideIcon;
}

const navItems: NavItem[] = [
  { href: '/account', label: 'Dashboard', Icon: LayoutDashboard },
  { href: '/account/orders', label: 'Orders', Icon: Package },
  { href: '/account/wishlist', label: 'Wishlist', Icon: Heart },
  { href: '/account/addresses', label: 'Addresses', Icon: MapPin },
  { href: '/account/profile', label: 'Profile', Icon: User },
];

interface AccountSidebarProps {
  active: string;
  userFirstName: string;
  userLastName: string;
}

export function AccountSidebar({
  active,
  userFirstName,
  userLastName,
}: AccountSidebarProps) {
  const initials = `${userFirstName.charAt(0)}${userLastName.charAt(0)}`;

  return (
    <aside className="lg:sticky lg:top-4">
      <div className="flex flex-col gap-2 rounded-card border border-border bg-white p-4 shadow-card md:p-5">
        <div className="flex items-center gap-3 border-b border-border pb-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-navy font-raleway text-base font-bold text-white">
            {initials}
          </div>
          <div className="flex flex-col">
            <span className="font-raleway text-sm font-bold text-navy">
              {userFirstName} {userLastName}
            </span>
            <span className="font-sans text-xs text-muted">Member</span>
          </div>
        </div>

        <nav aria-label="Account navigation" className="flex flex-col gap-1 pt-3">
          {navItems.map(({ href, label, Icon }) => {
            const isActive = active === href;
            return (
              <Link
                key={href}
                href={href}
                aria-current={isActive ? 'page' : undefined}
                className={`flex items-center gap-3 rounded-btn px-3 py-2.5 font-raleway text-sm font-semibold transition-colors ${
                  isActive
                    ? 'bg-navy text-white'
                    : 'text-charcoal hover:bg-page hover:text-navy'
                }`}
              >
                <Icon size={18} strokeWidth={1.75} aria-hidden />
                {label}
              </Link>
            );
          })}

          <Link
            href="/login"
            className="mt-2 flex items-center gap-3 rounded-btn px-3 py-2.5 font-raleway text-sm font-semibold text-danger transition-colors hover:bg-danger/10"
          >
            <LogOut size={18} strokeWidth={1.75} aria-hidden />
            Sign Out
          </Link>
        </nav>
      </div>
    </aside>
  );
}
