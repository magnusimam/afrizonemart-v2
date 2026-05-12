'use client';

import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import styles from './AnimatedAddToCartButton.module.css';

interface AnimatedAddToCartButtonProps {
  /// Label rendered when idle. Typically "Add to Cart" or "Add to Cart — ₦X".
  label: string;
  /// Fires once on click. The animation runs concurrently — the cart
  /// store should be updated optimistically inside this callback so
  /// the cart-icon counter reflects the addition immediately. The
  /// animation is purely visual confirmation; it never gates the
  /// state update.
  onAdd: () => void;
  /// Visual theme. `'dark'` = navy button on white card surface (PDP
  /// CTA). `'light'` = white button on white card surface with a
  /// soft navy outline (product cards). The CSS module supplies the
  /// palette via custom-property overrides — no runtime cost.
  theme?: 'dark' | 'light';
  /// Compact size variant — scales the SVG icons down + tightens
  /// padding for the smaller product-card surface (~140-180px wide).
  /// Also scales the JS-driven animation distances so the cart's
  /// travel path doesn't overflow a narrow button.
  compact?: boolean;
  disabled?: boolean;
  className?: string;
}

/**
 * Animated "Add to Cart" button. T-shirt drops into a shopping cart,
 * cart rolls across the button, label fades back. Fires `onAdd`
 * immediately on click so the cart counter updates without waiting
 * for the animation.
 *
 * Source: @nayanchamling CodePen "Interactive Cart Button". Reskinned
 * to navy + amber. The original used `MorphSVGPlugin` (paid GSAP-Club
 * plugin) to morph the shirt's SVG path while it fell — replaced
 * here with a scale-and-translate "squash" on the parent group so
 * we ship on free GSAP core only.
 *
 * Resilience contract: must be 1:1 swappable with `StaticAddToCartButton`
 * from the parent's POV. Same `label` / `onAdd` / `disabled` props.
 * If this throws on render, `<SafeBoundary>` falls through to the
 * static one and the customer can still buy.
 *
 * `prefers-reduced-motion: reduce` is handled at the CSS level
 * (transforms reset to idle values, shirt + cart hidden) AND in JS
 * (the GSAP timeline is short-circuited so the animation never runs).
 */
