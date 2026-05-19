'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { CSSProperties, PointerEvent as ReactPointerEvent } from 'react';
import { ShoppingCart } from 'lucide-react';
import { ROUTES } from '@/lib/constants';
import { useFlag } from '@/lib/useFlag';
import {
  selectCartTotalQuantity,
  useCartStore,
} from '@/stores/cartStore';

/**
 * Mobile-only floating cart bubble.
 *
 * The desktop header already shows a `<CartBadge />`, but it's
 * hidden under `md:` so on mobile (<768px) customers have no
 * visible cart indicator after they add an item — they have to
 * open the menu drawer to find /cart. This bubble fills that gap.
 *
 * Behaviour:
 *  - Renders only on mobile (`md:hidden`) and only when the cart
 *    has at least one item.
 *  - Hides on `/cart` itself so it doesn't sit on top of the page
 *    it links to.
 *  - Draggable to anywhere on screen via pointer events. On
 *    release we snap to the nearest screen edge — easier to grab
 *    on the next page than a marooned mid-screen bubble.
 *  - Position persists in localStorage so the customer's choice
 *    survives reload and route changes.
 *  - Tap → /cart. Drag (movement >= DRAG_THRESHOLD_PX) suppresses
 *    the click so the navigation only fires on a deliberate tap.
 *  - Kill-switch: `useFlag('floating_mobile_cart')`. The mobile
 *    drawer's existing /cart link is the natural fallback.
 */

const STORAGE_KEY = 'azm-floating-cart-pos';
const DRAG_THRESHOLD_PX = 5;
/// Bubble diameter (matches the `h-14 w-14` Tailwind classes below).
const SIZE = 56;
/// Minimum distance from any edge when snapped along it. Keeps the
/// bubble out of the iOS bottom safe-area / notch region.
const EDGE_INSET = 16;

type Edge = 'left' | 'right' | 'top' | 'bottom';
interface Position {
  /// Which screen edge the bubble is parked against.
  edge: Edge;
  /// Distance along that edge in px. For `left`/`right` this is the
  /// distance from the top of the viewport; for `top`/`bottom` it's
  /// the distance from the left.
  offset: number;
}

function loadPosition(): Position | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<Position>;
    if (
      parsed.edge === 'left' ||
      parsed.edge === 'right' ||
      parsed.edge === 'top' ||
      parsed.edge === 'bottom'
    ) {
      const offset = Number(parsed.offset);
      if (Number.isFinite(offset)) return { edge: parsed.edge, offset };
    }
  } catch {
    /* corrupted JSON — fall through to default */
  }
  return null;
}

function savePosition(p: Position) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(p));
  } catch {
    /* private mode / quota */
  }
}

function defaultPosition(): Position {
  // Default: right edge, around 65% down — a comfortable thumb
  // target for right-handed users. Sits above the ChatBubble
  // (which is fixed at bottom-5 right-5) so both are visible.
  if (typeof window === 'undefined') return { edge: 'right', offset: 480 };
  return {
    edge: 'right',
    offset: Math.max(
      EDGE_INSET,
      Math.round(window.innerHeight * 0.65) - SIZE / 2,
    ),
  };
}

function clamp(n: number, min: number, max: number): number {
  return Math.min(Math.max(n, min), max);
}

function snapToEdge(x: number, y: number): Position {
  const w = window.innerWidth;
  const h = window.innerHeight;
  const distances: Record<Edge, number> = {
    left: x,
    right: w - x - SIZE,
    top: y,
    bottom: h - y - SIZE,
  };
  const edges = Object.keys(distances) as Edge[];
  const closest = edges.reduce<Edge>(
    (best, e) => (distances[e] < distances[best] ? e : best),
    edges[0],
  );
  const along =
    closest === 'left' || closest === 'right'
      ? clamp(y, EDGE_INSET, h - SIZE - EDGE_INSET)
      : clamp(x, EDGE_INSET, w - SIZE - EDGE_INSET);
  return { edge: closest, offset: along };
}

function styleFor(p: Position): CSSProperties {
  switch (p.edge) {
    case 'left':
      return { left: EDGE_INSET, top: p.offset };
    case 'right':
      return { right: EDGE_INSET, top: p.offset };
    case 'top':
      return { top: EDGE_INSET, left: p.offset };
    case 'bottom':
      return { bottom: EDGE_INSET, left: p.offset };
  }
}

