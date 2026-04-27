'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ChevronDown, ChevronUp, Plus, Save, Send, Trash2 } from 'lucide-react';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { toast } from '@/components/admin/Toast';
import {
  adminDeleteEmailTemplate,
  adminListEmailBlocks,
  adminListEmailTemplates,
  adminPreviewEmailTemplate,
  adminSendTestEmail,
  adminUpsertEmailTemplate,
  type BlockPaletteEntry,
  type EmailBlock,
  type EmailTemplate,
} from '@/lib/api/admin';

const SAMPLE_VARIABLES: Record<string, unknown> = {
  customerName: 'Magnus',
  orderNumber: 'AZM-1042',
  orderId: 'cmoglgmnj',
  placedAt: 'Apr 27, 2026, 03:42 AM',
  total: 18500,
  amount: 18500,
  method: 'Card / Squad',
  paidAt: 'Apr 27, 2026, 03:42 AM',
  estimatedDelivery: 'Wed, Apr 30',
  trackUrl: 'https://afrizonemart.vercel.app/account/orders/sample',
  receiptUrl: 'https://afrizonemart.vercel.app/account/orders/sample',
  shopUrl: 'https://afrizonemart.vercel.app',
  resetUrl: 'https://afrizonemart.vercel.app/reset-password?token=demo',
  expiresInMinutes: 60,
  carrier: 'GIG Logistics',
  trackingNumber: 'GIG-998877',
  shippedAt: 'Apr 28, 2026, 11:00 AM',
  reason: '',
  refundExpected: true,
  refundAmount: 18500,
  items: [
    { name: 'Tastic Long Grain Rice 5kg', qty: 1, price: 8500 },
    { name: 'Spectra Cocoa Powder', qty: 2, price: 5000 },
  ],
  shippingAddress: {
    line1: '12 Awolowo Road',
    city: 'Ikoyi',
    region: 'Lagos',
    country: 'NG',
  },
};

