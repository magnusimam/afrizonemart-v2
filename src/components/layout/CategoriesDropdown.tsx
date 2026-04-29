'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { ChevronDown, Grid2X2 } from 'lucide-react';
import { listCategories, type ApiCategory } from '@/lib/api/categories';

const HOVER_OPEN_DELAY = 80;
const HOVER_CLOSE_DELAY = 180;

/**
 * "All Categories" header dropdown.
 *
 * - On desktop (hover-capable pointers): opens on hover with a small
 *   open/close delay so the menu doesn't flicker as the cursor
 *   crosses the gap between trigger and panel.
 * - On mobile (touch): the trigger is a click toggle, the panel
 *   closes when the visitor taps outside or picks an item.
 *
 * Categories are fetched lazily on first open and cached for the rest
 * of the session — keeps the initial nav render cheap.
 */
export function CategoriesDropdown() {
  const [open, setOpen] = useState(false);
  const [categories, setCategories] = useState<ApiCategory[] | null>(null);
  const openTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    return () => {
      if (openTimer.current) clearTimeout(openTimer.current);
      if (closeTimer.current) clearTimeout(closeTimer.current);
    };
  }, []);

  // Close on outside click (touch + desktop). Necessary because hover
  // alone doesn't fire on touch devices.
  useEffect(() => {
    if (!open) return;
    function onDocClick(e: MouseEvent) {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [open]);

  async function ensureLoaded() {
    if (categories === null) {
      const items = await listCategories();
      setCategories(items);
    }
  }

  function handleEnter() {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    openTimer.current = setTimeout(async () => {
      setOpen(true);
      await ensureLoaded();
    }, HOVER_OPEN_DELAY);
  }

  function handleLeave() {
    if (openTimer.current) clearTimeout(openTimer.current);
    closeTimer.current = setTimeout(() => setOpen(false), HOVER_CLOSE_DELAY);
  }

  function handleTriggerClick(e: React.MouseEvent) {
    // On touch (no hover), click toggles. On desktop the hover handler
    // already opened it — but a click should still navigate to /shop,
    // so we only intercept the click on touch devices that haven't
    // already opened via hover.
    if (window.matchMedia('(hover: none)').matches) {
      e.preventDefault();
      const next = !open;
      setOpen(next);
      if (next) ensureLoaded();
    }
  }

  // Show every category — even empty ones. Admins use /admin/categories
  // to control the list; the dropdown reflects the full taxonomy.
  // Categories with zero products still link to their /shop/<slug>
  // page where the visitor sees a "no products yet" empty state.
  const visible = categories ?? [];

  return (
    <div
      ref={containerRef}
      className="relative"
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
    >
      <Link
        href="/shop"
        onClick={handleTriggerClick}
        className="flex items-center gap-1 px-3 font-raleway text-xs font-semibold text-white hover:text-amber md:px-6 md:text-sm"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        All Categories
        <ChevronDown
          size={14}
          aria-hidden
          className={`transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </Link>

      {open ? (
        <div
          role="menu"
          className="absolute left-0 top-full z-50 mt-1 min-w-[240px] max-w-[calc(100vw-1.5rem)] overflow-hidden rounded-card border border-border bg-white shadow-card md:max-w-[320px]"
          onMouseEnter={handleEnter}
          onMouseLeave={handleLeave}
        >
          <div className="flex items-center justify-between gap-2 border-b border-border bg-page px-4 py-2.5">
            <span className="flex items-center gap-1.5 font-raleway text-[10px] font-bold uppercase tracking-btn text-navy">
              <Grid2X2 size={12} aria-hidden /> Browse Categories
            </span>
            <Link
              href="/shop"
              className="font-sans text-[11px] font-semibold text-amber hover:underline"
              role="menuitem"
            >
              View all →
            </Link>
          </div>

          {categories === null ? (
            <div className="px-4 py-6 text-center font-sans text-xs text-muted">
              Loading…
            </div>
          ) : visible.length === 0 ? (
            <div className="px-4 py-6 text-center font-sans text-xs text-muted">
              No categories available yet.
            </div>
          ) : (
            <ul className="max-h-[60vh] overflow-y-auto py-1">
              {visible.map((c) => (
                <li key={c.id}>
                  <Link
                    href={`/shop/${c.slug}`}
                    role="menuitem"
                    onClick={() => setOpen(false)}
                    className="flex items-center justify-between gap-3 px-4 py-2.5 font-sans text-sm text-charcoal transition-colors hover:bg-page hover:text-navy"
                  >
                    <span className="font-medium">{c.name}</span>
                    <span className="font-mono text-[10px] text-muted">
                      {c.productCount}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
}
