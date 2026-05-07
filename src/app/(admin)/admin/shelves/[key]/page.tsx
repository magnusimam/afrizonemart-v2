'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useParams } from 'next/navigation';
import {
  ArrowDown,
  ArrowUp,
  Check,
  ChevronLeft,
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
  type ShelfSlot,
} from '@/lib/api/admin';

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

  const handleSave = async () => {
    setSaving(true);
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
      toast(`Saved — ${slots.length} product${slots.length === 1 ? '' : 's'}`);
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
            <header className="border-b border-border bg-page px-5 py-3">
              <h2 className="font-raleway text-base font-bold text-navy">
                Products on this shelf
              </h2>
              <p className="mt-0.5 font-sans text-xs text-muted">
                Drag-free reorder via arrows. Products without country
                chips appear globally; pick countries to constrain. Items
                from different countries can sit on the same shelf.
              </p>
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
        <Field label="Countries (empty = global)">
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
                  className={`rounded-full border px-2 py-0.5 font-mono text-[11px] ${
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
  const trimmed = q.trim();

  // Debounce so we don't spam the API while typing.
  useEffect(() => {
    if (trimmed.length === 0) {
      setResults([]);
      return;
    }
    let cancelled = false;
    setSearching(true);
    const t = setTimeout(() => {
      void adminListProducts({ q: trimmed, limit: 20 })
        .then((r) => {
          if (!cancelled) setResults(r.items);
        })
        .catch(() => {
          if (!cancelled) setResults([]);
        })
        .finally(() => {
          if (!cancelled) setSearching(false);
        });
    }, 200);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [trimmed]);

  return (
    <div className="flex flex-col gap-3 p-5">
      <div className="relative">
        <Search
          size={14}
          aria-hidden
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted"
        />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search by product name or brand…"
          className="w-full rounded-input border border-border bg-white py-2 pl-9 pr-9 font-sans text-sm focus:border-navy focus:outline-none"
        />
        {q && (
          <button
            type="button"
            onClick={() => setQ('')}
            aria-label="Clear search"
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted hover:text-navy"
          >
            <X size={14} aria-hidden />
          </button>
        )}
      </div>

      {trimmed.length === 0 ? (
        <p className="rounded-card border border-dashed border-border px-4 py-6 text-center font-sans text-xs text-muted">
          Start typing to search the product catalog.
        </p>
      ) : searching ? (
        <p className="font-sans text-sm text-muted">Searching…</p>
      ) : results.length === 0 ? (
        <p className="font-sans text-sm text-muted">
          No products match &ldquo;{trimmed}&rdquo;.
        </p>
      ) : (
        <ul className="max-h-96 divide-y divide-border overflow-y-auto rounded-card border border-border">
          {results.map((p) => {
            const used = usedIds.has(p.id);
            const img = p.images?.[0];
            return (
              <li key={p.id}>
                <button
                  type="button"
                  disabled={used}
                  onClick={() => onPick(p)}
                  className={`flex w-full items-center gap-3 px-3 py-2 text-left transition ${
                    used ? 'opacity-50' : 'hover:bg-page'
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
                      {p.name}
                    </span>
                    <span className="font-sans text-[11px] text-muted">
                      {p.brand ?? '—'} {p.origin ? ` · ${p.origin}` : ''}
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
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
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
