'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { Column, DataTable } from '@/components/admin/DataTable';
import { toast } from '@/components/admin/Toast';
import {
  adminCreateFeatureFlag,
  adminDeleteFeatureFlag,
  adminListFeatureFlags,
  adminUpdateFeatureFlag,
  type FeatureFlagRow,
} from '@/lib/api/admin';

export default function AdminFeatureFlagsPage() {
  const [items, setItems] = useState<FeatureFlagRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<FeatureFlagRow | null>(null);
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void (async () => {
      try {
        const r = await adminListFeatureFlags();
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
  }, [refresh]);

  const onDelete = async (row: FeatureFlagRow) => {
    if (!confirm(`Delete flag "${row.key}"?`)) return;
    try {
      await adminDeleteFeatureFlag(row.id);
      toast('Flag deleted', 'success');
      setRefresh((k) => k + 1);
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Delete failed', 'error');
    }
  };

  const onToggleActive = async (row: FeatureFlagRow) => {
    try {
      await adminUpdateFeatureFlag(row.id, { isActive: !row.isActive });
      setRefresh((k) => k + 1);
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Toggle failed', 'error');
    }
  };

  const onToggleDefault = async (row: FeatureFlagRow) => {
    try {
      await adminUpdateFeatureFlag(row.id, { defaultValue: !row.defaultValue });
      setRefresh((k) => k + 1);
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Toggle failed', 'error');
    }
  };

  const columns: Column<FeatureFlagRow>[] = [
    {
      key: 'key',
      header: 'Flag',
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
          <span className="font-mono text-[10px] text-muted">{r.key}</span>
        </button>
      ),
    },
    {
      key: 'default',
      header: 'Default',
      render: (r) => (
        <button
          type="button"
          onClick={() => onToggleDefault(r)}
          className={`inline-flex rounded-full border px-2 py-0.5 font-raleway text-[10px] font-bold uppercase tracking-btn ${
            r.defaultValue
              ? 'border-success/30 bg-success/10 text-success'
              : 'border-muted/30 bg-muted/10 text-muted'
          }`}
        >
          {r.defaultValue ? 'On' : 'Off'}
        </button>
      ),
    },
    {
      key: 'rules',
      header: 'Targeting rules',
      render: (r) => (
        <span className="font-mono text-[11px] text-charcoal">
          {(r.targetingRules ?? []).length} rule{(r.targetingRules ?? []).length === 1 ? '' : 's'}
        </span>
      ),
    },
    {
      key: 'isActive',
      header: 'Status',
      render: (r) => (
        <button
          type="button"
          onClick={() => onToggleActive(r)}
          className={`inline-flex rounded-full border px-2 py-0.5 font-raleway text-[10px] font-bold uppercase tracking-btn ${
            r.isActive
              ? 'border-amber/30 bg-amber/10 text-amber'
              : 'border-muted/30 bg-muted/10 text-muted'
          }`}
        >
          {r.isActive ? 'Live' : 'Paused'}
        </button>
      ),
    },
    {
      key: 'actions',
      header: '',
      render: (r) => (
        <button
          type="button"
          onClick={() => onDelete(r)}
          className="rounded p-1 text-muted hover:bg-danger/10 hover:text-danger"
          aria-label="Delete flag"
        >
          <Trash2 size={14} aria-hidden />
        </button>
      ),
    },
  ];

  return (
    <div className="px-4 py-6 md:px-8 md:py-10">
      <AdminPageHeader
        title="Feature flags"
        subtitle="Toggle features without deploying. Roll out to a percentage, target by user / role / country, kill instantly when something breaks."
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
            New flag
          </button>
        }
      />

      <DataTable
        rows={items}
        columns={columns}
        rowKey={(r) => r.id}
        loading={loading}
        emptyState='No feature flags yet — click "New flag" to add one.'
      />

      {showForm && (
        <FlagFormDialog
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

function FlagFormDialog({
  editing,
  onClose,
  onSaved,
}: {
  editing: FeatureFlagRow | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [key, setKey] = useState(editing?.key ?? '');
  const [name, setName] = useState(editing?.name ?? '');
  const [description, setDescription] = useState(editing?.description ?? '');
  const [defaultValue, setDefaultValue] = useState(editing?.defaultValue ?? false);
  const [isActive, setIsActive] = useState(editing?.isActive ?? true);
  const [rolloutPercent, setRolloutPercent] = useState<number>(() => {
    const r = editing?.targetingRules?.find(
      (rl) => 'rolloutPercent' in (rl.match ?? {}),
    );
    return r ? Number((r.match as Record<string, unknown>).rolloutPercent ?? 0) : 0;
  });
  const [adminAlwaysOn, setAdminAlwaysOn] = useState(
    !!editing?.targetingRules?.find(
      (r) => (r.match as Record<string, unknown>).userRole === 'ADMIN' && r.value === true,
    ),
  );
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErr(null);
    setSubmitting(true);
    try {
      const targetingRules: Array<{ match: Record<string, unknown>; value: boolean }> = [];
      if (adminAlwaysOn) {
        targetingRules.push({ match: { userRole: 'ADMIN' }, value: true });
      }
      if (rolloutPercent > 0) {
        targetingRules.push({ match: { rolloutPercent }, value: true });
      }
      const body = {
        name,
        description: description.trim() || null,
        defaultValue,
        targetingRules,
        isActive,
      };
      if (editing) {
        await adminUpdateFeatureFlag(editing.id, body);
      } else {
        await adminCreateFeatureFlag({ ...body, key });
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
        className="flex w-full max-w-lg flex-col gap-4 rounded-card bg-white p-6 shadow-card overflow-y-auto max-h-[90vh]"
      >
        <h2 className="font-raleway text-xl font-bold text-navy">
          {editing ? `Edit "${editing.key}"` : 'New feature flag'}
        </h2>

        <label className="flex flex-col gap-1">
          <span className="font-raleway text-[10px] font-bold uppercase tracking-btn text-navy">
            Key {editing && '(immutable)'}
          </span>
          <input
            value={key}
            onChange={(e) => setKey(e.target.value)}
            disabled={!!editing}
            placeholder="new_checkout"
            pattern="[a-z][a-z0-9_]*"
            required
            className="rounded-input border border-border bg-white px-3 py-2 font-mono text-sm focus:border-navy focus:outline-none disabled:bg-page disabled:text-muted"
          />
          <span className="font-sans text-[11px] text-muted">
            Used in code: <span className="font-mono">useFlag(&apos;{key || 'your_key'}&apos;)</span>
          </span>
        </label>

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
          <span className="font-raleway text-[10px] font-bold uppercase tracking-btn text-navy">Description</span>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            className="rounded-input border border-border bg-white px-3 py-2 font-sans text-sm focus:border-navy focus:outline-none"
          />
        </label>

        <fieldset className="flex flex-col gap-3 rounded-card border border-border bg-page p-4">
          <legend className="px-2 font-raleway text-[10px] font-bold uppercase tracking-btn text-muted">
            Targeting
          </legend>
          <label className="flex items-center justify-between">
            <span className="font-sans text-sm text-charcoal">Default value when no rule matches</span>
            <input
              type="checkbox"
              checked={defaultValue}
              onChange={(e) => setDefaultValue(e.target.checked)}
            />
          </label>
          <label className="flex items-center justify-between">
            <span className="font-sans text-sm text-charcoal">
              Always on for ADMIN users (good for staff testing)
            </span>
            <input
              type="checkbox"
              checked={adminAlwaysOn}
              onChange={(e) => setAdminAlwaysOn(e.target.checked)}
            />
          </label>
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <span className="font-sans text-sm text-charcoal">
                Rollout to {rolloutPercent}% of logged-in users
              </span>
              <span className="font-mono text-xs text-navy">{rolloutPercent}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              step={1}
              value={rolloutPercent}
              onChange={(e) => setRolloutPercent(Number(e.target.value))}
            />
            <span className="font-sans text-[11px] text-muted">
              Sticky per-user — same user lands in the same bucket every time.
            </span>
          </div>
          <label className="flex items-center justify-between border-t border-border pt-3">
            <span className="font-sans text-sm text-charcoal">
              Active (uncheck to kill — flag returns its default value)
            </span>
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
            />
          </label>
        </fieldset>

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
            {submitting ? 'Saving…' : editing ? 'Save changes' : 'Create flag'}
          </button>
        </div>
      </form>
    </div>
  );
}
