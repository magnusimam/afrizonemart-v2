'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Calendar, CheckCircle2, Loader2, Mail, Package, Share2 } from 'lucide-react';
import { TrustBarSection } from '@/components/sections/TrustBarSection';
import { DELIVERY_METHODS } from '@/lib/checkout-data';
import { checkOrderPayment } from '@/lib/api/payments';
import { useCheckoutStore } from '@/stores/checkoutStore';
import { SafeBoundary } from '@/components/common/SafeBoundary';
import { SuccessDeliveryAnimation } from '@/components/checkout/SuccessDeliveryAnimation';
import { useFlag } from '@/lib/useFlag';

export default function SuccessPage() {
  const orderId = useCheckoutStore((s) => s.orderId);
  const shipping = useCheckoutStore((s) => s.shipping);
  const deliveryMethod = useCheckoutStore((s) => s.deliveryMethod);
  const reset = useCheckoutStore((s) => s.reset);
  const [hydrated, setHydrated] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'unknown' | 'pending' | 'paid' | 'failed'>('unknown');
  /// 2026-05-16 — replaces the static green-check ring with a GSAP
  /// delivery scene. Admin can flip `animated_success_delivery` to
  /// false in /admin/feature-flags for an instant kill-switch.
  const successAnimationOn = useFlag('animated_success_delivery', true);

  useEffect(() => {
    setHydrated(true);
  }, []);

  // Triggers a server-side verify against the gateway each tick, so
  // the order flips to PAID even when the webhook URL hasn't been
  // pointed at us (local dev, before launch). Gives up after ~30s
  // and surfaces a "still processing" banner.
  useEffect(() => {
    if (!hydrated || !orderId) return;
    let cancelled = false;
    let attempts = 0;
    const tick = async () => {
      if (cancelled) return;
      attempts += 1;
      try {
        const r = await checkOrderPayment(orderId);
        if (cancelled) return;
        if (
          r.orderStatus === 'PAID' ||
          r.orderStatus === 'FULFILLING' ||
          r.orderStatus === 'SHIPPED' ||
          r.orderStatus === 'DELIVERED'
        ) {
          setPaymentStatus('paid');
          return;
        }
        if (r.orderStatus === 'CANCELLED') {
          setPaymentStatus('failed');
          return;
        }
      } catch {
        /* keep polling */
      }
      if (attempts < 15) {
        setPaymentStatus('pending');
        setTimeout(() => void tick(), 2000);
      }
    };
    void tick();
    return () => {
      cancelled = true;
    };
  }, [hydrated, orderId]);

  const eta = (() => {
    const d = new Date();
    const m = DELIVERY_METHODS.find((mth) => mth.id === deliveryMethod);
    if (!m) return d;
    if (m.id === 'express') d.setHours(d.getHours() + 24);
    else if (m.id === 'standard') d.setDate(d.getDate() + 2);
    else if (m.id === 'pickup') d.setHours(d.getHours() + 4);
    else d.setDate(d.getDate() + 7);
    return d;
  })();

  const etaLabel = eta.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });

  return (
    <>
      <main className="bg-page pb-12">
        <section className="bg-white py-12 md:py-20">
          <div className="mx-auto flex max-w-2xl flex-col items-center gap-6 px-4 text-center">
            {successAnimationOn ? (
              /* Animated delivery scene. Wrapped in SafeBoundary —
               * if GSAP regresses or the scene throws at render
               * time, the boundary catches it and renders the
               * static checkmark instead so the page still works. */
              <SafeBoundary
                name="checkout:success-delivery"
                fallback={<StaticCheckmark />}
              >
                <SuccessDeliveryAnimation />
              </SafeBoundary>
            ) : (
              /* Admin flipped the kill-switch — same checkmark the
               * page used before the animated upgrade. */
              <StaticCheckmark />
            )}

            <div className="flex flex-col gap-2">
              <p className="font-raleway text-xs font-semibold uppercase tracking-btn text-amber">
                {paymentStatus === 'pending' ? 'Confirming payment…' : 'Order confirmed'}
              </p>
              <h1 className="font-raleway text-3xl font-bold text-navy md:text-5xl">
                Asante! Your Order is on the Way
              </h1>
              <p className="font-sans text-base leading-relaxed text-muted md:text-lg">
                Thank you{shipping ? `, ${shipping.firstName}` : ''} — your order has been received and our team is preparing it for dispatch.
              </p>
            </div>

            {paymentStatus === 'pending' && (
              <div className="flex w-full items-center justify-center gap-2 rounded-card border border-amber/40 bg-amber/10 px-4 py-3 font-sans text-sm text-charcoal">
                <Loader2 size={16} className="animate-spin text-navy" aria-hidden />
                Verifying payment with the gateway… you can close this page; a confirmation email will follow.
              </div>
            )}
            {paymentStatus === 'failed' && (
              <div className="w-full rounded-card border border-danger/30 bg-danger/5 px-4 py-3 font-sans text-sm text-danger">
                Payment didn&apos;t complete. The order has been cancelled — try again from your cart.
              </div>
            )}

            {hydrated && orderId ? (
              <div className="grid w-full grid-cols-1 gap-3 rounded-card border border-border bg-page p-5 text-left sm:grid-cols-2">
                <Detail label="Order Number" value={orderId} highlight />
                <Detail label="Estimated Delivery" value={etaLabel} icon={<Calendar size={14} />} />
                {shipping ? (
                  <Detail
                    label="Delivering to"
                    value={`${shipping.city}, ${shipping.region}`}
                  />
                ) : null}
                <Detail
                  label="Delivery Method"
                  value={
                    DELIVERY_METHODS.find((m) => m.id === deliveryMethod)?.label ?? '—'
                  }
                  icon={<Package size={14} />}
                />
              </div>
            ) : null}

            <p className="flex items-center gap-2 font-sans text-sm text-charcoal">
              <Mail size={16} className="text-navy" aria-hidden />
              A confirmation email has been sent
              {shipping?.email ? (
                <>
                  to <span className="font-semibold text-navy">{shipping.email}</span>
                </>
              ) : null}
              .
            </p>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href={orderId ? `/account/orders/${orderId}` : '/account/orders'}
                onClick={reset}
                className="rounded-btn bg-navy px-6 py-3 font-raleway text-xs font-bold uppercase tracking-btn text-white shadow-card transition-colors hover:bg-amber hover:text-navy md:text-sm"
              >
                Track Your Order
              </Link>
              <Link
                href="/"
                onClick={reset}
                className="rounded-btn border-2 border-navy bg-white px-6 py-3 font-raleway text-xs font-bold uppercase tracking-btn text-navy transition-colors hover:bg-navy hover:text-white md:text-sm"
              >
                Continue Shopping
              </Link>
            </div>

            <div className="flex flex-col items-center gap-3 pt-4">
              <p className="flex items-center gap-1.5 font-sans text-xs text-muted">
                <Share2 size={14} aria-hidden />
                Tell your friends about Afrizonemart:
              </p>
              <div className="flex gap-2">
                <ShareButton href="https://wa.me/?text=I%20just%20shopped%20on%20Afrizonemart!">
                  WhatsApp
                </ShareButton>
                <ShareButton href="https://x.com/intent/tweet?text=Just%20shopped%20on%20%40Afrizonemart!&url=https%3A%2F%2Fafrizonemart.com">
                  X
                </ShareButton>
                <ShareButton href="https://www.facebook.com/sharer/sharer.php?u=https%3A%2F%2Fafrizonemart.com">
                  Facebook
                </ShareButton>
              </div>
            </div>
          </div>
        </section>

        <SafeBoundary name="success:trust" fallback={null}>
          <TrustBarSection />
        </SafeBoundary>
      </main>
    </>
  );
}

