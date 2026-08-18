'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import {
  ChevronLeft,
  Loader2,
  Send,
  Star,
  CheckCircle2,
  Package,
} from 'lucide-react';
import { AccountSidebar } from '@/components/account/AccountSidebar';
import { SafeBoundary } from '@/components/common/SafeBoundary';
import {
  TRACK,
  trackEvent,
} from '@/components/providers/AnalyticsProvider';
import { createProductReview } from '@/lib/api/reviews';
import { getOrder, type Order } from '@/lib/api/orders';
import { HttpApiError } from '@/lib/api/client';
import { useAuthStore } from '@/stores/authStore';

/**
 * Web parity of the mobile RateOrderScreen.
 *
 * Reached from /account/orders/[id]'s "Rate this order" card when
 * status === DELIVERED. Loads the order, dedupes line items by
 * product, renders one star+title+body row per unique product,
 * and submits sequentially via POST /api/reviews.
 *
 * Per-row state mirrors the mobile flow so a 409 on one
 * (already-reviewed) doesn't abort the others — failed rows stay
 * open for retry, submitted rows flip to a green "Posted" pill.
 */
interface ReviewableItem {
  productId: string;
  productSlug: string;
  productName: string;
  productImage: string | null;
  rating: number;
  title: string;
  body: string;
  state: 'pending' | 'submitting' | 'submitted' | 'failed';
  errorMsg?: string;
}

interface PageProps {
  params: { id: string };
}