export default function EditEmailTemplatePage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params.id;

  const [template, setTemplate] = useState<EmailTemplate | null>(null);
  const [palette, setPalette] = useState<BlockPaletteEntry[]>([]);
  const [name, setName] = useState('');
  const [subject, setSubject] = useState('');
  const [preview, setPreview] = useState('');
  const [isActive, setIsActive] = useState(false);
  const [blocks, setBlocks] = useState<EmailBlock[]>([]);
  const [previewHtml, setPreviewHtml] = useState('');
  const [testEmail, setTestEmail] = useState('imammagnus40@gmail.com');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void (async () => {
      try {
        const [t, p] = await Promise.all([
          adminListEmailTemplates(),
          adminListEmailBlocks(),
        ]);
        const row = t.items.find((x) => x.id === id) ?? null;
        if (row) {
          setTemplate(row);
          setName(row.name);
          setSubject(row.subject);
          setPreview(row.preview ?? '');
          setIsActive(row.isActive);
          setBlocks(row.body);
        }
        setPalette(p.items);
      } catch (e) {
        toast(e instanceof Error ? e.message : 'Failed to load', 'error');
      }
    })();
  }, [id]);

  // Re-render preview when blocks change.
  const debouncedBlocks = useMemo(() => JSON.stringify(blocks), [blocks]);
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const r = await adminPreviewEmailTemplate({
          subject,
          preview: preview || null,
          body: blocks,
          variables: SAMPLE_VARIABLES,
        });
        if (!cancelled) setPreviewHtml(r.html);
      } catch {
        /* ignore preview errors */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [debouncedBlocks, subject, preview, blocks]);

  const moveBlock = (idx: number, dir: -1 | 1) => {
    setBlocks((prev) => {
      const next = [...prev];
      const target = idx + dir;
      if (target < 0 || target >= next.length) return prev;
      [next[idx], next[target]] = [next[target], next[idx]];
      return next;
    });
  };

  const removeBlock = (idx: number) => {
    setBlocks((prev) => prev.filter((_, i) => i !== idx));
  };

  const addBlock = (entry: BlockPaletteEntry) => {
    setBlocks((prev) => [...prev, entry.factory()]);
  };

  const updateBlock = (idx: number, key: string, value: unknown) => {
    setBlocks((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], [key]: value };
      return next;
    });
  };

  const onSave = async () => {
    if (!template) return;
    setSaving(true);
    try {
      const updated = await adminUpsertEmailTemplate({
        type: template.type,
        name,
        subject,
        preview: preview || null,
        body: blocks,
        isActive,
      });
      setTemplate(updated);
      toast('Saved — production sends now use this template', 'success');
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Save failed', 'error');
    } finally {
      setSaving(false);
    }
  };

  const onSendTest = async () => {
    try {
      await adminSendTestEmail({
        to: testEmail,
        subject,
        preview: preview || null,
        body: blocks,
        variables: SAMPLE_VARIABLES,
      });
      toast(`Test email sent to ${testEmail}`, 'success');
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Send failed', 'error');
    }
  };

  const onDelete = async () => {
    if (!template) return;
    if (!confirm('Delete this template? Sends will fall back to the hardcoded version.')) return;
    try {
      await adminDeleteEmailTemplate(template.id);
      toast('Template deleted', 'success');
      router.push('/admin/email-templates');
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Delete failed', 'error');
    }
  };

  if (!template) {
    return (
      <div className="px-8 py-10">
        <p className="font-sans text-sm text-muted">Loading template…</p>
      </div>
    );
  }

  return (
    <div className="px-8 py-10">
      <AdminPageHeader
        title={`Edit: ${template.name}`}
        subtitle={template.type}
        action={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onSave}
              disabled={saving}
              className="flex items-center gap-2 rounded-btn bg-navy px-4 py-2 font-raleway text-xs font-bold uppercase tracking-btn text-white shadow-card hover:bg-amber hover:text-navy disabled:opacity-60"
            >
              <Save size={14} aria-hidden />
              {saving ? 'Saving…' : 'Save'}
            </button>
            {!template.isSystem && (
              <button
                type="button"
                onClick={onDelete}
                className="rounded-btn border border-danger/30 bg-white px-3 py-2 font-raleway text-xs font-bold uppercase tracking-btn text-danger hover:bg-danger/5"
              >
                Delete
              </button>
            )}
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Editor pane */}
        <section className="flex flex-col gap-4 lg:col-span-6">
          <div className="rounded-card border border-border bg-white p-5">
            <h3 className="mb-3 font-raleway text-sm font-bold uppercase tracking-btn text-navy">
              Header
            </h3>
            <div className="flex flex-col gap-3">
              <Field label="Name (admin-only)">
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="rounded-input border border-border bg-white px-3 py-2 font-sans text-sm focus:border-navy focus:outline-none"
                />
              </Field>
              <Field label="Subject" hint="Supports {variables} like {orderNumber}">
                <input
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="rounded-input border border-border bg-white px-3 py-2 font-sans text-sm focus:border-navy focus:outline-none"
                />
              </Field>
              <Field label="Preview text (inbox snippet)">
                <input
                  value={preview}
                  onChange={(e) => setPreview(e.target.value)}
                  className="rounded-input border border-border bg-white px-3 py-2 font-sans text-sm focus:border-navy focus:outline-none"
                />
              </Field>
              <label className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                />
                <span className="font-sans text-sm text-charcoal">
                  Active — production sends use this template
                </span>
              </label>
            </div>
          </div>

          <div className="rounded-card border border-border bg-white p-5">
            <h3 className="mb-3 font-raleway text-sm font-bold uppercase tracking-btn text-navy">
              Blocks
            </h3>
            <div className="flex flex-col gap-3">
              {blocks.map((block, idx) => (
                <BlockEditor
                  key={idx}
                  block={block}
                  onChange={(k, v) => updateBlock(idx, k, v)}
                  onMoveUp={() => moveBlock(idx, -1)}
                  onMoveDown={() => moveBlock(idx, 1)}
                  onRemove={() => removeBlock(idx)}
                  isFirst={idx === 0}
                  isLast={idx === blocks.length - 1}
                />
              ))}
              {blocks.length === 0 && (
                <p className="rounded-card border border-dashed border-border px-4 py-6 text-center font-sans text-sm text-muted">
                  No blocks yet — pick from the palette below.
                </p>
              )}
            </div>
          </div>

          <div className="rounded-card border border-border bg-page p-5">
            <h3 className="mb-3 font-raleway text-sm font-bold uppercase tracking-btn text-navy">
              Palette — click to add
            </h3>
            <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
              {palette.map((entry) => (
                <button
                  key={entry.type}
                  type="button"
                  onClick={() => addBlock(entry)}
                  className="flex flex-col items-start gap-0.5 rounded-card border border-border bg-white px-3 py-2 text-left hover:border-navy"
                >
                  <span className="flex items-center gap-1 font-raleway text-xs font-bold text-navy">
                    <Plus size={10} aria-hidden />
                    {entry.label}
                  </span>
                  <span className="font-sans text-[10px] text-muted">{entry.description}</span>
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Preview pane */}
        <section className="flex flex-col gap-4 lg:col-span-6">
          <div className="rounded-card border border-border bg-white p-5">
            <h3 className="mb-3 font-raleway text-sm font-bold uppercase tracking-btn text-navy">
              Live preview
            </h3>
            <div className="overflow-hidden rounded-card border border-border bg-page">
              <iframe
                title="Email preview"
                srcDoc={previewHtml}
                className="h-[640px] w-full border-0"
              />
            </div>
          </div>

          <div className="rounded-card border border-border bg-white p-5">
            <h3 className="mb-3 font-raleway text-sm font-bold uppercase tracking-btn text-navy">
              Send test
            </h3>
            <div className="flex items-center gap-2">
              <input
                type="email"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                className="flex-1 rounded-input border border-border bg-white px-3 py-2 font-sans text-sm focus:border-navy focus:outline-none"
              />
              <button
                type="button"
                onClick={onSendTest}
                className="flex items-center gap-2 rounded-btn bg-navy px-4 py-2 font-raleway text-xs font-bold uppercase tracking-btn text-white hover:bg-amber hover:text-navy"
              >
                <Send size={12} aria-hidden />
                Send
              </button>
            </div>
          </div>
        </section>
      </div>
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
      <span className="font-raleway text-[10px] font-bold uppercase tracking-btn text-navy">
        {label}
      </span>
      {children}
      {hint && <span className="font-sans text-[11px] text-muted">{hint}</span>}
    </label>
  );
}

