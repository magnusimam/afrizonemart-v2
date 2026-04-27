/**
 * Renders a country flag as a real PNG/SVG image (via flagcdn.com),
 * not the unicode emoji — Windows + some Linux distros render flag
 * emoji as the country's two letters instead of the actual flag.
 *
 * The hostname `flagcdn.com` is whitelisted in `next.config.mjs`.
 *
 * Sizes match flagcdn's pre-rendered PNG widths. We keep `<img>` rather
 * than next/image because flags are tiny inline UI affordances — the
 * cost of next/image's runtime URL rewriting + intersection observer
 * outweighs the savings on a 600-byte PNG.
 */
type FlagSize = 'sm' | 'md' | 'lg';

interface Props {
  /** ISO 3166-1 alpha-2 (e.g. "NG"). Case-insensitive. */
  code: string;
  /** Hint that drives both the requested CDN size and rendered width. */
  size?: FlagSize;
  /** Country name — becomes alt text + tooltip. */
  title?: string;
  className?: string;
}

const SIZES: Record<FlagSize, { px: number; cdn: number }> = {
  sm: { px: 14, cdn: 40 }, // typical inline pill / chip
  md: { px: 20, cdn: 80 }, // chapter rail / footer
  lg: { px: 36, cdn: 160 }, // hero overlays
};

export function Flag({ code, size = 'sm', title, className }: Props) {
  const c = code.toLowerCase();
  const s = SIZES[size];
  const alt = title ? `Flag of ${title}` : `Flag of ${code.toUpperCase()}`;

  return (
    /* eslint-disable-next-line @next/next/no-img-element */
    <img
      src={`https://flagcdn.com/w${s.cdn}/${c}.png`}
      srcSet={`https://flagcdn.com/w${s.cdn * 2}/${c}.png 2x`}
      width={Math.round(s.px * 1.4)}
      height={s.px}
      alt={alt}
      title={title}
      loading="lazy"
      decoding="async"
      className={`inline-block shrink-0 rounded-[2px] object-cover shadow-[0_0_0_0.5px_rgba(0,0,0,0.1)] ${className ?? ''}`}
    />
  );
}