export function FloatingMobileCart() {
  const enabled = useFlag('floating_mobile_cart', true);
  const pathname = usePathname();
  const totalQuantity = useCartStore(selectCartTotalQuantity);

  const [hydrated, setHydrated] = useState(false);
  const [position, setPosition] = useState<Position>(() => defaultPosition());
  /// While dragging, override the snapped position with raw pointer
  /// coords so the bubble follows the finger / cursor 1:1.
  const [dragXY, setDragXY] = useState<{ x: number; y: number } | null>(null);

  /// Drag bookkeeping. Refs (not state) so updating them during a
  /// pointermove doesn't trigger re-renders.
  const dragRef = useRef<{
    startX: number;
    startY: number;
    moved: boolean;
    pointerId: number;
  } | null>(null);
  /// Set on drag-end; consumed by the next click event so a drag
  /// release on top of the bubble doesn't navigate to /cart.
  const suppressClickRef = useRef(false);

  useEffect(() => {
    setHydrated(true);
    const stored = loadPosition();
    if (stored) setPosition(stored);
  }, []);

  // Re-clamp after viewport resize / rotation so the bubble doesn't
  // end up off-screen if the offset was saved at a larger size.
  useEffect(() => {
    if (!hydrated) return;
    const onResize = () => {
      setPosition((prev) => {
        const w = window.innerWidth;
        const h = window.innerHeight;
        if (prev.edge === 'left' || prev.edge === 'right') {
          return {
            ...prev,
            offset: clamp(prev.offset, EDGE_INSET, h - SIZE - EDGE_INSET),
          };
        }
        return {
          ...prev,
          offset: clamp(prev.offset, EDGE_INSET, w - SIZE - EDGE_INSET),
        };
      });
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [hydrated]);

  const handlePointerDown = useCallback(
    (e: ReactPointerEvent<HTMLAnchorElement>) => {
      // Only react to the primary pointer. Multi-touch (e.g. user
      // tries to pinch the bubble) is ignored.
      if (dragRef.current) return;
      dragRef.current = {
        startX: e.clientX,
        startY: e.clientY,
        moved: false,
        pointerId: e.pointerId,
      };
      e.currentTarget.setPointerCapture(e.pointerId);
    },
    [],
  );

  const handlePointerMove = useCallback(
    (e: ReactPointerEvent<HTMLAnchorElement>) => {
      const drag = dragRef.current;
      if (!drag || drag.pointerId !== e.pointerId) return;
      const dx = e.clientX - drag.startX;
      const dy = e.clientY - drag.startY;
      if (!drag.moved && Math.hypot(dx, dy) >= DRAG_THRESHOLD_PX) {
        drag.moved = true;
      }
      if (drag.moved) {
        // Pointer becomes the centre of the bubble.
        setDragXY({ x: e.clientX - SIZE / 2, y: e.clientY - SIZE / 2 });
      }
    },
    [],
  );

  const handlePointerUp = useCallback(
    (e: ReactPointerEvent<HTMLAnchorElement>) => {
      const drag = dragRef.current;
      if (!drag || drag.pointerId !== e.pointerId) return;
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {
        /* already released */
      }
      if (drag.moved) {
        const next = snapToEdge(
          e.clientX - SIZE / 2,
          e.clientY - SIZE / 2,
        );
        setPosition(next);
        savePosition(next);
        setDragXY(null);
        // Suppress the click that pointerup would otherwise fire.
        // The flag is consumed (and cleared) by handleClick below.
        suppressClickRef.current = true;
      }
      dragRef.current = null;
    },
    [],
  );

  const handleClick = useCallback((e: React.MouseEvent) => {
    if (suppressClickRef.current) {
      e.preventDefault();
      e.stopPropagation();
      suppressClickRef.current = false;
    }
  }, []);

  // Render gates — order matters. Hooks above MUST run on every
  // render (React's rules-of-hooks); the early returns below are
  // safe because every hook above is unconditional.
  if (!enabled) return null;
  if (!hydrated) return null;
  if (totalQuantity <= 0) return null;
  if (pathname === ROUTES.cart) return null;
  /// PDP renders its own sticky bottom CTA bar on mobile — having
  /// the floating bubble overlap that bar makes the page feel
  /// crowded. The sticky bar already provides the primary action
  /// (Add to Cart / Buy Now); the cart icon in the mobile header
  /// drawer is the secondary path to /cart.
  if (pathname?.startsWith('/product/')) return null;
  /// Checkout flow keeps the customer focused on completing the
  /// purchase; floating bubble pointing back to /cart would be a
  /// regression. The checkout layout already has its own sticky
  /// summary on mobile.
  if (pathname?.startsWith('/checkout/')) return null;

  const style: CSSProperties = dragXY
    ? { left: dragXY.x, top: dragXY.y, right: 'auto', bottom: 'auto' }
    : styleFor(position);

  return (
    <Link
      href={ROUTES.cart}
      aria-label={`Cart — ${totalQuantity} item${totalQuantity === 1 ? '' : 's'}`}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onClick={handleClick}
      style={{
        ...style,
        // touch-action: none stops iOS Safari from scrolling the
        // page while dragging. Without this, every drag also
        // scrolls behind the bubble.
        touchAction: 'none',
        WebkitUserSelect: 'none',
        userSelect: 'none',
      }}
      className={`md:hidden fixed z-50 flex h-14 w-14 items-center justify-center rounded-full border-2 border-amber bg-navy text-white shadow-card-hover transition-transform duration-150 ${
        dragXY ? 'cursor-grabbing scale-105' : 'cursor-grab active:scale-95'
      }`}
    >
      <ShoppingCart size={24} strokeWidth={2.25} aria-hidden />
      <span
        aria-hidden
        className="absolute -right-1 -top-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-amber px-1 font-raleway text-[11px] font-bold leading-none text-navy shadow-card"
      >
        {totalQuantity > 99 ? '99+' : totalQuantity}
      </span>
    </Link>
  );
}
