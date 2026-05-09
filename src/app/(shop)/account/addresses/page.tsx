'use client';

import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Edit2, Loader2, MapPin, Plus, Trash2 } from 'lucide-react';
import { AccountSidebar } from '@/components/account/AccountSidebar';
import { SafeBoundary } from '@/components/common/SafeBoundary';
import { COUNTRIES, COUNTRY_CODES, getCountry } from '@/lib/countries';
import {
  AddressApiError,
  type AddressInput,
  type SavedAddress,
  createAddress,
  deleteAddress,
  listAddresses,
  updateAddress,
} from '@/lib/api/addresses';
import { useAuthStore } from '@/stores/authStore';

/**
 * /account/addresses — saved delivery addresses, live data.
 *
 * Replaces the previous fully-mocked page. Real CRUD against
 * `/api/addresses` (see afrizonemart-api/src/modules/addresses).
 *
 * UX:
 *  - Empty state: shows the form inline so the first address takes
 *    one click instead of two. First save is auto-default.
 *  - List + add: cards in a 2-col grid, an "Add new" tile that flips
 *    into the form, and an edit drawer that swaps in place of a
 *    card when its pencil is clicked.
 *  - Delete is destructive — confirmation is `window.confirm` for now;
 *    a styled modal can come later.
 *
 * Region/currency on /profile is "Coming Soon"; this page uses the
 * full COUNTRIES list directly because shipping country is the one
 * thing we definitely need today.
 */

const PHONE_HINT = 'E.164, e.g. +2348012345678';

const emptyForm: AddressInput = {
  fullName: '',
  phone: '',
  addressLine: '',
  city: '',
  country: 'NG',
  label: '',
  isDefault: false,
};

