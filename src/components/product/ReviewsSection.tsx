import { CheckCircle2, Star } from 'lucide-react';
import { getCountry } from '@/lib/countries';
import { Flag } from '@/components/common/Flag';
import type { ProductReview } from '@/lib/products';

interface ReviewsSectionProps {
  rating: number;
  reviewCount: number;
  reviews: ProductReview[];
}

const breakdown = [
  { stars: 5, percent: 78 },
  { stars: 4, percent: 16 },
  { stars: 3, percent: 4 },
  { stars: 2, percent: 1 },
  { stars: 1, percent: 1 },
];

export function ReviewsSection({ rating, reviewCount, reviews }: ReviewsSectionProps) {
  return (
    <section className="bg-white py-12 md:py-16">
      <div className="mx-auto max-w-site px-4">
        <div className="mb-8 flex items-end justify-between gap-4 flex-wrap">
          <div>
            <p className="font-raleway text-xs font-semibold uppercase tracking-btn text-amber">
              What our customers say
            </p>
            <h2 className="font-raleway text-2xl font-bold text-navy md:text-3xl">
              Customer Reviews
            </h2>
          </div>
          <button
            type="button"
            className="rounded-btn border-2 border-navy bg-white px-5 py-2 font-raleway text-xs font-bold uppercase tracking-btn text-navy transition-colors hover:bg-navy hover:text-white"
          >
            Write a Review
          </button>
        </div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-12 md:gap-10">
          <aside className="md:col-span-4">
            <div className="rounded-card border border-border bg-page p-6">
              <div className="flex items-baseline gap-2">
                <span className="font-raleway text-5xl font-bold text-navy">
                  {rating.toFixed(1)}
                </span>
                <span className="font-sans text-sm text-muted">/ 5</span>
              </div>
              <div className="mt-2 flex items-center gap-0.5 text-amber">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star
                    key={i}
                    size={18}
                    fill={i <= Math.round(rating) ? 'currentColor' : 'none'}
                    aria-hidden
                  />
                ))}
              </div>
              <p className="mt-1 font-sans text-sm text-muted">
                Based on {reviewCount.toLocaleString()} reviews
              </p>

              <div className="mt-5 flex flex-col gap-2">
                {breakdown.map((b) => (
                  <div key={b.stars} className="flex items-center gap-2">
                    <span className="w-6 font-sans text-xs text-charcoal">
                      {b.stars}★
                    </span>
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-border">
                      <div
                        className="h-full bg-amber"
                        style={{ width: `${b.percent}%` }}
                      />
                    </div>
                    <span className="w-8 text-right font-sans text-xs text-muted">
                      {b.percent}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </aside>

          <div className="md:col-span-8 flex flex-col gap-4">
            {reviews.map((r) => {
              const country = getCountry(r.country);
              return (
                <article
                  key={r.id}
                  className="rounded-card border border-border bg-white p-5 transition-shadow hover:shadow-card"
                >
                  <header className="flex flex-wrap items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-navy/10 font-raleway text-sm font-bold text-navy">
                      {r.author.charAt(0)}
                    </div>
                    <div className="flex flex-1 flex-col">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-raleway text-sm font-bold text-navy">
                          {r.author}
                        </span>
                        {country && (
                          <span className="inline-flex items-center gap-1 font-sans text-xs text-muted">
                            <Flag code={country.code} title={country.name} size="sm" />
                            {country.name}
                          </span>
                        )}
                        {r.verified && (
                          <span className="inline-flex items-center gap-1 rounded-input bg-success/10 px-1.5 py-0.5 font-sans text-[10px] font-semibold text-success">
                            <CheckCircle2 size={10} aria-hidden />
                            Verified Buyer
                          </span>
                        )}
                      </div>
                      <span className="font-sans text-xs text-muted">{r.date}</span>
                    </div>
                    <div className="flex items-center gap-0.5 text-amber">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <Star
                          key={i}
                          size={14}
                          fill={i <= r.rating ? 'currentColor' : 'none'}
                          aria-hidden
                        />
                      ))}
                    </div>
                  </header>
                  <h3 className="mt-3 font-raleway text-base font-bold text-charcoal">
                    {r.title}
                  </h3>
                  <p className="mt-1 font-sans text-sm leading-relaxed text-charcoal">
                    {r.body}
                  </p>
                </article>
              );
            })}

            <button
              type="button"
              className="self-start rounded-full border-2 border-navy bg-white px-6 py-2 font-raleway text-xs font-bold uppercase tracking-btn text-navy transition-colors hover:bg-navy hover:text-white"
            >
              Load More Reviews
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
