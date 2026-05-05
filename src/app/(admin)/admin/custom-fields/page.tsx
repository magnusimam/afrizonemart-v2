'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { Column, DataTable } from '@/components/admin/DataTable';
import { toast } from '@/components/admin/Toast';
import {
  adminCreateCustomField,
  adminDeleteCustomField,
  adminListCustomFields,
  adminUpdateCustomField,
  type CustomFieldDef,
  type CustomFieldScope,
  type CustomFieldType,
} from '@/lib/api/admin';

const TYPES: Array<{ value: CustomFieldType; label: string; hint: string }> = [
  { value: 'TEXT', label: 'Text', hint: 'Single-line text' },
  { value: 'LONGTEXT', label: 'Long text', hint: 'Multi-line textarea' },
  { value: 'RICHTEXT', label: 'Rich text', hint: 'HTML body' },
  { value: 'NUMBER', label: 'Number', hint: 'Integer or decimal' },
  { value: 'BOOLEAN', label: 'Yes / No', hint: 'Checkbox' },
  { value: 'URL', label: 'Link', hint: 'Any URL' },
  { value: 'VIDEO', label: 'Video', hint: 'YouTube / Vimeo URL — auto-embeds' },
  { value: 'IMAGE', label: 'Image', hint: 'Image URL — auto-renders' },
  { value: 'SELECT', label: 'Dropdown', hint: 'Pick from a list' },
  { value: 'JSON', label: 'JSON', hint: 'Power users' },
];

const SCOPES: Array<{ value: CustomFieldScope; label: string }> = [
  { value: 'PRODUCT', label: 'Product' },
  { value: 'ORDER', label: 'Order' },
  { value: 'USER', label: 'User' },
];

