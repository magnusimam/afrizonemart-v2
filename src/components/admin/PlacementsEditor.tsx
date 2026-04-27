'use client';

import { useEffect, useMemo, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import {
  adminListPlacementCatalog,
  type PlacementDef,
  type PlacementInput,
} from '@/lib/api/admin';

/**
 * Phase 10.7 — admin product form sub-panel.
 *
 * Lets the admin pick which curated places this product appears on
 * (homepage shelves, hero, special-discount, CMS pages, …) plus optional
 * sort order, time window, and per-country scope per placement.
 *
 * The auto-derived placements ("on sale", "new arrival", "country",
 * "category") are shown read-only at the top — they're computed from
 * other product fields, not toggled here.
 */

const COUNTRY_OPTIONS = [
  'NG', 'KE', 'ZA', 'GH', 'EG', 'MA', 'ET', 'TZ', 'UG', 'RW',
  'ZW', 'CI', 'SN', 'CM', 'ML', 'DZ', 'TN', 'AO', 'BW', 'NA', 'MZ',
];

interface AutoChip {
  label: string;
  active: boolean;
  hint?: string;
}

interface Props {
  value: PlacementInput[];
  onChange: (next: PlacementInput[]) => void;
  /** Auto-derived chips shown read-only (built from the other form fields). */
  autoChips: AutoChip[];
}

export function PlacementsEditor({ value, onChange, autoChips }: Props) {
  const [catalog, setCatalog] = useState<PlacementDef[]>([]);
  const [groups, setGroups] = useState<Record<string, string>>({});
  const [loadingCatalog, setLoadingCatalog] = useState(true);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const r = await adminListPlacementCatalog();
        if (!cancelled) {
          setCatalog(r.items);
          setGroups(r.groups);
        }
      } catch {
        // fail-soft: form still saves products without placements
      } finally {
        if (!cancelled) setLoadingCatalog(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Group catalog by group key.
  const groupedCatalog = useMemo(() => {
    const m: Record<string, PlacementDef[]> = {};
    for (const def of catalog) {
      (m[def.group] ?? (m[def.group] = [])).push(def);
    }
    return m;
  }, [catalog]);

  const usedKeys = new Set(value.map((p) => p.placement));
  const availableForAdd = catalog.filter((d) => !usedKeys.has(d.key));

  const addPlacement = (key: string) => {
    if (!key) return;
    onChange([
      ...value,
      { placement: key, sortOrder: 100, startsAt: null, endsAt: null, countries: [] },
    ]);
  };

  const updatePlacement = (idx: number, patch: Partial<PlacementInput>) => {
    onChange(value.map((p, i) => (i === idx ? { ...p, ...patch } : p)));
  };

  const removePlacement = (idx: number) => {
    onChange(value.filter((_, i) => i !== idx));
  };

  const labelFor = (key: string): string => {
    const def = catalog.find((d) => d.key === key);
    return def?.label ?? key;
  };

  const groupOf = (key: string): string => {
    const def = catalog.find((d) => d.key === key);
    return def?.group ?? 'unknown';
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Auto-derived chips */}
      <div className="rounded-card border border-border bg-page p-3">
        <p className="mb-2 font-raleway text-[10px] font-bold uppercase tracking-btn text-muted">
          Auto-derived (from this product&rsquo;s data)
        </p>
        <div className="flex flex-wrap gap-2">
          {autoChips.length === 0 && (
            <span className="font-sans text-xs text-muted">
              Fill in price/category/origin to see derived placements.
            </span>
          )}
          {autoChips.map((c, i) => (
            <span
              key={i}
              className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 font-raleway text-[10px] font-bold uppercase tracking-btn ${
                c.active
                  ? 'border-success/30 bg-success/10 text-success'
                  : 'border-muted/30 bg-white text-muted'
              }`}
              title={c.hint}
            >
              {c.active ? '✓' : '·'} {c.label}
            </span>
          ))}
        </div>
      </div>

      {/* Manual placement rows */}
      <div className="flex flex-col gap-3">
        {value.length === 0 && (
          <p className="rounded-card border border-dashed border-border px-4 py-6 text-center font-sans text-sm text-muted">
            No featured placements yet — pick from the menu below to pin this
            product to a specific page or shelf.
          </p>
        )}
        {value.map((p, idx) => (
          <div
            key={idx}
            className="rounded-card border border-border bg-white p-4"
          >
            <div className="mb-3 flex items-center justify-between">
              <div className="flex flex-col leading-tight">
                <span className="font-raleway text-[10px] font-bold uppercase tracking-btn text-muted">
                  {groups[groupOf(p.placement)] ?? groupOf(p.placement)}
                </span>
                <span className="font-raleway text-sm font-bold text-navy">
                  {labelFor(p.placement)}
                </span>
                <span className="font-mono text-[10px] text-muted">{p.placement}</span>
              </div>
              <button
                type="button"
                onClick={() => removePlacement(idx)}
                aria-label="Remove placement"
                className="rounded p-1 text-muted hover:bg-danger/10 hover:text-danger"
              >
                <Trash2 size={14} aria-hidden />
              </button>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <label className="flex flex-col gap-1">
                <span className="font-raleway text-[10px] font-bold uppercase tracking-btn text-muted">
                  Sort order
                </span>
                <input
                  type="number"
                  value={p.sortOrder ?? 100}
                  onChange={(e) =>
                    updatePlacement(idx, { sortOrder: Number(e.target.value) || 0 })
                  }
                  className="rounded-input border border-border bg-white px-2 py-1.5 font-sans text-sm focus:border-navy focus:outline-none"
                />
                <span className="font-sans text-[10px] text-muted">
                  Lower = appears first.
                </span>
              </label>
              <label className="flex flex-col gap-1">
                <span className="font-raleway text-[10px] font-bold uppercase tracking-btn text-muted">
                  Starts at (optional)
                </span>
                <input
                  type="datetime-local"
                  value={toLocal(p.startsAt)}
                  onChange={(e) =>
                    updatePlacement(idx, {
                      startsAt: fromLocal(e.target.value),
                    })
                  }
                  className="rounded-input border border-border bg-white px-2 py-1.5 font-sans text-sm focus:border-navy focus:outline-none"
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="font-raleway text-[10px] font-bold uppercase tracking-btn text-muted">
                  Ends at (optional)
                </span>
                <input
                  type="datetime-local"
                  value={toLocal(p.endsAt)}
                  onChange={(e) =>
                    updatePlacement(idx, {
                      endsAt: fromLocal(e.target.value),
                    })
                  }
                  className="rounded-input border border-border bg-white px-2 py-1.5 font-sans text-sm focus:border-navy focus:outline-none"
                />
              </label>
            </div>

            <div className="mt-3">
              <span className="block font-raleway text-[10px] font-bold uppercase tracking-btn text-muted">
                Countries (optional · empty = global)
              </span>
              <div className="mt-1 flex flex-wrap gap-1">
                {COUNTRY_OPTIONS.map((c) => {
                  const enabled = (p.countries ?? []).includes(c);
                  return (
                    <button
                      key={c}
                      type="button"
                      onClick={() => {
                        const next = enabled
                          ? (p.countries ?? []).filter((x) => x !== c)
                          : [...(p.countries ?? []), c];
                        updatePlacement(idx, { countries: next });
                      }}
                      className={`rounded-full border px-2.5 py-0.5 font-mono text-[11px] ${
                        enabled
                          ? 'border-navy bg-navy text-white'
                          : 'border-border bg-white text-charcoal hover:border-navy'
                      }`}
                    >
                      {c}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add placement dropdown */}
      <div className="rounded-card border border-border bg-page p-3">
        <p className="mb-2 font-raleway text-[10px] font-bold uppercase tracking-btn text-muted">
          Add a placement
        </p>
        {loadingCatalog ? (
          <p className="font-sans text-sm text-muted">Loading…</p>
        ) : availableForAdd.length === 0 ? (
          <p className="font-sans text-sm text-muted">
            All available placements are already added to this product.
          </p>
        ) : (
          <div className="flex items-center gap-2">
            <select
              defaultValue=""
              onChange={(e) => {
                if (e.target.value) {
                  addPlacement(e.target.value);
                  e.target.value = '';
                }
              }}
              className="flex-1 rounded-input border border-border bg-white px-3 py-2 font-sans text-sm focus:border-navy focus:outline-none"
            >
              <option value="" disabled>
                Choose a placement…
              </option>
              {Object.entries(groupedCatalog).map(([gKey, defs]) => (
                <optgroup key={gKey} label={groups[gKey] ?? gKey}>
                  {defs
                    .filter((d) => !usedKeys.has(d.key))
                    .map((d) => (
                      <option key={d.key} value={d.key}>
                        {d.label}
                      </option>
                    ))}
                </optgroup>
              ))}
            </select>
            <Plus size={14} className="text-muted" aria-hidden />
          </div>
        )}
      </div>
    </div>
  );
}

function toLocal(iso?: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  // datetime-local wants `YYYY-MM-DDTHH:mm` in local time
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function fromLocal(local: string): string | null {
  if (!local) return null;
  return new Date(local).toISOString();
}
