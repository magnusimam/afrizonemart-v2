'use client';

import { ApiProductCard } from '@/components/product/ApiProductCard';
import { trackSearchClick } from '@/lib/api/search';
import type { ApiProduct } from '@/lib/api/types';

/**
 * Search Phase 0 click-through tracking (spec Section 16.3) — the
 * `POST /api/search/click` call and `trackSearchClick` helper have
 * existed since Phase 0 shipped, just never wired to a click. Wraps
 * `ApiProductCard` in a plain `onClick` (bubble phase, fires alongside
 * the card's internal `<Link>` navigation, doesn't block or delay it)
 * so every search-result click gets attributed to the query that
 * produced it — the query-log-mined "did you mean" (Phase 1) and any
 * future learned ranker (Phase 3) both train on this signal.
 */
interface Props {
  product: ApiProduct;
  queryLogId: string | null;
}

export function SearchResultCard({ product, queryLogId }: Props) {
  return (
    <div
      onClick={() => {
        if (queryLogId) trackSearchClick(queryLogId, product.id);
      }}
    >
      <ApiProductCard product={product} />
    </div>
  );
}