export default function RateOrderPage({ params }: PageProps) {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);

  const [order, setOrder] = useState<Order | null>(null);
  const [items, setItems] = useState<ReviewableItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  /// Gate: signed-out users bounce to login + come back.
  useEffect(() => {
    if (!user) {
      router.replace(
        `/login?next=${encodeURIComponent(`/account/orders/${params.id}/rate`)}`,
      );
    }
  }, [user, router, params.id]);

  /// Load + dedupe.
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setLoadError(null);
    void getOrder(params.id)
      .then((o) => {
        if (cancelled) return;
        setOrder(o);
        const seen = new Set<string>();
        const seeded: ReviewableItem[] = [];
        for (const it of o.items) {
          if (seen.has(it.productId)) continue;
          seen.add(it.productId);
          seeded.push({
            productId: it.productId,
            productSlug: it.productSlug,
            productName: it.productName,
            productImage: it.productImage,
            rating: 0,
            title: '',
            body: '',
            state: 'pending',
          });
        }
        setItems(seeded);
      })
      .catch((e) => {
        if (cancelled) return;
        setLoadError(
          e instanceof HttpApiError && e.status === 404
            ? 'Order not found.'
            : e instanceof Error
              ? e.message
              : "Couldn't load order.",
        );
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [params.id]);

  const ratedCount = useMemo(
    () =>
      items.filter((it) => it.rating > 0 && it.state !== 'submitted').length,
    [items],
  );

  const update = (productId: string, patch: Partial<ReviewableItem>) => {
    setItems((prev) =>
      prev.map((it) =>
        it.productId === productId ? { ...it, ...patch } : it,
      ),
    );
  };

  const onSubmit = async () => {
    const ratedRows = items.filter(
      (it) => it.rating > 0 && it.state !== 'submitted',
    );
    if (ratedRows.length === 0 || submitting) return;
    setSubmitting(true);
    setItems((prev) =>
      prev.map((it) =>
        ratedRows.find((r) => r.productId === it.productId)
          ? { ...it, state: 'submitting' }
          : it,
      ),
    );

    let submittedCount = 0;
    let failedCount = 0;
    for (const row of ratedRows) {
      try {
        await createProductReview({
          productSlug: row.productSlug,
          rating: row.rating,
          title: row.title.trim() || null,
          body: row.body.trim() || `Rated ${row.rating}/5`,
        });
        update(row.productId, { state: 'submitted' });
        submittedCount++;
      } catch (e) {
        const msg =
          e instanceof HttpApiError
            ? e.message
            : e instanceof Error
              ? e.message
              : 'Could not submit.';
        update(row.productId, { state: 'failed', errorMsg: msg });
        failedCount++;
      }
    }

    setSubmitting(false);
    trackEvent(TRACK.REVIEW_SUBMITTED, {
      order_id: order?.id,
      submitted: submittedCount,
      failed: failedCount,
    });

    if (failedCount === 0) {
      router.push(`/account/orders/${params.id}`);
    }
  };

  if (!user) return null;

  return (
    <main className="bg-page pb-12">
      <nav aria-label="Breadcrumb" className="border-b border-border bg-page">
        <ol className="mx-auto flex max-w-site items-center gap-2 px-4 py-3 font-sans text-xs text-muted md:text-sm">
          <li>
            <Link
              href={`/account/orders/${params.id}`}
              className="inline-flex items-center gap-1 hover:text-navy"
            >
              <ChevronLeft size={14} aria-hidden /> Back to order
            </Link>
          </li>
        </ol>
      </nav>

      <div className="mx-auto max-w-site px-4 py-6 md:py-10">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:gap-8">
          <div className="hidden lg:col-span-3 lg:block">
            <SafeBoundary name="account:sidebar" fallback={null}>
              <AccountSidebar
                active="/account/orders"
                userFirstName={user.name?.split(' ')[0] ?? 'You'}
                userLastName={user.name?.split(' ').slice(1).join(' ') ?? ''}
              />
            </SafeBoundary>
          </div>

          <div className="flex flex-col gap-5 lg:col-span-9">
            <header>
              <p className="font-raleway text-xs font-semibold uppercase tracking-btn text-amber">
                Rate your order
              </p>
              <h1 className="mt-2 font-raleway text-2xl font-bold text-navy md:text-3xl">
                {order ? `Order ${order.orderNumber}` : 'Loading…'}
              </h1>
              <p className="mt-2 font-sans text-sm text-muted">
                Tap a star for each product you bought — write a short
                note if you&apos;d like. Your review is signed
                &ldquo;Verified&rdquo; because you actually purchased.
              </p>
            </header>

            {loading ? (
              <div className="flex items-center justify-center gap-2 rounded-card border border-border bg-white p-10">
                <Loader2 size={18} className="animate-spin text-amber" aria-hidden />
                <p className="font-sans text-sm text-muted">
                  Loading your order…
                </p>
              </div>
            ) : loadError ? (
              <div
                role="alert"
                className="rounded-card border border-danger/30 bg-danger/10 px-4 py-3 font-sans text-sm text-danger"
              >
                {loadError}
              </div>
            ) : items.length === 0 ? (
              <div className="rounded-card border border-border bg-white p-10 text-center font-sans text-sm text-muted">
                No items to review on this order.
              </div>
            ) : (
              <>
                {items.map((it) => (
                  <ItemCard
                    key={it.productId}
                    item={it}
                    onChange={(patch) => update(it.productId, patch)}
                  />
                ))}

                <div className="sticky bottom-4 z-10 mt-4 rounded-card border border-border bg-white p-4 shadow-card">
                  <button
                    type="button"
                    onClick={() => void onSubmit()}
                    disabled={ratedCount === 0 || submitting}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-btn bg-navy px-5 py-3 font-raleway text-sm font-bold uppercase tracking-btn text-white hover:bg-amber hover:text-navy disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {submitting ? (
                      <Loader2 size={16} className="animate-spin" aria-hidden />
                    ) : (
                      <Send size={16} aria-hidden />
                    )}
                    {submitting
                      ? 'Submitting…'
                      : ratedCount === 0
                        ? 'Tap stars to start'
                        : `Submit ${ratedCount} ${ratedCount === 1 ? 'review' : 'reviews'}`}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

function ItemCard({
  item,
  onChange,
}: {
  item: ReviewableItem;
  onChange: (patch: Partial<ReviewableItem>) => void;
}) {
  const submitted = item.state === 'submitted';
  return (
    <section
      className={[
        'rounded-card border bg-white p-5 transition-opacity',
        submitted ? 'border-success/30 opacity-70' : 'border-border',
      ].join(' ')}
    >
      <header className="flex items-start gap-3">
        {item.productImage ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={item.productImage}
            alt=""
            className="h-14 w-14 shrink-0 rounded-input bg-page object-cover"
          />
        ) : (
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-input border border-border bg-page">
            <Package size={20} className="text-muted" aria-hidden />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="line-clamp-2 font-raleway text-sm font-bold text-navy">
            {item.productName}
          </p>
          {submitted ? (
            <span className="mt-1 inline-flex items-center gap-1 rounded-pill bg-success/10 px-2 py-0.5 font-raleway text-[10px] font-bold uppercase tracking-btn text-success">
              <CheckCircle2 size={11} aria-hidden /> Posted
            </span>
          ) : null}
        </div>
      </header>

      {submitted ? null : (
        <>
          <div className="mt-4 flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => onChange({ rating: n })}
                aria-label={`${n} star${n === 1 ? '' : 's'}`}
                className="rounded-input p-1 transition-colors hover:bg-page"
              >
                <Star
                  size={24}
                  className={
                    n <= item.rating ? 'fill-amber text-amber' : 'text-border'
                  }
                />
              </button>
            ))}
          </div>

          {item.rating > 0 ? (
            <div className="mt-4 flex flex-col gap-3">
              <input
                value={item.title}
                onChange={(e) => onChange({ title: e.target.value })}
                placeholder="Title (optional)"
                maxLength={120}
                className="rounded-input border border-border bg-white px-3 py-2 font-sans text-sm text-charcoal placeholder:text-muted focus:border-navy focus:outline-none"
              />
              <textarea
                value={item.body}
                onChange={(e) => onChange({ body: e.target.value })}
                placeholder="What did you think? Optional but helps other shoppers."
                maxLength={2000}
                rows={3}
                className="rounded-input border border-border bg-white px-3 py-2 font-sans text-sm text-charcoal placeholder:text-muted focus:border-navy focus:outline-none"
              />
            </div>
          ) : null}

          {item.state === 'failed' && item.errorMsg ? (
            <p className="mt-3 font-sans text-xs text-danger">
              {item.errorMsg}
            </p>
          ) : null}
        </>
      )}
    </section>
  );
}
