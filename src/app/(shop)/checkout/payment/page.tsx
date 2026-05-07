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
import { CheckoutOrderSummary } from '@/components/checkout/CheckoutOrderSummary';
import { PaymentMethodForm } from '@/components/checkout/PaymentMethodForm';
import { PaymentMethodSelector } from '@/components/checkout/PaymentMethodSelector';
import { CheckoutProgress, type CheckoutStep } from '@/components/cart/CheckoutProgress';
import { formatPriceNGN } from '@/lib/format';
import { type PaymentMethodId } from '@/lib/checkout-data';
import { fetchCart, type CartView } from '@/lib/api/cart';
import { HttpApiError } from '@/lib/api/client';
import { placeOrder, type PaymentMethodId as ApiPaymentMethod } from '@/lib/api/orders';
import { initPayment } from '@/lib/api/payments';
import { listPublicGateways } from '@/lib/api/admin';
import { useCheckoutStore } from '@/stores/checkoutStore';
import { SafeBoundary } from '@/components/common/SafeBoundary';
import {
  selectCartTotalAmount,
  selectCartTotalQuantity,
  useCartStore,
} from '@/stores/cartStore';

// Card / mobile money / USSD / crypto all funnel through Squad (it
// handles the channel selection on its own hosted page). Bank transfer
// + COD bypass the gateway and stay PENDING_PAYMENT for manual
// confirmation by an admin.
const PAYMENT_METHOD_MAP: Record<PaymentMethodId, ApiPaymentMethod> = {
  card: 'GTSQUAD',
  'mobile-money': 'GTSQUAD',
  'bank-transfer': 'BANK_TRANSFER',
  ussd: 'GTSQUAD',
  crypto: 'GTSQUAD',
  'pay-on-delivery': 'CASH_ON_DELIVERY',
};

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
  const shippingRateId = useCheckoutStore((s) => s.shippingRateId);
  const selectedQuote = useCheckoutStore((s) => s.selectedQuote);
  const storedPayment = useCheckoutStore((s) => s.paymentMethod);
  const setPaymentMethod = useCheckoutStore((s) => s.setPaymentMethod);
  const setOrderId = useCheckoutStore((s) => s.setOrderId);

  const [selected, setSelected] = useState<PaymentMethodId | undefined>(storedPayment);
  const [billingSame, setBillingSame] = useState(true);
  const [agreed, setAgreed] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [serverCart, setServerCart] = useState<CartView | null>(null);
  const [activeGateways, setActiveGateways] = useState<string[]>([]);

  useEffect(() => {
    void (async () => {
      try {
        const r = await listPublicGateways('NGN');
        setActiveGateways(r.items.map((g) => g.label));
      } catch {
        /* fail-soft */
      }
    })();
  }, []);

  useEffect(() => {
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated && !shipping) {
      router.replace('/checkout/shipping');
    }
  }, [hydrated, shipping, router]);

  // Pull live cart so we know the applied coupon discount + free-shipping flag.
  useEffect(() => {
    void fetchCart().then(setServerCart).catch(() => {});
  }, []);

  // The selected quote already carries the resolved price + ETA from
  // the shipping page (it ran the live engine). No extra fetch needed.
  const couponDiscount = serverCart?.couponDiscount ?? 0;
  const couponFreeShipping = serverCart?.couponFreeShipping ?? false;
  const subtotal = hydrated ? totalAmount : 0;
  const baseShipping = selectedQuote?.amountNgn ?? 0;
  const shippingFee = couponFreeShipping ? 0 : baseShipping;
  const total = Math.max(0, subtotal - couponDiscount + shippingFee);

  const handleSelectMethod = (id: PaymentMethodId) => {
    setSelected(id);
    setPaymentMethod(id);
  };

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected || !agreed || !shipping) return;
    setError(null);
    setSubmitting(true);
    try {
      const order = await placeOrder({
        shipping: {
          fullName: `${shipping.firstName} ${shipping.lastName}`.trim(),
          phone: shipping.phone,
          addressLine: [shipping.street, shipping.apartment].filter(Boolean).join(', '),
          city: shipping.city,
          country: shipping.country,
        },
        paymentMethod: PAYMENT_METHOD_MAP[selected],
        shippingRateId,
      });
      setOrderId(order.orderNumber);

      // Online methods (card / mobile money / USSD / crypto) all flow
      // through the gateway. Bank transfer + pay-on-delivery skip the
      // redirect — the order stays PENDING_PAYMENT and an admin
      // confirms manually.
      const needsGateway =
        selected !== 'bank-transfer' && selected !== 'pay-on-delivery';

      if (needsGateway) {
        const init = await initPayment(order.id);
        // Hand off to the gateway-hosted (or stub) checkout page. It
        // POSTs the webhook + redirects back to /checkout/success.
        clearCart();
        window.location.href = init.checkoutUrl;
        return;
      }

      clearCart();
      router.push('/checkout/success');
    } catch (err) {
      setError(
        err instanceof HttpApiError
          ? err.message
          : 'Could not place your order. Please try again.',
      );
    } finally {
      setSubmitting(false);
    }
  };

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
              <SafeBoundary name="checkout:progress" fallback={null}>
                <CheckoutProgress steps={steps} />
              </SafeBoundary>
            </div>

            <form onSubmit={handlePay} className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:gap-8">
              <div className="flex flex-col gap-6 lg:col-span-8 lg:gap-8">
                <Section title="Payment Method" caption="Pick how you want to pay.">
                  <SafeBoundary
                    name="checkout:method-selector"
                    fallback={
                      <p className="rounded-card border border-amber bg-amber/10 p-4 font-sans text-sm text-charcoal">
                        We couldn&apos;t load payment options. Please reload the page.
                      </p>
                    }
                  >
                    <PaymentMethodSelector value={selected} onChange={handleSelectMethod} />
                  </SafeBoundary>
                  {activeGateways.length > 0 && (
                    <p className="mt-3 flex flex-wrap items-center gap-2 font-sans text-[11px] text-muted">
                      <Lock size={10} aria-hidden />
                      Securely processed by{' '}
                      <span className="font-raleway font-semibold text-charcoal">
                        {activeGateways.join(', ')}
                      </span>
                    </p>
                  )}
                </Section>

                {selected ? (
                  <Section
                    title="Payment Details"
                    caption="Enter the details for your selected method."
                  >
                    <SafeBoundary
                      name="checkout:method-form"
                      fallback={
                        <p className="rounded-card border border-amber bg-amber/10 p-4 font-sans text-sm text-charcoal">
                          We couldn&apos;t load this payment form. Try a different payment method.
                        </p>
                      }
                    >
                      <PaymentMethodForm method={selected} total={total} />
                    </SafeBoundary>
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

                {error && (
                  <div
                    role="alert"
                    className="rounded-card border border-danger/30 bg-danger/5 px-4 py-3 font-sans text-sm text-danger"
                  >
                    {error}
                  </div>
                )}

                <div className="flex flex-col-reverse items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <Link
                    href="/checkout/shipping"
                    className="rounded-btn border-2 border-navy bg-white px-5 py-3 text-center font-raleway text-xs font-bold uppercase tracking-btn text-navy transition-colors hover:bg-navy hover:text-white sm:text-sm"
                  >
                    ← Back to Shipping
                  </Link>
                  <button
                    type="submit"
                    disabled={!selected || !agreed || submitting}
                    className="rounded-btn bg-navy px-6 py-4 text-center font-raleway text-sm font-bold uppercase tracking-btn text-white shadow-card transition-colors hover:bg-amber hover:text-navy disabled:cursor-not-allowed disabled:opacity-50 md:text-base"
                  >
                    {submitting ? 'Placing order…' : `Pay ${formatPriceNGN(total)}`}
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
                    showShippingRecap
                  />
                </SafeBoundary>
              </div>
            </form>
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
