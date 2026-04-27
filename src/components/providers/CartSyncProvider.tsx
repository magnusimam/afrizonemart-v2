'use client';

import { useEffect, useRef } from 'react';
import { fetchCart, replaceCart, type CartLine } from '@/lib/api/cart';
import { useAuthStore } from '@/stores/authStore';
import { useCartStore } from '@/stores/cartStore';
import type { CartItem } from '@/types';

const SYNC_DEBOUNCE_MS = 400;

function toLocalCartItem(line: CartLine): CartItem {
  return {
    productId: line.productId,
    slug: line.slug,
    name: line.name,
    price: line.price,
    comparePrice: line.comparePrice ?? undefined,
    image: line.image ?? '',
    origin: line.origin ?? undefined,
    quantity: line.quantity,
  };
}

/**
 * Bridges the local cartStore with the server cart for authenticated
 * users:
 *   - On sign-in (or first mount with an existing session): pull the
 *     server cart and replace local items.
 *   - On every local cart mutation while authed: PUT the items back to
 *     the server, debounced so rapid clicks don't spam the API.
 *   - On sign-out: leave the local cart as-is (acts as a guest cart).
 */
export function CartSyncProvider({ children }: { children: React.ReactNode }) {
  const userId = useAuthStore((s) => s.user?.id ?? null);
  const items = useCartStore((s) => s.items);
  const setItems = useCartStore((s) => s.setItems);

  // Track which user we last hydrated for, so swapping accounts triggers
  // a fresh pull instead of leaking the previous session's cart.
  const hydratedFor = useRef<string | null>(null);
  const skipNextSync = useRef(false);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Pull server cart on sign-in.
  useEffect(() => {
    if (!userId) {
      hydratedFor.current = null;
      return;
    }
    if (hydratedFor.current === userId) return;
    hydratedFor.current = userId;
    let cancelled = false;
    void (async () => {
      try {
        const server = await fetchCart();
        if (cancelled) return;
        if (server.items.length > 0) {
          // Server has a saved cart — prefer it over whatever was sitting
          // in localStorage from a guest session.
          skipNextSync.current = true;
          setItems(server.items.map(toLocalCartItem));
        } else if (items.length > 0) {
          // Server is empty but the guest session has items — push them
          // up so the new session keeps them.
          await replaceCart(items.map((i) => ({ productId: i.productId, quantity: i.quantity })));
        }
      } catch {
        // Network or auth blip — try again next mount.
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  // Push local mutations to the server (debounced) while authed.
  useEffect(() => {
    if (!userId) return;
    if (skipNextSync.current) {
      skipNextSync.current = false;
      return;
    }
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      void replaceCart(
        items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
      ).catch(() => {
        // Server-side validation could fail (e.g. stale productId after a
        // catalog edit). Surface in tracker followup; for now swallow.
      });
    }, SYNC_DEBOUNCE_MS);

    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [items, userId]);

  return <>{children}</>;
}
