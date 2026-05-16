'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Heart, Loader2 } from 'lucide-react';
import { AccountSidebar } from '@/components/account/AccountSidebar';
import { AccountMobileNav } from '@/components/account/AccountMobileNav';
import { ProductCardPlaceholder } from '@/components/product/ProductCardPlaceholder';
import { SafeBoundary } from '@/components/common/SafeBoundary';
import {
  WishlistApiError,
  type WishlistEntry,
  listWishlist,
  removeFromWishlist,
} from '@/lib/api/wishlist';
import { useAuthStore } from '@/stores/authStore';

/**
 * /account/wishlist — live wishlist data, replaces MOCK_WISHLIST.
 *
 * The product card has its own local `wished` state today (the heart
 * toggle isn't wired to the API yet). Removing from this page calls
 * the API directly. Wiring the card-level heart into the wishlist
 * API is a separate change — when that lands, this page can drop
 * the dedicated "remove" button per card.
 */
export default function WishlistPage() {
  const user = useAuthStore((s) => s.user);
  const accessToken = useAuthStore((s) => s.accessToken);

  const [items, setItems] = useState<WishlistEntry[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const { first, last } = useMemo(() => {
    const [f, ...rest] = (user?.name ?? '').split(' ');
    return { first: f ?? '', last: rest.join(' ') };
  }, [user?.name]);

  useEffect(() => {
    if (!accessToken) return;
    let cancelled = false;
    setLoadError(null);
    listWishlist(accessToken)
      .then((res) => {
        if (!cancelled) setItems(res.items);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setLoadError(
          err instanceof WishlistApiError
            ? err.message
            : 'Could not load your wishlist.',
        );
      });
    return () => {
      cancelled = true;
    };
  }, [accessToken]);

  const handleRemove = async (productId: string) => {
    if (!accessToken) return;
    setBusyId(productId);
    try {
      await removeFromWishlist(accessToken, productId);
      setItems((prev) =>
        (prev ?? []).filter((entry) => entry.product.id !== productId),
      );
    } catch (err) {
      setLoadError(
        err instanceof WishlistApiError
          ? err.message
          : 'Could not remove that item.',
      );
    } finally {
      setBusyId(null);
    }
  };

  const count = items?.length ?? 0;

  return (
    <main className="bg-page pb-12">
      <div className="mx-auto max-w-site px-4 py-6 md:py-10">
        <SafeBoundary name="account:mobile-nav" fallback={null}>
          <AccountMobileNav active="/account/wishlist" />
        </SafeBoundary>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:gap-8">
          <div className="lg:col-span-3">
            <SafeBoundary name="account:sidebar" fallback={null}>
              <AccountSidebar
                active="/account/wishlist"
                userFirstName={first || 'You'}
                userLastName={last}
              />
            </SafeBoundary>
          </div>

          <div className="flex flex-col gap-5 lg:col-span-9">
            <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <h1 className="font-raleway text-2xl font-bold text-navy md:text-3xl">
                  Your Wishlist
                </h1>
                <p className="font-sans text-sm text-muted md:text-base">
                  {items === null
                    ? 'Loading…'
                    : `${count} item${count === 1 ? '' : 's'} you love`}
                </p>
              </div>
            </header>

            {loadError ? (
              <div
                role="alert"
                className="rounded-input border border-danger/30 bg-danger/5 px-3 py-2 font-sans text-sm text-danger"
              >
                {loadError}
              </div>
            ) : null}

            {items === null ? (
              <div className="flex items-center gap-2 font-sans text-sm text-muted">
                <Loader2 size={16} className="animate-spin" aria-hidden />
                Loading your wishlist…
              </div>
            ) : items.length === 0 ? (
              <div className="flex flex-col items-center gap-3 rounded-card border border-border bg-white p-12 text-center">
                <Heart size={36} className="text-border" aria-hidden />
                <p className="font-raleway text-base font-bold text-navy">
                  Your wishlist is empty
                </p>
                <p className="font-sans text-sm text-muted">
                  Tap the heart on any product to save it for later.
                </p>
                <Link
                  href="/"
                  className="rounded-btn bg-navy px-6 py-3 font-raleway text-xs font-bold uppercase tracking-btn text-white hover:bg-amber hover:text-navy"
                >
                  Discover Products
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:gap-4 lg:grid-cols-4 xl:grid-cols-5">
                {items.map((entry) => {
                  const p = entry.product;
                  const removing = busyId === p.id;
                  return (
                    <div key={entry.id} className="flex flex-col gap-2">
                      <SafeBoundary name="wishlist:card" fallback={null}>
                        <ProductCardPlaceholder
                          id={p.id}
                          slug={p.slug}
                          name={p.name}
                          price={p.price}
                          comparePrice={p.comparePrice ?? undefined}
                          discountPercent={p.discountPercent ?? undefined}
                          origin={p.origin ?? undefined}
                          imageSrc={p.images?.[0]}
                          outOfStock={!p.inStock}
                        />
                      </SafeBoundary>
                      <button
                        type="button"
                        onClick={() => handleRemove(p.id)}
                        disabled={removing}
                        className="flex items-center justify-center gap-1.5 rounded-btn border border-border bg-white px-3 py-1.5 font-raleway text-[10px] font-bold uppercase tracking-btn text-charcoal hover:border-danger hover:text-danger disabled:opacity-50"
                      >
                        {removing ? 'Removing…' : 'Remove'}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
