'use client';

import Link from 'next/link';
import { useLibraryDocs } from '@/hooks/use-library-docs';
import { LibraryDocCard } from '@/components/library/LibraryDocCard';
import { SafeBoundary } from '@/components/common/SafeBoundary';
import { useFlag } from '@/lib/useFlag';

/// Homepage teaser row for Civic Library — pulls the most recently
/// published documents straight from the public API, no new shelf
/// infrastructure (the Shelf/categoryAutoFill system is product-only;
/// documents aren't products, so this is a standalone section
/// mirroring the visual pattern of other homepage rows like
/// BooksSection). Gated behind the same civic_library_enabled flag
/// as the /library page and nav entry, and additionally hides itself
/// while loading or if there's nothing published yet — a promo row
/// pointing at an empty grid is worse than no row.
export function CivicLibrarySection() {
  const enabled = useFlag('civic_library_enabled', false);
  const { data, isLoading, isError } = useLibraryDocs({ limit: 8 });

  if (!enabled || isLoading || isError) return null;
  const items = data?.items ?? [];
  if (items.length === 0) return null;

  return (
    <section>
      <div className="w-full bg-navy py-3 text-center">
        <h2 className="font-raleway text-base font-bold uppercase tracking-btn text-white md:text-lg">
          Civic Library — Free Government Documents
        </h2>
      </div>

      <div className="bg-white py-6 md:py-8">
        <div className="mx-auto grid max-w-site grid-cols-2 gap-3 px-4 sm:grid-cols-3 md:grid-cols-4 md:gap-4 lg:grid-cols-6">
          {items.map((doc) => (
            <SafeBoundary key={doc.id} name="home:civic-library-card" fallback={null}>
              <LibraryDocCard doc={doc} />
            </SafeBoundary>
          ))}
        </div>

        <div className="mt-6 flex justify-center px-4 md:mt-8">
          <Link
            href="/library"
            className="rounded-full bg-amber px-8 py-3 text-center font-raleway text-xs font-bold uppercase tracking-btn text-navy transition-colors hover:bg-navy hover:text-white md:text-sm lg:px-12"
          >
            View — Civic Library ›
          </Link>
        </div>
      </div>
    </section>
  );
}
