'use client';

import Image from 'next/image';
import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  Check,
  CircleDashed,
  Clock,
  Plus,
  ShieldCheck,
  Upload,
  XCircle,
} from 'lucide-react';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { ImageUploader } from '@/components/admin/ImageUploader';
import { toast } from '@/components/admin/Toast';
import { HttpApiError } from '@/lib/api/client';
import {
  internClaimFromPool,
  internGetMyQueue,
  internSubmitImages,
  type InternQueueItem,
} from '@/lib/api/admin';
import { useAuthStore } from '@/stores/authStore';

type Filter = 'all' | 'todo' | 'pending' | 'approved' | 'rejected';

/// Intern-facing image-upload queue. Stripped down — no admin buttons,
/// no other admin pages, no danger. Just: see your products, upload
/// 3 images per product, submit, see what's been approved or rejected.
export default function MyImageQueuePage() {
  const user = useAuthStore((s) => s.user);
  const [data, setData] = useState<{
    items: InternQueueItem[];
    stats: { todo: number; pending: number; approved: number; rejected: number };
  } | null>(null);
  const [filter, setFilter] = useState<Filter>('todo');
  const [busy, setBusy] = useState(false);

  const load = () =>
    internGetMyQueue()
      .then(setData)
      .catch((e) => toast(e instanceof Error ? e.message : 'Failed to load', 'error'));

  useEffect(() => {
    void load();
  }, []);

  const filtered = useMemo(() => {
    if (!data) return [];
    if (filter === 'all') return data.items;
    return data.items.filter((it) => it.status === filter);
  }, [data, filter]);

  const handleClaim = async () => {
    setBusy(true);
    try {
      const r = await internClaimFromPool(10);
      if (r.claimed === 0) {
        toast('Nothing in the unassigned pool right now', 'info');
      } else {
        toast(`Claimed ${r.claimed} new product${r.claimed === 1 ? '' : 's'}`);
        await load();
      }
    } catch (e) {
      toast(e instanceof HttpApiError ? e.message : 'Failed to claim', 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="px-8 py-10">
      <AdminPageHeader
        title={`Hi, ${user?.name?.split(' ')[0] ?? 'there'} — your image queue`}
        subtitle="Upload front, back, and side images for each product. Mark a product done when all three are uploaded; admin reviews and approves."
        action={
          <button
            type="button"
            onClick={handleClaim}
            disabled={busy}
            className="flex items-center gap-2 rounded-btn bg-amber px-4 py-2 font-raleway text-xs font-bold uppercase tracking-btn text-navy hover:bg-white disabled:opacity-50"
          >
            <Plus size={14} aria-hidden /> Claim 10 more
          </button>
        }
      />

      {data && (
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <FilterTab
            active={filter === 'todo'}
            onClick={() => setFilter('todo')}
            icon={<CircleDashed size={14} aria-hidden />}
            label="To do"
            count={data.stats.todo}
          />
          <FilterTab
            active={filter === 'pending'}
            onClick={() => setFilter('pending')}
            icon={<Clock size={14} aria-hidden />}
            label="Pending review"
            count={data.stats.pending}
          />
          <FilterTab
            active={filter === 'approved'}
            onClick={() => setFilter('approved')}
            icon={<ShieldCheck size={14} aria-hidden />}
            label="Approved"
            count={data.stats.approved}
          />
          <FilterTab
            active={filter === 'rejected'}
            onClick={() => setFilter('rejected')}
            icon={<AlertTriangle size={14} aria-hidden />}
            label="Needs rework"
            count={data.stats.rejected}
          />
        </div>
      )}

      {data === null ? (
        <p className="font-sans text-sm text-muted">Loading your queue…</p>
      ) : filtered.length === 0 ? (
        <p className="rounded-card border border-border bg-white p-8 text-center font-sans text-sm text-muted">
          {filter === 'todo'
            ? 'Nothing to do right now. Hit "Claim 10 more" to pull from the pool.'
            : `No ${filter} products.`}
        </p>
      ) : (
        <div className="flex flex-col gap-4">
          {filtered.map((item) => (
            <ProductCard key={item.id} item={item} onSaved={load} busy={busy} setBusy={setBusy} />
          ))}
        </div>
      )}
    </div>
  );
}

function FilterTab({
  active,
  onClick,
  icon,
  label,
  count,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  count: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center justify-between gap-2 rounded-card border px-3 py-3 font-raleway text-xs font-bold uppercase tracking-btn ${
        active ? 'border-navy bg-navy text-white' : 'border-border bg-white text-charcoal hover:border-navy'
      }`}
    >
      <span className="flex items-center gap-1.5">
        {icon}
        {label}
      </span>
      <span
        className={`rounded-full px-2 py-0.5 text-xs ${
          active ? 'bg-white/20 text-white' : 'bg-page text-charcoal'
        }`}
      >
        {count}
      </span>
    </button>
  );
}

function ProductCard({
  item,
  onSaved,
  busy,
  setBusy,
}: {
  item: InternQueueItem;
  onSaved: () => void;
  busy: boolean;
  setBusy: (v: boolean) => void;
}) {
  const sub = item.latestSubmission;
  const brandLabel = item.brand ?? item.name;
  const [front, setFront] = useState(sub?.frontImageUrl ?? '');
  const [back, setBack] = useState(sub?.backImageUrl ?? '');
  const [side, setSide] = useState(sub?.sideImageUrl ?? '');
  const [brandImg, setBrandImg] = useState(sub?.brandImageUrl ?? '');
  const [brandAlt, setBrandAlt] = useState(
    sub?.brandImageAlt ?? `${brandLabel} — brand logo`,
  );
  const [extras, setExtras] = useState<string[]>(sub?.additionalImages ?? []);

  // When a new product loads (after rejection edit), reset state to
  // whatever is on the latest submission. This keeps the form aligned
  // when the parent reloads after a save.
  useEffect(() => {
    setFront(sub?.frontImageUrl ?? '');
    setBack(sub?.backImageUrl ?? '');
    setSide(sub?.sideImageUrl ?? '');
    setBrandImg(sub?.brandImageUrl ?? '');
    setBrandAlt(sub?.brandImageAlt ?? `${brandLabel} — brand logo`);
    setExtras(sub?.additionalImages ?? []);
    // brandLabel is derived from item; refresh on item.id change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    sub?.id,
    sub?.frontImageUrl,
    sub?.backImageUrl,
    sub?.sideImageUrl,
    sub?.brandImageUrl,
    sub?.brandImageAlt,
    sub?.additionalImages,
    item.id,
  ]);

  const canSubmit =
    item.status !== 'pending' &&
    item.status !== 'approved' &&
    front &&
    back &&
    side &&
    brandImg;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setBusy(true);
    try {
      await internSubmitImages(item.id, {
        frontImageUrl: front,
        backImageUrl: back,
        sideImageUrl: side,
        brandImageUrl: brandImg,
        brandImageAlt: brandAlt.trim() || null,
        additionalImages: extras,
      });
      toast(`Submitted ${item.name} for review`);
      onSaved();
    } catch (e) {
      toast(e instanceof HttpApiError ? e.message : 'Failed to submit', 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <article
      className={`overflow-hidden rounded-card border bg-white ${
        item.status === 'rejected' ? 'border-danger/40' : 'border-border'
      }`}
    >
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-page px-4 py-3">
        <div className="flex items-center gap-3">
          {item.currentImages[0] && (
            <div className="relative h-10 w-10 overflow-hidden rounded-md border border-border">
              <Image
                src={item.currentImages[0]}
                alt={item.name}
                fill
                sizes="40px"
                className="object-cover"
              />
            </div>
          )}
          <div>
            <p className="font-raleway font-semibold text-navy">{item.name}</p>
            <p className="font-sans text-xs text-muted">
              {item.brand ?? '—'} · {item.category?.name ?? 'Uncategorised'}
            </p>
          </div>
        </div>
        <StatusBadge status={item.status} />
      </header>

      {item.status === 'rejected' && sub?.rejectionReason && (
        <div className="border-b border-danger/30 bg-danger/5 px-4 py-3">
          <p className="mb-1 flex items-center gap-1 font-raleway text-[10px] font-bold uppercase tracking-btn text-danger">
            <XCircle size={12} aria-hidden /> Reason for rejection
          </p>
          <p className="font-sans text-sm text-charcoal">{sub.rejectionReason}</p>
        </div>
      )}

      {item.status === 'pending' ? (
        <div className="px-4 py-4">
          <p className="font-sans text-sm text-muted">
            Submitted {sub ? new Date(sub.createdAt).toLocaleString() : ''}. Waiting on admin review — you&apos;ll see the result here.
          </p>
          {sub && (
            <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <PreviewSlot label="Front" url={sub.frontImageUrl} />
              <PreviewSlot label="Back" url={sub.backImageUrl} />
              <PreviewSlot label="Side" url={sub.sideImageUrl} />
              {sub.brandImageUrl && (
                <PreviewSlot label="Brand" url={sub.brandImageUrl} />
              )}
            </div>
          )}
        </div>
      ) : item.status === 'approved' ? (
        <div className="px-4 py-4">
          <p className="font-sans text-sm text-success">
            Approved {sub?.reviewedAt ? new Date(sub.reviewedAt).toLocaleString() : ''} — counts toward payment.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 p-4 md:grid-cols-2 lg:grid-cols-4">
          <UploadSlot label="Front" required value={front} onChange={setFront} />
          <UploadSlot label="Back" required value={back} onChange={setBack} />
          <UploadSlot label="Side" required value={side} onChange={setSide} />
          {/* Brand logo is structurally different (it's the company
              mark, not a view of the product) but kept in the same
              grid so the intern sees it as part of the same task. The
              alt input is exposed because brand alts feed the
              "About the brand" section copy. */}
          <div className="flex flex-col gap-2">
            <label className="flex flex-col gap-1.5">
              <span className="font-raleway text-[10px] font-bold uppercase tracking-btn text-amber">
                Brand logo *
              </span>
              <ImageUploader
                value={brandImg}
                onChange={(next) => setBrandImg(next ?? '')}
                folder="products"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="font-raleway text-[9px] font-bold uppercase tracking-btn text-muted">
                Alt text (SEO)
              </span>
              <input
                type="text"
                value={brandAlt}
                onChange={(e) => setBrandAlt(e.target.value)}
                placeholder={`${brandLabel} — brand logo`}
                maxLength={200}
                className="w-full rounded-input border border-border bg-white px-2 py-1.5 font-sans text-xs text-charcoal focus:border-navy focus:outline-none"
              />
            </label>
          </div>
          <div className="md:col-span-2 lg:col-span-4">
            <p className="mb-2 font-raleway text-[10px] font-bold uppercase tracking-btn text-muted">
              Optional extras
            </p>
            <div className="flex flex-wrap gap-3">
              {extras.map((url, i) => (
                <div key={i} className="relative">
                  <PreviewSlot url={url} />
                  <button
                    type="button"
                    onClick={() => setExtras(extras.filter((_, idx) => idx !== i))}
                    aria-label="Remove"
                    className="absolute -right-2 -top-2 rounded-full bg-danger p-1 text-white shadow"
                  >
                    <XCircle size={12} aria-hidden />
                  </button>
                </div>
              ))}
              <ImageUploader
                value=""
                onChange={(url) => url && setExtras([...extras, url])}
                folder="products"
              />
            </div>
          </div>
          <div className="flex justify-end md:col-span-2 lg:col-span-4">
            <button
              type="button"
              onClick={handleSubmit}
              disabled={busy || !canSubmit}
              className="flex items-center gap-2 rounded-btn bg-navy px-5 py-2.5 font-raleway text-xs font-bold uppercase tracking-btn text-white hover:bg-amber hover:text-navy disabled:opacity-50"
            >
              <Upload size={14} aria-hidden /> Submit for review
            </button>
          </div>
        </div>
      )}
    </article>
  );
}

function StatusBadge({ status }: { status: InternQueueItem['status'] }) {
  if (status === 'approved') {
    return (
      <span className="flex items-center gap-1 rounded-full bg-success/15 px-3 py-1 font-raleway text-[10px] font-bold uppercase tracking-btn text-success">
        <Check size={10} aria-hidden /> Approved
      </span>
    );
  }
  if (status === 'pending') {
    return (
      <span className="flex items-center gap-1 rounded-full bg-info/15 px-3 py-1 font-raleway text-[10px] font-bold uppercase tracking-btn text-info">
        <Clock size={10} aria-hidden /> In review
      </span>
    );
  }
  if (status === 'rejected') {
    return (
      <span className="flex items-center gap-1 rounded-full bg-danger/15 px-3 py-1 font-raleway text-[10px] font-bold uppercase tracking-btn text-danger">
        <AlertTriangle size={10} aria-hidden /> Rework
      </span>
    );
  }
  return (
    <span className="flex items-center gap-1 rounded-full bg-muted/20 px-3 py-1 font-raleway text-[10px] font-bold uppercase tracking-btn text-muted">
      <CircleDashed size={10} aria-hidden /> To do
    </span>
  );
}

function UploadSlot({
  label,
  required,
  value,
  onChange,
}: {
  label: string;
  required?: boolean;
  value: string;
  onChange: (url: string) => void;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="font-raleway text-[10px] font-bold uppercase tracking-btn text-navy">
        {label}
        {required && <span className="ml-0.5 text-danger">*</span>}
      </span>
      <ImageUploader
        value={value}
        onChange={(next) => onChange(next ?? '')}
        folder="products"
      />
    </label>
  );
}

function PreviewSlot({ label, url }: { label?: string; url: string }) {
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <span className="font-raleway text-[10px] font-bold uppercase tracking-btn text-muted">
          {label}
        </span>
      )}
      <a href={url} target="_blank" rel="noreferrer">
        <div className="relative aspect-square w-24 overflow-hidden rounded-card border border-border bg-page">
          <Image src={url} alt={label ?? ''} fill sizes="96px" className="object-cover" />
        </div>
      </a>
    </div>
  );
}
