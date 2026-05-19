'use client';

import { useState } from 'react';
import { SafeBoundary } from '@/components/common/SafeBoundary';
import { FiltersSidebar } from './FiltersSidebar';
import { ShopToolbar } from './ShopToolbar';
import type { ApiCategory } from '@/lib/api/categories';

/**
 * Client shell that owns the mobile filter-drawer state and hosts the
 * sidebar + toolbar. The shop pages stay server components and pass
 * the pre-fetched category tree plus their already-resolved product
 * grid as children.
 *
 * On desktop the sidebar lives in a regular `col-span-3` column.
 * On mobile it's hidden and only mounts inside a slide-in drawer
 * when the toolbar's Filters button is tapped.
 */
interface ShopShellProps {
  categories?: ApiCategory[];
  total: number;
  showCountryFilter?: boolean;
  showCategoryFilter?: boolean;
  children: React.ReactNode;
}

export function ShopShell({
  categories,
  total,
  showCountryFilter = true,
  showCategoryFilter = true,
  children,
}: ShopShellProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:gap-8">
      <div className="hidden lg:col-span-3 lg:block">
        <SafeBoundary name="shop:filters" fallback={null}>
          <FiltersSidebar
            categories={categories}
            showCountryFilter={showCountryFilter}
            showCategoryFilter={showCategoryFilter}
          />
        </SafeBoundary>
      </div>

      <div className="flex flex-col gap-4 lg:col-span-9 lg:gap-6">
        <SafeBoundary name="shop:toolbar" fallback={null}>
          <ShopToolbar total={total} onOpenFilters={() => setDrawerOpen(true)} />
        </SafeBoundary>

        {children}
      </div>

      {drawerOpen ? (
        <div
          className="fixed inset-0 z-50 flex lg:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Filters"
        >
          <button
            type="button"
            aria-label="Close filters"
            onClick={() => setDrawerOpen(false)}
            className="flex-1 bg-black/40"
          />
          <div className="h-full w-[88%] max-w-sm overflow-y-auto bg-white shadow-xl">
            <SafeBoundary name="shop:filters-drawer" fallback={null}>
              <FiltersSidebar
                categories={categories}
                showCountryFilter={showCountryFilter}
                showCategoryFilter={showCategoryFilter}
                onClose={() => setDrawerOpen(false)}
              />
            </SafeBoundary>
          </div>
        </div>
      ) : null}
    </div>
  );
}
