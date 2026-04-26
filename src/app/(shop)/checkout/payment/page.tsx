'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  BadgeCheck,
  ChevronRight,
  Home as HomeIcon,
  Lock,
  ShieldCheck,
} from 'lucide-react';
import { ChatBubble } from '@/components/layout/ChatBubble';
import { Footer } from '@/components/layout/Footer';
import { Header } from '@/components/layout/Header';
import { CheckoutOrderSummary } from '@/components/checkout/CheckoutOrderSummary';
import { PaymentMethodForm } from '@/components/checkout/PaymentMethodForm';
import { PaymentMethodSelector } from '@/components/checkout/PaymentMethodSelector';
import { CheckoutProgress, type CheckoutStep } from '@/components/cart/CheckoutProgress';
import { formatPriceNGN } from '@/lib/format';
import { DELIVERY_METHODS, type PaymentMethodId } from '@/lib/checkout-data';
import { useCheckoutStore } from '@/stores/checkoutStore';
import {
  selectCartTotalAmount,
  selectCartTotalQuantity,
  useCartStore,
} from '@/stores/cartStore';

const steps: CheckoutStep[] = [
  { num: 1, label: 'Cart', status: 'done' },
  { num: 2, label: 'Shipping', status: 'done' },
  { num: 3, label: 'Payment', status: 'active' },
];

