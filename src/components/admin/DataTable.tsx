'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';

export interface Column<T> {
  key: string;
  header: React.ReactNode;
  render: (row: T) => React.ReactNode;
  className?: string;
}

interface Props<T> {
  rows: T[];
  columns: Column<T>[];
  rowKey: (row: T) => string;
  emptyState?: React.ReactNode;
  loading?: boolean;
  pagination?: {
    page: number;
    pages: number;
    total: number;
    onPage: (page: number) => void;
  };
}

/**
 * Minimal table for admin list views. Plain HTML table — TanStack Table
 * goes in once we need column resize / sticky headers / sortable cols.
 */
export function DataTable<T>({
  rows,
  columns,
  rowKey,
  emptyState,
  loading,
  pagination,
}: Props<T>) {
  return (
    <div className="overflow-hidden rounded-card border border-border bg-white shadow-card">
      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse text-left font-sans text-sm">
          <thead>
            <tr className="border-b border-border bg-page">
              {columns.map((c) => (
                <th
                  key={c.key}
                  className={`whitespace-nowrap px-4 py-3 font-raleway text-[11px] font-bold uppercase tracking-btn text-muted ${c.className ?? ''}`}
                >
                  {c.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={columns.length} className="px-4 py-10 text-center text-muted">
                  Loading…
                </td>
              </tr>
            )}
            {!loading && rows.length === 0 && (
              <tr>
                <td colSpan={columns.length} className="px-4 py-10 text-center text-muted">
                  {emptyState ?? 'No results.'}
                </td>
              </tr>
            )}
            {!loading &&
              rows.map((row) => (
                <tr
                  key={rowKey(row)}
                  className="border-b border-border last:border-b-0 hover:bg-page/60"
                >
                  {columns.map((c) => (
                    <td key={c.key} className={`px-4 py-3 align-middle ${c.className ?? ''}`}>
                      {c.render(row)}
                    </td>
                  ))}
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {pagination && pagination.pages > 1 && (
        <div className="flex items-center justify-between gap-3 border-t border-border bg-page px-4 py-2 font-sans text-xs text-muted">
          <span>
            Page {pagination.page} of {pagination.pages} · {pagination.total.toLocaleString()} total
          </span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => pagination.onPage(pagination.page - 1)}
              disabled={pagination.page <= 1}
              className="flex items-center gap-1 rounded-md border border-border bg-white px-2 py-1 hover:bg-page disabled:cursor-not-allowed disabled:opacity-50"
            >
              <ChevronLeft size={14} aria-hidden /> Prev
            </button>
            <button
              type="button"
              onClick={() => pagination.onPage(pagination.page + 1)}
              disabled={pagination.page >= pagination.pages}
              className="flex items-center gap-1 rounded-md border border-border bg-white px-2 py-1 hover:bg-page disabled:cursor-not-allowed disabled:opacity-50"
            >
              Next <ChevronRight size={14} aria-hidden />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
