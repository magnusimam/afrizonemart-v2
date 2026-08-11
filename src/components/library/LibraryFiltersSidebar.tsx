'use client';

import { useCallback } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { COUNTRIES, COUNTRY_CODES, type CountryCode } from '@/lib/countries';
import type { DocumentType } from '@/lib/api/documents';

/// URL-bound filter sidebar for /library, mirroring the URL-param
/// pattern in `FiltersSidebar` (shop) but scoped to the two groups
/// Civic Library actually has — country and document type. Kept as
/// its own small component rather than extending `FiltersSidebar`,
/// which is wired to price/rating/stock filters that don't apply to
/// free public documents.

export const LIBRARY_FILTER_PARAM_KEYS = ['country', 'docType'] as const;

const DOC_TYPES: { value: DocumentType; label: string }[] = [
  { value: 'CONSTITUTION', label: 'Constitution' },
  { value: 'ACT', label: 'Act' },
  { value: 'BILL', label: 'Bill' },
  { value: 'POLICY', label: 'Policy' },
  { value: 'REGULATION', label: 'Regulation' },
  { value: 'TREATY', label: 'Treaty' },
  { value: 'OTHER', label: 'Other' },
];

export function LibraryFiltersSidebar({ onClose }: { onClose?: () => void }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const selectedCountry = (searchParams.get('country') ?? '').toUpperCase();
  const selectedDocType = searchParams.get('docType') ?? '';

  const writeParams = useCallback(
    (mutate: (params: URLSearchParams) => void) => {
      const params = new URLSearchParams(searchParams.toString());
      mutate(params);
      params.delete('page');
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  const setOrUnset = useCallback(
    (key: string, value: string | null) => {
      writeParams((p) => {
        if (!value) p.delete(key);
        else p.set(key, value);
      });
    },
    [writeParams],
  );

  const clearAll = useCallback(() => {
    writeParams((p) => {
      for (const key of LIBRARY_FILTER_PARAM_KEYS) p.delete(key);
    });
  }, [writeParams]);

  return (
    <aside className="flex flex-col gap-4 rounded-card border border-border bg-white p-4 shadow-card md:p-5">
      <header className="flex items-center justify-between gap-3 border-b border-border pb-3">
        <h2 className="font-raleway text-base font-bold text-navy md:text-lg">Filters</h2>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={clearAll}
            className="font-raleway text-[10px] font-bold uppercase tracking-btn text-amber hover:underline md:text-xs"
          >
            Clear all
          </button>
          {onClose ? (
            <button
              type="button"
              onClick={onClose}
              aria-label="Close filters"
              className="text-muted lg:hidden"
            >
              ✕
            </button>
          ) : null}
        </div>
      </header>

      <FilterGroup title="Document Type">
        <ul className="flex flex-col gap-2">
          {DOC_TYPES.map((t) => (
            <li key={t.value}>
              <label className="flex cursor-pointer items-center gap-2 font-sans text-sm text-charcoal">
                <input
                  type="radio"
                  name="docType"
                  checked={selectedDocType === t.value}
                  onChange={() => setOrUnset('docType', t.value)}
                  className="h-4 w-4 cursor-pointer accent-navy"
                />
                {t.label}
              </label>
            </li>
          ))}
        </ul>
        {selectedDocType ? (
          <button
            type="button"
            onClick={() => setOrUnset('docType', null)}
            className="mt-2 font-raleway text-[10px] font-bold uppercase tracking-btn text-amber hover:underline"
          >
            Clear document type
          </button>
        ) : null}
      </FilterGroup>

      <FilterGroup title="Country">
        <ul className="flex max-h-72 flex-col gap-2 overflow-y-auto">
          {COUNTRY_CODES.map((c: CountryCode) => (
            <li key={c}>
              <label className="flex cursor-pointer items-center gap-2 font-sans text-sm text-charcoal">
                <input
                  type="radio"
                  name="country"
                  checked={selectedCountry === c}
                  onChange={() => setOrUnset('country', c)}
                  className="h-4 w-4 cursor-pointer accent-navy"
                />
                <span aria-hidden>{COUNTRIES[c].flag}</span>
                {COUNTRIES[c].name}
              </label>
            </li>
          ))}
        </ul>
        {selectedCountry ? (
          <button
            type="button"
            onClick={() => setOrUnset('country', null)}
            className="mt-2 font-raleway text-[10px] font-bold uppercase tracking-btn text-amber hover:underline"
          >
            Clear country
          </button>
        ) : null}
      </FilterGroup>
    </aside>
  );
}

function FilterGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <details open className="group">
      <summary className="flex cursor-pointer items-center justify-between gap-2 py-2 font-raleway text-xs font-bold uppercase tracking-btn text-navy">
        {title}
      </summary>
      <div className="pb-2 pt-1">{children}</div>
    </details>
  );
}
