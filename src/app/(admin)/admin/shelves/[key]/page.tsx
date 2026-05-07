'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useParams } from 'next/navigation';
import {
  ArrowDown,
  ArrowUp,
  Check,
  ChevronLeft,
  Download,
  Globe,
  Save,
  Search,
  Trash2,
  X,
} from 'lucide-react';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { toast } from '@/components/admin/Toast';
import { HttpApiError } from '@/lib/api/client';
import {
  adminGetShelf,
  adminListProducts,
  adminSetShelfProducts,
  adminUpdateShelf,
  type AdminProductListItem,
  type ShelfDetail,
  type ShelfFallback,
  type ShelfSlot,
} from '@/lib/api/admin';
import { fetchProducts } from '@/lib/api/products';

const COUNTRY_OPTIONS = [
  'NG', 'KE', 'ZA', 'GH', 'EG', 'MA', 'ET', 'TZ', 'UG', 'RW',
  'ZW', 'CI', 'SN', 'CM', 'ML', 'DZ', 'TN', 'AO', 'BW', 'NA', 'MZ',
];

interface DraftSlot {
  productId: string;
  startsAt: string | null;
  endsAt: string | null;
  countries: string[];
  /** Hydrated from the API; missing (null) when the user just added it
      from the picker — we backfill from the search results. */
  product: ShelfSlot['product'];
}

/**
 * Phase 10.8 — admin shelf detail editor.
 *
 * Lets an editor:
 *  - rename the shelf (title + subtitle)
 *  - set rows × cols (controls how many product cards render)
 *  - toggle enabled (hide a shelf without deleting picks)
 *  - search the product catalog and add products to the shelf
 *  - reorder picks (up/down arrows; persists as ProductPlacement.sortOrder)
 *  - scope each pick to specific countries (empty = global)
 *  - schedule a pick with start/end timestamps
 *
 * Saves go to two endpoints in parallel: PUT /admin/shelves/:key for
 * the container, PUT /admin/shelves/:key/products for the slots.
 */
