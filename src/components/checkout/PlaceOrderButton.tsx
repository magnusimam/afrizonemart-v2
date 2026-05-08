'use client';

import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import styles from './PlaceOrderButton.module.css';

interface PlaceOrderButtonProps {
  /// Label rendered when the button is idle. Typically "Pay ₦X,XXX".
  label: string;
  /// Called once on click. Should resolve when the order is confirmed
  /// (or reject to surface an error). The truck animation runs
  /// concurrently; we wait for BOTH the promise resolves and the
  /// animation completes before settling into the "Order Placed"
  /// state — so the customer never sees success before the order
  /// actually exists in the DB. **Do NOT redirect inside `onSubmit`**
  /// — return cleanly and put the redirect in `onSuccess` so the
  /// animation has time to complete first.
  onSubmit: () => Promise<void>;
  /// Fires after both the animation AND `onSubmit` have completed.
  /// This is where the parent should redirect (router.push or
  /// window.location.href). A short delay between settling the
  /// success state and the redirect lets the customer register the
  /// "Order Placed" tick before the page changes.
  onSuccess?: () => void;
  disabled?: boolean;
  className?: string;
}

/// Time the success state stays visible before `onSuccess` fires.
/// Long enough for the tick to register, short enough not to feel
/// stalled. Skipped under prefers-reduced-motion.
const SUCCESS_HOLD_MS = 600;

/**
 * Animated "Place Order" button. On click, the button rotates 3D to
 * lay flat, a truck drives across with the customer's box, the road
 * fills as a progress bar, and the button settles into "Order Placed"
 * with a tick.
 *
 * Animation timeline is sourced from the original GSAP demo by
 * @coding.pixel and reskinned to brand palette. Free GSAP core only;
 * no premium plugins.
 *
 * State coupling:
 * - The animation timing (~2.4s) and the order-submit API call run
 *   concurrently on click. Whichever finishes second is what gates
 *   the redirect — so the customer never sees "Order Placed" before
 *   the order actually exists in the DB.
 * - On rejection: animation reverses to idle. Parent surfaces the
 *   error inline.
 * - `prefers-reduced-motion`: the animation is skipped entirely; we
 *   just await the promise then hand control back.
 */
export function PlaceOrderButton({
  label,
  onSubmit,
  onSuccess,
  disabled,
  className,
}: PlaceOrderButtonProps) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [phase, setPhase] = useState<'idle' | 'animating' | 'done'>('idle');
  const submittingRef = useRef(false);

  // Tear down any in-flight gsap tweens on unmount so they don't fire
  // on a stale DOM node (e.g. user navigated away mid-animation).
  useEffect(() => {
    const node = buttonRef.current;
    return () => {
      if (node) gsap.killTweensOf(node);
    };
  }, []);

  const reduceMotion =
    typeof window !== 'undefined' &&
    window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const handleClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (submittingRef.current || disabled) return;
    submittingRef.current = true;

    // Reduced-motion path: just await the submit. No 3D, no truck.
    if (reduceMotion) {
      setPhase('animating');
      try {
        await onSubmit();
        setPhase('done');
        onSuccess?.();
      } catch {
        setPhase('idle');
      } finally {
        submittingRef.current = false;
      }
      return;
    }

    setPhase('animating');
    const button = buttonRef.current;
    if (!button) {
      submittingRef.current = false;
      return;
    }
    const box = button.querySelector<HTMLElement>(`.${styles.box}`);
    const truck = button.querySelector<HTMLElement>(`.${styles.truck}`);
    if (!box || !truck) {
      submittingRef.current = false;
      return;
    }

    // ---- Animation timeline (≈ 2.4s end-to-end) ----
    // Faithful port of the original GSAP timeline. The promise we
    // resolve at the end of `runAnimation()` lets us race the API
    // call against the visual; whichever finishes second gates the
    // "done" state.
    const runAnimation = () => new Promise<void>((resolve) => {
      gsap.to(button, { '--box-s': 1, '--box-o': 1, duration: 0.3, delay: 0.5 });
      gsap.to(box, { x: 0, duration: 0.4, delay: 0.7 });
      gsap.to(button, { '--hx': -5, '--bx': 50, duration: 0.18, delay: 0.92 });
      gsap.to(box, { y: 0, duration: 0.1, delay: 1.15 });
      gsap.set(button, { '--truck-y': 0, '--truck-y-n': -26 });
      gsap.to(button, {
        '--truck-y': 1,
        '--truck-y-n': -25,
        duration: 0.2,
        delay: 1.25,
        onComplete() {
          const tl = gsap
            .timeline({ onComplete: resolve })
            .to(truck, { x: 0, duration: 0.4 })
            .to(truck, { x: 40, duration: 1 })
            .to(truck, { x: 20, duration: 0.6 })
            .to(truck, { x: 96, duration: 0.4 });
          // Road fills at the same pace.
          gsap.to(button, {
            '--progress': 1,
            duration: 2.4,
            ease: 'power2.in',
          });
          void tl;
        },
      });
    });

    try {
      // Race animation + API call. We wait for BOTH so the customer
      // never sees the success state before the API has actually
      // confirmed the order.
      await Promise.all([runAnimation(), onSubmit()]);
      setPhase('done');
      // Hold the "Order Placed" state briefly before handing back
      // to the parent for redirect. Keeps the tick visible long
      // enough to register.
      setTimeout(() => onSuccess?.(), SUCCESS_HOLD_MS);
    } catch {
      // Reset all the GSAP-set CSS vars so the button can be retried.
      gsap.killTweensOf([button, box, truck]);
      gsap.set(truck, { x: 4 });
      gsap.set(button, {
        '--progress': 0,
        '--hx': 0,
        '--bx': 0,
        '--box-s': 0.5,
        '--box-o': 0,
        '--truck-y': 0,
        '--truck-y-n': -26,
      });
      gsap.set(box, { x: -24, y: -6 });
      setPhase('idle');
    } finally {
      submittingRef.current = false;
    }
  };

  const phaseClasses = [
    styles.button,
    phase === 'animating' || phase === 'done' ? styles.animation : '',
    phase === 'done' ? styles.done : '',
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <span className={styles.wrapper}>
      <button
        ref={buttonRef}
        type="button"
        onClick={handleClick}
        disabled={disabled || phase !== 'idle'}
        className={phaseClasses}
        aria-live="polite"
      >
        <span className={styles.default}>{label}</span>
        <span className={styles.success}>
          Order Placed
          <svg viewBox="0 0 12 10" aria-hidden>
            <polyline points="1.5 6 4.5 9 10.5 1" />
          </svg>
        </span>
        <div className={styles.truck}>
          <div className={styles.wheel} />
          <div className={styles.back} />
          <div className={styles.front} />
          <div className={styles.box} />
        </div>
      </button>
    </span>
  );
}