export function AnimatedAddToCartButton({
  label,
  onAdd,
  theme = 'dark',
  compact = false,
  disabled,
  className,
}: AnimatedAddToCartButtonProps) {
  /// Animation-distance scale factor. Compact buttons (~140-180px on
  /// product cards) get distances proportionally reduced so the cart
  /// doesn't fly past the button edge. PDP buttons are full-width and
  /// use the originally-tuned distances.
  const scale = compact ? 0.6 : 1;
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [active, setActive] = useState(false);
  const inflight = useRef(false);

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

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (inflight.current || disabled) return;
    inflight.current = true;

    // Fire the parent's onAdd immediately. The animation is just
    // confirmation; never gate state updates on it.
    onAdd();

    if (reduceMotion) {
      // No animation. The button briefly disables to debounce double
      // clicks, then resets.
      setActive(true);
      setTimeout(() => {
        setActive(false);
        inflight.current = false;
      }, 250);
      return;
    }

    setActive(true);
    const button = buttonRef.current;
    if (!button) {
      inflight.current = false;
      return;
    }

    /// Snap the button back to its idle CSS-var values + clear React
    /// state. Called from `onComplete` (normal end) AND `onInterrupt`
    /// (timeline killed mid-flight by a re-render, component unmount,
    /// or a tween on the same property starting elsewhere). Without
    /// the onInterrupt handler the cart would freeze wherever the
    /// last completed tween left it — typically near the centre of
    /// the button, which is the "stops halfway in the middle" bug
    /// Magnus reported on mobile cards. Removing `.active` lets the
    /// CSS opacity:0 rule take over so the cart is invisible in
    /// idle state regardless of where its CSS-var positions sit.
    const resetIdle = () => {
      gsap.set(button, {
        '--background-scale': 1,
        '--text-o': 1,
        '--text-x': '0px',
        '--shirt-y': `${-16 * scale}px`,
        '--shirt-scale': 0,
        '--cart-x': `${-64 * scale}px`,
        '--cart-y': '0px',
        '--cart-rotate': '0deg',
        '--cart-scale': 0.75,
        '--cart-clip': '0px',
        '--cart-clip-x': '0px',
        '--cart-tick-offset': '10px',
      });
      setActive(false);
      inflight.current = false;
    };

    // ---- Animation timeline (~2.0s end-to-end) ----
    // Faithful port of the @nayanchamling timeline minus the two
    // MorphSVG-driven steps. The shirt's "squash" on its way down is
    // approximated by a scale tween on the parent .shirt div instead
    // of morphing the SVG path itself.
    const tl = gsap.timeline({
      onComplete: resetIdle,
      onInterrupt: resetIdle,
    });

    // Background squish — feels like the button is being pressed.
    tl.to(button, {
      '--background-scale': 0.97,
      duration: 0.15,
    }).to(
      button,
      {
        '--background-scale': 1,
        duration: 1.2,
        ease: 'elastic.out(1, .6)',
      },
      0.15,
    );

    // Label fade out.
    tl.to(
      button,
      {
        '--text-o': 0,
        duration: 0.3,
      },
      0,
    );

    // Shirt drops, squashes, settles.
    // (This is the bit that USED to be MorphSVG. Now: scale + Y translate.)
    tl.to(
      button,
      {
        '--shirt-scale': 1,
        '--shirt-y': `${-42 * scale}px`,
        duration: 0.4,
        ease: 'power1.in',
      },
      0,
    )
      .to(button, {
        '--shirt-y': `${-40 * scale}px`,
        duration: 0.3,
      })
      .to(button, {
        '--shirt-y': `${16 * scale}px`,
        '--shirt-scale': 0.9,
        duration: 0.25,
      })
      .to(button, {
        '--shirt-scale': 0,
        duration: 0.3,
      });

    // Cart enters, catches the shirt, rolls across the button.
    tl.to(
      button,
      {
        '--cart-x': '0px',
        '--cart-scale': 1,
        duration: 0.4,
        ease: 'power1.in',
      },
      0,
    )
      .to(button, {
        '--cart-clip': '12px',
        '--cart-clip-x': '3px',
        duration: 0.06,
      })
      .to(button, {
        '--cart-y': '2px',
        duration: 0.1,
      })
      .to(button, {
        '--cart-tick-offset': '0px',
        '--cart-y': '0px',
        duration: 0.2,
      })
      .to(button, {
        '--cart-x': `${52 * scale}px`,
        '--cart-rotate': '-15deg',
        duration: 0.2,
      })
      .to(button, {
        '--cart-x': `${140 * scale}px`,
        '--cart-rotate': '0deg',
        duration: 0.2,
      });

    // Label slides back from the left.
    tl.to(
      button,
      {
        '--text-o': 1,
        '--text-x': '0px',
        duration: 0.25,
      },
      '>-0.05',
    );
  };

  const cls = [
    styles.button,
    theme === 'light' ? styles.themeLight : '',
    compact ? styles.compact : '',
    active ? styles.active : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button
      ref={buttonRef}
      type="button"
      onClick={handleClick}
      disabled={disabled || active}
      className={cls}
      aria-live="polite"
    >
      <span className={styles.label}>{label}</span>
      <div className={styles.shirt}>
        <svg viewBox="0 0 24 24" aria-hidden>
          <path d="M4.99997 3L8.99997 1.5C8.99997 1.5 10.6901 3 12 3C13.3098 3 15 1.5 15 1.5L19 3L22.5 8L19.5 10.5L19 9.5L17.1781 18.6093C17.062 19.1901 16.778 19.7249 16.3351 20.1181C15.4265 20.925 13.7133 22.3147 12 23C10.2868 22.3147 8.57355 20.925 7.66487 20.1181C7.22198 19.7249 6.93798 19.1901 6.82183 18.6093L4.99997 9.5L4.5 10.5L1.5 8L4.99997 3Z" />
          <g>
            <path d="M16.3516 9.65383H14.3484V7.83652H14.1742V9.8269H16.5258V7.83652H16.3516V9.65383Z" />
            <path d="M14.5225 6.01934V7.66357H14.6967V7.4905H14.8186V7.66357H14.9928V6.01934H14.8186V7.31742H14.6967V6.01934H14.5225Z" />
            <path d="M14.1742 5.67319V7.66357H14.3484V5.84627H16.3516V7.66357H16.5258V5.67319H14.1742Z" />
            <path d="M15.707 9.48071H15.8812V9.28084L16.0032 9.4807V9.48071H16.1774V7.83648H16.0032V9.14683L15.8812 8.94697V7.83648H15.707V9.48071Z" />
            <path d="M15.5852 6.01931H15.1149V6.19238H15.5852V6.01931Z" />
            <path d="M15.707 6.01934V7.66357H15.8812V7.46371L16.0032 7.66357H16.1774V6.01934H16.0032V7.32969L15.8812 7.12984V6.01934H15.707Z" />
            <path d="M15.411 7.31742H15.2891V6.53857H15.411V7.31742ZM15.1149 7.66357H15.2891V7.4905H15.411V7.66357H15.5852V6.3655H15.1149V7.66357Z" />
            <path d="M14.5225 8.69756L14.8186 9.18291V9.30763H14.6967V9.13455H14.5225V9.48071H14.9928V9.13456V9.13455L14.6967 8.64917V8.00956H14.8186V8.6586H14.9928V7.83648H14.5225V8.69756Z" />
            <path d="M15.411 9.30763H15.2891V8.00956H15.411V9.30763ZM15.1149 9.48071H15.5852V7.83648H15.1149V9.48071Z" />
          </g>
        </svg>
      </div>
      <div className={styles.cart}>
        <svg viewBox="0 0 36 26" aria-hidden>
          <path d="M1 2.5H6L10 18.5H25.5L28.5 7.5L7.5 7.5" className="shape" />
          <path d="M11.5 25C12.6046 25 13.5 24.1046 13.5 23C13.5 21.8954 12.6046 21 11.5 21C10.3954 21 9.5 21.8954 9.5 23C9.5 24.1046 10.3954 25 11.5 25Z" className="wheel" />
          <path d="M24 25C25.1046 25 26 24.1046 26 23C26 21.8954 25.1046 21 24 21C22.8954 21 22 21.8954 22 23C22 24.1046 22.8954 25 24 25Z" className="wheel" />
          <path d="M14.5 13.5L16.5 15.5L21.5 10.5" className="tick" />
        </svg>
      </div>
    </button>
  );
}