export default function AddressesPage() {
  const user = useAuthStore((s) => s.user);
  const accessToken = useAuthStore((s) => s.accessToken);

  const [items, setItems] = useState<SavedAddress[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Either creating ("new") or editing an existing id; null = closed.
  const [editing, setEditing] = useState<'new' | string | null>(null);
  const [form, setForm] = useState<AddressInput>(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const { first, last } = useMemo(() => {
    const [f, ...rest] = (user?.name ?? '').split(' ');
    return { first: f ?? '', last: rest.join(' ') };
  }, [user?.name]);

  useEffect(() => {
    if (!accessToken) return;
    let cancelled = false;
    setLoadError(null);
    listAddresses(accessToken)
      .then((res) => {
        if (cancelled) return;
        setItems(res.items);
        // First-time visitor with zero addresses → open the form so
        // they can create the first one in a single click.
        if (res.items.length === 0) {
          setForm({ ...emptyForm, fullName: user?.name ?? '', phone: user?.phone ?? '' });
          setEditing('new');
        }
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setLoadError(
          err instanceof AddressApiError
            ? err.message
            : 'Could not load your saved addresses.',
        );
      });
    return () => {
      cancelled = true;
    };
  }, [accessToken, user?.name, user?.phone]);

  const startCreate = () => {
    setForm({ ...emptyForm, fullName: user?.name ?? '', phone: user?.phone ?? '' });
    setFormError(null);
    setEditing('new');
  };

  const startEdit = (a: SavedAddress) => {
    setForm({
      fullName: a.fullName,
      phone: a.phone,
      addressLine: a.addressLine,
      city: a.city,
      country: a.country,
      label: a.label ?? '',
      isDefault: a.isDefault,
    });
    setFormError(null);
    setEditing(a.id);
  };

  const closeForm = () => {
    setEditing(null);
    setFormError(null);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!accessToken) return;
    setFormError(null);
    setSubmitting(true);
    try {
      const payload: AddressInput = {
        ...form,
        label: form.label?.trim() ? form.label.trim() : null,
      };
      if (editing === 'new') {
        const created = await createAddress(accessToken, payload);
        setItems((prev) => syncDefault([...(prev ?? []), created], created));
      } else if (editing) {
        const updated = await updateAddress(accessToken, editing, payload);
        setItems((prev) =>
          syncDefault(
            (prev ?? []).map((a) => (a.id === updated.id ? updated : a)),
            updated,
          ),
        );
      }
      closeForm();
    } catch (err) {
      setFormError(
        err instanceof AddressApiError
          ? err.message
          : 'Could not save the address. Try again.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (a: SavedAddress) => {
    if (!accessToken) return;
    if (!window.confirm(`Delete "${a.label || a.addressLine}"?`)) return;
    setBusyId(a.id);
    try {
      await deleteAddress(accessToken, a.id);
      // Refetch — the API may have promoted another address to default.
      const refreshed = await listAddresses(accessToken);
      setItems(refreshed.items);
    } catch (err) {
      setLoadError(
        err instanceof AddressApiError
          ? err.message
          : 'Could not delete that address.',
      );
    } finally {
      setBusyId(null);
    }
  };

  const handleSetDefault = async (a: SavedAddress) => {
    if (!accessToken || a.isDefault) return;
    setBusyId(a.id);
    try {
      const updated = await updateAddress(accessToken, a.id, { isDefault: true });
      setItems((prev) => syncDefault(prev ?? [], updated));
    } catch (err) {
      setLoadError(
        err instanceof AddressApiError
          ? err.message
          : 'Could not set as default.',
      );
    } finally {
      setBusyId(null);
    }
  };

  const count = items?.length ?? 0;

  return (
    <main className="bg-page pb-12">
      <div className="mx-auto max-w-site px-4 py-6 md:py-10">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:gap-8">
          <div className="lg:col-span-3">
            <SafeBoundary name="account:sidebar" fallback={null}>
              <AccountSidebar
                active="/account/addresses"
                userFirstName={first || 'You'}
                userLastName={last}
              />
            </SafeBoundary>
          </div>

          <div className="flex flex-col gap-5 lg:col-span-9">
            <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <h1 className="font-raleway text-2xl font-bold text-navy md:text-3xl">
                  Saved Addresses
                </h1>
                <p className="font-sans text-sm text-muted md:text-base">
                  {items === null
                    ? 'Loading…'
                    : `${count} address${count === 1 ? '' : 'es'} on file`}
                </p>
              </div>
              {items !== null && editing !== 'new' ? (
                <button
                  type="button"
                  onClick={startCreate}
                  className="flex items-center gap-1.5 rounded-btn bg-navy px-4 py-2 font-raleway text-xs font-bold uppercase tracking-btn text-white hover:bg-amber hover:text-navy"
                >
                  <Plus size={14} aria-hidden />
                  Add New Address
                </button>
              ) : null}
            </header>

            {loadError ? (
              <div
                role="alert"
                className="rounded-input border border-danger/30 bg-danger/5 px-3 py-2 font-sans text-sm text-danger"
              >
                {loadError}
              </div>
            ) : null}

            {items === null ? (
              <div className="flex items-center gap-2 font-sans text-sm text-muted">
                <Loader2 size={16} className="animate-spin" aria-hidden />
                Loading your addresses…
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-5">
                {items.map((a) =>
                  editing === a.id ? (
                    <AddressForm
                      key={a.id}
                      mode="edit"
                      form={form}
                      onChange={setForm}
                      onCancel={closeForm}
                      onSubmit={handleSubmit}
                      submitting={submitting}
                      error={formError}
                    />
                  ) : (
                    <AddressCard
                      key={a.id}
                      a={a}
                      busy={busyId === a.id}
                      onEdit={() => startEdit(a)}
                      onDelete={() => handleDelete(a)}
                      onSetDefault={() => handleSetDefault(a)}
                    />
                  ),
                )}

                {editing === 'new' ? (
                  <AddressForm
                    mode="create"
                    form={form}
                    onChange={setForm}
                    onCancel={closeForm}
                    onSubmit={handleSubmit}
                    submitting={submitting}
                    error={formError}
                  />
                ) : (
                  <button
                    type="button"
                    onClick={startCreate}
                    className="flex min-h-[200px] flex-col items-center justify-center gap-3 rounded-card border-2 border-dashed border-border bg-white p-6 text-navy transition-colors hover:border-navy hover:bg-page"
                  >
                    <Plus size={28} aria-hidden />
                    <span className="font-raleway text-sm font-bold uppercase tracking-btn">
                      Add New Address
                    </span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

/// After a write that may have changed the default flag, re-flag the
/// list locally so we don't have to refetch on every save. The server
/// has already enforced exclusivity; this just mirrors that into our
/// in-memory copy.
function syncDefault(list: SavedAddress[], latest: SavedAddress): SavedAddress[] {
  if (!latest.isDefault) return list;
  return list.map((a) =>
    a.id === latest.id ? latest : { ...a, isDefault: false },
  );
}

function AddressCard({
  a,
  busy,
  onEdit,
  onDelete,
  onSetDefault,
}: {
  a: SavedAddress;
  busy: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onSetDefault: () => void;
}) {
  const c = getCountry(a.country);
  return (
    <article
      className={`flex flex-col gap-3 rounded-card border-2 bg-white p-5 shadow-card md:p-6 ${
        a.isDefault ? 'border-navy' : 'border-border'
      }`}
    >
      <header className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <MapPin size={18} className="text-navy" aria-hidden />
          <span className="font-raleway text-base font-bold text-navy">
            {a.label || 'Address'}
          </span>
          {a.isDefault ? (
            <span className="rounded-input bg-amber px-2 py-0.5 font-raleway text-[10px] font-bold uppercase tracking-btn text-navy">
              Default
            </span>
          ) : null}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onEdit}
            disabled={busy}
            aria-label={`Edit ${a.label || 'address'}`}
            className="flex h-8 w-8 items-center justify-center rounded-full text-navy transition-colors hover:bg-navy/10 disabled:opacity-50"
          >
            <Edit2 size={14} aria-hidden />
          </button>
          <button
            type="button"
            onClick={onDelete}
            disabled={busy}
            aria-label={`Delete ${a.label || 'address'}`}
            className="flex h-8 w-8 items-center justify-center rounded-full text-danger transition-colors hover:bg-danger/10 disabled:opacity-50"
          >
            <Trash2 size={14} aria-hidden />
          </button>
        </div>
      </header>

      <div className="flex flex-col gap-1 font-sans text-sm leading-relaxed text-charcoal">
        <span className="font-bold text-navy">{a.fullName}</span>
        <span>{a.phone}</span>
        <span>{a.addressLine}</span>
        <span>{a.city}</span>
        <span>
          {c?.flag} {c?.name ?? a.country}
        </span>
      </div>

      {!a.isDefault ? (
        <button
          type="button"
          onClick={onSetDefault}
          disabled={busy}
          className="self-start rounded-btn border border-navy bg-white px-4 py-1.5 font-raleway text-xs font-bold uppercase tracking-btn text-navy hover:bg-navy hover:text-white disabled:opacity-50"
        >
          {busy ? 'Working…' : 'Set as Default'}
        </button>
      ) : null}
    </article>
  );
}

function AddressForm({
  mode,
  form,
  onChange,
  onCancel,
  onSubmit,
  submitting,
  error,
}: {
  mode: 'create' | 'edit';
  form: AddressInput;
  onChange: (next: AddressInput) => void;
  onCancel: () => void;
  onSubmit: (e: FormEvent) => void;
  submitting: boolean;
  error: string | null;
}) {
  return (
    <form
      onSubmit={onSubmit}
      className="md:col-span-2 flex flex-col gap-4 rounded-card border-2 border-navy bg-white p-5 shadow-card md:p-6"
    >
      <header className="flex items-center justify-between gap-3">
        <h2 className="font-raleway text-lg font-bold text-navy">
          {mode === 'create' ? 'Add a new address' : 'Edit address'}
        </h2>
      </header>

      {error ? (
        <div
          role="alert"
          className="rounded-input border border-danger/30 bg-danger/5 px-3 py-2 font-sans text-sm text-danger"
        >
          {error}
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Field label="Label" hint="Optional. e.g. Home, Office, Mum's place">
          <input
            type="text"
            value={form.label ?? ''}
            onChange={(e) => onChange({ ...form, label: e.target.value })}
            placeholder="Home"
            maxLength={50}
            className={inputClass}
          />
        </Field>
        <Field label="Full Name">
          <input
            type="text"
            value={form.fullName}
            onChange={(e) => onChange({ ...form, fullName: e.target.value })}
            required
            maxLength={100}
            autoComplete="name"
            className={inputClass}
          />
        </Field>
        <Field label="Phone" hint={PHONE_HINT}>
          <input
            type="tel"
            value={form.phone}
            onChange={(e) => onChange({ ...form, phone: e.target.value })}
            required
            placeholder="+2348012345678"
            autoComplete="tel"
            className={inputClass}
          />
        </Field>
        <Field label="Country">
          <select
            value={form.country}
            onChange={(e) => onChange({ ...form, country: e.target.value })}
            required
            autoComplete="country"
            className={inputClass}
          >
            {COUNTRY_CODES.map((c) => (
              <option key={c} value={c}>
                {COUNTRIES[c].flag} {COUNTRIES[c].name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="City">
          <input
            type="text"
            value={form.city}
            onChange={(e) => onChange({ ...form, city: e.target.value })}
            required
            maxLength={100}
            autoComplete="address-level2"
            className={inputClass}
          />
        </Field>
        <Field label="Street Address" full>
          <input
            type="text"
            value={form.addressLine}
            onChange={(e) => onChange({ ...form, addressLine: e.target.value })}
            required
            maxLength={250}
            autoComplete="street-address"
            placeholder="Plot 14, Adeola Odeku Street"
            className={inputClass}
          />
        </Field>
      </div>

      <label className="flex items-center gap-2 font-sans text-sm text-charcoal">
        <input
          type="checkbox"
          checked={form.isDefault ?? false}
          onChange={(e) => onChange({ ...form, isDefault: e.target.checked })}
          className="h-4 w-4 rounded border-border text-navy focus:ring-navy"
        />
        Make this my default delivery address
      </label>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={submitting}
          className="flex items-center gap-2 rounded-btn bg-navy px-6 py-3 font-raleway text-sm font-bold uppercase tracking-btn text-white shadow-card hover:bg-amber hover:text-navy disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting && <Loader2 size={16} className="animate-spin" aria-hidden />}
          {submitting
            ? 'Saving…'
            : mode === 'create'
              ? 'Save Address'
              : 'Save Changes'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={submitting}
          className="rounded-btn border border-border bg-white px-6 py-3 font-raleway text-sm font-bold uppercase tracking-btn text-charcoal hover:bg-page disabled:opacity-50"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

const inputClass =
  'w-full rounded-input border border-border bg-white px-3 py-2.5 font-sans text-sm text-charcoal placeholder:text-muted focus:border-navy focus:outline-none';

function Field({
  label,
  hint,
  full,
  children,
}: {
  label: string;
  hint?: string;
  full?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className={`flex flex-col gap-1.5 ${full ? 'md:col-span-2' : ''}`}>
      <span className="font-raleway text-xs font-bold uppercase tracking-btn text-navy">
        {label}
      </span>
      {children}
      {hint ? <span className="font-sans text-xs text-muted">{hint}</span> : null}
    </label>
  );
}
