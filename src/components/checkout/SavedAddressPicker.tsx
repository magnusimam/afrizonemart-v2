'use client';

import { Check, Loader2, PlusCircle } from 'lucide-react';
import type { SavedAddress } from '@/lib/api/addresses';

/// Saved-address picker shown on /checkout/shipping (Tracker #52,
/// 2026-05-19). Renders one radio card per saved address plus an
/// "Add a new address" tile at the end.
///
/// Picking a saved address pre-fills the AddressForm below; the
/// customer can still tweak before placing. Picking "Add new"
/// reveals an empty form. Default address is pre-selected on
/// page mount.
///
/// "Make default" link on non-default cards flips it in place via
/// the parent's onMakeDefault handler (PATCH /api/addresses/:id
/// with isDefault: true — backend handles exclusivity).

export type SelectedAddress = string | 'new';

interface Props {
  addresses: SavedAddress[];
  selectedId: SelectedAddress | null;
  onSelect: (id: SelectedAddress) => void;
  onMakeDefault: (id: string) => Promise<void> | void;
  /// True while the parent is mid-flight on a "Make default" PATCH.
  /// Disables the link on the row being updated so duplicate taps
  /// don't fire concurrent PATCHes.
  busyDefaultId: string | null;
}

export function SavedAddressPicker({
  addresses,
  selectedId,
  onSelect,
  onMakeDefault,
  busyDefaultId,
}: Props) {
  return (
    <ul className="flex flex-col gap-2.5">
      {addresses.map((a) => {
        const selected = selectedId === a.id;
        const busy = busyDefaultId === a.id;
        return (
          <li key={a.id}>
            <button
              type="button"
              onClick={() => onSelect(a.id)}
              aria-pressed={selected}
              className={`group relative flex w-full items-start gap-3 rounded-card border-2 p-3.5 text-left transition-all ${
                selected
                  ? 'border-navy bg-navy/5 shadow-card'
                  : 'border-border bg-white hover:border-navy/40'
              }`}
            >
              <span
                className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
                  selected ? 'border-navy bg-navy' : 'border-border bg-white'
                }`}
                aria-hidden
              >
                {selected && <span className="h-2 w-2 rounded-full bg-white" />}
              </span>

              <div className="flex flex-1 flex-col gap-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-raleway text-sm font-bold text-navy">
                    {a.label?.trim() ? a.label : 'Saved address'}
                  </span>
                  {a.isDefault && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber/20 px-2 py-0.5 font-raleway text-[10px] font-bold uppercase tracking-btn text-navy">
                      <Check size={10} aria-hidden /> Default
                    </span>
                  )}
                </div>
                <p className="font-sans text-sm text-charcoal">
                  {a.fullName} <span className="text-muted">·</span> {a.phone}
                </p>
                <p className="font-sans text-xs text-muted">
                  {a.addressLine}, {a.city}, {a.country}
                </p>
                {!a.isDefault && (
                  /// "Make default" lives as a real <span role=button> so
                  /// the click can stopPropagation without nesting a
                  /// <button> inside the card <button> (invalid HTML).
                  <span
                    role="button"
                    tabIndex={0}
                    aria-disabled={busy}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!busy) void onMakeDefault(a.id);
                    }}
                    onKeyDown={(e) => {
                      if ((e.key === 'Enter' || e.key === ' ') && !busy) {
                        e.preventDefault();
                        e.stopPropagation();
                        void onMakeDefault(a.id);
                      }
                    }}
                    className={`mt-1 inline-flex w-fit items-center gap-1 font-raleway text-[11px] font-semibold uppercase tracking-btn text-amber underline-offset-2 hover:underline ${
                      busy ? 'cursor-wait opacity-60' : 'cursor-pointer'
                    }`}
                  >
                    {busy ? <Loader2 size={11} className="animate-spin" aria-hidden /> : null}
                    Make default
                  </span>
                )}
              </div>
            </button>
          </li>
        );
      })}

      <li>
        <button
          type="button"
          onClick={() => onSelect('new')}
          aria-pressed={selectedId === 'new'}
          className={`flex w-full items-center gap-3 rounded-card border-2 border-dashed p-3.5 text-left transition-all ${
            selectedId === 'new'
              ? 'border-navy bg-navy/5'
              : 'border-border bg-white hover:border-navy/40'
          }`}
        >
          <span
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
              selectedId === 'new' ? 'bg-navy text-white' : 'bg-page text-navy'
            }`}
            aria-hidden
          >
            <PlusCircle size={18} />
          </span>
          <div className="flex flex-col">
            <span className="font-raleway text-sm font-bold text-navy">
              Add a new address
            </span>
            <span className="font-sans text-xs text-muted">
              Use a different name, phone, or destination.
            </span>
          </div>
        </button>
      </li>
    </ul>
  );
}