export default function AdminCustomFieldsPage() {
  const [scope, setScope] = useState<CustomFieldScope>('PRODUCT');
  const [items, setItems] = useState<CustomFieldDef[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<CustomFieldDef | null>(null);
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void (async () => {
      try {
        const r = await adminListCustomFields({ scope, includeInactive: true });
        if (!cancelled) setItems(r.items);
      } catch (e) {
        if (!cancelled) toast(e instanceof Error ? e.message : 'Failed to load', 'error');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [scope, refresh]);

  const onDelete = async (def: CustomFieldDef) => {
    if (!confirm(`Delete the "${def.label}" field? Existing values on records will remain in the database but will stop rendering.`)) return;
    try {
      await adminDeleteCustomField(def.id);
      toast('Field deleted', 'success');
      setRefresh((k) => k + 1);
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Delete failed', 'error');
    }
  };

  const columns: Column<CustomFieldDef>[] = [
    {
      key: 'label',
      header: 'Label',
      render: (d) => (
        <div className="flex flex-col leading-tight">
          <button
            type="button"
            onClick={() => {
              setEditing(d);
              setShowForm(true);
            }}
            className="text-left font-raleway text-sm font-bold text-navy hover:underline"
          >
            {d.label}
          </button>
          <span className="font-mono text-[10px] text-muted">{d.key}</span>
        </div>
      ),
    },
    { key: 'type', header: 'Type', render: (d) => <span className="font-mono text-[11px] text-navy">{d.type}</span> },
    {
      key: 'required',
      header: 'Required',
      render: (d) => (d.required ? <span className="text-amber">●</span> : <span className="text-border">—</span>),
    },
    {
      key: 'sortOrder',
      header: 'Order',
      render: (d) => <span className="font-sans text-xs text-muted">{d.sortOrder}</span>,
    },
    {
      key: 'isActive',
      header: 'Status',
      render: (d) => (
        <span
          className={`inline-flex rounded-full border px-2 py-0.5 font-raleway text-[10px] font-bold uppercase tracking-btn ${
            d.isActive
              ? 'border-success/30 bg-success/10 text-success'
              : 'border-muted/30 bg-muted/10 text-muted'
          }`}
        >
          {d.isActive ? 'Active' : 'Hidden'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      render: (d) => (
        <button
          type="button"
          onClick={() => onDelete(d)}
          className="rounded p-1 text-muted hover:bg-danger/10 hover:text-danger"
          aria-label="Delete field"
        >
          <Trash2 size={14} aria-hidden />
        </button>
      ),
    },
  ];

  return (
    <div className="px-4 py-6 md:px-8 md:py-10">
      <AdminPageHeader
        title="Custom Fields"
        subtitle="Add new fields to products, orders or users without filing a dev ticket. Each field appears in the admin form and on the storefront."
        action={
          <button
            type="button"
            onClick={() => {
              setEditing(null);
              setShowForm(true);
            }}
            className="flex items-center gap-2 rounded-btn bg-navy px-4 py-2 font-raleway text-xs font-bold uppercase tracking-btn text-white shadow-card hover:bg-amber hover:text-navy"
          >
            <Plus size={14} aria-hidden />
            New field
          </button>
        }
      />

      <div className="mb-4 flex items-center gap-2">
        {SCOPES.map((s) => (
          <button
            key={s.value}
            type="button"
            onClick={() => setScope(s.value)}
            className={`rounded-btn border px-4 py-1.5 font-raleway text-xs font-bold uppercase tracking-btn transition-colors ${
              scope === s.value
                ? 'border-navy bg-navy text-white'
                : 'border-border bg-white text-charcoal hover:border-navy'
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      <DataTable
        rows={items}
        columns={columns}
        rowKey={(d) => d.id}
        loading={loading}
        emptyState={`No ${scope.toLowerCase()} fields yet — click "New field" to add one.`}
      />

      {showForm && (
        <FieldFormDialog
          scope={scope}
          editing={editing}
          onClose={() => {
            setShowForm(false);
            setEditing(null);
          }}
          onSaved={() => {
            setShowForm(false);
            setEditing(null);
            setRefresh((k) => k + 1);
          }}
        />
      )}
    </div>
  );
}

function FieldFormDialog({
  scope,
  editing,
  onClose,
  onSaved,
}: {
  scope: CustomFieldScope;
  editing: CustomFieldDef | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [label, setLabel] = useState(editing?.label ?? '');
  const [key, setKey] = useState(editing?.key ?? '');
  const [type, setType] = useState<CustomFieldType>(editing?.type ?? 'TEXT');
  const [description, setDescription] = useState(editing?.description ?? '');
  const [required, setRequired] = useState(editing?.required ?? false);
  const [sortOrder, setSortOrder] = useState(editing?.sortOrder ?? 100);
  const [isActive, setIsActive] = useState(editing?.isActive ?? true);
  const [choicesText, setChoicesText] = useState(
    editing?.type === 'SELECT' && Array.isArray((editing.options as { choices?: string[] }).choices)
      ? ((editing.options as { choices: string[] }).choices ?? []).join('\n')
      : '',
  );
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // Auto-derive a key from the label when creating.
  useEffect(() => {
    if (editing) return;
    const derived = label
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '')
      .slice(0, 60);
    setKey(derived);
  }, [label, editing]);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErr(null);
    setSubmitting(true);
    try {
      const options: Record<string, unknown> = {};
      if (type === 'SELECT') {
        const choices = choicesText
          .split('\n')
          .map((s) => s.trim())
          .filter(Boolean);
        options.choices = choices;
      }
      const body = {
        label: label.trim(),
        description: description.trim() || null,
        type,
        required,
        sortOrder,
        options,
      };
      if (editing) {
        await adminUpdateCustomField(editing.id, { ...body, isActive });
      } else {
        await adminCreateCustomField({ scope, key: key.trim(), ...body });
      }
      onSaved();
    } catch (e2) {
      setErr(e2 instanceof Error ? e2.message : 'Save failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-navy/40 p-4"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={onSubmit}
        className="flex w-full max-w-lg flex-col gap-4 rounded-card bg-white p-6 shadow-card"
      >
        <h2 className="font-raleway text-xl font-bold text-navy">
          {editing ? 'Edit field' : `New ${scope.toLowerCase()} field`}
        </h2>

        <label className="flex flex-col gap-1">
          <span className="font-raleway text-[10px] font-bold uppercase tracking-btn text-navy">Label</span>
          <input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="e.g. YouTube how-it's-made"
            required
            className="rounded-input border border-border bg-white px-3 py-2 font-sans text-sm focus:border-navy focus:outline-none"
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="font-raleway text-[10px] font-bold uppercase tracking-btn text-navy">
            Key {editing && '(immutable)'}
          </span>
          <input
            value={key}
            onChange={(e) => setKey(e.target.value)}
            disabled={!!editing}
            placeholder="youtube_how_its_made"
            pattern="[a-z][a-z0-9_]*"
            required
            className="rounded-input border border-border bg-white px-3 py-2 font-mono text-sm focus:border-navy focus:outline-none disabled:bg-page disabled:text-muted"
          />
          <span className="font-sans text-[11px] text-muted">
            Lowercase letters, numbers, underscores. Used as JSON key on records — never change after fields are in use.
          </span>
        </label>

        <label className="flex flex-col gap-1">
          <span className="font-raleway text-[10px] font-bold uppercase tracking-btn text-navy">Type</span>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as CustomFieldType)}
            className="rounded-input border border-border bg-white px-3 py-2 font-sans text-sm focus:border-navy focus:outline-none"
          >
            {TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label} — {t.hint}
              </option>
            ))}
          </select>
        </label>

        {type === 'SELECT' && (
          <label className="flex flex-col gap-1">
            <span className="font-raleway text-[10px] font-bold uppercase tracking-btn text-navy">Choices (one per line)</span>
            <textarea
              value={choicesText}
              onChange={(e) => setChoicesText(e.target.value)}
              rows={4}
              required
              className="rounded-input border border-border bg-white px-3 py-2 font-sans text-sm focus:border-navy focus:outline-none"
              placeholder={'small\nmedium\nlarge'}
            />
          </label>
        )}

        <label className="flex flex-col gap-1">
          <span className="font-raleway text-[10px] font-bold uppercase tracking-btn text-navy">Helper text (optional)</span>
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Shown under the field in admin"
            className="rounded-input border border-border bg-white px-3 py-2 font-sans text-sm focus:border-navy focus:outline-none"
          />
        </label>

        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={required}
              onChange={(e) => setRequired(e.target.checked)}
            />
            <span className="font-sans text-sm text-charcoal">Required</span>
          </label>
          {editing && (
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
              />
              <span className="font-sans text-sm text-charcoal">Active</span>
            </label>
          )}
          <label className="ml-auto flex items-center gap-2">
            <span className="font-sans text-xs text-muted">Order</span>
            <input
              type="number"
              value={sortOrder}
              onChange={(e) => setSortOrder(Number(e.target.value) || 0)}
              className="w-20 rounded-input border border-border bg-white px-2 py-1 font-sans text-sm"
            />
          </label>
        </div>

        {err && (
          <p className="rounded-card border border-danger/30 bg-danger/5 px-3 py-2 font-sans text-xs text-danger">{err}</p>
        )}

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-btn border border-border bg-white px-4 py-2 font-raleway text-xs font-bold uppercase tracking-btn text-charcoal hover:border-navy"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="rounded-btn bg-navy px-4 py-2 font-raleway text-xs font-bold uppercase tracking-btn text-white hover:bg-amber hover:text-navy disabled:opacity-60"
          >
            {submitting ? 'Saving…' : editing ? 'Save changes' : 'Create field'}
          </button>
        </div>
      </form>
    </div>
  );
}
