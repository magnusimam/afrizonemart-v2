import type { Metadata } from 'next';
import { SITE_NAME } from '@/lib/seo';

// Search is intentionally non-canonical (per-query results vary).
// We let Google index the search landing but ignore individual
// query strings to avoid SERP-bloat.
export const metadata: Metadata = {
  title: 'Search Products',
  description: `Search ${SITE_NAME} for authentic African-made products — beauty, fashion, groceries, home goods, automobile, and more.`,
  robots: { index: true, follow: true },
};

export default function SearchLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
