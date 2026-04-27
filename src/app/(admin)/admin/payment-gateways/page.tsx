'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { Column, DataTable } from '@/components/admin/DataTable';
import { toast } from '@/components/admin/Toast';
import {
  adminCreatePaymentGateway,
  adminDeletePaymentGateway,
  adminListAvailableProviders,
  adminListPaymentGateways,
  adminUpdatePaymentGateway,
  type PaymentGatewayConfigRow,
  type ProviderDefinition,
} from '@/lib/api/admin';

const CURRENCIES = ['NGN', 'USD', 'GBP', 'EUR', 'KES', 'GHS', 'ZAR'];

export default function AdminPaymentGatewaysPage() {
  const [providers, setProviders] = useState<ProviderDefinition[]>([]);
  const [rows, setRows] = useState<PaymentGatewayConfigRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<PaymentGatewayConfigRow | null>(null);
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void (async () => {
      try {
        const [p, r] = await Promise.all([
          adminListAvailableProviders(),
          adminListPaymentGateways(),
        ]);
        if (!cancelled) {
          setProviders(p.items);
          setRows(r.items);
        }
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

  const onDelete = async (row: PaymentGatewayConfigRow) => {
    if (!confirm(`Delete the "${row.label}" gateway? Customers can no longer use it.`)) return;
    try {
      await adminDeletePaymentGateway(row.id);
      toast('Gateway removed', 'success');
      setRefresh((k) => k + 1);
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Delete failed', 'error');
    }
  };

  const onToggle = async (row: PaymentGatewayConfigRow) => {
    try {
      await adminUpdatePaymentGateway(row.id, { isActive: !row.isActive });
      setRefresh((k) => k + 1);
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Toggle failed', 'error');
    }
  };

  const columns: Column<PaymentGatewayConfigRow>[] = [
    {
      key: 'label',
      header: 'Gateway',
      render: (r) => (
        <button
          type="button"
          onClick={() => {
            setEditing(r);
            setShowForm(true);
          }}
          className="flex flex-col text-left leading-tight"
        >
          <span className="font-raleway text-sm font-bold text-navy hover:underline">{r.label}</span>
          <span className="font-mono text-[10px] text-muted">
            {r.provider} · {r.environment}
          </span>
        </button>
      ),
    },
    {
      key: 'currencies',
      header: 'Currencies',
      render: (r) => (
        <div className="flex flex-wrap gap-1">
          {r.currencies.map((c) => (
            <span
              key={c}
              className="rounded-full border border-border bg-page px-2 py-0.5 font-mono text-[10px] text-charcoal"
            >
              {c}
            </span>
          ))}
        </div>
      ),
    },
    {
      key: 'priority',
      header: 'Priority',
      render: (r) => <span className="font-sans text-xs text-muted">{r.priority}</span>,
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
          {r.isActive ? 'Active' : 'Disabled'}
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
          aria-label="Delete gateway"
        >
          <Trash2 size={14} aria-hidden />
        </button>
      ),
    },
  ];

  return (
    <div className="px-8 py-10">
      <AdminPageHeader
        title="Payment gateways"
        subtitle="Configure which providers can accept payments. Customers see active gateways at checkout, ordered by priority."
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
            New gateway
          </button>
        }
      />

      <DataTable
        rows={rows}
        columns={columns}
        rowKey={(r) => r.id}
        loading={loading}
        emptyState='No payment gateways configured yet — click "New gateway" to add one.'
      />

      {showForm && (
        <GatewayFormDialog
          providers={providers}
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

function GatewayFormDialog({
  providers,
  editing,
  onClose,
  onSaved,
}: {
  providers: ProviderDefinition[];
  editing: PaymentGatewayConfigRow | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [providerKey, setProviderKey] = useState(editing?.provider ?? providers[0]?.key ?? '');
  const provider = providers.find((p) => p.key === providerKey) ?? null;

  const [label, setLabel] = useState(editing?.label ?? '');
  const [environment, setEnvironment] = useState(editing?.environment ?? 'sandbox');
  const [priority, setPriority] = useState(editing?.priority ?? 100);
  const [currencies, setCurrencies] = useState<string[]>(editing?.currencies ?? ['NGN']);
  const [credentials, setCredentials] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // When the user picks a different provider, prefill label with the
  // provider's default and reset credentials.
  useEffect(() => {
    if (!editing && provider) {
      setLabel(provider.defaultLabel);
      setCurrencies((c) => (c.length > 0 ? c : provider.supportedCurrencies.slice(0, 1)));
    }
  }, [providerKey, provider, editing]);

  const setCred = (k: string, v: string) => setCredentials((p) => ({ ...p, [k]: v }));

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErr(null);
    setSubmitting(true);
    try {
      const body = {
        provider: providerKey,
        label: label.trim(),
        environment,
        priority,
        currencies,
        credentials,
      };
      if (editing) {
        await adminUpdatePaymentGateway(editing.id, body);
      } else {
        await adminCreatePaymentGateway(body);
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
          {editing ? `Edit "${editing.label}"` : 'Add payment gateway'}
        </h2>

        <label className="flex flex-col gap-1">
          <span className="font-raleway text-[10px] font-bold uppercase tracking-btn text-navy">Provider</span>
          <select
            value={providerKey}
            onChange={(e) => setProviderKey(e.target.value)}
            disabled={!!editing}
            required
            className="rounded-input border border-border bg-white px-3 py-2 font-sans text-sm focus:border-navy focus:outline-none disabled:bg-page"
          >
            {providers.map((p) => (
              <option key={p.key} value={p.key}>
                {p.displayName}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1">
          <span className="font-raleway text-[10px] font-bold uppercase tracking-btn text-navy">Customer-facing label</span>
          <input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="e.g. Card / Squad"
            required
            className="rounded-input border border-border bg-white px-3 py-2 font-sans text-sm focus:border-navy focus:outline-none"
          />
        </label>

        {provider?.hasEnvironments && (
          <label className="flex flex-col gap-1">
            <span className="font-raleway text-[10px] font-bold uppercase tracking-btn text-navy">Environment</span>
            <select
              value={environment}
              onChange={(e) => setEnvironment(e.target.value)}
              className="rounded-input border border-border bg-white px-3 py-2 font-sans text-sm focus:border-navy focus:outline-none"
            >
              <option value="sandbox">Sandbox / test</option>
              <option value="live">Live / production</option>
            </select>
          </label>
        )}

        <div>
          <span className="block font-raleway text-[10px] font-bold uppercase tracking-btn text-navy">Currencies</span>
          <div className="mt-1 flex flex-wrap gap-2">
            {CURRENCIES.map((c) => {
              const enabled = currencies.includes(c);
              return (
                <button
                  key={c}
                  type="button"
                  onClick={() => {
                    setCurrencies((prev) =>
                      enabled ? prev.filter((p) => p !== c) : [...prev, c],
                    );
                  }}
                  className={`rounded-full border px-3 py-1 font-mono text-xs ${
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

        <label className="flex items-center gap-2">
          <span className="font-sans text-xs text-muted">Priority</span>
          <input
            type="number"
            value={priority}
            onChange={(e) => setPriority(Number(e.target.value) || 0)}
            className="w-24 rounded-input border border-border bg-white px-2 py-1 font-sans text-sm"
          />
          <span className="font-sans text-[11px] text-muted">Lower = higher in checkout list</span>
        </label>

        {provider && provider.credentialFields.length > 0 && (
          <fieldset className="flex flex-col gap-3 rounded-card border border-border bg-page p-4">
            <legend className="px-2 font-raleway text-[10px] font-bold uppercase tracking-btn text-muted">
              Credentials
            </legend>
            {provider.credentialFields.map((f) => (
              <label key={f.key} className="flex flex-col gap-1">
                <span className="font-raleway text-[10px] font-bold uppercase tracking-btn text-navy">
                  {f.label}
                  {f.required && <span className="ml-1 text-amber">*</span>}
                </span>
                <input
                  type={f.type === 'password' ? 'password' : 'text'}
                  value={credentials[f.key] ?? ''}
                  onChange={(e) => setCred(f.key, e.target.value)}
                  placeholder={
                    editing
                      ? (editing.credentials[f.key] as string) ?? 'Leave blank to keep current'
                      : undefined
                  }
                  required={f.required && !editing}
                  className="rounded-input border border-border bg-white px-3 py-2 font-mono text-xs focus:border-navy focus:outline-none"
                />
                {f.helpText && (
                  <span className="font-sans text-[11px] text-muted">{f.helpText}</span>
                )}
              </label>
            ))}
          </fieldset>
        )}

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
            {submitting ? 'Saving…' : editing ? 'Save changes' : 'Add gateway'}
          </button>
        </div>
      </form>
    </div>
  );
}
