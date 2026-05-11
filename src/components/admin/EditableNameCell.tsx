'use client';

import { useEffect, useRef, useState } from 'react';
import { Check, Loader2, Pencil, X } from 'lucide-react';
import { HttpApiError } from '@/lib/api/client';
import { adminUpdateProduct } from '@/lib/api/admin';
import { toast } from '@/components/admin/Toast';

/**
 * Inline editable product-name cell. Sibling to `EditablePriceCell`
 * (used in the intern list view + admin products list).
 *
 * Same UX rules: pencil on hover, Enter saves, Escape / click-outside
 * cancels. No auto-save on blur — we'd rather lose an unintentional
 * edit than lose an intentional one to a misclick.
 *
 * Writes go through `PATCH /api/admin/products/:id` with just the
 * `name` field. Caller must have `products.write` (interns get it
 * via the 20260511150000 migration).
 */
interface EditableNameCellProps {
  productId: string;
  name: string;
  onChanged: (nextName: string) => void;
}

export function EditableNameCell({
  productId,
  name,
  onChanged,
}: EditableNameCellProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(name);
  const [saving, setSaving] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setDraft(name);
  }, [name]);

  useEffect(() => {
    if (!editing) return;
    inputRef.current?.focus();
    inputRef.current?.select();
  }, [editing]);

  // Click-outside cancels (no auto-save).
  useEffect(() => {
    if (!editing) return;
    const onMouseDown = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) {
        setEditing(false);
        setDraft(name);
      }
    };
    document.addEventListener('mousedown', onMouseDown);
    return () => document.removeEventListener('mousedown', onMouseDown);
  }, [editing, name]);

  const handleSave = async () => {
    const next = draft.trim();
    if (!next) {
      toast('Name cannot be empty', 'error');
      return;
    }
    if (next === name) {
      setEditing(false);
      return;
    }
    setSaving(true);
    try {
      await adminUpdateProduct(productId, { name: next });
      onChanged(next);
      toast('Name updated');
      setEditing(false);
    } catch (e) {
      toast(
        e instanceof HttpApiError ? e.message : 'Failed to save name',
        'error',
      );
    } finally {
      setSaving(false);
    }
  };

  const handleKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      void handleSave();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setEditing(false);
      setDraft(name);
    }
  };

  if (editing) {
    return (
      <div ref={containerRef} className="flex items-center gap-1">
        <input
          ref={inputRef}
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKey}
          disabled={saving}
          maxLength={250}
          aria-label="Product name"
          className="w-full min-w-[200px] rounded-input border border-navy bg-white px-2 py-1 font-raleway text-sm font-semibold text-navy focus:outline-none"
        />
        <button
          type="button"
          onClick={() => void handleSave()}
          disabled={saving}
          aria-label="Save name"
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-success text-white hover:bg-success/85 disabled:opacity-50"
        >
          {saving ? (
            <Loader2 size={12} className="animate-spin" aria-hidden />
          ) : (
            <Check size={12} aria-hidden />
          )}
        </button>
        <button
          type="button"
          onClick={() => {
            setEditing(false);
            setDraft(name);
          }}
          disabled={saving}
          aria-label="Cancel"
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-border bg-white text-charcoal hover:border-danger hover:text-danger disabled:opacity-50"
        >
          <X size={12} aria-hidden />
        </button>
      </div>
    );
  }

  return (
    <div className="group flex items-center gap-1.5">
      <span className="font-raleway font-semibold text-navy">{name}</span>
      <button
        type="button"
        onClick={() => setEditing(true)}
        aria-label={`Edit ${name}`}
        className="flex h-6 w-6 items-center justify-center rounded-full text-muted opacity-0 transition-opacity hover:bg-navy/10 hover:text-navy group-hover:opacity-100"
      >
        <Pencil size={12} aria-hidden />
      </button>
    </div>
  );
}
