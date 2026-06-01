'use client';

import { useEffect, useState } from 'react';
import { Loader2, Search, X } from 'lucide-react';
import { adminListProducts } from '@/lib/api/admin';

/**
 * Search-and-pick widget for selecting up to N product **slugs**.
 *
 * Why slugs and not IDs? Slugs are admin-facing (they show up in
 * URLs) and survive deletes-and-readds; IDs are opaque. The mobile
 * renderer already takes slugs to resolve via `useProduct(slug)`,
 * so we stay slug-native end to end.
 *
 * Search runs `adminListProducts({ q })` with a 250 ms debounce; the
 * dropdown shows up to 12 results. Clicking a result appends its
 * slug to `value` (de-duped, capped at `max`). Selected slugs render
 * as pills with an X to remove.
 *
 * Used by:
 *   - /admin/category-heroes (per-slide featured products)
 *   - any future surface where admin needs to point at a small set
 *     of products without typing slugs manually.
 */

const DEBOUNCE_MS = 250;
const RESULT_LIMIT = 12;

interface ResultRow {
  slug: string;
  name: string;
  image: string | null;
}

export interface ProductMultiPickerProps {
  value: string[];
  onChange: (next: string[]) => void;
  /// Hard cap. Default 2 (matches the floating-card overlay's cap on
  /// the category hero). Pass higher for other surfaces.
  max?: number;
  /// Placeholder shown in the search input.
  placeholder?: string;
}

export function ProductMultiPicker({
  value,
  onChange,
  max = 2,
  placeholder = 'Search products by name…',
}: ProductMultiPickerProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<ResultRow[]>([]);
  const [loading, setLoading] = useState(false);
  /// Selected slug → display row, so removing a pill shows a name
  /// (admins forget what `aki-and-ukwa-combo` actually was). Populated
  /// from both search results and the on-mount "hydrate selected"
  /// pass below.
  const [selectedNames, setSelectedNames] = useState<Record<string, ResultRow>>(
    {},
  );

  /// Hydrate names for slugs we got handed in `value` but haven't
  /// seen in any search yet. Runs once per new unknown slug. Bulk
  /// fetch via `adminListProducts({ ids: ... })` — wait, we have
  /// slugs not IDs. Easiest: do a single `q` per slug. There are at
  /// most `max` (=2) so this is fine; over-engineering for >2 isn't
  /// worth it yet.
  useEffect(() => {
    const missing = value.filter((s) => !selectedNames[s]);
    if (missing.length === 0) return;
    let cancelled = false;
    for (const slug of missing) {
      void adminListProducts({ q: slug, limit: 5 })
        .then((res) => {
          if (cancelled) return;
          const hit = res.items.find((p) => p.slug === slug);
          if (hit) {
            setSelectedNames((prev) => ({
              ...prev,
              [slug]: {
                slug: hit.slug,
                name: hit.name,
                image: hit.images?.[0] ?? null,
              },
            }));
          }
        })
        .catch(() => {
          /// Silent fail — pill just shows the slug literal, which is
          /// still useful information for the admin.
        });
    }
    return () => {
      cancelled = true;
    };
    // selectedNames intentionally not in deps — would refetch on every
    // hydrate. Hydrate-once-per-unknown-slug is the contract.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  /// Debounced search.
  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setResults([]);
      return;
    }
    let cancelled = false;
    setLoading(true);
    const t = setTimeout(() => {
      void adminListProducts({ q, limit: RESULT_LIMIT })
        .then((res) => {
          if (cancelled) return;
          setResults(
            res.items.map((p) => ({
              slug: p.slug,
              name: p.name,
              image: p.images?.[0] ?? null,
            })),
          );
        })
        .catch(() => {
          if (cancelled) return;
          setResults([]);
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    }, DEBOUNCE_MS);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [query]);

  const atCap = value.length >= max;

  const add = (row: ResultRow) => {
    if (atCap) return;
    if (value.includes(row.slug)) return;
    setSelectedNames((prev) => ({ ...prev, [row.slug]: row }));
    onChange([...value, row.slug]);
    setQuery('');
    setResults([]);
  };

  const remove = (slug: string) => {
    onChange(value.filter((s) => s !== slug));
  };

  return (
    <div className="flex flex-col gap-2">
      {/* Selected pills */}
      {value.length > 0 ? (
        <ul className="flex flex-wrap gap-1.5">
          {value.map((slug) => {
            const row = selectedNames[slug];
            return (
              <li
                key={slug}
                className="inline-flex items-center gap-2 rounded-pill border border-border bg-white py-1 pl-1.5 pr-2"
              >
                {row?.image ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={row.image}
                    alt=""
                    className="h-6 w-6 rounded-full object-cover"
                  />
                ) : (
                  <span className="h-6 w-6 rounded-full bg-page" />
                )}
                <span className="font-sans text-xs text-charcoal">
                  {row?.name ?? slug}
                </span>
                <button
                  type="button"
                  onClick={() => remove(slug)}
                  aria-label={`Remove ${row?.name ?? slug}`}
                  className="text-muted hover:text-danger"
                >
                  <X size={12} aria-hidden />
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}

      {/* Search + results */}
      {atCap ? (
        <p className="font-sans text-[11px] text-muted">
          Maximum {max} {max === 1 ? 'product' : 'products'} reached. Remove
          one to swap.
        </p>
      ) : (
        <div className="relative">
          <div className="flex items-center gap-2 rounded-input border border-border bg-white px-3 py-2">
            <Search size={14} className="text-muted" aria-hidden />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={placeholder}
              className="w-full bg-transparent font-sans text-sm text-charcoal placeholder:text-muted focus:outline-none"
            />
            {loading ? (
              <Loader2 size={14} className="animate-spin text-muted" aria-hidden />
            ) : null}
          </div>
          {query.trim().length >= 2 && results.length > 0 ? (
            <ul className="absolute left-0 right-0 top-full z-10 mt-1 max-h-60 overflow-auto rounded-card border border-border bg-white shadow-card">
              {results.map((r) => (
                <li key={r.slug}>
                  <button
                    type="button"
                    onClick={() => add(r)}
                    disabled={value.includes(r.slug)}
                    className="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-page disabled:opacity-50"
                  >
                    {r.image ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={r.image}
                        alt=""
                        className="h-8 w-8 shrink-0 rounded-md object-cover"
                      />
                    ) : (
                      <span className="h-8 w-8 shrink-0 rounded-md bg-page" />
                    )}
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-raleway text-sm font-semibold text-navy">
                        {r.name}
                      </span>
                      <span className="block truncate font-mono text-[10px] text-muted">
                        /{r.slug}
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
          {query.trim().length >= 2 && !loading && results.length === 0 ? (
            <p className="mt-1 font-sans text-[11px] text-muted">
              No products match &ldquo;{query.trim()}&rdquo;.
            </p>
          ) : null}
        </div>
      )}
    </div>
  );
}
