'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import {
  ExternalLink,
  FileSpreadsheet,
  Headset,
  Home,
  LogOut,
  User,
  X,
  type LucideIcon,
} from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { logoutUser } from '@/lib/api/auth';

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

const NAV: NavItem[] = [
  { href: '/supplier/dashboard', label: 'Dashboard', icon: Home },
  { href: '/supplier/piqs', label: 'My PIQs', icon: FileSpreadsheet },
  { href: '/supplier/support', label: 'Support', icon: Headset },
  { href: '/supplier/profile', label: 'Profile', icon: User },
];

interface Props {
  mobileOpen: boolean;
  onMobileClose: () => void;
}

/**
 * Supplier portal navigation — the supplier mirror of AdminSidebar.
 *   - md+: a slim rail that expands on hover/focus as an overlay, so the
 *          page stays wide. The Afrizonemart "A" brand mark is always
 *          visible; the full wordmark reveals when expanded.
 *   - <md: full-width slide-in drawer (always expanded).
 */
export function SupplierSidebar({ mobileOpen, onMobileClose }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);

  const handleSignOut = async () => {
    onMobileClose();
    const token = useAuthStore.getState().accessToken;
    try {
      if (token) await logoutUser(token);
    } catch {
      /* even if the server call fails, clear locally */
    }
    useAuthStore.getState().clear();
    router.push('/suppliers');
  };

  /** `mini` = the slim desktop rail (mark + icons only). */
  const renderBody = (mini: boolean) => (
    <div className="flex h-full flex-col bg-navy text-white">
      {/* Brand — the "A" mark is always shown; wordmark appears when wide. */}
      <div
        className={`flex items-center gap-2.5 border-b border-white/10 py-5 ${
          mini ? 'justify-center px-2' : 'px-4'
        }`}
      >
        <Link
          href="/suppliers"
          className="flex items-center gap-2.5"
          onClick={onMobileClose}
          aria-label="Afrizonemart for Suppliers"
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber to-amber-dark font-raleway text-lg font-extrabold text-navy shadow-md">
            A
          </span>
          {!mini && (
            <span className="leading-tight">
              <span className="block whitespace-nowrap font-raleway text-base font-extrabold text-white">
                Afrizonemart
              </span>
              <span className="block whitespace-nowrap font-raleway text-[10px] font-bold uppercase tracking-[0.18em] text-amber">
                Supplier Portal
              </span>
            </span>
          )}
        </Link>
        {!mini && (
          <button
            type="button"
            onClick={onMobileClose}
            aria-label="Close menu"
            className="ml-auto rounded-md p-1.5 text-white/80 hover:bg-white/10 md:hidden"
          >
            <X size={18} aria-hidden />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-3">
        <ul className="flex flex-col gap-1">
          {NAV.map((item) => {
            const active =
              pathname === item.href || pathname.startsWith(`${item.href}/`);
            const Icon = item.icon;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={onMobileClose}
                  title={mini ? item.label : undefined}
                  aria-label={item.label}
                  className={`flex items-center rounded-btn font-raleway text-sm font-semibold transition-colors ${
                    mini ? 'justify-center px-0 py-3' : 'gap-3 px-3 py-2.5'
                  } ${
                    active
                      ? 'bg-amber text-navy'
                      : 'text-white/80 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <Icon size={18} aria-hidden className="shrink-0" />
                  {!mini && <span className="whitespace-nowrap">{item.label}</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Exit / sign out */}
      <div className="flex flex-col gap-1 border-t border-white/10 px-3 py-3">
        <Link
          href="/suppliers"
          onClick={onMobileClose}
          title={mini ? 'Exit portal' : undefined}
          aria-label="Exit portal"
          className={`flex items-center rounded-btn font-raleway text-sm font-semibold text-white/60 transition-colors hover:bg-white/10 hover:text-white ${
            mini ? 'justify-center px-0 py-3' : 'gap-3 px-3 py-2.5'
          }`}
        >
          <ExternalLink size={18} aria-hidden className="shrink-0" />
          {!mini && <span className="whitespace-nowrap">Exit portal</span>}
        </Link>
        <button
          type="button"
          onClick={handleSignOut}
          title={mini ? 'Sign out' : undefined}
          aria-label="Sign out"
          className={`flex items-center rounded-btn font-raleway text-sm font-semibold text-white/60 transition-colors hover:bg-white/10 hover:text-white ${
            mini ? 'justify-center px-0 py-3' : 'gap-3 px-3 py-2.5'
          }`}
        >
          <LogOut size={18} aria-hidden className="shrink-0" />
          {!mini && <span className="whitespace-nowrap">Sign out</span>}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop: slim rail (reserves 76px) that expands to an overlay on
          hover/focus without pushing the page. */}
      <aside className="sticky top-0 z-30 hidden h-screen w-[76px] shrink-0 md:block">
        <div
          onMouseEnter={() => setExpanded(true)}
          onMouseLeave={() => setExpanded(false)}
          onFocusCapture={() => setExpanded(true)}
          onBlurCapture={(e) => {
            if (!e.currentTarget.contains(e.relatedTarget as Node)) setExpanded(false);
          }}
          className={`absolute left-0 top-0 h-full transition-[width] duration-200 ease-out ${
            expanded ? 'w-64 shadow-2xl' : 'w-[76px]'
          }`}
        >
          {renderBody(!expanded)}
        </div>
      </aside>

      {/* Mobile drawer (always full width) */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={onMobileClose}
            aria-hidden
          />
          <div className="absolute left-0 top-0 h-full w-64 shadow-card-hover">
            {renderBody(false)}
          </div>
        </div>
      )}
    </>
  );
}
