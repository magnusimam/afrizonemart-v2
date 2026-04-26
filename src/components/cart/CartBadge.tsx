'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ShoppingCart } from 'lucide-react';
import {
  selectCartTotalAmount,
  selectCartTotalQuantity,
  useCartStore,
} from '@/stores/cartStore';
import { formatNaira } from '@/lib/format';
import { ROUTES } from '@/lib/constants';

export function CartBadge() {
  const [hydrated, setHydrated] = useState(false);
  const totalQuantity = useCartStore(selectCartTotalQuantity);
  const totalAmount = useCartStore(selectCartTotalAmount);

  useEffect(() => {
    setHydrated(true);
  }, []);

  const count = hydrated ? totalQuantity : 0;
  const amount = hydrated ? totalAmount : 0;

  return (
    <Link
      href={ROUTES.cart}
      aria-label={`Cart — ${count} item${count === 1 ? '' : 's'}, ${formatNaira(amount)}`}
      className="group relative flex shrink-0 items-center gap-2 rounded-btn border-2 border-amber bg-white px-3 py-1.5 transition-colors duration-200 hover:border-navy hover:bg-navy hover:shadow-card"
    >
      <span className="relative flex h-7 w-7 items-center justify-center text-navy transition-colors duration-200 group-hover:text-amber">
        <ShoppingCart size={22} strokeWidth={2.25} aria-hidden />
        {count > 0 && (
          <span
            className="absolute -right-1.5 -top-1.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-danger px-1 font-raleway text-[10px] font-bold leading-none text-white"
            aria-hidden
          >
            {count > 99 ? '99+' : count}
          </span>
        )}
      </span>
      <span className="font-raleway text-xs font-bold text-navy transition-colors duration-200 group-hover:text-amber md:text-sm">
        {formatNaira(amount)}
      </span>
    </Link>
  );
}
