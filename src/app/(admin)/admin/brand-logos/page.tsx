'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';
import { ImagePlus, X } from 'lucide-react';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { ImageUploader } from '@/components/admin/ImageUploader';
import { toast } from '@/components/admin/Toast';
import { HttpApiError } from '@/lib/api/client';
import {
  adminListBrands,
  adminSetBrandLogo,
  type BrandSummary,
} from '@/lib/api/admin';

/// Bulk brand-logo manager — lets the admin attach a logo to every
/// product sharing a brand string in one click. Saves running 100+
/// products back through the intern queue just for the logo.
export default function BrandLogosPage() {
  const [brands, setBrands] = useState<BrandSummary[] | null>(null);
  const [editing, setEditing] = useState<BrandSummary | null>(null);

  const load = () =>
    adminListBrands()
      .then((r) => setBrands(r.items))
      .catch((e) => toast(e instanceof Error ? e.message : 'Failed to load', 'error'));

  useEffect(() => {
    void load();
  }, []);

  return (
    <div className="px-4 py-6 md:px-8 md:py-10">
      <AdminPageHeader
        title="Brand logos"
        subtitle="Attach a logo to every product sharing a brand. Used on the product page's About-the-brand section."
      />

      {brands === null ? (
        <p className="font-sans text-sm text-muted">Loading brands…</p>
      ) : brands.length === 0 ? (
        <p className="rounded-card border border-border bg-white p-8 text-center font-sans text-sm text-muted">
          No products yet — upload some first to discover brands.
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {brands.map((b) => {
            const coverage = b.productCount === 0 ? 0 : (b.productsWithLogo / b.productCount) * 100;
            const fullyCovered = b.productsWithLogo === b.productCount && b.productCount > 0;
            return (
              <li
                key={b.brand || '(no brand)'}
                className={`flex flex-wrap items-center gap-4 rounded-card border bg-white p-4 shadow-card ${
                  fullyCovered ? 'border-border' : 'border-amber/40'
                }`}
              >
                <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-md border border-border bg-page">
                  {b.brandImageUrl ? (
                    <Image
                      src={b.brandImageUrl}
                      alt={b.brandImageAlt || `${b.brand} logo`}
                      fill
                      sizes="56px"
                      className="object-contain"
                    />
                  ) : (
                    <span className="flex h-full w-full items-center justify-center text-muted">
                      <ImagePlus size={20} aria-hidden />
                    </span>
                  )}
                </div>

                <div className="flex flex-1 flex-col leading-tight">
                  <p className="font-raleway text-sm font-bold text-navy">
                    {b.brand || <span className="text-muted">(no brand)</span>}
                  </p>
                  <p className="font-sans text-xs text-muted">
                    {b.productCount} product{b.productCount === 1 ? '' : 's'} ·{' '}
                    {b.productsWithLogo} with logo ({Math.round(coverage)}%)
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setEditing(b)}
                  className="rounded-btn bg-navy px-3 py-1.5 font-raleway text-[11px] font-bold uppercase tracking-btn text-white hover:bg-amber hover:text-navy"
                >
                  {b.brandImageUrl ? 'Replace' : 'Set logo'}
                </button>
              </li>
            );
          })}
        </ul>
      )}

      <SetLogoDialog
        target={editing}
        onClose={() => setEditing(null)}
        onSaved={() => {
          setEditing(null);
          void load();
        }}
      />
    </div>
  );
}

function SetLogoDialog({
  target,
  onClose,
  onSaved,
}: {
  target: BrandSummary | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [url, setUrl] = useState('');
  const [alt, setAlt] = useState('');
  const [busy, setBusy] = useState(false);

  // Hydrate when a different brand is selected.
  useEffect(() => {
    if (!target) return;
    setUrl(target.brandImageUrl ?? '');
    setAlt(target.brandImageAlt ?? `${target.brand} — brand logo`);
  }, [target]);

  if (!target) return null;

  const handleSave = async () => {
    if (!url) return;
    setBusy(true);
    try {
      const r = await adminSetBrandLogo({
        brand: target.brand,
        brandImageUrl: url,
        brandImageAlt: alt.trim() || null,
      });
      toast(
        `Applied to ${r.affected} product${r.affected === 1 ? '' : 's'} of "${target.brand || '(no brand)'}"`,
      );
      onSaved();
    } catch (e) {
      toast(e instanceof HttpApiError ? e.message : 'Failed to save', 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-stretch justify-center bg-charcoal/40 sm:items-center sm:px-4 sm:py-6"
      onClick={busy ? undefined : onClose}
    >
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={(e) => {
          e.preventDefault();
          void handleSave();
        }}
        className="flex max-h-full w-full flex-col bg-white shadow-card-hover sm:max-w-lg sm:rounded-card"
      >
        <header className="flex items-start justify-between gap-4 border-b border-border px-4 py-3 sm:px-6 sm:py-4">
          <div>
            <h2 className="font-raleway text-lg font-bold text-navy">
              Set logo for {target.brand || '(no brand)'}
            </h2>
            <p className="mt-1 font-sans text-xs text-muted">
              Applies to all {target.productCount} product
              {target.productCount === 1 ? '' : 's'} with this brand.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            aria-label="Close"
            className="rounded p-1 text-muted hover:bg-page hover:text-charcoal disabled:opacity-50"
          >
            <X size={16} aria-hidden />
          </button>
        </header>

        <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-4 py-4 sm:px-6 sm:py-5">
          <label className="flex flex-col gap-1.5">
            <span className="font-raleway text-[11px] font-bold uppercase tracking-btn text-navy">
              Logo image
            </span>
            <ImageUploader
              value={url}
              onChange={(next) => setUrl(next ?? '')}
              folder="products"
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="font-raleway text-[11px] font-bold uppercase tracking-btn text-navy">
              Alt text (SEO)
            </span>
            <input
              type="text"
              value={alt}
              onChange={(e) => setAlt(e.target.value)}
              maxLength={200}
              className="w-full rounded-input border border-border bg-white px-3 py-2 font-sans text-sm text-charcoal focus:border-navy focus:outline-none"
            />
          </label>
        </div>

        <footer className="flex justify-end gap-2 border-t border-border bg-page px-4 py-3 sm:px-6">
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="rounded-btn border border-border bg-white px-4 py-2 font-raleway text-xs font-bold uppercase tracking-btn text-charcoal hover:bg-page disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={busy || !url}
            className="rounded-btn bg-navy px-4 py-2 font-raleway text-xs font-bold uppercase tracking-btn text-white hover:bg-amber hover:text-navy disabled:opacity-50"
          >
            {busy ? 'Saving…' : `Apply to ${target.productCount}`}
          </button>
        </footer>
      </form>
    </div>
  );
}
