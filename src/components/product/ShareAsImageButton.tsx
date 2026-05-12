'use client';

import { useState } from 'react';
import { ImageDown, Check, Loader2 } from 'lucide-react';
import { SafeBoundary } from '@/components/common/SafeBoundary';
import { useFlag } from '@/lib/useFlag';

/**
 * Standalone "Share as image" button on the PDP, sitting next to
 * the link-share button + wishlist heart. Distinct from the popover
 * "Copy link / WhatsApp / Twitter / etc." flow because:
 *
 *  - The link-share button on mobile fires `navigator.share` directly
 *    (no popover ever opens), so a menu-item inside that popover would
 *    be invisible to the majority of mobile users.
 *  - Generating a PNG card is a meaningfully different action from
 *    sharing a URL — a dedicated icon makes the affordance obvious
 *    without surprise-changing the existing share UX.
 *
 * The button:
 *  1. Hits the storefront route `/api/products/[slug]/share-image
 *     ?variant=square` which composites the navy/amber PNG via satori.
 *  2. If the client supports `navigator.canShare({ files })` — opens
 *     the native iOS/Android share sheet with the PNG attached.
 *  3. Otherwise — triggers a download via an anchor element.
 *
 * Gated by `useFlag('share_as_image', false)` so it stays hidden until
 * admin flips it on; wrapped in `<SafeBoundary>` so a generation
 * failure can't break the surrounding PDP toolbar.
 */
interface ShareAsImageButtonProps {
  slug: string;
  productName: string;
  brand?: string | null;
  shortDescription?: string | null;
  className?: string;
}

export function ShareAsImageButton(props: ShareAsImageButtonProps) {
  const enabled = useFlag('share_as_image', false);
  if (!enabled) return null;
  return (
    <SafeBoundary name="share-as-image-button" fallback={null}>
      <ShareAsImageButtonInner {...props} />
    </SafeBoundary>
  );
}

function ShareAsImageButtonInner({
  slug,
  productName,
  brand,
  shortDescription,
  className,
}: ShareAsImageButtonProps) {
  const [state, setState] = useState<'idle' | 'busy' | 'done' | 'error'>('idle');

  const shareTitle = brand ? `${productName} — ${brand}` : productName;
  const shareText = shortDescription
    ? `${shareTitle} · ${shortDescription}`
    : `${shareTitle} on Afrizonemart`;

  const handleClick = async () => {
    if (state === 'busy') return;
    setState('busy');
    try {
      const res = await fetch(
        `/api/products/${encodeURIComponent(slug)}/share-image?variant=square`,
      );
      if (!res.ok) throw new Error(`generation failed: ${res.status}`);
      const blob = await res.blob();
      const file = new File([blob], `${slug}-afrizonemart.png`, {
        type: 'image/png',
      });

      const canShareFiles =
        typeof navigator !== 'undefined' &&
        typeof navigator.canShare === 'function' &&
        navigator.canShare({ files: [file] });

      if (canShareFiles && typeof navigator.share === 'function') {
        try {
          await navigator.share({
            files: [file],
            title: shareTitle,
            text: shareText,
          });
          setState('done');
          window.setTimeout(() => setState('idle'), 2000);
          return;
        } catch (err) {
          if (err instanceof Error && err.name === 'AbortError') {
            setState('idle');
            return;
          }
          // Fall through to download.
        }
      }

      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = objectUrl;
      a.download = `${slug}-afrizonemart.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
      setState('done');
      window.setTimeout(() => setState('idle'), 2000);
    } catch {
      setState('error');
      window.setTimeout(() => setState('idle'), 3000);
    }
  };

  const label =
    state === 'busy'
      ? `Generating share card for ${productName}`
      : state === 'done'
      ? `Share card ready for ${productName}`
      : state === 'error'
      ? `Could not generate share card for ${productName}, try again`
      : `Share ${productName} as image`;

  return (
    <button
      type="button"
      onClick={() => void handleClick()}
      aria-label={label}
      title={state === 'idle' ? 'Share as image' : label}
      disabled={state === 'busy'}
      className={`flex h-10 w-10 items-center justify-center rounded-full border border-border bg-white text-charcoal transition-colors hover:border-navy hover:text-navy disabled:opacity-60 ${className ?? ''}`}
    >
      {state === 'busy' ? (
        <Loader2 size={18} className="animate-spin" aria-hidden />
      ) : state === 'done' ? (
        <Check size={18} className="text-success" aria-hidden />
      ) : (
        <ImageDown size={18} aria-hidden />
      )}
    </button>
  );
}
