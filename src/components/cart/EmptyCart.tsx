import Link from 'next/link';
import { ShoppingBag } from 'lucide-react';

export function EmptyCart() {
  return (
    <div className="flex flex-col items-center justify-center gap-5 rounded-card border border-border bg-white px-6 py-16 text-center shadow-card md:py-20">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-amber/15 text-navy">
        <ShoppingBag size={36} strokeWidth={1.5} aria-hidden />
      </div>
      <div className="flex flex-col gap-2">
        <h2 className="font-raleway text-2xl font-bold text-navy md:text-3xl">
          Your cart is empty
        </h2>
        <p className="max-w-md font-sans text-sm text-muted md:text-base">
          Add African-made products to your cart and we&apos;ll deliver them to
          your door — across the continent and the world.
        </p>
      </div>
      <Link
        href="/"
        className="rounded-btn bg-navy px-6 py-3 font-raleway text-xs font-bold uppercase tracking-btn text-white transition-colors hover:bg-amber hover:text-navy md:text-sm"
      >
        Continue Shopping
      </Link>
    </div>
  );
}