export default function AdminShelfDetailPage() {
  const params = useParams<{ key: string }>();
  const key = decodeURIComponent(params.key);

  const [data, setData] = useState<ShelfDetail | null>(null);
  const [loading, setLoading] = useState(true);

  // Container draft.
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState<string>('');
  const [rows, setRows] = useState(1);
  const [cols, setCols] = useState(6);
  const [enabled, setEnabled] = useState(true);

  // Slots draft (ordered list).
  const [slots, setSlots] = useState<DraftSlot[]>([]);

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const detail = await adminGetShelf(key);
        if (cancelled) return;
        setData(detail);
        setTitle(detail.shelf.title);
        setSubtitle(detail.shelf.subtitle ?? '');
        setRows(detail.shelf.rows);
        setCols(detail.shelf.cols);
        setEnabled(detail.shelf.enabled);
        setSlots(
          detail.items.map((s) => ({
            productId: s.productId,
            startsAt: s.startsAt,
            endsAt: s.endsAt,
            countries: s.countries,
            product: s.product,
          })),
        );
      } catch (e) {
        toast(
          e instanceof HttpApiError ? e.message : 'Failed to load shelf',
          'error',
        );
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [key]);

  const cap = Math.max(1, rows * cols);
  const overCap = slots.length > cap;
  const usedIds = useMemo(() => new Set(slots.map((s) => s.productId)), [slots]);

  const handleAddProduct = (p: AdminProductListItem) => {
    if (usedIds.has(p.id)) {
      toast('Already on this shelf', 'info');
      return;
    }
    setSlots((prev) => [
      ...prev,
      {
        productId: p.id,
        startsAt: null,
        endsAt: null,
        countries: [],
        product: {
          id: p.id,
          slug: p.slug,
          name: p.name,
          brand: p.brand,
          origin: p.origin,
          images: p.images,
          price: p.price,
          inStock: p.inStock,
        },
      },
    ]);
  };

  const move = (idx: number, dir: -1 | 1) => {
    const next = idx + dir;
    if (next < 0 || next >= slots.length) return;
    setSlots((prev) => {
      const arr = [...prev];
      [arr[idx], arr[next]] = [arr[next], arr[idx]];
      return arr;
    });
  };

  const remove = (idx: number) =>
    setSlots((prev) => prev.filter((_, i) => i !== idx));

  const update = (idx: number, patch: Partial<DraftSlot>) =>
    setSlots((prev) => prev.map((s, i) => (i === idx ? { ...s, ...patch } : s)));

  const [filling, setFilling] = useState(false);
  const handleQuickFill = async () => {
    const fb = data?.defaultFallback;
    if (!fb) return;
    setFilling(true);
    try {
      // Pull enough products to fill the shelf to capacity. Over-fetch
      // a bit so we still have rows after filtering out items already
      // pinned (rare but possible if the editor partially curated).
      const limit = Math.min(50, Math.max(rows * cols, 12));
      const r = await fetchProducts({
        category: fb.category,
        origin: fb.origin,
        onSale: fb.onSale,
        sort: fb.sort ?? 'newest',
        limit,
      });
      const used = new Set(slots.map((s) => s.productId));
      const newSlots: DraftSlot[] = r.items
        .filter((p) => !used.has(p.id))
        .map((p) => ({
          productId: p.id,
          startsAt: null,
          endsAt: null,
          countries: [],
          product: {
            id: p.id,
            slug: p.slug,
            name: p.name,
            brand: p.brand,
            origin: p.origin,
            images: p.images,
            price: p.price,
            inStock: p.inStock,
          },
        }));
      if (newSlots.length === 0) {
        toast(
          'Fallback returned no new products — every match is already on the shelf.',
          'info',
        );
        return;
      }
      setSlots((prev) => [...prev, ...newSlots]);
      toast(
        `Added ${newSlots.length} product${newSlots.length === 1 ? '' : 's'} from fallback. Click Save to persist.`,
      );
    } catch (e) {
      toast(
        e instanceof Error ? e.message : 'Failed to pull fallback',
        'error',
      );
    } finally {
      setFilling(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    // Snapshot the local list at the moment of save so the toast +
    // refetch can compare what was sent vs what came back.
    const sentCount = slots.length;
    try {
      await Promise.all([
        adminUpdateShelf(key, {
          title: title.trim() || (data?.shelf.title ?? key),
          subtitle: subtitle.trim() ? subtitle.trim() : null,
          rows,
          cols,
          enabled,
        }),
        adminSetShelfProducts(
          key,
          slots.map((s) => ({
            productId: s.productId,
            startsAt: s.startsAt,
            endsAt: s.endsAt,
            countries: s.countries,
          })),
        ),
      ]);
      // Refetch from the API and reconcile. If the user kept editing
      // while the save was in flight (added/removed slots), we leave
      // their local edits alone so nothing gets clobbered — they can
      // save again. Otherwise we mirror the server state so the UI
      // always matches what's actually persisted.
      const fresh = await adminGetShelf(key);
      setData(fresh);
      const persistedCount = fresh.items.length;
      const editedDuringSave = slots.length !== sentCount;
      if (!editedDuringSave) {
        setSlots(
          fresh.items.map((s) => ({
            productId: s.productId,
            startsAt: s.startsAt,
            endsAt: s.endsAt,
            countries: s.countries,
            product: s.product,
          })),
        );
      }
      if (persistedCount === sentCount) {
        toast(
          `Saved — ${persistedCount} product${persistedCount === 1 ? '' : 's'} on this shelf`,
        );
      } else {
        toast(
          `Save mismatch — sent ${sentCount}, server kept ${persistedCount}. Refresh to see the saved state.`,
          'error',
        );
      }
    } catch (e) {
      toast(
        e instanceof HttpApiError ? e.message : 'Failed to save',
        'error',
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="px-8 py-10">
      <AdminPageHeader
        title={loading ? 'Loading…' : title || key}
        subtitle={
          <span className="font-mono text-[11px] text-muted">
            <Link
              href="/admin/shelves"
              className="inline-flex items-center gap-1 text-navy hover:text-amber"
            >
              <ChevronLeft size={12} aria-hidden /> Shelves
            </Link>{' '}
            · {key}
          </span>
        }
        action={
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || loading}
            className="flex items-center gap-2 rounded-btn bg-amber px-4 py-2 font-raleway text-xs font-bold uppercase tracking-btn text-navy hover:bg-white disabled:opacity-50"
          >
            <Save size={14} aria-hidden /> {saving ? 'Saving…' : 'Save'}
          </button>
        }
      />

      {loading ? (
        <p className="font-sans text-sm text-muted">Loading…</p>
      ) : !data ? (
        <p className="font-sans text-sm text-danger">Shelf not found.</p>
      ) : (
        <div className="flex flex-col gap-6">
          {/* Container settings */}
          <section className="rounded-card border border-border bg-white">
            <header className="border-b border-border bg-page px-5 py-3">
              <h2 className="font-raleway text-base font-bold text-navy">
                Shelf settings
              </h2>
              <p className="mt-0.5 font-sans text-xs text-muted">
                Title shows above the products. Rows × cols controls how
                many cards render.
              </p>
            </header>
            <div className="grid gap-4 p-5 md:grid-cols-2">
              <Field label="Title">
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className={inputClass}
                  placeholder="e.g. Best of Africa"
                />
              </Field>
              <Field label="Subtitle (optional)">
                <input
                  value={subtitle}
                  onChange={(e) => setSubtitle(e.target.value)}
                  className={inputClass}
                  placeholder="A short tagline shown under the title"
                />
              </Field>
              <Field label="Rows" hint="Number of horizontal rows the shelf renders.">
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={rows}
                  onChange={(e) => setRows(Math.max(1, Math.min(20, Number(e.target.value) || 1)))}
                  className={inputClass}
                />
              </Field>
              <Field
                label="Columns"
                hint="Cards per row at the widest breakpoint. Mobile/tablet stay responsive."
              >
                <input
                  type="number"
                  min={1}
                  max={12}
                  value={cols}
                  onChange={(e) => setCols(Math.max(1, Math.min(12, Number(e.target.value) || 1)))}
                  className={inputClass}
                />
              </Field>
              <Field label="Status">
                <label className="inline-flex items-center gap-2 font-sans text-sm text-charcoal">
                  <input
                    type="checkbox"
                    checked={enabled}
                    onChange={(e) => setEnabled(e.target.checked)}
                    className="h-4 w-4 cursor-pointer accent-navy"
                  />
                  {enabled ? 'Live on storefront' : 'Hidden from storefront'}
                </label>
              </Field>
              <Field label="Slots used">
                <p
                  className={`font-raleway text-sm font-bold ${
                    overCap ? 'text-danger' : 'text-navy'
                  }`}
                >
                  {slots.length} of {cap}{' '}
                  {overCap && (
                    <span className="font-sans text-xs font-normal text-danger">
                      — first {cap} will render; the rest are queued.
                    </span>
                  )}
                </p>
              </Field>
            </div>
          </section>

          {/* Slots editor */}
          <section className="rounded-card border border-border bg-white">
            <header className="flex flex-wrap items-start justify-between gap-3 border-b border-border bg-page px-5 py-3">
              <div className="flex flex-col gap-0.5">
                <h2 className="font-raleway text-base font-bold text-navy">
                  Products on this shelf
                </h2>
                <p className="font-sans text-xs leading-snug text-muted">
                  Reorder with the up/down arrows. <strong>Mix countries
                  freely</strong> — each product is global by default; click
                  country chips on its row to scope it. A single shelf can
                  carry products from any number of countries at once.
                </p>
                {data.defaultFallback && (
                  <p className="mt-1 font-sans text-[11px] leading-snug text-muted">
                    Storefront fallback: <FallbackDescriptor fb={data.defaultFallback} />
                    . When picks are fewer than {rows * cols} the rest of
                    the shelf auto-fills from this filter.
                  </p>
                )}
              </div>
              {data.defaultFallback && (
                <button
                  type="button"
                  onClick={handleQuickFill}
                  disabled={filling}
                  className="inline-flex shrink-0 items-center gap-2 rounded-btn border border-navy px-3 py-1.5 font-raleway text-[11px] font-bold uppercase tracking-btn text-navy hover:bg-navy hover:text-white disabled:opacity-50"
                  title="Pull the products that currently render via the fallback into editable slots"
                >
                  <Download size={12} aria-hidden />
                  {filling ? 'Pulling…' : 'Pull from fallback'}
                </button>
              )}
            </header>
            {slots.length === 0 ? (
              <p className="px-5 py-8 text-center font-sans text-sm text-muted">
                No products yet. Use the picker below to add some.
              </p>
            ) : (
              <ol className="flex flex-col divide-y divide-border">
                {slots.map((slot, idx) => (
                  <SlotRow
                    key={slot.productId}
                    index={idx}
                    total={slots.length}
                    slot={slot}
                    onMoveUp={() => move(idx, -1)}
                    onMoveDown={() => move(idx, 1)}
                    onRemove={() => remove(idx)}
                    onChange={(patch) => update(idx, patch)}
                  />
                ))}
              </ol>
            )}
          </section>

          {/* Picker */}
          <section className="rounded-card border border-border bg-white">
            <header className="border-b border-border bg-page px-5 py-3">
              <h2 className="font-raleway text-base font-bold text-navy">
                Add products
              </h2>
              <p className="mt-0.5 font-sans text-xs text-muted">
                Search the catalog by name or brand. Tap a row to add it
                to the shelf.
              </p>
            </header>
            <ProductPicker usedIds={usedIds} onPick={handleAddProduct} />
          </section>
        </div>
      )}
    </div>
  );
}

function SlotRow({
  index,
  total,
  slot,
  onMoveUp,
  onMoveDown,
  onRemove,
  onChange,
}: {
  index: number;
  total: number;
  slot: DraftSlot;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onRemove: () => void;
  onChange: (patch: Partial<DraftSlot>) => void;
}) {
  const p = slot.product;
  const img = p?.images?.[0];
  return (
    <li className="flex flex-col gap-3 p-4 md:flex-row md:items-start">
      <span className="flex w-7 shrink-0 items-center justify-center rounded-full bg-navy font-raleway text-xs font-bold text-white">
        {index + 1}
      </span>
      <div className="flex shrink-0 items-start gap-3">
        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-md border border-border bg-page">
          {img ? (
            <Image
              src={img}
              alt={p?.name ?? ''}
              fill
              sizes="64px"
              className="object-cover"
            />
          ) : (
            <span className="flex h-full w-full items-center justify-center font-sans text-[10px] text-muted">
              No image
            </span>
          )}
        </div>
        <div className="flex flex-col leading-tight">
          <span className="font-raleway text-sm font-bold text-navy">
            {p?.name ?? slot.productId}
          </span>
          <span className="font-sans text-[11px] text-muted">
            {p?.brand ?? '—'} {p?.origin ? ` · ${p.origin}` : ''}
          </span>
          {p && (
            <span className="font-sans text-[11px] text-charcoal/70">
              ₦{p.price.toLocaleString('en-NG')}{' '}
              {p.inStock ? (
                <span className="text-success">· In stock</span>
              ) : (
                <span className="text-danger">· Out of stock</span>
              )}
            </span>
          )}
        </div>
      </div>
      <div className="grid flex-1 gap-3 md:grid-cols-3">
        <Field label="Show from (optional)">
          <input
            type="datetime-local"
            value={toLocal(slot.startsAt)}
            onChange={(e) => onChange({ startsAt: fromLocal(e.target.value) })}
            className={inputClass}
          />
        </Field>
        <Field label="Hide after (optional)">
          <input
            type="datetime-local"
            value={toLocal(slot.endsAt)}
            onChange={(e) => onChange({ endsAt: fromLocal(e.target.value) })}
            className={inputClass}
          />
        </Field>
        <Field
          label={
            slot.countries.length === 0 ? (
              <span className="inline-flex items-center gap-1 text-success">
                <Globe size={11} aria-hidden /> Visible in every country
              </span>
            ) : (
              <span>Visible only in: {slot.countries.join(', ')}</span>
            )
          }
          hint="Pick one or more countries to scope this product. Leave empty so customers in every country see it. You can mix global + country-scoped picks on the same shelf."
        >
          <div className="flex flex-wrap gap-1">
            {COUNTRY_OPTIONS.map((c) => {
              const on = slot.countries.includes(c);
              return (
                <button
                  key={c}
                  type="button"
                  onClick={() =>
                    onChange({
                      countries: on
                        ? slot.countries.filter((x) => x !== c)
                        : [...slot.countries, c],
                    })
                  }
                  className={`rounded-full border px-2 py-0.5 font-mono text-[11px] transition ${
                    on
                      ? 'border-navy bg-navy text-white'
                      : 'border-border bg-white text-charcoal hover:border-navy'
                  }`}
                >
                  {c}
                </button>
              );
            })}
          </div>
        </Field>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <button
          type="button"
          onClick={onMoveUp}
          disabled={index === 0}
          aria-label="Move up"
          className="rounded p-1 text-muted hover:bg-page hover:text-navy disabled:opacity-30"
        >
          <ArrowUp size={14} aria-hidden />
        </button>
        <button
          type="button"
          onClick={onMoveDown}
          disabled={index === total - 1}
          aria-label="Move down"
          className="rounded p-1 text-muted hover:bg-page hover:text-navy disabled:opacity-30"
        >
          <ArrowDown size={14} aria-hidden />
        </button>
        <button
          type="button"
          onClick={onRemove}
          aria-label="Remove from shelf"
          className="rounded p-1 text-muted hover:bg-danger/10 hover:text-danger"
        >
          <Trash2 size={14} aria-hidden />
        </button>
      </div>
    </li>
  );
}

function ProductPicker({
  usedIds,
  onPick,
}: {
  usedIds: Set<string>;
  onPick: (p: AdminProductListItem) => void;
}) {
  const [q, setQ] = useState('');
  const [results, setResults] = useState<AdminProductListItem[]>([]);
  const [searching, setSearching] = useState(false);
  const [open, setOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);
  const wrapRef = useRef<HTMLDivElement>(null);
  const trimmed = q.trim();

  // Debounce so we don't spam the API while typing. 150ms feels
  // instant without firing for every individual keystroke.
  useEffect(() => {
    if (trimmed.length === 0) {
      setResults([]);
      setSearching(false);
      return;
    }
    let cancelled = false;
    setSearching(true);
    const t = setTimeout(() => {
      void adminListProducts({ q: trimmed, limit: 20, sort: 'newest' })
        .then((r) => {
          if (!cancelled) {
            setResults(r.items);
            setActiveIdx(0);
          }
        })
        .catch(() => {
          if (!cancelled) setResults([]);
        })
        .finally(() => {
          if (!cancelled) setSearching(false);
        });
    }, 150);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [trimmed]);

  // Click-outside closes the dropdown.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  const pickable = results.filter((p) => !usedIds.has(p.id));

  const handleSelect = (p: AdminProductListItem) => {
    onPick(p);
    // Clear and refocus so they can keep adding without re-clicking.
    setQ('');
    setResults([]);
    setOpen(false);
  };

  // Keyboard navigation — arrow keys + enter to add the highlighted
  // product without leaving the keyboard.
  const onKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open || pickable.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIdx((i) => Math.min(i + 1, pickable.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const p = pickable[activeIdx];
      if (p) handleSelect(p);
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  const showDropdown = open && trimmed.length > 0;

  return (
    <div className="flex flex-col gap-3 p-5">
      <div ref={wrapRef} className="relative">
        <Search
          size={14}
          aria-hidden
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted"
        />
        <input
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKey}
          placeholder="Type to search products by name, brand, or country…"
          autoComplete="off"
          className="w-full rounded-input border border-border bg-white py-2 pl-9 pr-9 font-sans text-sm focus:border-navy focus:outline-none"
        />
        {q && (
          <button
            type="button"
            onClick={() => {
              setQ('');
              setResults([]);
            }}
            aria-label="Clear search"
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted hover:text-navy"
          >
            <X size={14} aria-hidden />
          </button>
        )}

        {/* Floating dropdown — pops up below the input as the editor
            types. Keyboard-friendly (arrow keys + enter), and resets
            after each pick so successive products can be added in a
            single typing session. */}
        {showDropdown && (
          <div className="absolute left-0 right-0 top-full z-30 mt-1 max-h-96 overflow-y-auto rounded-card border border-border bg-white shadow-lg">
            {searching && results.length === 0 ? (
              <p className="px-4 py-3 font-sans text-sm text-muted">Searching…</p>
            ) : results.length === 0 ? (
              <p className="px-4 py-3 font-sans text-sm text-muted">
                No products match &ldquo;{trimmed}&rdquo;.
              </p>
            ) : (
              <ul className="divide-y divide-border">
                {results.map((p) => {
                  const used = usedIds.has(p.id);
                  const pickableIdx = pickable.findIndex((x) => x.id === p.id);
                  const active = !used && pickableIdx === activeIdx;
                  const img = p.images?.[0];
                  return (
                    <li key={p.id}>
                      <button
                        type="button"
                        disabled={used}
                        onMouseEnter={() => {
                          if (!used && pickableIdx >= 0) setActiveIdx(pickableIdx);
                        }}
                        onClick={() => handleSelect(p)}
                        className={`flex w-full items-center gap-3 px-3 py-2 text-left transition ${
                          used
                            ? 'opacity-50'
                            : active
                              ? 'bg-amber/10'
                              : 'hover:bg-page'
                        }`}
                      >
                        <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-md border border-border bg-page">
                          {img && (
                            <Image
                              src={img}
                              alt={p.name}
                              fill
                              sizes="48px"
                              className="object-cover"
                            />
                          )}
                        </div>
                        <div className="flex flex-1 flex-col leading-tight">
                          <span className="font-raleway text-sm font-bold text-navy">
                            <Highlight text={p.name} term={trimmed} />
                          </span>
                          <span className="font-sans text-[11px] text-muted">
                            {p.brand ? <Highlight text={p.brand} term={trimmed} /> : '—'}
                            {p.origin ? <> · {p.origin}</> : null}
                            {' · '}₦{p.price.toLocaleString('en-NG')}
                          </span>
                        </div>
                        {used ? (
                          <span className="inline-flex items-center gap-1 rounded-full border border-success/30 bg-success/10 px-2 py-0.5 font-raleway text-[10px] font-bold uppercase tracking-btn text-success">
                            <Check size={11} aria-hidden /> On shelf
                          </span>
                        ) : (
                          <span className="rounded-full border border-navy px-2 py-0.5 font-raleway text-[10px] font-bold uppercase tracking-btn text-navy">
                            Add
                          </span>
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        )}
      </div>

      <p className="font-sans text-[11px] leading-snug text-muted">
        Tip — type a few letters of the product name, brand, or
        ingredient. Use ↑/↓ to highlight, Enter to add. Products
        already on the shelf are dimmed.
      </p>
    </div>
  );
}

/// Highlights every occurrence of `term` inside `text` with an amber
/// background so editors can visually confirm the match.
function Highlight({ text, term }: { text: string; term: string }) {
  if (!term) return <>{text}</>;
  const safe = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const parts = text.split(new RegExp(`(${safe})`, 'gi'));
  return (
    <>
      {parts.map((part, i) =>
        part.toLowerCase() === term.toLowerCase() ? (
          <mark key={i} className="rounded bg-amber/30 px-0.5 text-navy">
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </>
  );
}

/// Renders a one-line summary of what the fallback query is doing,
/// e.g. "category=personal-care, sort=newest". Helps editors confirm
/// the right products will get pulled before clicking the button.
function FallbackDescriptor({ fb }: { fb: ShelfFallback }) {
  const parts: string[] = [];
  if (fb.category) parts.push(`category=${fb.category}`);
  if (fb.origin) parts.push(`origin=${fb.origin}`);
  if (fb.onSale !== undefined) parts.push(`onSale=${fb.onSale}`);
  if (fb.sort) parts.push(`sort=${fb.sort}`);
  if (parts.length === 0) return <span>(latest products)</span>;
  return <span className="font-mono">{parts.join(', ')}</span>;
}

function Field({
  label,
  hint,
  children,
}: {
  label: React.ReactNode;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="font-raleway text-[10px] font-bold uppercase tracking-btn text-muted">
        {label}
      </span>
      {children}
      {hint && (
        <span className="font-sans text-[11px] leading-snug text-muted">{hint}</span>
      )}
    </label>
  );
}

const inputClass =
  'w-full rounded-input border border-border bg-white px-3 py-2 font-sans text-sm text-charcoal focus:border-navy focus:outline-none';

function toLocal(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function fromLocal(local: string): string | null {
  if (!local) return null;
  return new Date(local).toISOString();
}
