'use client';

import { useEffect, useMemo, useState } from 'react';
import { Save } from 'lucide-react';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { toast } from '@/components/admin/Toast';
import { HttpApiError } from '@/lib/api/client';
import {
  adminGetSettings,
  adminUpdateSettings,
  type SettingGroup,
  type SettingItem,
} from '@/lib/api/admin';

const GROUP_LABELS: Record<SettingGroup, string> = {
  general: 'General',
  inventory: 'Inventory',
  shipping: 'Shipping',
  orders: 'Orders',
  notifications: 'Notifications',
  advanced: 'Advanced',
};

export default function AdminSettingsPage() {
  const [items, setItems] = useState<SettingItem[] | null>(null);
  const [draft, setDraft] = useState<Record<string, string | number | boolean>>({});
  const [activeGroup, setActiveGroup] = useState<SettingGroup>('general');
  const [busy, setBusy] = useState(false);

  const load = () =>
    adminGetSettings()
      .then((r) => {
        setItems(r.items);
        setDraft({});
      })
      .catch((e) => toast(e instanceof Error ? e.message : 'Failed to load', 'error'));

  useEffect(() => {
    void load();
  }, []);

  const groups = useMemo(() => {
    const seen = new Set<SettingGroup>();
    items?.forEach((i) => seen.add(i.def.group));
    return (Object.keys(GROUP_LABELS) as SettingGroup[]).filter((g) => seen.has(g));
  }, [items]);

  const dirty = Object.keys(draft).length > 0;

  const handleSave = async () => {
    setBusy(true);
    try {
      await adminUpdateSettings(draft);
      toast('Settings saved');
      await load();
    } catch (e) {
      toast(e instanceof HttpApiError ? e.message : 'Failed to save', 'error');
    } finally {
      setBusy(false);
    }
  };

  const valueFor = (item: SettingItem): string | number | boolean =>
    item.def.key in draft ? draft[item.def.key] : item.value;

  const setValue = (key: string, value: string | number | boolean) =>
    setDraft((d) => ({ ...d, [key]: value }));

  return (
    <div className="px-8 py-10">
      <AdminPageHeader
        title="Settings"
        subtitle="Store-wide configuration. Changes are versioned and audited."
        action={
          <button
            type="button"
            onClick={handleSave}
            disabled={!dirty || busy}
            className="flex items-center gap-2 rounded-btn bg-navy px-4 py-2 font-raleway text-xs font-bold uppercase tracking-btn text-white hover:bg-amber hover:text-navy disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Save size={14} aria-hidden /> {busy ? 'Saving…' : `Save${dirty ? ` (${Object.keys(draft).length})` : ''}`}
          </button>
        }
      />

      {!items && <p className="font-sans text-sm text-muted">Loading settings…</p>}

      {items && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:gap-6">
          <aside className="lg:col-span-3">
            <nav className="flex flex-col gap-1 rounded-card border border-border bg-white p-2 shadow-card">
              {groups.map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setActiveGroup(g)}
                  className={`rounded-md px-3 py-2 text-left font-raleway text-sm transition-colors ${
                    activeGroup === g
                      ? 'bg-navy font-semibold text-white'
                      : 'text-charcoal hover:bg-page'
                  }`}
                >
                  {GROUP_LABELS[g]}
                </button>
              ))}
            </nav>
          </aside>

          <section className="flex flex-col gap-4 lg:col-span-9">
            {items
              .filter((i) => i.def.group === activeGroup)
              .map((item) => (
                <SettingRow
                  key={item.def.key}
                  item={item}
                  value={valueFor(item)}
                  onChange={(v) => setValue(item.def.key, v)}
                />
              ))}
          </section>
        </div>
      )}
    </div>
  );
}

function SettingRow({
  item,
  value,
  onChange,
}: {
  item: SettingItem;
  value: string | number | boolean;
  onChange: (v: string | number | boolean) => void;
}) {
  const { def } = item;
  return (
    <div className="flex flex-col gap-2 rounded-card border border-border bg-white p-5 shadow-card">
      <header className="flex flex-col gap-0.5">
        <label
          htmlFor={`setting-${def.key}`}
          className="font-raleway text-sm font-bold text-navy"
        >
          {def.label}
        </label>
        {def.description && (
          <p className="font-sans text-xs text-muted">{def.description}</p>
        )}
        <p className="font-mono text-[10px] text-muted">{def.key}</p>
      </header>

      {def.type === 'boolean' ? (
        <label className="flex cursor-pointer items-center gap-3 rounded-input border border-border bg-page px-3 py-2.5 font-sans text-sm text-charcoal">
          <input
            id={`setting-${def.key}`}
            type="checkbox"
            checked={value as boolean}
            onChange={(e) => onChange(e.target.checked)}
            className="h-4 w-4 cursor-pointer accent-navy"
          />
          {value ? 'Enabled' : 'Disabled'}
        </label>
      ) : def.type === 'number' ? (
        <input
          id={`setting-${def.key}`}
          type="number"
          value={String(value)}
          onChange={(e) => onChange(Number(e.target.value) || 0)}
          className={inputClass}
        />
      ) : def.type === 'longtext' ? (
        <textarea
          id={`setting-${def.key}`}
          value={String(value)}
          onChange={(e) => onChange(e.target.value)}
          rows={3}
          className={inputClass}
        />
      ) : (
        <input
          id={`setting-${def.key}`}
          type={def.type === 'email' ? 'email' : 'text'}
          value={String(value)}
          onChange={(e) => onChange(e.target.value)}
          className={inputClass}
        />
      )}
    </div>
  );
}

const inputClass =
  'w-full rounded-input border border-border bg-white px-3 py-2 font-sans text-sm text-charcoal placeholder:text-muted focus:border-navy focus:outline-none';
