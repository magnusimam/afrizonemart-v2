/// Empty market-stall SVG used on the 404 / not-found page. Pure
/// inline SVG so it ships in the HTML, no extra request, no GIF.
///
/// Visual: two wooden posts + a striped amber canopy + an empty
/// counter + a small "Be right back" sign hanging from the canopy.
/// Implies "the seller is just away" rather than "this place is
/// dead" — matches the "come back soon" copy on the page.
///
/// Animation: the canopy + sign sway gently as if in wind. Pure
/// CSS keyframes via the `azm-stall-sway` class defined in
/// globals.css. transform-origin is the canopy's anchor point so
/// it rotates around where it meets the posts, not the page corner.

import styles from './EmptyStallIllustration.module.css';

interface Props {
  className?: string;
  /// aria-label on the wrapping svg. Falls back to a sensible default
  /// so the page can keep this decorative without forgetting alt text.
  ariaLabel?: string;
}

export function EmptyStallIllustration({ className, ariaLabel }: Props) {
  return (
    <svg
      viewBox="0 0 320 240"
      role="img"
      aria-label={ariaLabel ?? 'An empty market stall — back soon'}
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Ground line + small shadow under the stall. */}
      <ellipse cx="160" cy="220" rx="120" ry="6" fill="#000066" opacity="0.08" />

      {/* Left + right posts — navy stroke, no fill so they look like
          framed wood. */}
      <rect x="44" y="70" width="10" height="150" rx="2" fill="#000066" />
      <rect x="266" y="70" width="10" height="150" rx="2" fill="#000066" />

      {/* Counter — horizontal plank between the posts, slightly above
          the ground so the posts read as legs. */}
      <rect x="40" y="170" width="240" height="14" rx="2" fill="#000066" />
      <rect x="40" y="184" width="240" height="6" fill="#000066" opacity="0.4" />

      {/* Canopy + hanging sign group: this is what sways. The
          transform-origin in CSS is the top anchor where the canopy
          meets the posts so the sway looks attached, not detached. */}
      <g className={styles.sway}>
        {/* Canopy — slanted striped roof. Amber + white stripes,
            navy outline so it reads at small sizes too. */}
        <path
          d="M 30 70 L 290 50 L 290 80 L 30 100 Z"
          fill="#FBAC34"
          stroke="#000066"
          strokeWidth="3"
          strokeLinejoin="round"
        />
        {/* Three white stripes across the canopy for the classic
            market-stall awning look. */}
        <path d="M 95 73 L 95 95" stroke="#fff" strokeWidth="6" strokeLinecap="round" opacity="0.85" />
        <path d="M 160 68 L 160 90" stroke="#fff" strokeWidth="6" strokeLinecap="round" opacity="0.85" />
        <path d="M 225 63 L 225 85" stroke="#fff" strokeWidth="6" strokeLinecap="round" opacity="0.85" />

        {/* Scallop trim along the front edge of the canopy. */}
        <path
          d="M 30 100 q 12 14 24 0 q 12 14 24 0 q 12 14 24 0 q 12 14 24 0 q 12 14 24 0 q 12 14 24 0 q 12 14 24 0 q 12 14 24 0 q 12 14 24 0 q 12 14 24 0 L 290 80"
          fill="#FBAC34"
          stroke="#000066"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />

        {/* Hanging "Be right back" sign — small rectangle dangling
            from the canopy by two thin ropes. */}
        <line x1="140" y1="100" x2="140" y2="120" stroke="#000066" strokeWidth="1.5" />
        <line x1="180" y1="98" x2="180" y2="120" stroke="#000066" strokeWidth="1.5" />
        <rect
          x="130"
          y="120"
          width="60"
          height="28"
          rx="3"
          fill="#fff"
          stroke="#000066"
          strokeWidth="2"
        />
        {/* Sign copy — kept tiny on purpose; the surrounding page
            copy carries the real message. */}
        <text
          x="160"
          y="138"
          textAnchor="middle"
          fontFamily="Raleway, sans-serif"
          fontWeight="700"
          fontSize="9"
          fill="#000066"
          letterSpacing="0.5"
        >
          BACK SOON
        </text>
      </g>
    </svg>
  );
}
