'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ChevronRight, Home as HomeIcon } from 'lucide-react';
import { AddressForm } from '@/components/checkout/AddressForm';
import { CheckoutOrderSummary } from '@/components/checkout/CheckoutOrderSummary';
import { LiveShippingQuoteSelector } from '@/components/checkout/LiveShippingQuoteSelector';
import { NotificationPrefs } from '@/components/checkout/NotificationPrefs';
import { CheckoutProgress, type CheckoutStep } from '@/components/cart/CheckoutProgress';
import { useCheckoutStore, type ShippingAddress } from '@/stores/checkoutStore';
import {
  selectCartTotalAmount,
  selectCartTotalQuantity,
  useCartStore,
} from '@/stores/cartStore';
import { SafeBoundary } from '@/components/common/SafeBoundary';
import type { ShippingQuote } from '@/lib/api/shipping';

const steps: CheckoutStep[] = [
  { num: 1, label: 'Cart', status: 'done' },
  { num: 2, label: 'Shipping', status: 'active' },
  { num: 3, label: 'Payment', status: 'pending' },
];

export default function ShippingPage() {
  const router = useRouter();
  const items = useCartStore((s) => s.items);
  const totalQuantity = useCartStore(selectCartTotalQuantity);
  const totalAmount = useCartStore(selectCartTotalAmount);

  const storeShipping = useCheckoutStore((s) => s.shipping);
  const selectedQuote = useCheckoutStore((s) => s.selectedQuote);
  const notify = useCheckoutStore((s) => s.notify);
  const setShipping = useCheckoutStore((s) => s.setShipping);
  const setSelectedQuote = useCheckoutStore((s) => s.setSelectedQuote);
  const setShippingRateId = useCheckoutStore((s) => s.setShippingRateId);
  const setNotify = useCheckoutStore((s) => s.setNotify);

  const [draft, setDraft] = useState<ShippingAddress | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft) return;
    if (!selectedQuote) return;
    setShipping(draft);
    router.push('/checkout/payment');
  };

  const handleQuoteChange = (q: ShippingQuote | null) => {
    setSelectedQuote(q ?? undefined);
    setShippingRateId(q?.rateId ?? undefined);
  };

  // Destination passed to the quote selector — comes from the form
  // draft if the user is editing, otherwise the saved store value.
  const destForQuotes = (() => {
    const src = draft ?? storeShipping ?? null;
    if (!src?.country) return null;
    return {
      country: src.country.toUpperCase(),
      city: src.city || undefined,
      state: src.region || undefined,
      postcode: src.postalCode || undefined,
      addressLine: [src.street, src.apartment].filter(Boolean).join(', ') || undefined,
    };
  })();
  const cartItemsForQuote = items.map((i) => ({ productId: i.productId, qty: i.quantity }));

  const isEmpty = hydrated && items.length === 0;

  return (
    <>
      <main className="bg-page pb-12">
        <nav aria-label="Breadcrumb" className="border-b border-border bg-page">
          <ol className="mx-auto flex max-w-site items-center gap-1.5 px-4 py-3 font-sans text-xs text-muted md:text-sm">
            <li>
              <Link href="/" className="flex items-center gap-1 hover:text-navy">
                <HomeIcon size={14} aria-hidden /> Home
              </Link>
            </li>
            <li aria-hidden>
              <ChevronRight size={12} className="text-border" />
            </li>
            <li>
              <Link href="/cart" className="hover:text-navy">
                Cart
              </Link>
            </li>
            <li aria-hidden>
              <ChevronRight size={12} className="text-border" />
            </li>
            <li>
              <span className="font-medium text-charcoal">Shipping</span>
            </li>
          </ol>
        </nav>

        <div className="bg-white">
          <div className="mx-auto max-w-site px-4 py-8 md:py-10">
            <div className="mb-6 flex flex-col items-center gap-2 text-center md:mb-8">
              <h1 className="font-raleway text-3xl font-bold text-navy md:text-4xl">
                Shipping Details
              </h1>
              <p className="font-sans text-sm text-muted md:text-base">
                Where should we deliver your order?
              </p>
            </div>

            <div className="mb-8 md:mb-10">
              <SafeBoundary name="checkout:progress" fallback={null}>
                <CheckoutProgress steps={steps} />
              </SafeBoundary>
            </div>

            {isEmpty ? (
              <div className="rounded-card border border-border bg-white p-10 text-center">
                <p className="mb-4 font-sans text-base text-muted">
                  Your cart is empty. Add some products before checking out.
                </p>
                <Link
                  href="/"
                  className="inline-block rounded-btn bg-navy px-6 py-3 font-raleway text-xs font-bold uppercase tracking-btn text-white hover:bg-amber hover:text-navy"
                >
                  Continue Shopping
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:gap-8">
                <div className="flex flex-col gap-6 lg:col-span-8 lg:gap-8">
                  <Section title="Delivery Address" caption="Where should this go?">
                    <SafeBoundary name="checkout:address-form">
                      <AddressForm initial={storeShipping ?? undefined} onChange={setDraft} />
                    </SafeBoundary>
                  </Section>

                  <Section
                    title="Delivery Method"
                    caption="Live rates based on your address and cart weight."
                  >
                    <SafeBoundary
                      name="checkout:delivery-method"
                      fallback={
                        <p className="font-sans text-sm text-muted">
                          Delivery options couldn&apos;t load. Refresh to try again.
                        </p>
                      }
                    >
                      <LiveShippingQuoteSelector
                        destination={destForQuotes}
                        items={cartItemsForQuote}
                        selectedRateId={selectedQuote?.rateId ?? null}
                        selectedProvider={selectedQuote?.provider ?? null}
                        onChange={handleQuoteChange}
                      />
                    </SafeBoundary>
                  </Section>

                  <Section
                    title="Notifications"
                    caption="Order updates from dispatch to delivery."
                  >
                    <SafeBoundary name="checkout:notification-prefs" fallback={null}>
                      <NotificationPrefs value={notify} onChange={setNotify} />
                    </SafeBoundary>
                  </Section>

                  <div className="flex flex-col-reverse items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <Link
                      href="/cart"
                      className="rounded-btn border-2 border-navy bg-white px-5 py-3 text-center font-raleway text-xs font-bold uppercase tracking-btn text-navy transition-colors hover:bg-navy hover:text-white sm:text-sm"
                    >
                      ← Back to Cart
                    </Link>
                    <button
                      type="submit"
                      disabled={!draft || !selectedQuote}
                      className="rounded-btn bg-navy px-6 py-3 text-center font-raleway text-xs font-bold uppercase tracking-btn text-white shadow-card transition-colors hover:bg-amber hover:text-navy disabled:cursor-not-allowed disabled:opacity-50 sm:text-sm"
                      title={
                        !draft
                          ? 'Fill in the address first'
                          : !selectedQuote
                            ? 'Pick a delivery method'
                            : ''
                      }
                    >
                      Continue to Payment →
                    </button>
                  </div>
                </div>

                <div className="lg:col-span-4">
                  <SafeBoundary
                    name="checkout:order-summary"
                    fallback={
                      <div className="rounded-card border border-amber bg-amber/10 p-4 font-sans text-sm text-charcoal">
                        Order summary couldn&apos;t render. Refresh the page.
                      </div>
                    }
                  >
                    <CheckoutOrderSummary
                      items={hydrated ? items : []}
                      subtotal={hydrated ? totalAmount : 0}
                      itemCount={hydrated ? totalQuantity : 0}
                    />
                  </SafeBoundary>
                </div>
              </form>
            )}
          </div>
        </div>
      </main>
    </>
  );
}

function Section({
  title,
  caption,
  children,
}: {
  title: string;
  caption?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-card border border-border bg-white p-5 shadow-card md:p-6">
      <header className="mb-4 md:mb-5">
        <h2 className="font-raleway text-lg font-bold text-navy md:text-xl">
          {title}
        </h2>
        {caption ? (
          <p className="mt-1 font-sans text-sm text-muted">{caption}</p>
        ) : null}
      </header>
      {children}
    </section>
  );
}