export default function PaymentPage() {
  const router = useRouter();
  const items = useCartStore((s) => s.items);
  const totalQuantity = useCartStore(selectCartTotalQuantity);
  const totalAmount = useCartStore(selectCartTotalAmount);
  const clearCart = useCartStore((s) => s.clear);

  const shipping = useCheckoutStore((s) => s.shipping);
  const deliveryMethod = useCheckoutStore((s) => s.deliveryMethod);
  const storedPayment = useCheckoutStore((s) => s.paymentMethod);
  const setPaymentMethod = useCheckoutStore((s) => s.setPaymentMethod);
  const setOrderId = useCheckoutStore((s) => s.setOrderId);

  const [selected, setSelected] = useState<PaymentMethodId | undefined>(storedPayment);
  const [billingSame, setBillingSame] = useState(true);
  const [agreed, setAgreed] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated && !shipping) {
      router.replace('/checkout/shipping');
    }
  }, [hydrated, shipping, router]);

  const method = DELIVERY_METHODS.find((m) => m.id === deliveryMethod);
  const shippingFee = method?.price ?? 0;
  const total = (hydrated ? totalAmount : 0) + shippingFee;

  const handleSelectMethod = (id: PaymentMethodId) => {
    setSelected(id);
    setPaymentMethod(id);
  };

  const handlePay = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected || !agreed) return;
    const orderId = `AZM-${Date.now().toString().slice(-8)}`;
    setOrderId(orderId);
    clearCart();
    router.push('/checkout/success');
  };

  return (
    <>
      <Header />
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
              <Link href="/checkout/shipping" className="hover:text-navy">
                Shipping
              </Link>
            </li>
            <li aria-hidden>
              <ChevronRight size={12} className="text-border" />
            </li>
            <li>
              <span className="font-medium text-charcoal">Payment</span>
            </li>
          </ol>
        </nav>

        <div className="bg-white">
          <div className="mx-auto max-w-site px-4 py-8 md:py-10">
            <div className="mb-6 flex flex-col items-center gap-2 text-center md:mb-8">
              <h1 className="font-raleway text-3xl font-bold text-navy md:text-4xl">
                Payment
              </h1>
              <p className="font-sans text-sm text-muted md:text-base">
                Choose a payment method that works for you anywhere in Africa.
              </p>
            </div>

            <div className="mb-8 md:mb-10">
              <CheckoutProgress steps={steps} />
            </div>

            <form onSubmit={handlePay} className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:gap-8">
              <div className="flex flex-col gap-6 lg:col-span-8 lg:gap-8">
                <Section title="Payment Method" caption="Pick how you want to pay.">
                  <PaymentMethodSelector value={selected} onChange={handleSelectMethod} />
                </Section>

                {selected ? (
                  <Section
                    title="Payment Details"
                    caption="Enter the details for your selected method."
                  >
                    <PaymentMethodForm method={selected} total={total} />
                  </Section>
                ) : null}

                <Section title="Billing Address">
                  <label className="flex cursor-pointer items-start gap-3">
                    <input
                      type="checkbox"
                      checked={billingSame}
                      onChange={(e) => setBillingSame(e.target.checked)}
                      className="mt-1 h-4 w-4 cursor-pointer accent-navy"
                    />
                    <div className="flex flex-col">
                      <span className="font-raleway text-sm font-semibold text-navy">
                        Same as shipping address
                      </span>
                      {shipping ? (
                        <span className="font-sans text-xs leading-snug text-muted">
                          {shipping.firstName} {shipping.lastName} ·{' '}
                          {shipping.street}, {shipping.city}
                        </span>
                      ) : null}
                    </div>
                  </label>
                  {!billingSame ? (
                    <p className="mt-3 rounded-card border border-border bg-page p-4 font-sans text-xs text-muted">
                      A separate billing address form will appear here.
                    </p>
                  ) : null}
                </Section>

                <div className="grid grid-cols-1 gap-3 rounded-card border border-border bg-page p-4 sm:grid-cols-3">
                  <Trust
                    Icon={Lock}
                    title="PCI Compliant"
                    caption="Card data tokenised"
                  />
                  <Trust
                    Icon={ShieldCheck}
                    title="SSL Encrypted"
                    caption="256-bit secure"
                  />
                  <Trust
                    Icon={BadgeCheck}
                    title="African Partners"
                    caption="Local rails on every method"
                  />
                </div>

                <label className="flex cursor-pointer items-start gap-3 rounded-card border border-border bg-white p-4">
                  <input
                    required
                    type="checkbox"
                    checked={agreed}
                    onChange={(e) => setAgreed(e.target.checked)}
                    className="mt-1 h-4 w-4 cursor-pointer accent-navy"
                  />
                  <span className="font-sans text-sm leading-relaxed text-charcoal">
                    I agree to AfriZoneMart&apos;s{' '}
                    <Link
                      href="/legal/terms"
                      className="font-semibold text-navy underline"
                    >
                      Terms of Service
                    </Link>{' '}
                    and{' '}
                    <Link
                      href="/legal/privacy"
                      className="font-semibold text-navy underline"
                    >
                      Privacy Policy
                    </Link>
                    .
                  </span>
                </label>

                <div className="flex flex-col-reverse items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <Link
                    href="/checkout/shipping"
                    className="rounded-btn border-2 border-navy bg-white px-5 py-3 text-center font-raleway text-xs font-bold uppercase tracking-btn text-navy transition-colors hover:bg-navy hover:text-white sm:text-sm"
                  >
                    ← Back to Shipping
                  </Link>
                  <button
                    type="submit"
                    disabled={!selected || !agreed}
                    className="rounded-btn bg-navy px-6 py-4 text-center font-raleway text-sm font-bold uppercase tracking-btn text-white shadow-card transition-colors hover:bg-amber hover:text-navy disabled:cursor-not-allowed disabled:opacity-50 md:text-base"
                  >
                    Pay {formatPriceNGN(total)}
                  </button>
                </div>
              </div>

              <div className="lg:col-span-4">
                <CheckoutOrderSummary
                  items={hydrated ? items : []}
                  subtotal={hydrated ? totalAmount : 0}
                  itemCount={hydrated ? totalQuantity : 0}
                  showShippingRecap
                />
              </div>
            </form>
          </div>
        </div>
      </main>
      <Footer />
      <ChatBubble />
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

function Trust({
  Icon,
  title,
  caption,
}: {
  Icon: typeof Lock;
  title: string;
  caption: string;
}) {
  return (
    <div className="flex flex-col items-center gap-1.5 text-center">
      <Icon size={22} strokeWidth={1.75} className="text-navy" aria-hidden />
      <p className="font-raleway text-xs font-bold text-navy">{title}</p>
      <p className="font-sans text-[10px] leading-tight text-muted">{caption}</p>
    </div>
  );
}
