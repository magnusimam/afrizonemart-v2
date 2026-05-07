'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ChevronRight, Eye, EyeOff, Package } from 'lucide-react';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { toast } from '@/components/admin/Toast';
import { HttpApiError } from '@/lib/api/client';
import { adminListShelves, type ShelfListItem } from '@/lib/api/admin';

/**
 * Phase 10.8 — admin "Shelves" overview.
 *
 * Lists every placement key the storefront supports (homepage rails,
 * curated landing-page rows, CMS-page features) grouped by purpose,
 * with the current product count + container settings, and a click
 * through to the detail editor.
 */
export default function AdminShelvesPage() {
  const [data, setData] = useState<{
    groups: Record<string, string>;
    items: ShelfListItem[];
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void adminListShelves()
      .then(setData)
      .catch((e) =>
        toast(e instanceof HttpApiError ? e.message : 'Failed to load shelves', 'error'),
      )
      .finally(() => setLoading(false));
  }, []);

  const grouped = useMemo(() => {
    if (!data) return [];
    const byGroup = new Map<string, ShelfListItem[]>();
    for (const it of data.items) {
      if (!byGroup.has(it.group)) byGroup.set(it.group, []);
      byGroup.get(it.group)!.push(it);
    }
    // Render groups in registry order; CMS group last.
    const order = ['pages', 'homepage_shelves', 'curated_lists', 'cms_pages'];
    return order
      .filter((g) => byGroup.has(g))
      .map((g) => ({
        groupKey: g,
        groupLabel: data.groups[g] ?? g,
        items: byGroup.get(g)!,
      }));
  }, [data]);

  return (
    <div className="px-8 py-10">
      <AdminPageHeader
        title="Shelves"
        subtitle="Pick which products show on every shelf across the site, set how many rows render, and disable shelves you don't want live yet. Changes go live the moment you save."
      />

      {loading ? (
        <p className="font-sans text-sm text-muted">Loading…</p>
      ) : !data || data.items.length === 0 ? (
        <p className="rounded-card border border-border bg-page px-4 py-6 text-center font-sans text-sm text-muted">
          No shelves available.
        </p>
      ) : (
        <div className="flex flex-col gap-8">
          {grouped.map((g) => (
            <section key={g.groupKey} className="rounded-card border border-border bg-white">
              <header className="border-b border-border bg-page px-5 py-3">
                <h2 className="font-raleway text-lg font-bold text-navy">{g.groupLabel}</h2>
              </header>
              <ul className="flex flex-col divide-y divide-border">
                {g.items.map((item) => (
                  <li key={item.key}>
                    <Link
                      href={`/admin/shelves/${encodeURIComponent(item.key)}`}
                      className="group flex items-center justify-between gap-4 px-5 py-4 hover:bg-page/60"
                    >
                      <div className="flex flex-col gap-1 leading-tight">
                        <div className="flex items-center gap-2">
                          <span className="font-raleway text-sm font-bold text-navy">
                            {item.shelf.title}
                          </span>
                          {!item.shelf.enabled && (
                            <span className="inline-flex items-center gap-1 rounded-full border border-muted/40 bg-muted/10 px-2 py-0.5 font-raleway text-[10px] font-bold uppercase tracking-btn text-muted">
                              <EyeOff size={11} aria-hidden /> Hidden
                            </span>
                          )}
                          {item.shelf.enabled && (
                            <span className="inline-flex items-center gap-1 rounded-full border border-success/30 bg-success/10 px-2 py-0.5 font-raleway text-[10px] font-bold uppercase tracking-btn text-success">
                              <Eye size={11} aria-hidden /> Live
                            </span>
                          )}
                        </div>
                        <span className="font-mono text-[11px] text-muted">{item.key}</span>
                        <p className="font-sans text-xs leading-snug text-charcoal/70">
                          {item.description}
                        </p>
                      </div>
                      <div className="flex items-center gap-5">
                        <div className="flex flex-col items-end leading-tight">
                          <span className="font-raleway text-base font-bold text-navy">
                            {item.shelf.rows} × {item.shelf.cols}
                          </span>
                          <span className="font-sans text-[10px] uppercase tracking-btn text-muted">
                            rows × cols
                          </span>
                        </div>
                        <div className="flex items-center gap-1 rounded-full border border-border bg-white px-2.5 py-1 font-raleway text-[11px] font-bold text-navy">
                          <Package size={12} aria-hidden /> {item.productCount}
                        </div>
                        <ChevronRight
                          size={18}
                          className="text-muted group-hover:text-navy"
                          aria-hidden
                        />
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
