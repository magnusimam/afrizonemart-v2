'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  Check,
  CircleDashed,
  Clock,
  LayoutList,
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
  type InternQueueStats,
} from '@/lib/api/admin';
import { useAuthStore } from '@/stores/authStore';

/// Intern-facing image-upload queue. Stripped down — no admin buttons,
/// no other admin pages, no danger. Just: see your products, upload
/// images per product, submit, see what's been approved or rejected.
///
/// Status pills are real tabs that filter the cards in-place
/// (regression fix 2026-05-18 — previously they were navigation Links
/// to a separate list page, which buried TO-DO work below mountains
/// of approved rows). Default tab is TO DO so interns land on the
/// work that needs doing. A small "table view" button per tab links
/// to /admin/intern-queue/list?status=X for the leaner price-edit
/// view.
///
/// Tracker #50 — Approved tab defaults to UNPAID only (payoutId
/// null on the latest submission). Toggle reveals already-paid
/// history so it doesn't clutter the active workspace.
type TabKey = 'todo' | 'pending' | 'approved' | 'rejected';

export default function MyImageQueuePage() {
  const user = useAuthStore((s) => s.user);
  const [data, setData] = useState<{
    items: InternQueueItem[];
    stats: InternQueueStats;
  } | null>(null);
  const [busy, setBusy] = useState(false);
  const [tab, setTab] = useState<TabKey>('todo');
  const [showPaidApproved, setShowPaidApproved] = useState(false);

  const load = () =>
    internGetMyQueue()
      .then(setData)
      .catch((e) => toast(e instanceof Error ? e.message : 'Failed to load', 'error'));

  useEffect(() => {
    void load();
  }, []);

  const allItems = data?.items ?? [];

  /// Items shown under the active tab. Approved is split by payoutId
  /// so already-paid work doesn't drown the unpaid queue — the toggle
  /// brings paid rows back in.
  const visibleItems = useMemo(() => {
    return allItems.filter((it) => {
      if (it.status !== tab) return false;
      if (tab === 'approved' && !showPaidApproved) {
        return it.latestSubmission?.payoutId == null;
      }
      return true;
    });
  }, [allItems, tab, showPaidApproved]);

  /// Approved-tab count: by default this is unpaid-only so the visible
  /// number matches the cards on screen. Other tabs map 1:1 to stats.
  const tabCount = (k: TabKey): number => {
    if (!data) return 0;
    if (k === 'approved' && !showPaidApproved) return data.stats.approvedUnpaid;
    return data.stats[k];
  };

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
        subtitle="Upload front, back, side, and brand-logo images for each product. Submit once you have at least one image — admin reviews and approves."
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
        <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatusTab
            active={tab === 'todo'}
            onClick={() => setTab('todo')}
            icon={<CircleDashed size={14} aria-hidden />}
            label="To do"
            count={tabCount('todo')}
          />
          <StatusTab
            active={tab === 'pending'}
            onClick={() => setTab('pending')}
            icon={<Clock size={14} aria-hidden />}
            label="Pending review"
            count={tabCount('pending')}
          />
          <StatusTab
            active={tab === 'approved'}
            onClick={() => setTab('approved')}
            icon={<ShieldCheck size={14} aria-hidden />}
            label="Approved"
            count={tabCount('approved')}
          />
          <StatusTab
            active={tab === 'rejected'}
            onClick={() => setTab('rejected')}
            icon={<AlertTriangle size={14} aria-hidden />}
            label="Needs rework"
            count={tabCount('rejected')}
          />
        </div>
      )}

      {data && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <Link
            href={`/admin/intern-queue/list?status=${tab}`}
            className="inline-flex items-center gap-1.5 rounded-input border border-border bg-white px-3 py-1.5 font-sans text-xs font-semibold text-charcoal hover:border-navy hover:text-navy"
          >
            <LayoutList size={12} aria-hidden /> Table view
          </Link>
          {tab === 'approved' && (
            <label className="inline-flex cursor-pointer items-center gap-2 font-sans text-xs text-charcoal">
              <input
                type="checkbox"
                checked={showPaidApproved}
                onChange={(e) => setShowPaidApproved(e.target.checked)}
                className="h-4 w-4 cursor-pointer accent-navy"
              />
              Show paid history{' '}
              <span className="text-muted">
                ({data.stats.approvedPaid.toLocaleString()})
              </span>
            </label>
          )}
        </div>
      )}

      {data === null ? (
        <p className="font-sans text-sm text-muted">Loading your queue…</p>
      ) : allItems.length === 0 ? (
        <p className="rounded-card border border-border bg-white p-8 text-center font-sans text-sm text-muted">
          Nothing in your queue yet. Hit &ldquo;Claim 10 more&rdquo; to pull
          from the pool.
        </p>
      ) : visibleItems.length === 0 ? (
        <p className="rounded-card border border-dashed border-border bg-page p-8 text-center font-sans text-sm text-muted">
          {tab === 'todo' && 'Nothing to do — great work. Claim more to keep going.'}
          {tab === 'pending' && 'No submissions awaiting review right now.'}
          {tab === 'approved' &&
            (showPaidApproved
              ? 'No approved work yet.'
              : 'No unpaid approved work — your unpaid queue is empty (toggle "Show paid history" to see what was already paid out).')}
          {tab === 'rejected' && 'Nothing needs rework — keep it up.'}
        </p>
      ) : (
        <div className="flex flex-col gap-4">
          {visibleItems.map((item) => (
            <ProductCard key={item.id} item={item} onSaved={load} busy={busy} setBusy={setBusy} />
          ))}
        </div>
      )}
    </div>
  );
}

/// Status pill that filters the cards list in-place. Replaces the
/// nav-link tiles that used to take the intern to a different page.
function StatusTab({
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
      aria-pressed={active}
      className={`group flex items-center justify-between gap-2 rounded-card border px-3 py-3 text-left font-raleway text-xs font-bold uppercase tracking-btn transition-colors ${
        active
          ? 'border-navy bg-navy text-white shadow-card'
          : 'border-border bg-white text-charcoal hover:border-navy'
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

  // Every slot is optional individually. Submit requires at least
  // ONE image total across all slots (front / back / side / brand /
  // extras). Brand logo no longer hard-required so interns aren't
  // stuck on products that don't ship with a clear brand mark — admin
  // can backfill missing logos via /admin/brand-logos.
  const totalImageCount =
    (front ? 1 : 0) +
    (back ? 1 : 0) +
    (side ? 1 : 0) +
    (brandImg ? 1 : 0) +
    extras.length;
  const canSubmit =
    item.status !== 'pending' &&
    item.status !== 'approved' &&
    totalImageCount >= 1;

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
              {sub.frontImageUrl && <PreviewSlot label="Front" url={sub.frontImageUrl} />}
              {sub.backImageUrl && <PreviewSlot label="Back" url={sub.backImageUrl} />}
              {sub.sideImageUrl && <PreviewSlot label="Side" url={sub.sideImageUrl} />}
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
          <UploadSlot label="Front" value={front} onChange={setFront} />
          <UploadSlot label="Back" value={back} onChange={setBack} />
          <UploadSlot label="Side" value={side} onChange={setSide} />
          {/* Brand logo is structurally different (it's the company
              mark, not a view of the product) but kept in the same
              grid so the intern sees it as part of the same task. The
              alt input is exposed because brand alts feed the
              "About the brand" section copy. */}
          <div className="flex flex-col gap-2">
            <label className="flex flex-col gap-1.5">
              <span className="font-raleway text-[10px] font-bold uppercase tracking-btn text-amber">
                Brand logo
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
