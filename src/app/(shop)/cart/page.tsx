'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ChevronRight, Home as HomeIcon, Trash2 } from 'lucide-react';
import { ChatBubble } from '@/components/layout/ChatBubble';
import { Footer } from '@/components/layout/Footer';
import { Header } from '@/components/layout/Header';
import { CartCouponForm } from '@/components/cart/CartCouponForm';
import { CartLineItem } from '@/components/cart/CartLineItem';
import { CheckoutProgress, type CheckoutStep } from '@/components/cart/CheckoutProgress';
import { EmptyCart } from '@/components/cart/EmptyCart';
import { OrderSummary } from '@/components/cart/OrderSummary';
import { RelatedProducts } from '@/components/product/RelatedProducts';
import { TrustBarSection } from '@/components/sections/TrustBarSection';
import { fetchCart, type CartView } from '@/lib/api/cart';
import { getRelatedProducts } from '@/lib/products';
import { useAuthStore } from '@/stores/authStore';
import {
  selectCartTotalAmount,
  selectCartTotalQuantity,
  useCartStore,
} from '@/stores/cartStore';

const steps: CheckoutStep[] = [
  { num: 1, label: 'Cart', status: 'active' },
  { num: 2, label: 'Shipping', status: 'pending' },
  { num: 3, label: 'Payment', status: 'pending' },
];

export default function CartPage() {
  const [hydrated, setHydrated] = useState(false);
  const items = useCartStore((s) => s.items);
  const clear = useCartStore((s) => s.clear);
  const totalQuantity = useCartStore(selectCartTotalQuantity);
  const totalAmount = useCartStore(selectCartTotalAmount);
  const isAuthed = useAuthStore((s) => Boolean(s.user && s.accessToken));
  const [serverCart, setServerCart] = useState<CartView | null>(null);

  useEffect(() => {
    setHydrated(true);
  }, []);

  // Pull the server cart so we know the applied coupon (if any) and can
  // surface the discount line. Refreshes when items change so adding /
  // removing items mid-session re-validates the coupon against the new
  // subtotal.
  useEffect(() => {
    if (!isAuthed) {
      setServerCart(null);
      return;
    }
    void fetchCart().then(setServerCart).catch(() => {});
  }, [isAuthed, items]);

  const itemCount = hydrated ? totalQuantity : 0;
  const subtotal = hydrated ? totalAmount : 0;
  const cartItems = hydrated ? items : [];
  const isEmpty = cartItems.length === 0;
  const related = getRelatedProducts('');

  return (
    <>
      <Header />
      <main className="bg-page pb-12">
        <nav aria-label="Breadcrumb" className="border-b border-border bg-page">
          <ol className="mx-auto flex max-w-site items-center gap-1.5 px-4 py-3 font-sans text-xs text-muted md:text-sm">
            <li>
              <Link
                href="/"
                className="flex items-center gap-1 transition-colors hover:text-navy"
              >
                <HomeIcon size={14} aria-hidden /> Home
              </Link>
            </li>
            <li aria-hidden>
              <ChevronRight size={12} className="text-border" />
            </li>
            <li>
              <span className="font-medium text-charcoal">Shopping Cart</span>
            </li>
          </ol>
        </nav>

        <div className="bg-white">
          <div className="mx-auto max-w-site px-4 py-8 md:py-10">
            <div className="mb-6 flex flex-col items-center gap-2 text-center md:mb-8 md:gap-3">
              <h1 className="font-raleway text-3xl font-bold text-navy md:text-4xl">
                Shopping Cart
              </h1>
              <p className="font-sans text-sm text-muted md:text-base">
                {isEmpty
                  ? 'Your cart is currently empty.'
                  : `You have ${itemCount} item${itemCount === 1 ? '' : 's'} ready for checkout.`}
              </p>
            </div>

            <div className="mb-8 md:mb-10">
              <CheckoutProgress steps={steps} />
            </div>

            {isEmpty ? (
              <EmptyCart />
            ) : (
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:gap-8">
                <div className="lg:col-span-8">
                  <div className="overflow-hidden rounded-card border border-border bg-white">
                    <div className="flex items-center justify-between gap-3 border-b border-border bg-amber px-4 py-3 md:px-5">
                      <h2 className="font-raleway text-sm font-bold uppercase tracking-btn text-navy md:text-base">
                        My Cart ({itemCount})
                      </h2>
                      <button
                        type="button"
                        onClick={clear}
                        className="flex items-center gap-1.5 font-raleway text-xs font-bold uppercase tracking-btn text-navy transition-colors hover:text-danger md:text-sm"
                      >
                        <Trash2 size={14} aria-hidden />
                        Clear Cart
                      </button>
                    </div>

                    <div className="hidden grid-cols-12 items-center gap-4 border-b border-border bg-page px-5 py-3 md:grid">
                      <span className="col-span-1" />
                      <span className="col-span-5 font-raleway text-xs font-bold uppercase tracking-btn text-muted">
                        Product
                      </span>
                      <span className="col-span-2 text-center font-raleway text-xs font-bold uppercase tracking-btn text-muted">
                        Price
                      </span>
                      <span className="col-span-2 text-center font-raleway text-xs font-bold uppercase tracking-btn text-muted">
                        Quantity
                      </span>
                      <span className="col-span-2 text-right font-raleway text-xs font-bold uppercase tracking-btn text-muted">
                        Subtotal
                      </span>
                    </div>

                    <div className="px-4 md:px-5">
                      {cartItems.map((item) => (
                        <CartLineItem key={item.productId} item={item} />
                      ))}
                    </div>
                  </div>

                  <div className="mt-6 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div className="md:max-w-md md:flex-1">
                      <CartCouponForm
                        couponCode={serverCart?.couponCode ?? null}
                        couponDiscount={serverCart?.couponDiscount ?? 0}
                        onChange={setServerCart}
                        disabled={!isAuthed}
                      />
                    </div>
                    <Link
                      href="/"
                      className="self-start rounded-btn border-2 border-navy bg-white px-5 py-2.5 font-raleway text-xs font-bold uppercase tracking-btn text-navy transition-colors hover:bg-navy hover:text-white md:text-sm"
                    >
                      ← Continue Shopping
                    </Link>
                  </div>
                </div>

                <div className="lg:col-span-4">
                  <OrderSummary
                    itemCount={itemCount}
                    subtotal={subtotal}
                    couponCode={serverCart?.couponCode ?? null}
                    couponDiscount={serverCart?.couponDiscount ?? 0}
                    couponFreeShipping={serverCart?.couponFreeShipping ?? false}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {!isEmpty ? <RelatedProducts products={related.slice(0, 6)} /> : null}

        <TrustBarSection />
      </main>
      <Footer />
      <ChatBubble />
    </>
  );
}