function BlockEditor({
  block,
  onChange,
  onMoveUp,
  onMoveDown,
  onRemove,
  isFirst,
  isLast,
}: {
  block: EmailBlock;
  onChange: (key: string, value: unknown) => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onRemove: () => void;
  isFirst: boolean;
  isLast: boolean;
}) {
  return (
    <div className="rounded-card border border-border bg-page px-3 py-3">
      <header className="mb-2 flex items-center justify-between">
        <span className="font-raleway text-[10px] font-bold uppercase tracking-btn text-navy">
          {block.type}
        </span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onMoveUp}
            disabled={isFirst}
            className="rounded p-1 text-muted hover:bg-white disabled:opacity-30"
          >
            <ChevronUp size={12} aria-hidden />
          </button>
          <button
            type="button"
            onClick={onMoveDown}
            disabled={isLast}
            className="rounded p-1 text-muted hover:bg-white disabled:opacity-30"
          >
            <ChevronDown size={12} aria-hidden />
          </button>
          <button
            type="button"
            onClick={onRemove}
            className="rounded p-1 text-muted hover:bg-danger/10 hover:text-danger"
          >
            <Trash2 size={12} aria-hidden />
          </button>
        </div>
      </header>
      <BlockInputs block={block} onChange={onChange} />
    </div>
  );
}

function BlockInputs({
  block,
  onChange,
}: {
  block: EmailBlock;
  onChange: (key: string, value: unknown) => void;
}) {
  const inputCls =
    'w-full rounded-input border border-border bg-white px-2 py-1 font-sans text-sm focus:border-navy focus:outline-none';

  switch (block.type) {
    case 'heading':
    case 'subheading':
    case 'paragraph':
      return (
        <textarea
          value={(block.text as string) ?? ''}
          onChange={(e) => onChange('text', e.target.value)}
          rows={block.type === 'paragraph' ? 3 : 1}
          className={inputCls}
        />
      );
    case 'button':
      return (
        <div className="flex flex-col gap-2">
          <input
            placeholder="Label"
            value={(block.label as string) ?? ''}
            onChange={(e) => onChange('label', e.target.value)}
            className={inputCls}
          />
          <input
            placeholder="Href (supports {variables})"
            value={(block.href as string) ?? ''}
            onChange={(e) => onChange('href', e.target.value)}
            className={`${inputCls} font-mono text-xs`}
          />
        </div>
      );
    case 'image':
      return (
        <div className="flex flex-col gap-2">
          <input
            placeholder="Image URL"
            value={(block.src as string) ?? ''}
            onChange={(e) => onChange('src', e.target.value)}
            className={`${inputCls} font-mono text-xs`}
          />
          <input
            placeholder="Alt text"
            value={(block.alt as string) ?? ''}
            onChange={(e) => onChange('alt', e.target.value)}
            className={inputCls}
          />
        </div>
      );
    case 'spacer':
      return (
        <input
          type="number"
          value={(block.size as number) ?? 16}
          onChange={(e) => onChange('size', Number(e.target.value) || 16)}
          className={inputCls}
        />
      );
    case 'divider':
      return <p className="font-sans text-xs text-muted">Renders a horizontal line.</p>;
    case 'info-card': {
      const rows = ((block.rows as Array<{ label: string; value: string }>) ?? []);
      return (
        <div className="flex flex-col gap-2">
          {rows.map((r, i) => (
            <div key={i} className="grid grid-cols-2 gap-1">
              <input
                placeholder="Label"
                value={r.label}
                onChange={(e) => {
                  const next = [...rows];
                  next[i] = { ...r, label: e.target.value };
                  onChange('rows', next);
                }}
                className={inputCls}
              />
              <input
                placeholder="Value (supports {variables})"
                value={r.value}
                onChange={(e) => {
                  const next = [...rows];
                  next[i] = { ...r, value: e.target.value };
                  onChange('rows', next);
                }}
                className={inputCls}
              />
            </div>
          ))}
          <button
            type="button"
            onClick={() =>
              onChange('rows', [...rows, { label: 'Label', value: 'Value' }])
            }
            className="self-start rounded-btn border border-border bg-white px-3 py-1 font-raleway text-[10px] font-bold uppercase tracking-btn text-navy hover:border-navy"
          >
            + row
          </button>
        </div>
      );
    }
    case 'item-list':
      return (
        <p className="font-sans text-xs text-muted">
          Auto-renders the order&rsquo;s line items + total from the event payload (the
          `items` and `total` variables).
        </p>
      );
    default:
      return (
        <p className="font-sans text-xs text-muted">No editor for &quot;{block.type}&quot; yet.</p>
      );
  }
}
