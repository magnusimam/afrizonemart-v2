'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
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
import { PlaceOrderButton } from '@/components/checkout/PlaceOrderButton';
import { StaticPlaceOrderButton } from '@/components/checkout/StaticPlaceOrderButton';
import { CheckoutProgress, type CheckoutStep } from '@/components/cart/CheckoutProgress';
import { useFlag } from '@/lib/useFlag';
import { formatPriceNGN } from '@/lib/format';
import { type PaymentMethodId } from '@/lib/checkout-data';
import { fetchCart, type CartView } from '@/lib/api/cart';
import { HttpApiError } from '@/lib/api/client';
import { placeOrder, type PaymentMethodId as ApiPaymentMethod } from '@/lib/api/orders';
import { initPayment } from '@/lib/api/payments';
import { listPublicGateways } from '@/lib/api/admin';
import {
  fetchPublicPaymentMethods,
  type PaymentBankAccount,
  type PaymentMethodConfig,
} from '@/lib/api/payment-methods';
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
  const coinRedeemRequest = useCartStore((s) => s.coinRedeemRequest);
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
  /// Tracker #46 — methods + bank accounts come from the API now.
  /// Null while loading; empty after a failure or before any are
  /// configured. PaymentMethodSelector renders a friendly placeholder
  /// in both cases.
  const [methods, setMethods] = useState<PaymentMethodConfig[]>([]);
  const [bankAccounts, setBankAccounts] = useState<PaymentBankAccount[]>([]);

  /// Phase 11.4 — animated Place Order button kill-switch (Principle
  /// #2). Default true so the animation ships visible; admin can flip
  /// `animated_place_order_button` to false in /admin/feature-flags
  /// for an instant kill if it misbehaves in prod (GSAP regression,
  /// browser-specific 3D bug, etc.) without a redeploy. The fallback
  /// is the same plain "Pay X" button this page used before the
  /// animated upgrade.
  const animationEnabled = useFlag('animated_place_order_button', true);

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

  /// Tracker #46 — load the live method config + matching bank
  /// accounts for the customer's shipping country. The currency
  /// is fixed to NGN for now (matches Order.currency in placeOrder);
  /// when multi-currency checkout lands this becomes the order's
  /// currency.
  useEffect(() => {
    const country = shipping?.country ?? null;
    void (async () => {
      try {
        const r = await fetchPublicPaymentMethods({ currency: 'NGN', country });
        setMethods(r.methods);
        setBankAccounts(r.bankAccounts);
      } catch {
        /* fail-soft — selector shows the empty-state notice */
      }
    })();
  }, [shipping?.country]);

  const selectedConfig =
    methods.find((m) => {
      const map: Record<string, string> = {
        CARD: 'card',
        MOBILE_MONEY: 'mobile-money',
        BANK_TRANSFER: 'bank-transfer',
        USSD: 'ussd',
        CRYPTO: 'crypto',
        PAY_ON_DELIVERY: 'pay-on-delivery',
      };
      return map[m.code] === selected;
    }) ?? null;

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

  // Where to send the customer once the truck animation finishes.
  // Stashed during the API call (which runs concurrently with the
  // animation) so `onSuccess` only has to do the redirect itself.
  // A ref (not state) — the value never drives a render, and using a
  // ref sidesteps any timing risk between state-flushing and the
  // post-animation onSuccess callback.
  const redirectRef = useRef<
    | { kind: 'gateway'; url: string }
    | { kind: 'success' }
    | null
  >(null);

  const submitOrder = async (): Promise<void> => {
    if (!selected || !agreed || !shipping) {
      throw new Error('Please confirm your shipping, payment method, and the terms.');
    }
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
        coinRedeemCoins: coinRedeemRequest > 0 ? coinRedeemRequest : undefined,
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
        redirectRef.current = { kind: 'gateway', url: init.checkoutUrl };
      } else {
        redirectRef.current = { kind: 'success' };
      }
    } catch (err) {
      // Surface error inline; PlaceOrderButton resets to idle on reject.
      setError(
        err instanceof HttpApiError
          ? err.message
          : 'Could not place your order. Please try again.',
      );
      throw err;
    } finally {
      setSubmitting(false);
    }
  };

  const handleOrderPlaced = () => {
    // Fired AFTER the truck animation completes AND the API has
    // confirmed the order. Clear the cart and redirect to whatever
    // the server told us we needed (gateway-hosted page or our own
    // /checkout/success).
    const target = redirectRef.current;
    if (!target) return;
    clearCart();
    if (target.kind === 'gateway') {
      window.location.href = target.url;
    } else {
      router.push('/checkout/success');
    }
  };

  // No-op submit handler so an Enter-key in any form input doesn't
  // trigger a default browser navigation. The PlaceOrderButton owns
  // the actual click behaviour (it's `type="button"`).
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
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

            <form onSubmit={handleFormSubmit} className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:gap-8">
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
                    <PaymentMethodSelector
                      methods={methods}
                      value={selected}
                      onChange={handleSelectMethod}
                    />
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
                      <PaymentMethodForm
                        method={selected}
                        total={total}
                        config={selectedConfig}
                        bankAccounts={bankAccounts}
                      />
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
                  {animationEnabled ? (
                    /* Animated truck button. Wrapped in SafeBoundary
                     * (Rule B8) — if GSAP regresses, the CSS module
                     * fails to load, or any other render-time error
                     * happens, the boundary catches it, reports to
                     * Sentry tagged `boundary:checkout:place-order`,
                     * and renders the static button instead so the
                     * customer can still complete checkout. */
                    <SafeBoundary
                      name="checkout:place-order"
                      fallback={
                        <StaticPlaceOrderButton
                          label={`Pay ${formatPriceNGN(total)}`}
                          disabled={!selected || !agreed || submitting}
                          onSubmit={submitOrder}
                          onSuccess={handleOrderPlaced}
                        />
                      }
                    >
                      <PlaceOrderButton
                        label={`Pay ${formatPriceNGN(total)}`}
                        disabled={!selected || !agreed || submitting}
                        onSubmit={submitOrder}
                        onSuccess={handleOrderPlaced}
                      />
                    </SafeBoundary>
                  ) : (
                    /* Admin flipped the kill-switch — same button the
                     * page used before the animated upgrade. */
                    <StaticPlaceOrderButton
                      label={`Pay ${formatPriceNGN(total)}`}
                      disabled={!selected || !agreed || submitting}
                      onSubmit={submitOrder}
                      onSuccess={handleOrderPlaced}
                    />
                  )}
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
