'use client';

import Link from 'next/link';
import {
  Coins,
  Heart,
  LayoutDashboard,
  MapPin,
  Package,
  Share2,
  User,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

/**
 * 2026-05-16 — mobile-only horizontal nav for the /account section.
 * The AccountSidebar is hidden under lg: so it didn't crowd the
 * already-short mobile viewport. This bar gives mobile customers
 * the same one-tap navigation across account pages, scrolled
 * horizontally if it overflows.
 *
 * Visually a tight chip row with icon + label. The active chip
 * highlights in navy; others sit on the page background. Touch
 * targets stay ~36px tall (chip height + padding) — comfortable
 * thumb-tappable size without dominating the layout.
 */

interface NavItem {
  href: string;
  label: string;
  Icon: LucideIcon;
}

const navItems: NavItem[] = [
  { href: '/account', label: 'Home', Icon: LayoutDashboard },
  { href: '/account/orders', label: 'Orders', Icon: Package },
  { href: '/account/rewards', label: 'Rewards', Icon: Coins },
  { href: '/account/refer', label: 'Refer', Icon: Share2 },
  { href: '/account/wishlist', label: 'Wishlist', Icon: Heart },
  { href: '/account/addresses', label: 'Addresses', Icon: MapPin },
  { href: '/account/profile', label: 'Profile', Icon: User },
];

interface Props {
  active: string;
}

export function AccountMobileNav({ active }: Props) {
  return (
    <nav
      aria-label="Account section navigation"
      className="-mx-4 mb-4 overflow-x-auto px-4 lg:hidden"
    >
      <ul className="flex w-max gap-2 pb-1">
        {navItems.map(({ href, label, Icon }) => {
          const isActive = active === href;
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={isActive ? 'page' : undefined}
                className={[
                  'flex items-center gap-1.5 rounded-full border px-3 py-1.5 font-raleway text-xs font-semibold transition-colors',
                  isActive
                    ? 'border-navy bg-navy text-white'
                    : 'border-border bg-white text-charcoal',
                ].join(' ')}
              >
                <Icon size={14} aria-hidden />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
