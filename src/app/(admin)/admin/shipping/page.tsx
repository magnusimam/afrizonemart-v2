'use client';

import { useEffect, useState } from 'react';
import { Globe2, Plus, Save, Trash2, X } from 'lucide-react';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { ConfirmDialog } from '@/components/admin/ConfirmDialog';
import { toast } from '@/components/admin/Toast';
import { HttpApiError } from '@/lib/api/client';
import {
  adminCreateShippingRate,
  adminCreateShippingZone,
  adminDeleteShippingRate,
  adminDeleteShippingZone,
  adminListShippingZones,
  adminUpdateShippingRate,
  adminUpdateShippingZone,
  type AdminShippingRate,
  type AdminShippingZone,
} from '@/lib/api/admin';
import { formatPriceNGN } from '@/lib/format';

export default function AdminShippingPage() {
  const [zones, setZones] = useState<AdminShippingZone[] | null>(null);
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null);
  const [zoneFormOpen, setZoneFormOpen] = useState(false);
  const [editingZone, setEditingZone] = useState<AdminShippingZone | null>(null);
  const [pendingZoneDelete, setPendingZoneDelete] = useState<AdminShippingZone | null>(null);
  const [pendingRateDelete, setPendingRateDelete] = useState<AdminShippingRate | null>(null);
  const [rateFormOpen, setRateFormOpen] = useState(false);
  const [editingRate, setEditingRate] = useState<AdminShippingRate | null>(null);
  const [busy, setBusy] = useState(false);

  const load = () =>
    adminListShippingZones()
      .then((r) => {
        setZones(r.items);
        if (!selectedZoneId && r.items.length > 0) setSelectedZoneId(r.items[0].id);
      })
      .catch((e) => toast(e instanceof Error ? e.message : 'Failed to load', 'error'));

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectedZone = zones?.find((z) => z.id === selectedZoneId) ?? null;

  const handleDeleteZone = async () => {
    if (!pendingZoneDelete) return;
    setBusy(true);
    try {
      await adminDeleteShippingZone(pendingZoneDelete.id);
      toast(`Deleted ${pendingZoneDelete.name}`);
      if (selectedZoneId === pendingZoneDelete.id) setSelectedZoneId(null);
      setPendingZoneDelete(null);
      await load();
    } catch (e) {
      toast(e instanceof HttpApiError ? e.message : 'Failed to delete', 'error');
    } finally {
      setBusy(false);
    }
  };

  const handleDeleteRate = async () => {
    if (!pendingRateDelete) return;
    setBusy(true);
    try {
      await adminDeleteShippingRate(pendingRateDelete.id);
      toast(`Deleted ${pendingRateDelete.name}`);
      setPendingRateDelete(null);
      await load();
    } catch (e) {
      toast(e instanceof HttpApiError ? e.message : 'Failed to delete', 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="px-4 py-6 md:px-8 md:py-10">
      <AdminPageHeader
        title="Shipping"
        subtitle="Zones group countries; each zone has one or more rates that customers see at checkout."
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:gap-6">
        {/* Zones list */}
        <section className="flex flex-col gap-3 rounded-card border border-border bg-white p-5 shadow-card lg:col-span-5">
          <header className="flex items-center justify-between gap-3 border-b border-border pb-3">
            <div>
              <h2 className="font-raleway text-base font-bold text-navy">Zones</h2>
              <p className="font-sans text-xs text-muted">
                {zones ? `${zones.length} configured` : 'Loading…'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setEditingZone(null);
                setZoneFormOpen(true);
              }}
              className="flex items-center gap-1.5 rounded-btn border border-navy bg-white px-3 py-1.5 font-raleway text-[11px] font-bold uppercase tracking-btn text-navy hover:bg-navy hover:text-white"
            >
              <Plus size={12} aria-hidden /> Zone
            </button>
          </header>

          {zones?.length === 0 && (
            <p className="font-sans text-sm text-muted">
              No zones yet — add one to start charging shipping at checkout.
            </p>
          )}

          <ul className="flex flex-col gap-2">
            {zones?.map((z) => (
              <li
                key={z.id}
                className={`flex flex-col gap-1 rounded-card border p-3 transition-colors ${
                  z.id === selectedZoneId
                    ? 'border-navy bg-navy/5'
                    : 'border-border bg-white hover:border-navy/40'
                }`}
              >
                <button
                  type="button"
                  onClick={() => setSelectedZoneId(z.id)}
                  className="flex items-center justify-between gap-3 text-left"
                >
                  <div className="flex items-center gap-2">
                    <Globe2 size={14} className="text-navy" aria-hidden />
                    <span className="font-raleway text-sm font-semibold text-navy">{z.name}</span>
                    {z.isDefault && (
                      <span className="rounded-full bg-amber/30 px-1.5 py-0.5 font-raleway text-[9px] font-bold uppercase tracking-btn text-navy">
                        Default
                      </span>
                    )}
                  </div>
                  <span className="font-sans text-[11px] text-muted">
                    {z.rates.length} rate{z.rates.length === 1 ? '' : 's'}
                  </span>
                </button>
                <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                  <span className="font-sans text-[11px] text-charcoal">
                    {z.countries.length === 0
                      ? 'Catch-all (any country)'
                      : z.countries.join(', ')}
                  </span>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingZone(z);
                        setZoneFormOpen(true);
                      }}
                      className="rounded-md px-2 py-1 font-raleway text-[10px] font-bold uppercase tracking-btn text-navy hover:bg-page"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => setPendingZoneDelete(z)}
                      className="rounded-md p-1 text-muted hover:bg-danger/10 hover:text-danger"
                      aria-label="Delete zone"
                    >
                      <Trash2 size={12} aria-hidden />
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </section>

        {/* Rates for selected zone */}
        <section className="flex flex-col gap-3 rounded-card border border-border bg-white p-5 shadow-card lg:col-span-7">
          <header className="flex items-center justify-between gap-3 border-b border-border pb-3">
            <div>
              <h2 className="font-raleway text-base font-bold text-navy">
                {selectedZone ? `Rates for ${selectedZone.name}` : 'Rates'}
              </h2>
              <p className="font-sans text-xs text-muted">
                {selectedZone
                  ? `Customers shipping to ${
                      selectedZone.countries.length === 0
                        ? 'any country (catch-all)'
                        : selectedZone.countries.join(', ')
                    } see these.`
                  : 'Select a zone to manage its rates.'}
              </p>
            </div>
            {selectedZone && (
              <button
                type="button"
                onClick={() => {
                  setEditingRate(null);
                  setRateFormOpen(true);
                }}
                className="flex items-center gap-1.5 rounded-btn bg-navy px-3 py-1.5 font-raleway text-[11px] font-bold uppercase tracking-btn text-white hover:bg-amber hover:text-navy"
              >
                <Plus size={12} aria-hidden /> Rate
              </button>
            )}
          </header>

          {!selectedZone && (
            <p className="font-sans text-sm text-muted">No zone selected.</p>
          )}

          {selectedZone && selectedZone.rates.length === 0 && (
            <p className="font-sans text-sm text-muted">
              No rates yet — add one (e.g. &ldquo;Standard ₦1500, free above ₦10k&rdquo;).
            </p>
          )}

          {selectedZone && selectedZone.rates.length > 0 && (
            <ul className="flex flex-col divide-y divide-border">
              {selectedZone.rates.map((r) => (
                <li
                  key={r.id}
                  className="flex flex-wrap items-center justify-between gap-3 py-3"
                >
                  <div className="flex flex-col leading-tight">
                    <span className="flex items-center gap-2 font-raleway text-sm font-semibold text-navy">
                      {r.name}
                      {r.isDefault && (
                        <span className="rounded-full bg-amber/30 px-1.5 py-0.5 font-raleway text-[9px] font-bold uppercase tracking-btn text-navy">
                          Default
                        </span>
                      )}
                    </span>
                    <span className="font-sans text-[11px] text-muted">
                      {formatPriceNGN(r.priceAmount)}
                      {r.freeAboveAmount
                        ? ` · free above ${formatPriceNGN(r.freeAboveAmount)}`
                        : ''}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingRate(r);
                        setRateFormOpen(true);
                      }}
                      className="rounded-md px-2 py-1 font-raleway text-[10px] font-bold uppercase tracking-btn text-navy hover:bg-page"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => setPendingRateDelete(r)}
                      className="rounded-md p-1 text-muted hover:bg-danger/10 hover:text-danger"
                      aria-label="Delete rate"
                    >
                      <Trash2 size={12} aria-hidden />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {zoneFormOpen && (
        <ZoneDialog
          initial={editingZone}
          onClose={() => setZoneFormOpen(false)}
          onSaved={async () => {
            setZoneFormOpen(false);
            await load();
          }}
        />
      )}

      {rateFormOpen && selectedZone && (
        <RateDialog
          zoneId={selectedZone.id}
          initial={editingRate}
          onClose={() => setRateFormOpen(false)}
          onSaved={async () => {
            setRateFormOpen(false);
            await load();
          }}
        />
      )}

      <ConfirmDialog
        open={Boolean(pendingZoneDelete)}
        title="Delete zone"
        message={
          pendingZoneDelete
            ? `Delete "${pendingZoneDelete.name}" and all its rates? Existing orders keep their snapshot.`
            : ''
        }
        confirmLabel="Delete"
        destructive
        busy={busy}
        onConfirm={handleDeleteZone}
        onCancel={() => !busy && setPendingZoneDelete(null)}
      />

      <ConfirmDialog
        open={Boolean(pendingRateDelete)}
        title="Delete rate"
        message={pendingRateDelete ? `Delete "${pendingRateDelete.name}"?` : ''}
        confirmLabel="Delete"
        destructive
        busy={busy}
        onConfirm={handleDeleteRate}
        onCancel={() => !busy && setPendingRateDelete(null)}
      />
    </div>
  );
}

function ZoneDialog({
  initial,
  onClose,
  onSaved,
}: {
  initial: AdminShippingZone | null;
  onClose: () => void;
  onSaved: () => Promise<void> | void;
}) {
  const [name, setName] = useState(initial?.name ?? '');
  const [countriesText, setCountriesText] = useState((initial?.countries ?? []).join(', '));
  const [isDefault, setIsDefault] = useState(initial?.isDefault ?? false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const countries = countriesText
      .split(',')
      .map((s) => s.trim().toUpperCase())
      .filter(Boolean);
    try {
      if (initial) {
        await adminUpdateShippingZone(initial.id, {
          name: name.trim(),
          countries,
          isDefault,
        });
        toast(`Saved ${name.trim()}`);
      } else {
        await adminCreateShippingZone({ name: name.trim(), countries, isDefault });
        toast(`Created ${name.trim()}`);
      }
      await onSaved();
    } catch (err) {
      setError(err instanceof HttpApiError ? err.message : err instanceof Error ? err.message : 'Save failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal title={initial ? `Edit ${initial.name}` : 'New zone'} onClose={() => !busy && onClose()}>
      <form onSubmit={handleSave} className="flex flex-col gap-4">
        <Field label="Name" required>
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={input}
          />
        </Field>
        <Field
          label="Countries"
          hint="Comma-separated 2-letter ISO codes (e.g. NG, GH, KE). Leave blank only for the catch-all default zone."
        >
          <input
            value={countriesText}
            onChange={(e) => setCountriesText(e.target.value)}
            className={input}
            placeholder="NG, GH, KE"
          />
        </Field>
        <label className="flex cursor-pointer items-center gap-2 rounded-input border border-border bg-page px-3 py-2.5 font-sans text-sm text-charcoal">
          <input
            type="checkbox"
            checked={isDefault}
            onChange={(e) => setIsDefault(e.target.checked)}
            className="h-4 w-4 cursor-pointer accent-navy"
          />
          Catch-all default zone (matches any country not covered above)
        </label>
        {error && (
          <p className="rounded-input border border-danger/30 bg-danger/5 px-3 py-2 font-sans text-sm text-danger">
            {error}
          </p>
        )}
        <DialogFooter onCancel={() => !busy && onClose()} busy={busy} initial={Boolean(initial)} />
      </form>
    </Modal>
  );
}

function RateDialog({
  zoneId,
  initial,
  onClose,
  onSaved,
}: {
  zoneId: string;
  initial: AdminShippingRate | null;
  onClose: () => void;
  onSaved: () => Promise<void> | void;
}) {
  const [name, setName] = useState(initial?.name ?? '');
  const [priceAmount, setPriceAmount] = useState(String(initial?.priceAmount ?? 0));
  const [freeAboveAmount, setFreeAboveAmount] = useState(
    initial?.freeAboveAmount != null ? String(initial.freeAboveAmount) : '',
  );
  const [isDefault, setIsDefault] = useState(initial?.isDefault ?? false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      if (initial) {
        await adminUpdateShippingRate(initial.id, {
          name: name.trim(),
          priceAmount: Number(priceAmount) || 0,
          freeAboveAmount: freeAboveAmount ? Number(freeAboveAmount) : null,
          isDefault,
        });
        toast(`Saved ${name.trim()}`);
      } else {
        await adminCreateShippingRate(zoneId, {
          name: name.trim(),
          priceAmount: Number(priceAmount) || 0,
          freeAboveAmount: freeAboveAmount ? Number(freeAboveAmount) : null,
          isDefault,
        });
        toast(`Created ${name.trim()}`);
      }
      await onSaved();
    } catch (err) {
      setError(err instanceof HttpApiError ? err.message : err instanceof Error ? err.message : 'Save failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal title={initial ? `Edit ${initial.name}` : 'New rate'} onClose={() => !busy && onClose()}>
      <form onSubmit={handleSave} className="flex flex-col gap-4">
        <Field label="Name" required>
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={input}
            placeholder="Standard, Express, Pickup, …"
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Price (NGN)" required>
            <input
              required
              type="number"
              min={0}
              value={priceAmount}
              onChange={(e) => setPriceAmount(e.target.value)}
              className={input}
            />
          </Field>
          <Field label="Free above (NGN)" hint="Subtotal threshold for free shipping. Blank = never auto-free.">
            <input
              type="number"
              min={0}
              value={freeAboveAmount}
              onChange={(e) => setFreeAboveAmount(e.target.value)}
              className={input}
            />
          </Field>
        </div>
        <label className="flex cursor-pointer items-center gap-2 rounded-input border border-border bg-page px-3 py-2.5 font-sans text-sm text-charcoal">
          <input
            type="checkbox"
            checked={isDefault}
            onChange={(e) => setIsDefault(e.target.checked)}
            className="h-4 w-4 cursor-pointer accent-navy"
          />
          Default rate for this zone (auto-selected at checkout)
        </label>
        {error && (
          <p className="rounded-input border border-danger/30 bg-danger/5 px-3 py-2 font-sans text-sm text-danger">
            {error}
          </p>
        )}
        <DialogFooter onCancel={() => !busy && onClose()} busy={busy} initial={Boolean(initial)} />
      </form>
    </Modal>
  );
}

function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-charcoal/40 px-4"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex w-full max-w-md flex-col rounded-card bg-white shadow-card-hover"
      >
        <header className="flex items-start justify-between gap-4 border-b border-border px-6 py-4">
          <h2 className="font-raleway text-lg font-bold text-navy">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded p-1 text-muted hover:bg-page hover:text-charcoal"
          >
            <X size={16} aria-hidden />
          </button>
        </header>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  );
}

function DialogFooter({
  onCancel,
  busy,
  initial,
}: {
  onCancel: () => void;
  busy: boolean;
  initial: boolean;
}) {
  return (
    <div className="flex justify-end gap-2 border-t border-border pt-3">
      <button
        type="button"
        onClick={onCancel}
        disabled={busy}
        className="rounded-btn border border-border bg-white px-4 py-2 font-raleway text-xs font-bold uppercase tracking-btn text-charcoal hover:bg-page disabled:opacity-50"
      >
        Cancel
      </button>
      <button
        type="submit"
        disabled={busy}
        className="flex items-center gap-2 rounded-btn bg-navy px-4 py-2 font-raleway text-xs font-bold uppercase tracking-btn text-white hover:bg-amber hover:text-navy disabled:opacity-50"
      >
        <Save size={13} aria-hidden /> {busy ? 'Saving…' : initial ? 'Save' : 'Create'}
      </button>
    </div>
  );
}

const input =
  'w-full rounded-input border border-border bg-white px-3 py-2 font-sans text-sm text-charcoal placeholder:text-muted focus:border-navy focus:outline-none';

function Field({
  label,
  required,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="font-raleway text-[11px] font-bold uppercase tracking-btn text-navy">
        {label}
        {required && <span className="ml-0.5 text-danger">*</span>}
      </span>
      {children}
      {hint && <span className="font-sans text-[11px] text-muted">{hint}</span>}
    </label>
  );
}
