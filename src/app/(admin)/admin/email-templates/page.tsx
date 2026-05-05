'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { Column, DataTable } from '@/components/admin/DataTable';
import { toast } from '@/components/admin/Toast';
import {
  adminListEmailTemplates,
  adminUpsertEmailTemplate,
  type EmailTemplate,
} from '@/lib/api/admin';

const KNOWN_EVENTS: Array<{ type: string; defaultName: string; defaultSubject: string }> = [
  { type: 'order.confirmed', defaultName: 'Order confirmation', defaultSubject: 'Order {orderNumber} confirmed' },
  { type: 'payment.received', defaultName: 'Payment received', defaultSubject: 'Payment received for {orderNumber}' },
  { type: 'order.shipped', defaultName: 'Order shipped', defaultSubject: 'Your order {orderNumber} has shipped' },
  { type: 'order.delivered', defaultName: 'Order delivered', defaultSubject: 'Your order {orderNumber} has been delivered' },
  { type: 'order.cancelled', defaultName: 'Order cancelled', defaultSubject: 'Order {orderNumber} cancelled' },
  { type: 'order.refunded', defaultName: 'Refund issued', defaultSubject: 'Refund issued for {orderNumber}' },
  { type: 'user.welcome', defaultName: 'Welcome email', defaultSubject: 'Welcome to Afrizonemart' },
  { type: 'password.reset', defaultName: 'Password reset', defaultSubject: 'Reset your Afrizonemart password' },
];

export default function AdminEmailTemplatesPage() {
  const [items, setItems] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void (async () => {
      try {
        const r = await adminListEmailTemplates();
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

  const initialiseTemplate = async (
    spec: (typeof KNOWN_EVENTS)[number],
  ) => {
    try {
      const created = await adminUpsertEmailTemplate({
        type: spec.type,
        name: spec.defaultName,
        subject: spec.defaultSubject,
        preview: null,
        body: [
          { type: 'heading', text: spec.defaultName },
          { type: 'paragraph', text: 'Edit this template from the admin.' },
        ],
        isActive: false,
      });
      toast(`Created "${created.name}" — open to edit`, 'success');
      setRefresh((k) => k + 1);
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Create failed', 'error');
    }
  };

  const existingTypes = new Set(items.map((i) => i.type));
  const uninitialised = KNOWN_EVENTS.filter((e) => !existingTypes.has(e.type));

  const columns: Column<EmailTemplate>[] = [
    {
      key: 'name',
      header: 'Template',
      render: (t) => (
        <Link
          href={`/admin/email-templates/${t.id}`}
          className="flex flex-col text-left leading-tight hover:underline"
        >
          <span className="font-raleway text-sm font-bold text-navy">{t.name}</span>
          <span className="font-mono text-[10px] text-muted">{t.type}</span>
        </Link>
      ),
    },
    {
      key: 'subject',
      header: 'Subject',
      render: (t) => <span className="font-sans text-sm text-charcoal">{t.subject}</span>,
    },
    {
      key: 'isActive',
      header: 'Status',
      render: (t) => (
        <span
          className={`inline-flex rounded-full border px-2 py-0.5 font-raleway text-[10px] font-bold uppercase tracking-btn ${
            t.isActive
              ? 'border-success/30 bg-success/10 text-success'
              : 'border-muted/30 bg-muted/10 text-muted'
          }`}
        >
          {t.isActive ? 'Live' : 'Hardcoded fallback'}
        </span>
      ),
    },
  ];

  return (
    <div className="px-4 py-6 md:px-8 md:py-10">
      <AdminPageHeader
        title="Email templates"
        subtitle="Edit subject + body of every transactional email. Inactive templates fall back to the hardcoded version shipped with the platform."
      />

      <DataTable
        rows={items}
        columns={columns}
        rowKey={(t) => t.id}
        loading={loading}
        emptyState="No templates initialised yet — pick one to start editing below."
      />

      {uninitialised.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-3 font-raleway text-sm font-bold uppercase tracking-btn text-navy">
            Initialise more templates
          </h2>
          <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
            {uninitialised.map((spec) => (
              <button
                key={spec.type}
                type="button"
                onClick={() => initialiseTemplate(spec)}
                className="flex items-center justify-between gap-2 rounded-card border border-border bg-white px-4 py-3 text-left transition-colors hover:border-navy"
              >
                <div className="flex flex-col leading-tight">
                  <span className="font-raleway text-sm font-bold text-navy">
                    {spec.defaultName}
                  </span>
                  <span className="font-mono text-[10px] text-muted">{spec.type}</span>
                </div>
                <Plus size={14} className="text-muted" aria-hidden />
              </button>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
