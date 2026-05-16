'use client';

import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import styles from './SuccessDeliveryAnimation.module.css';

/**
 * 2026-05-16 — order-success "delivery arrives" scene.
 *
 * Replaces the static green-check ring on /checkout/success with a
 * branded GSAP scene: an amber-cargo truck drives in from the left,
 * stops, rear doors swing open, a box hops out, a tick stamps onto
 * the box.
 *
 * Wired with the standard resilience trio:
 *  1. Kill-switch flag (`animated_success_delivery`, default ON)
 *  2. SafeBoundary around the animation in the parent page
 *  3. Static checkmark fallback (existing markup on the page) when
 *     the flag is off OR the boundary catches a render error
 *
 * Timeline ≈ 4.8s end-to-end:
 *   t=0.0   truck off-screen left, sky/ground visible
 *   t=0.0–1.6 truck drives in, slight settle bounce
 *   t=1.6   dust puffs behind the wheels
 *   t=1.8–2.4 rear doors swing open
 *   t=2.4–3.2 box hops out (arc) and lands beside the truck
 *   t=3.2–3.6 tick stamps onto the box
 *   t=3.6+  static; parent shows the order details
 *
 * `prefers-reduced-motion`: the animation skips and the static end
 * state appears immediately. The parent page's "Order confirmed"
 * copy below the scene fully tells the customer what happened in
 * that case, so the animation is purely decorative.
 *
 * Per the GSAP-timeline rule (memory:
 * feedback_gsap_timeline_oninterrupt) — onInterrupt mirrors
 * onComplete so an unmount mid-flight doesn't leave the scene in
 * a half-state if the parent re-renders.
 */
export function SuccessDeliveryAnimation() {
  const sceneRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    const reduceMotion =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

    const truck = scene.querySelector<HTMLElement>(`.${styles.truck}`);
    const doorL = scene.querySelector<HTMLElement>(`.${styles.doorLeft}`);
    const doorR = scene.querySelector<HTMLElement>(`.${styles.doorRight}`);
    const box = scene.querySelector<HTMLElement>(`.${styles.box}`);
    const tick = scene.querySelector<HTMLElement>(`.${styles.tick}`);
    const wheels = scene.querySelectorAll<HTMLElement>(`.${styles.wheel}`);
    const puffs = scene.querySelectorAll<HTMLElement>(`.${styles.puff}`);
    if (!truck || !doorL || !doorR || !box || !tick) return;

    /// Final/static state — used both as the reduced-motion end
    /// state and as the onInterrupt reset.
    const settle = () => {
      gsap.set(truck, { x: 0 });
      gsap.set(doorL, { rotation: -110 });
      gsap.set(doorR, { rotation: 110 });
      gsap.set(box, { x: 0, y: 0, opacity: 1, scale: 1 });
      gsap.set(tick, { opacity: 1, scale: 1 });
    };

    if (reduceMotion) {
      settle();
      return;
    }

    /// Initial state (off-screen / hidden) before play
    gsap.set(truck, { x: -320 });
    gsap.set(doorL, { rotation: 0 });
    gsap.set(doorR, { rotation: 0 });
    gsap.set(box, { x: 36, y: -10, opacity: 0, scale: 0.85 });
    gsap.set(tick, { opacity: 0, scale: 0 });
    gsap.set(puffs, { opacity: 0, x: 0, y: 0 });

    const tl = gsap.timeline({ onInterrupt: settle });

    // Truck drives in
    tl.to(truck, {
      x: 0,
      duration: 1.6,
      ease: 'power3.out',
    });

    // Wheels spin during the drive-in (decorative, optional)
    tl.to(
      wheels,
      {
        rotation: 720,
        transformOrigin: '50% 50%',
        duration: 1.6,
        ease: 'power3.out',
      },
      '<',
    );

    // Settle bounce
    tl.to(truck, { y: -3, duration: 0.1 })
      .to(truck, { y: 0, duration: 0.1 });

    // Dust puffs trailing the wheels
    tl.to(
      puffs,
      {
        opacity: 0.8,
        y: -10,
        duration: 0.4,
        stagger: 0.08,
        ease: 'power1.out',
      },
      '-=0.3',
    );
    tl.to(
      puffs,
      {
        opacity: 0,
        y: -20,
        duration: 0.5,
        stagger: 0.08,
      },
      '-=0.3',
    );

    // Rear doors swing open
    tl.to(doorL, { rotation: -110, duration: 0.4, ease: 'back.out(1.7)' }, '+=0.1');
    tl.to(doorR, { rotation: 110, duration: 0.4, ease: 'back.out(1.7)' }, '<');

    // Box hops out — slight arc using two segments
    tl.to(box, { opacity: 1, duration: 0.15 }, '+=0.05');
    tl.to(box, {
      x: 0,
      y: -25,
      scale: 1,
      duration: 0.35,
      ease: 'power2.out',
    });
    tl.to(box, {
      y: 0,
      duration: 0.3,
      ease: 'bounce.out',
    });

    // Tick stamps onto the box
    tl.to(
      tick,
      {
        opacity: 1,
        scale: 1,
        duration: 0.35,
        ease: 'back.out(2)',
      },
      '+=0.1',
    );

    return () => {
      tl.kill();
    };
  }, []);

  return (
    <div ref={sceneRef} className={styles.scene} aria-hidden>
      <div className={styles.ground} />

      {/* Dust trailing the truck — appears once it settles */}
      <span className={`${styles.puff} ${styles.puff1}`} />
      <span className={`${styles.puff} ${styles.puff2}`} />
      <span className={`${styles.puff} ${styles.puff3}`} />

      {/* The delivery truck */}
      <div className={styles.truck}>
        <div className={styles.cargo}>
          <span className={styles.cargoLabel}>AZM</span>
        </div>
        <span className={styles.doorLeft} />
        <span className={styles.doorRight} />
        <div className={styles.cab}>
          <div className={styles.cabRoof} />
          <div className={styles.cabBumper} />
        </div>
        <span className={`${styles.wheel} ${styles.wheelBack}`} />
        <span className={`${styles.wheel} ${styles.wheelFront}`} />
      </div>

      {/* The box that hops out, with a tick that stamps onto it */}
      <div className={styles.box}>
        <span className={styles.boxTape} />
        <span className={styles.tick}>
          <svg viewBox="0 0 24 24" aria-hidden>
            <polyline points="5 12 10 17 19 8" />
          </svg>
        </span>
      </div>
    </div>
  );
}
