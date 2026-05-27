'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState, type FormEvent } from 'react';
import { CheckCircle2, Loader2, Star } from 'lucide-react';
import { HttpApiError } from '@/lib/api/client';
import {
  createProductReview,
  listProductReviews,
  type ApiReview,
} from '@/lib/api/reviews';
import { useAuthStore } from '@/stores/authStore';

/**
 * PDP reviews section — public list + customer write form.
 *
 * Average rating + count are derived from the loaded page (the server-
 * rendered AggregateRating JSON-LD already uses the canonical
 * Product.rating / reviewCount, which the API recomputes inside the
 * same tx as the insert — so the stars in search results stay accurate
 * the moment a new review lands).
 *
 * Signed-out users see a sign-in CTA instead of the form. Verified
 * reviewers (PAID+ order for this product) get a "Verified purchase"
 * pill on their card.
 */

const PAGE_SIZE = 10;

export interface ProductReviewsProps {
  productSlug: string;
  /// Server-fetched first page so reviews land in the SSR HTML and
  /// Google indexes the text. Omit → component fetches on mount.
  initialReviews?: ApiReview[];
  initialTotal?: number;
  initialPages?: number;
}

export function ProductReviews({
  productSlug,
  initialReviews,
  initialTotal,
  initialPages,
}: ProductReviewsProps) {
  const user = useAuthStore((s) => s.user);
  const pathname = usePathname();

  const hasInitial = initialReviews !== undefined;

  const [reviews, setReviews] = useState<ApiReview[]>(initialReviews ?? []);
  const [total, setTotal] = useState(initialTotal ?? 0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(initialPages ?? 1);
  const [loading, setLoading] = useState(!hasInitial);
  const [error, setError] = useState<string | null>(null);

  /// Client-side fallback fetch (only when the server didn't pass data).
  useEffect(() => {
    if (hasInitial) return;
    let cancelled = false;
    setLoading(true);
    listProductReviews(productSlug, 1, PAGE_SIZE)
      .then((res) => {
        if (cancelled) return;
        setReviews(res.items);
        setTotal(res.pagination.total);
        setPages(res.pagination.pages);
        setPage(1);
      })
      .catch((e) => {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : 'Could not load reviews');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [productSlug, hasInitial]);

  const loadMore = async () => {
    if (loading || page >= pages) return;
    setLoading(true);
    try {
      const next = page + 1;
      const res = await listProductReviews(productSlug, next, PAGE_SIZE);
      setReviews((prev) => [...prev, ...res.items]);
      setPage(next);
      setPages(res.pagination.pages);
      setTotal(res.pagination.total);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load more reviews');
    } finally {
      setLoading(false);
    }
  };

  /// Local-only average so the heading reflects the loaded page until
  /// the next product-page render picks up the canonical Product.rating.
  const avg =
    reviews.length > 0
      ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
      : 0;

  const handleSubmit = async (review: ApiReview) => {
    setReviews((prev) => [review, ...prev]);
    setTotal((n) => n + 1);
  };

  return (
    <section className="mx-auto max-w-site px-4 py-10 md:py-12">
      <header className="flex flex-col gap-3 border-b border-border pb-5 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="font-raleway text-2xl font-bold text-navy md:text-3xl">
            Reviews
          </h2>
          <div className="mt-2 flex items-center gap-3">
            <StarRow rating={avg} size={18} />
            <span className="font-sans text-sm text-muted">
              {total === 0
                ? 'No reviews yet — be the first.'
                : `${avg.toFixed(1)} average · ${total} review${total === 1 ? '' : 's'}`}
            </span>
          </div>
        </div>
      </header>

      {/* Form / sign-in CTA */}
      {user ? (
        <ReviewForm productSlug={productSlug} onSubmitted={handleSubmit} />
      ) : (
        <div className="mt-5 rounded-card border border-border bg-white px-5 py-4">
          <p className="font-sans text-sm text-charcoal">
            <Link
              href={`/login?next=${encodeURIComponent(pathname ?? '/')}`}
              className="font-bold text-navy underline-offset-4 hover:underline"
            >
              Sign in
            </Link>{' '}
            to leave a review. Verified-purchase reviews are tagged automatically.
          </p>
        </div>
      )}

      {/* Reviews list */}
      <div className="mt-6 space-y-4">
        {loading && reviews.length === 0 ? (
          <p className="font-sans text-sm text-muted">Loading reviews…</p>
        ) : error && reviews.length === 0 ? (
          <p className="font-sans text-sm text-danger">{error}</p>
        ) : reviews.length === 0 ? (
          <p className="font-sans text-sm text-muted">
            No reviews yet. Customers who&apos;ve bought this product can leave one.
          </p>
        ) : (
          reviews.map((r) => <ReviewCard key={r.id} review={r} />)
        )}
      </div>

      {page < pages && (
        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={loadMore}
            disabled={loading}
            className="rounded-btn border border-border bg-white px-5 py-2 font-raleway text-xs font-bold uppercase tracking-btn text-navy hover:border-navy disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? 'Loading…' : `Show more (${total - reviews.length})`}
          </button>
        </div>
      )}
    </section>
  );
}

/* ─────────────────────────  Review card  ───────────────────────── */

function ReviewCard({ review }: { review: ApiReview }) {
  const date = new Date(review.createdAt).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
  return (
    <article className="rounded-card border border-border bg-white p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <StarRow rating={review.rating} size={16} />
          {review.verified && (
            <span className="inline-flex items-center gap-1 rounded-pill bg-success/10 px-2 py-0.5 font-raleway text-[10px] font-bold uppercase tracking-btn text-success">
              <CheckCircle2 size={11} aria-hidden />
              Verified purchase
            </span>
          )}
        </div>
        <span className="font-sans text-xs text-muted">{date}</span>
      </div>
      {review.title && (
        <h3 className="mt-3 font-raleway font-bold text-navy">{review.title}</h3>
      )}
      <p className="mt-2 whitespace-pre-wrap font-sans text-sm leading-relaxed text-charcoal">
        {review.body}
      </p>
      <p className="mt-3 font-sans text-xs text-muted">— {review.authorName}</p>
    </article>
  );
}

/* ──────────────────────────  Write form  ───────────────────────── */

interface ReviewFormProps {
  productSlug: string;
  onSubmitted: (r: ApiReview) => void;
}

function ReviewForm({ productSlug, onSubmitted }: ReviewFormProps) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (rating < 1 || rating > 5) {
      setError('Pick a star rating.');
      return;
    }
    if (body.trim().length < 1) {
      setError('Add some words to your review.');
      return;
    }
    setSubmitting(true);
    try {
      const review = await createProductReview({
        productSlug,
        rating,
        title: title.trim() || null,
        body: body.trim(),
      });
      onSubmitted(review);
      setRating(0);
      setTitle('');
      setBody('');
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (e) {
      const msg =
        e instanceof HttpApiError || e instanceof Error
          ? e.message
          : 'Could not post your review';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const displayRating = hoverRating || rating;

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-5 space-y-3 rounded-card border border-border bg-white p-5"
    >
      <h3 className="font-raleway text-base font-bold text-navy">
        Write a review
      </h3>

      <div>
        <p className="font-raleway text-[11px] font-bold uppercase tracking-btn text-navy">
          Your rating
        </p>
        <div className="mt-1.5 flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setRating(n)}
              onMouseEnter={() => setHoverRating(n)}
              onMouseLeave={() => setHoverRating(0)}
              aria-label={`${n} star${n === 1 ? '' : 's'}`}
              className="rounded-input p-1 transition-colors hover:bg-page"
            >
              <Star
                size={24}
                className={
                  n <= displayRating ? 'fill-amber text-amber' : 'text-border'
                }
              />
            </button>
          ))}
        </div>
      </div>

      <label className="flex flex-col gap-1.5">
        <span className="font-raleway text-[11px] font-bold uppercase tracking-btn text-navy">
          Title (optional)
        </span>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={120}
          placeholder="One-line summary"
          className="rounded-input border border-border bg-white px-3 py-2 font-sans text-sm text-charcoal placeholder:text-muted focus:border-navy focus:outline-none"
        />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="font-raleway text-[11px] font-bold uppercase tracking-btn text-navy">
          Your review
        </span>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          maxLength={2000}
          required
          rows={4}
          placeholder="What did you think? What would you tell a friend?"
          className="rounded-input border border-border bg-white px-3 py-2 font-sans text-sm text-charcoal placeholder:text-muted focus:border-navy focus:outline-none"
        />
      </label>

      {error && (
        <p className="font-sans text-sm text-danger">{error}</p>
      )}
      {success && (
        <p className="font-sans text-sm text-success">Thanks — your review is live.</p>
      )}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={submitting}
          className="inline-flex items-center gap-2 rounded-btn bg-navy px-5 py-2.5 font-raleway text-xs font-bold uppercase tracking-btn text-white hover:bg-amber hover:text-navy disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting ? (
            <Loader2 size={13} className="animate-spin" aria-hidden />
          ) : null}
          {submitting ? 'Posting…' : 'Post review'}
        </button>
      </div>
    </form>
  );
}

/* ───────────────────────────  Stars  ─────────────────────────── */

function StarRow({ rating, size = 16 }: { rating: number; size?: number }) {
  /// Round to the nearest half so a 4.4 shows as four filled + half;
  /// 4.6 as five.
  const rounded = Math.round(rating * 2) / 2;
  return (
    <div className="flex items-center" aria-label={`${rating.toFixed(1)} out of 5`}>
      {[1, 2, 3, 4, 5].map((n) => {
        const filled = rounded >= n;
        const half = !filled && rounded >= n - 0.5;
        return (
          <Star
            key={n}
            size={size}
            className={
              filled
                ? 'fill-amber text-amber'
                : half
                  ? 'fill-amber/40 text-amber'
                  : 'text-border'
            }
          />
        );
      })}
    </div>
  );
}
