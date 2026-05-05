'use client';

import { useEffect, useState } from 'react';
import { ChevronDown, ChevronRight, Eye, EyeOff, KeyRound, Plus, RefreshCw, Trash2, X } from 'lucide-react';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { ConfirmDialog } from '@/components/admin/ConfirmDialog';
import { toast } from '@/components/admin/Toast';
import { HttpApiError } from '@/lib/api/client';
import {
  adminCreateWebhook,
  adminDeleteWebhook,
  adminListWebhookDeliveries,
  adminListWebhooks,
  adminReplayWebhookDelivery,
  adminRotateWebhookSecret,
  adminUpdateWebhook,
  type AdminWebhook,
  type AdminWebhookDelivery,
  type AdminWebhookInput,
} from '@/lib/api/admin';

const KNOWN_EVENTS = [
  '*',
  'order.placed',
  'order.paid',
  'order.shipped',
  'order.cancelled',
  'order.refunded',
  'order.note_added',
  'product.viewed',
  'cart.updated',
  'user.registered',
  'user.logged_in',
];

export default function AdminWebhooksPage() {
  const [items, setItems] = useState<AdminWebhook[] | null>(null);
  const [editing, setEditing] = useState<AdminWebhook | 'new' | null>(null);
  const [pendingDelete, setPendingDelete] = useState<AdminWebhook | null>(null);
  const [busy, setBusy] = useState(false);
  const [openDeliveries, setOpenDeliveries] = useState<string | null>(null);

  const load = () =>
    adminListWebhooks()
      .then((r) => setItems(r.items))
      .catch((e) => toast(e instanceof Error ? e.message : 'Failed to load', 'error'));

  useEffect(() => {
    void load();
  }, []);

  const handleDelete = async () => {
    if (!pendingDelete) return;
    setBusy(true);
    try {
      await adminDeleteWebhook(pendingDelete.id);
      toast(`Deleted ${pendingDelete.name}`);
      setPendingDelete(null);
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
        title="Webhooks"
        subtitle="Outbound HTTP callbacks fired when domain events happen."
        action={
          <button
            type="button"
            onClick={() => setEditing('new')}
            className="flex items-center gap-2 rounded-btn bg-navy px-4 py-2 font-raleway text-xs font-bold uppercase tracking-btn text-white hover:bg-amber hover:text-navy"
          >
            <Plus size={14} aria-hidden /> New webhook
          </button>
        }
      />

      {items && items.length === 0 && (
        <div className="rounded-card border border-border bg-white p-10 text-center">
          <p className="font-sans text-sm text-muted">
            No webhooks yet. Add one to start streaming events to your own
            servers, Zapier, n8n, etc.
          </p>
        </div>
      )}

      <ul className="flex flex-col gap-3">
        {items?.map((w) => (
          <li
            key={w.id}
            className="flex flex-col gap-3 rounded-card border border-border bg-white p-5 shadow-card"
          >
            <header className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex flex-col gap-1 leading-tight">
                <div className="flex items-center gap-2">
                  <span className="font-raleway text-base font-bold text-navy">
                    {w.name}
                  </span>
                  {w.isActive ? (
                    <span className="rounded-full bg-success/15 px-2 py-0.5 font-sans text-[10px] font-bold text-success">
                      Active
                    </span>
                  ) : (
                    <span className="rounded-full bg-border/50 px-2 py-0.5 font-sans text-[10px] font-bold text-muted">
                      Off
                    </span>
                  )}
                </div>
                <span className="font-mono text-[11px] text-muted">{w.url}</span>
                <span className="font-sans text-[11px] text-charcoal">
                  Events: {w.events.join(', ')} · {w._count?.deliveries ?? 0} deliveries
                </span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() =>
                    setOpenDeliveries(openDeliveries === w.id ? null : w.id)
                  }
                  className="flex items-center gap-1 rounded-md px-2 py-1 font-raleway text-[11px] font-bold uppercase tracking-btn text-navy hover:bg-page"
                >
                  {openDeliveries === w.id ? (
                    <ChevronDown size={12} aria-hidden />
                  ) : (
                    <ChevronRight size={12} aria-hidden />
                  )}{' '}
                  Deliveries
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    if (!confirm(`Rotate the secret for "${w.name}"? Existing receivers verifying the old signature will start failing.`)) return;
                    try {
                      await adminRotateWebhookSecret(w.id);
                      toast('Secret rotated. Update your receiver to the new value.');
                      await load();
                    } catch (e) {
                      toast(e instanceof HttpApiError ? e.message : 'Failed to rotate', 'error');
                    }
                  }}
                  className="flex items-center gap-1 rounded-md px-2 py-1 font-raleway text-[11px] font-bold uppercase tracking-btn text-navy hover:bg-page"
                  title="Rotate secret"
                >
                  <KeyRound size={12} aria-hidden /> Rotate
                </button>
                <button
                  type="button"
                  onClick={() => setEditing(w)}
                  className="rounded-md px-2 py-1 font-raleway text-[11px] font-bold uppercase tracking-btn text-navy hover:bg-page"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => setPendingDelete(w)}
                  className="rounded-md p-1.5 text-muted hover:bg-danger/10 hover:text-danger"
                  aria-label="Delete webhook"
                >
                  <Trash2 size={15} aria-hidden />
                </button>
              </div>
            </header>

            <SecretField secret={w.secret} />

            {openDeliveries === w.id && <DeliveriesList webhookId={w.id} />}
          </li>
        ))}
      </ul>

      {editing !== null && (
        <WebhookDialog
          initial={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={async () => {
            setEditing(null);
            await load();
          }}
        />
      )}

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title="Delete webhook"
        message={pendingDelete ? `Delete "${pendingDelete.name}"?` : ''}
        confirmLabel="Delete"
        destructive
        busy={busy}
        onConfirm={handleDelete}
        onCancel={() => !busy && setPendingDelete(null)}
      />
    </div>
  );
}

