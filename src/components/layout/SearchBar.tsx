'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useId, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';
import { fetchAutocomplete, type AutocompleteResponse } from '@/lib/api/search';
import { formatNaira } from '@/lib/format';

/**
 * Header search — a real `<form action="/search" method="GET">` (works
 * with JS disabled) layered with a debounced autocomplete dropdown
 * (Search & Discovery Phase 0, `GET /api/search/autocomplete`).
 *
 * Two visual variants reusing the exact markup/classes the plain forms
 * in `Header.tsx` used before this replaced them, so nothing shifts
 * pixel-wise — see `afrizonemart-api` PR #79/#80 for the backend.
 */

const DEBOUNCE_MS = 200;
const MIN_CHARS = 2;

interface Props {
  variant: 'mobile' | 'desktop';
}

export function SearchBar({ variant }: Props) {
  const router = useRouter();
  const listboxId = useId();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<AutocompleteResponse | null>(null);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const containerRef = useRef<HTMLFormElement>(null);

  // Combined, indexable suggestion list — queries first, then product
  // jumps — so arrow-key navigation has one flat index space.
  const flatItems = results
    ? [
        ...results.queries.map((q) => ({ kind: 'query' as const, value: q })),
        ...results.products.map((p) => ({
          kind: 'product' as const,
          value: p,
        })),
      ]
    : [];

  useEffect(() => {
    const q = query.trim();
    if (q.length < MIN_CHARS) {
      setResults(null);
      setActiveIndex(-1);
      return;
    }
    let cancelled = false;
    const controller = new AbortController();
    const t = setTimeout(() => {
      void fetchAutocomplete(q, 6, controller.signal)
        .then((res) => {
          if (cancelled) return;
          setResults(res);
          setActiveIndex(-1);
        })
        .catch(() => {
          if (cancelled) return;
          setResults(null);
        });
    }, DEBOUNCE_MS);
    return () => {
      cancelled = true;
      controller.abort();
      clearTimeout(t);
    };
  }, [query]);

  // Close on outside click.
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [open]);

  const goToQuery = (q: string) => {
    setOpen(false);
    router.push(`/search?q=${encodeURIComponent(q)}`);
  };

  const goToProduct = (slug: string) => {
    setOpen(false);
    router.push(`/product/${slug}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open || flatItems.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => (i + 1) % flatItems.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => (i <= 0 ? flatItems.length - 1 : i - 1));
    } else if (e.key === 'Escape') {
      setOpen(false);
    } else if (e.key === 'Enter' && activeIndex >= 0) {
      e.preventDefault();
      const item = flatItems[activeIndex];
      if (item.kind === 'query') goToQuery(item.value);
      else goToProduct(item.value.slug);
    }
    // Plain Enter with nothing highlighted falls through to the
    // form's native GET submit — /search already handles `q`.
  };

  const showDropdown =
    open && query.trim().length >= MIN_CHARS && results !== null;

  const formClass =
    variant === 'mobile'
      ? 'relative flex items-stretch gap-0 px-3 pb-2.5 md:hidden'
      : 'relative flex max-w-[720px] flex-1 items-stretch overflow-hidden rounded-input border border-border bg-white';
  const inputClass =
    variant === 'mobile'
      ? 'min-w-0 flex-1 rounded-l-input border border-r-0 border-border bg-white px-3 py-2.5 font-sans text-base text-charcoal placeholder:text-muted focus:outline-none'
      : 'min-w-0 flex-1 px-4 py-2.5 font-sans text-sm text-charcoal placeholder:text-muted focus:outline-none';
  const buttonClass =
    variant === 'mobile'
      ? 'flex min-h-[44px] items-center justify-center gap-1.5 rounded-r-input bg-navy px-5 font-raleway text-xs font-bold uppercase tracking-btn text-white transition-colors hover:bg-navy/90 active:bg-navy/80'
      : 'flex items-center gap-2 bg-navy px-5 font-raleway text-xs font-bold uppercase tracking-btn text-white transition-colors hover:bg-navy-dark md:px-7 md:text-sm';
  const placeholder =
    variant === 'mobile'
      ? 'Search products, brands & categories'
      : 'Search for products, brands & categories...';

  return (
    <form
      ref={containerRef}
      role="search"
      action="/search"
      method="GET"
      className={formClass}
    >
      <input
        type="search"
        name="q"
        role="combobox"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        aria-label="Search products"
        aria-autocomplete="list"
        aria-expanded={showDropdown}
        aria-controls={listboxId}
        aria-activedescendant={
          activeIndex >= 0 ? `${listboxId}-opt-${activeIndex}` : undefined
        }
        enterKeyHint="search"
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck={false}
        className={inputClass}
      />
      <button type="submit" aria-label="Search" className={buttonClass}>
        <Search size={variant === 'mobile' ? 14 : 16} aria-hidden />
        Search
      </button>

      {showDropdown && flatItems.length > 0 && (
        <ul
          id={listboxId}
          role="listbox"
          className="absolute left-0 right-0 top-full z-50 mt-1 max-h-96 overflow-y-auto rounded-card border border-border bg-white py-1 shadow-card-hover"
        >
          {results!.queries.length > 0 && (
            <li className="px-3 py-1 font-raleway text-[10px] font-bold uppercase tracking-btn text-muted">
              Suggestions
            </li>
          )}
          {results!.queries.map((q, i) => (
            <li
              key={`q-${q}`}
              id={`${listboxId}-opt-${i}`}
              role="option"
              aria-selected={activeIndex === i}
            >
              <button
                type="button"
                onClick={() => goToQuery(q)}
                onMouseEnter={() => setActiveIndex(i)}
                className={`flex w-full items-center gap-2 px-3 py-2 text-left font-sans text-sm text-charcoal ${
                  activeIndex === i ? 'bg-page' : 'hover:bg-page'
                }`}
              >
                <Search size={13} className="shrink-0 text-muted" aria-hidden />
                {q}
              </button>
            </li>
          ))}

          {results!.products.length > 0 && (
            <li className="px-3 py-1 font-raleway text-[10px] font-bold uppercase tracking-btn text-muted">
              Products
            </li>
          )}
          {results!.products.map((p, idx) => {
            const i = results!.queries.length + idx;
            return (
              <li
                key={p.id}
                id={`${listboxId}-opt-${i}`}
                role="option"
                aria-selected={activeIndex === i}
              >
                <Link
                  href={`/product/${p.slug}`}
                  onClick={() => setOpen(false)}
                  onMouseEnter={() => setActiveIndex(i)}
                  className={`flex items-center gap-3 px-3 py-2 font-sans text-sm text-charcoal ${
                    activeIndex === i ? 'bg-page' : 'hover:bg-page'
                  }`}
                >
                  <span className="relative h-9 w-9 shrink-0 overflow-hidden rounded-md bg-page">
                    {p.image ? (
                      <Image
                        src={p.image}
                        alt=""
                        fill
                        sizes="36px"
                        className="object-cover"
                      />
                    ) : null}
                  </span>
                  <span className="min-w-0 flex-1 truncate">{p.name}</span>
                  <span className="shrink-0 font-raleway text-xs font-semibold text-navy">
                    {formatNaira(p.price)}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </form>
  );
}