function Detail({
  label,
  value,
  icon,
  highlight = false,
}: {
  label: string;
  value: string;
  icon?: React.ReactNode;
  highlight?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1">
      <span className="flex items-center gap-1.5 font-raleway text-[10px] font-bold uppercase tracking-btn text-muted">
        {icon}
        {label}
      </span>
      <span
        className={`font-raleway text-sm font-bold md:text-base ${
          highlight ? 'text-amber' : 'text-navy'
        }`}
      >
        {value}
      </span>
    </div>
  );
}

function ShareButton({
  children,
  href,
}: {
  children: React.ReactNode;
  href: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="rounded-full border border-border bg-white px-4 py-1.5 font-raleway text-xs font-semibold text-navy transition-colors hover:border-navy hover:bg-navy hover:text-white"
    >
      {children}
    </a>
  );
}

/// Static fallback shown when (a) admin flips the kill-switch, OR
/// (b) the SafeBoundary catches a render error inside the animation.
/// Same markup the page used before the animated upgrade.
function StaticCheckmark() {
  return (
    <div className="relative flex h-24 w-24 items-center justify-center md:h-32 md:w-32">
      <span className="absolute inset-0 animate-ping rounded-full bg-success/20" aria-hidden />
      <span className="relative flex h-20 w-20 items-center justify-center rounded-full bg-success md:h-28 md:w-28">
        <CheckCircle2 size={48} strokeWidth={2} className="text-white md:hidden" aria-hidden />
        <CheckCircle2 size={64} strokeWidth={2} className="hidden text-white md:block" aria-hidden />
      </span>
    </div>
  );
}