function SecretField({ secret }: { secret: string }) {
  const [show, setShow] = useState(false);
  return (
    <div className="flex items-center gap-2 rounded-input border border-border bg-page px-3 py-2 font-mono text-xs">
      <span className="font-raleway text-[10px] font-bold uppercase tracking-btn text-muted">
        Secret
      </span>
      <span className="flex-1 truncate text-charcoal">
        {show ? secret : `${secret.slice(0, 12)}…${'•'.repeat(20)}`}
      </span>
      <button
        type="button"
        onClick={() => setShow(!show)}
        className="text-muted hover:text-navy"
        aria-label={show ? 'Hide secret' : 'Show secret'}
      >
        {show ? <EyeOff size={14} aria-hidden /> : <Eye size={14} aria-hidden />}
      </button>
    </div>
  );
}

function DeliveriesList({ webhookId }: { webhookId: string }) {
  const [items, setItems] = useState<AdminWebhookDelivery[] | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = () =>
    adminListWebhookDeliveries(webhookId)
      .then((r) => setItems(r.items))
      .catch(() => setItems([]));

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [webhookId]);

  const handleReplay = async (deliveryId: string) => {
    setBusyId(deliveryId);
    try {
      await adminReplayWebhookDelivery(webhookId, deliveryId);
      toast('Replay queued — check the new entry at the top.');
      await load();
    } catch (e) {
      toast(e instanceof HttpApiError ? e.message : 'Replay failed', 'error');
    } finally {
      setBusyId(null);
    }
  };

  if (!items) return <p className="font-sans text-xs text-muted">Loading deliveries…</p>;
  if (items.length === 0)
    return <p className="font-sans text-xs text-muted">No deliveries yet.</p>;

  return (
    <ul className="flex flex-col divide-y divide-border rounded-card border border-border bg-page">
      {items.slice(0, 25).map((d) => {
        const ok = d.statusCode != null && d.statusCode >= 200 && d.statusCode < 300;
        const pending = !d.succeededAt && d.nextAttemptAt && new Date(d.nextAttemptAt) > new Date();
        return (
          <li
            key={d.id}
            className="flex flex-wrap items-center justify-between gap-3 px-3 py-2 font-sans text-xs"
          >
            <div className="flex flex-col leading-tight">
              <span className="font-mono text-[11px] text-navy">{d.eventType}</span>
              <span className="text-[10px] text-muted">
                {new Date(d.createdAt).toLocaleString()} · attempts {d.attempts}
                {pending && (
                  <span className="ml-2 text-amber">
                    retry at {new Date(d.nextAttemptAt!).toLocaleTimeString()}
                  </span>
                )}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                  ok
                    ? 'bg-success/15 text-success'
                    : pending
                      ? 'bg-amber/30 text-navy'
                      : 'bg-danger/15 text-danger'
                }`}
              >
                {d.statusCode ?? 'ERR'}
              </span>
              <button
                type="button"
                onClick={() => handleReplay(d.id)}
                disabled={busyId === d.id}
                className="flex items-center gap-1 rounded-md px-2 py-1 font-raleway text-[10px] font-bold uppercase tracking-btn text-navy hover:bg-white disabled:opacity-50"
                title="Replay this delivery"
              >
                <RefreshCw size={11} aria-hidden /> Replay
              </button>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

function WebhookDialog({
  initial,
  onClose,
  onSaved,
}: {
  initial: AdminWebhook | null;
  onClose: () => void;
  onSaved: () => Promise<void> | void;
}) {
  const [name, setName] = useState(initial?.name ?? '');
  const [url, setUrl] = useState(initial?.url ?? 'https://');
  const [events, setEvents] = useState<string[]>(initial?.events ?? ['order.placed']);
  const [isActive, setIsActive] = useState(initial?.isActive ?? true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleEvent = (e: string) =>
    setEvents((arr) => (arr.includes(e) ? arr.filter((x) => x !== e) : [...arr, e]));

  const handleSave = async (ev: React.FormEvent) => {
    ev.preventDefault();
    setError(null);
    setBusy(true);
    const input: AdminWebhookInput = { name: name.trim(), url: url.trim(), events, isActive };
    try {
      if (initial) {
        await adminUpdateWebhook(initial.id, input);
        toast(`Saved ${name.trim()}`);
      } else {
        await adminCreateWebhook(input);
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
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-charcoal/40 px-4"
      onClick={() => !busy && onClose()}
    >
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={handleSave}
        className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-card bg-white shadow-card-hover"
      >
        <header className="flex items-start justify-between gap-4 border-b border-border px-6 py-4">
          <h2 className="font-raleway text-lg font-bold text-navy">
            {initial ? `Edit ${initial.name}` : 'New webhook'}
          </h2>
          <button
            type="button"
            onClick={() => !busy && onClose()}
            disabled={busy}
            aria-label="Close"
            className="rounded p-1 text-muted hover:bg-page hover:text-charcoal disabled:opacity-50"
          >
            <X size={16} aria-hidden />
          </button>
        </header>

        <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-6 py-5">
          <Field label="Name" required>
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={input}
            />
          </Field>
          <Field label="POST URL" required>
            <input
              required
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className={`${input} font-mono`}
            />
          </Field>
          <Field label="Events" required>
            <div className="flex flex-wrap gap-2">
              {KNOWN_EVENTS.map((e) => (
                <label
                  key={e}
                  className={`flex cursor-pointer items-center gap-1 rounded-full border px-2.5 py-1 font-mono text-[11px] transition-colors ${
                    events.includes(e)
                      ? 'border-navy bg-navy text-white'
                      : 'border-border bg-white text-charcoal hover:border-navy/40'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={events.includes(e)}
                    onChange={() => toggleEvent(e)}
                    className="hidden"
                  />
                  {e}
                </label>
              ))}
            </div>
          </Field>
          <label className="flex cursor-pointer items-center gap-2 rounded-input border border-border bg-page px-3 py-2.5 font-sans text-sm text-charcoal">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="h-4 w-4 cursor-pointer accent-navy"
            />
            Active
          </label>
          {error && (
            <p className="rounded-input border border-danger/30 bg-danger/5 px-3 py-2 font-sans text-sm text-danger">
              {error}
            </p>
          )}
        </div>

        <footer className="flex justify-end gap-2 border-t border-border bg-page px-6 py-3">
          <button
            type="button"
            onClick={() => !busy && onClose()}
            disabled={busy}
            className="rounded-btn border border-border bg-white px-4 py-2 font-raleway text-xs font-bold uppercase tracking-btn text-charcoal hover:bg-page disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={busy || events.length === 0}
            className="rounded-btn bg-navy px-4 py-2 font-raleway text-xs font-bold uppercase tracking-btn text-white hover:bg-amber hover:text-navy disabled:opacity-50"
          >
            {busy ? 'Saving…' : initial ? 'Save' : 'Create'}
          </button>
        </footer>
      </form>
    </div>
  );
}

const input =
  'w-full rounded-input border border-border bg-white px-3 py-2 font-sans text-sm text-charcoal placeholder:text-muted focus:border-navy focus:outline-none';

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="font-raleway text-[11px] font-bold uppercase tracking-btn text-navy">
        {label}
        {required && <span className="ml-0.5 text-danger">*</span>}
      </span>
      {children}
    </label>
  );
}
