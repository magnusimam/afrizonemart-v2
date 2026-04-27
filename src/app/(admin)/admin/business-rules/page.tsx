'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { Column, DataTable } from '@/components/admin/DataTable';
import { toast } from '@/components/admin/Toast';
import {
  adminCreateBusinessRule,
  adminDeleteBusinessRule,
  adminListBusinessRules,
  adminUpdateBusinessRule,
  type BusinessRuleRow,
} from '@/lib/api/admin';

const SCOPES = ['cart', 'order', 'fulfilment', 'discount', 'fraud', 'loyalty'];

export default function AdminBusinessRulesPage() {
  const [scope, setScope] = useState<string>('cart');
  const [items, setItems] = useState<BusinessRuleRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<BusinessRuleRow | null>(null);
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void (async () => {
      try {
        const r = await adminListBusinessRules(scope);
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

  const onDelete = async (row: BusinessRuleRow) => {
    if (!confirm(`Delete rule "${row.name}"?`)) return;
    try {
      await adminDeleteBusinessRule(row.id);
      toast('Rule deleted', 'success');
      setRefresh((k) => k + 1);
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Delete failed', 'error');
    }
  };

  const onToggle = async (row: BusinessRuleRow) => {
    try {
      await adminUpdateBusinessRule(row.id, { isActive: !row.isActive });
      setRefresh((k) => k + 1);
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Toggle failed', 'error');
    }
  };

  const columns: Column<BusinessRuleRow>[] = [
    {
      key: 'name',
      header: 'Rule',
      render: (r) => (
        <button
          type="button"
          onClick={() => {
            setEditing(r);
            setShowForm(true);
          }}
          className="flex flex-col text-left leading-tight"
        >
          <span className="font-raleway text-sm font-bold text-navy hover:underline">{r.name}</span>
          <span className="font-mono text-[10px] text-muted">
            {r.scope}/{r.key}
          </span>
        </button>
      ),
    },
    {
      key: 'priority',
      header: 'Priority',
      render: (r) => <span className="font-sans text-xs text-muted">{r.priority}</span>,
    },
    {
      key: 'conditions',
      header: 'Matches when',
      render: (r) => (
        <pre className="max-w-md overflow-x-auto whitespace-pre-wrap break-words rounded bg-page p-2 font-mono text-[10px] text-charcoal">
          {Object.keys(r.conditions ?? {}).length === 0
            ? '— always —'
            : JSON.stringify(r.conditions, null, 2)}
        </pre>
      ),
    },
    {
      key: 'actions',
      header: 'Then apply',
      render: (r) => (
        <pre className="max-w-md overflow-x-auto whitespace-pre-wrap break-words rounded bg-page p-2 font-mono text-[10px] text-charcoal">
          {JSON.stringify(r.actions ?? {}, null, 2)}
        </pre>
      ),
    },
    {
      key: 'isActive',
      header: 'Status',
      render: (r) => (
        <button
          type="button"
          onClick={() => onToggle(r)}
          className={`inline-flex rounded-full border px-2 py-0.5 font-raleway text-[10px] font-bold uppercase tracking-btn ${
            r.isActive
              ? 'border-success/30 bg-success/10 text-success'
              : 'border-muted/30 bg-muted/10 text-muted'
          }`}
        >
          {r.isActive ? 'Active' : 'Paused'}
        </button>
      ),
    },
    {
      key: 'rm',
      header: '',
      render: (r) => (
        <button
          type="button"
          onClick={() => onDelete(r)}
          className="rounded p-1 text-muted hover:bg-danger/10 hover:text-danger"
          aria-label="Delete rule"
        >
          <Trash2 size={14} aria-hidden />
        </button>
      ),
    },
  ];

  return (
    <div className="px-8 py-10">
      <AdminPageHeader
        title="Business rules"
        subtitle="Author conditional logic without code. Each rule is matched against a context (cart, order…) and produces actions the host module honours."
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
            New rule
          </button>
        }
      />

      <div className="mb-4 flex items-center gap-2 overflow-x-auto">
        {SCOPES.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setScope(s)}
            className={`rounded-btn border px-4 py-1.5 font-raleway text-xs font-bold uppercase tracking-btn whitespace-nowrap ${
              scope === s
                ? 'border-navy bg-navy text-white'
                : 'border-border bg-white text-charcoal hover:border-navy'
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      <DataTable
        rows={items}
        columns={columns}
        rowKey={(r) => r.id}
        loading={loading}
        emptyState={`No ${scope} rules yet — click "New rule" to add one.`}
      />

      {showForm && (
        <RuleFormDialog
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

const SAMPLE_CONDITIONS: Record<string, string> = {
  cart: '{\n  "subtotal": { "$gte": 15000 }\n}',
  order: '{\n  "country": ["NG"]\n}',
  fulfilment: '{\n  "weight": { "$lte": 5 }\n}',
  discount: '{\n  "user.tier": "VIP"\n}',
  fraud: '{\n  "amount": { "$gt": 500000 }\n}',
  loyalty: '{}',
};

const SAMPLE_ACTIONS: Record<string, string> = {
  cart: '{\n  "freeShipping": true\n}',
  order: '{\n  "requireApproval": false\n}',
  fulfilment: '{\n  "carrier": "GIG"\n}',
  discount: '{\n  "discountPercent": 10\n}',
  fraud: '{\n  "requireReview": true\n}',
  loyalty: '{\n  "pointsMultiplier": 2\n}',
};

function RuleFormDialog({
  scope,
  editing,
  onClose,
  onSaved,
}: {
  scope: string;
  editing: BusinessRuleRow | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState(editing?.name ?? '');
  const [key, setKey] = useState(editing?.key ?? '');
  const [description, setDescription] = useState(editing?.description ?? '');
  const [priority, setPriority] = useState(editing?.priority ?? 100);
  const [isActive, setIsActive] = useState(editing?.isActive ?? true);
  const [conditionsText, setConditionsText] = useState(
    editing
      ? JSON.stringify(editing.conditions, null, 2)
      : SAMPLE_CONDITIONS[scope] ?? '{}',
  );
  const [actionsText, setActionsText] = useState(
    editing
      ? JSON.stringify(editing.actions, null, 2)
      : SAMPLE_ACTIONS[scope] ?? '{}',
  );
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // Auto-derive a key from name when creating.
  useEffect(() => {
    if (editing) return;
    const derived = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '')
      .slice(0, 80);
    setKey(derived);
  }, [name, editing]);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErr(null);
    let conditions: Record<string, unknown> = {};
    let actions: Record<string, unknown> = {};
    try {
      conditions = JSON.parse(conditionsText || '{}');
      actions = JSON.parse(actionsText || '{}');
    } catch (e2) {
      setErr(e2 instanceof Error ? `JSON: ${e2.message}` : 'Invalid JSON');
      return;
    }
    setSubmitting(true);
    try {
      const body = {
        name,
        description: description.trim() || null,
        priority,
        isActive,
        conditions,
        actions,
      };
      if (editing) {
        await adminUpdateBusinessRule(editing.id, body);
      } else {
        await adminCreateBusinessRule({ ...body, scope, key });
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
        className="flex w-full max-w-2xl flex-col gap-4 rounded-card bg-white p-6 shadow-card overflow-y-auto max-h-[90vh]"
      >
        <h2 className="font-raleway text-xl font-bold text-navy">
          {editing ? `Edit ${editing.scope}/${editing.key}` : `New ${scope} rule`}
        </h2>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <label className="flex flex-col gap-1">
            <span className="font-raleway text-[10px] font-bold uppercase tracking-btn text-navy">Name</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
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
              pattern="[a-z][a-z0-9_]*"
              required
              className="rounded-input border border-border bg-white px-3 py-2 font-mono text-sm focus:border-navy focus:outline-none disabled:bg-page"
            />
          </label>
        </div>

        <label className="flex flex-col gap-1">
          <span className="font-raleway text-[10px] font-bold uppercase tracking-btn text-navy">Description</span>
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="rounded-input border border-border bg-white px-3 py-2 font-sans text-sm focus:border-navy focus:outline-none"
          />
        </label>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <label className="flex flex-col gap-1">
            <span className="font-raleway text-[10px] font-bold uppercase tracking-btn text-navy">When (conditions)</span>
            <textarea
              value={conditionsText}
              onChange={(e) => setConditionsText(e.target.value)}
              rows={8}
              className="rounded-input border border-border bg-white px-3 py-2 font-mono text-xs focus:border-navy focus:outline-none"
            />
            <span className="font-sans text-[11px] text-muted">
              Operators: $eq $ne $gt $gte $lt $lte $in. Combine with $any or $all. Empty = always matches.
            </span>
          </label>
          <label className="flex flex-col gap-1">
            <span className="font-raleway text-[10px] font-bold uppercase tracking-btn text-navy">Then (actions)</span>
            <textarea
              value={actionsText}
              onChange={(e) => setActionsText(e.target.value)}
              rows={8}
              className="rounded-input border border-border bg-white px-3 py-2 font-mono text-xs focus:border-navy focus:outline-none"
            />
            <span className="font-sans text-[11px] text-muted">
              Free-form key/value the host module reads.
            </span>
          </label>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <label className="flex items-center gap-2">
            <span className="font-sans text-xs text-muted">Priority</span>
            <input
              type="number"
              value={priority}
              onChange={(e) => setPriority(Number(e.target.value) || 0)}
              className="w-24 rounded-input border border-border bg-white px-2 py-1 font-sans text-sm"
            />
            <span className="font-sans text-[11px] text-muted">Lower = first</span>
          </label>
          <label className="ml-auto flex items-center gap-2">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
            />
            <span className="font-sans text-sm text-charcoal">Active</span>
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
            {submitting ? 'Saving…' : editing ? 'Save changes' : 'Create rule'}
          </button>
        </div>
      </form>
    </div>
  );
}
