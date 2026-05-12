'use client';

import { useEffect, useRef, useState } from 'react';
import { Check, Copy, Mail, Send, Share2 } from 'lucide-react';
import { SITE_URL } from '@/lib/seo';

/**
 * One-tap share affordance on the PDP. Uses the Web Share API on
 * supported clients (mobile Safari, mobile Chrome, recent desktop
 * Edge) so the native share sheet routes to WhatsApp / iMessage /
 * Messages / Mail / Copy without us having to enumerate targets.
 *
 * Falls back to an inline popover with explicit one-tap targets
 * (Copy link, WhatsApp, X/Twitter, Facebook, Telegram, Email) for
 * the clients that don't expose `navigator.share`.
 *
 * Why the explicit targets exist even though the native sheet
 * exists: desktop browsers + older mobile builds. Telegram and X
 * unfurls render nicely with the OG tags on /product/[slug], so
 * giving customers the choice is the path of least friction.
 *
 * UTM parameters are appended per-channel so we can measure
 * share-driven traffic separately in analytics. Stripped on the
 * server side for canonicalisation but the query stays for the
 * customer's referrer.
 */

interface ShareProductButtonProps {
  slug: string;
  productName: string;
  brand?: string | null;
  /// Optional short description appended to the share text. Falls
  /// back to a neutral "Found this on Afrizonemart" line.
  shortDescription?: string | null;
  className?: string;
}

function buildShareUrl(slug: string, medium: string): string {
  const url = new URL(`${SITE_URL}/product/${slug}`);
  url.searchParams.set('utm_source', 'share');
  url.searchParams.set('utm_medium', medium);
  return url.toString();
}

export function ShareProductButton({
  slug,
  productName,
  brand,
  shortDescription,
  className,
}: ShareProductButtonProps) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Plain text companion to the URL — surfaces in WhatsApp's
  // preview, SMS, and Twitter's intent. Keep under ~120 chars so
  // platforms with caps don't truncate the URL.
  const shareTitle = brand ? `${productName} — ${brand}` : productName;
  const shareText = shortDescription
    ? `${shareTitle} · ${shortDescription}`
    : `${shareTitle} on Afrizonemart`;

  // Click-outside closes the popover.
  useEffect(() => {
    if (!open) return;
    const onMouseDown = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onMouseDown);
    return () => document.removeEventListener('mousedown', onMouseDown);
  }, [open]);

  // Reset the "Copied!" state when the popover closes so the next
  // open shows the neutral icon again.
  useEffect(() => {
    if (!open) setCopied(false);
  }, [open]);

  const handleShareClick = async () => {
    // navigator.share is only available on HTTPS + supported
    // clients. If unavailable we fall through to the popover.
    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      const shareUrl = buildShareUrl(slug, 'web-share');
      try {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: shareUrl,
        });
        return;
      } catch (err) {
        // User cancelled the native sheet (AbortError) — silent.
        // Any other failure falls through to the popover so they
        // still have a way to share.
        if (err instanceof Error && err.name === 'AbortError') return;
      }
    }
    setOpen((prev) => !prev);
  };

  const handleCopy = async () => {
    try {
      const link = buildShareUrl(slug, 'copy');
      await navigator.clipboard.writeText(link);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Older browsers without clipboard API — manual select.
      const fallback = document.createElement('textarea');
      fallback.value = buildShareUrl(slug, 'copy');
      document.body.appendChild(fallback);
      fallback.select();
      try {
        document.execCommand('copy');
        setCopied(true);
        window.setTimeout(() => setCopied(false), 2000);
      } finally {
        document.body.removeChild(fallback);
      }
    }
  };

  return (
    <div ref={containerRef} className={`relative ${className ?? ''}`}>
      <button
        type="button"
        onClick={() => void handleShareClick()}
        aria-label={`Share ${productName}`}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-white text-charcoal transition-colors hover:border-navy hover:text-navy"
      >
        <Share2 size={18} aria-hidden />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-12 z-30 flex w-56 flex-col gap-1 rounded-card border border-border bg-white p-2 shadow-card-hover"
        >
          <button
            type="button"
            role="menuitem"
            onClick={() => void handleCopy()}
            className="flex items-center justify-between gap-2 rounded-input px-3 py-2 text-left font-sans text-sm text-charcoal hover:bg-page"
          >
            <span className="flex items-center gap-2">
              {copied ? (
                <Check size={14} className="text-success" aria-hidden />
              ) : (
                <Copy size={14} aria-hidden />
              )}
              {copied ? 'Link copied!' : 'Copy link'}
            </span>
          </button>

          <ShareTarget
            href={`https://wa.me/?text=${encodeURIComponent(
              `${shareText}\n${buildShareUrl(slug, 'whatsapp')}`,
            )}`}
            icon={
              <span className="flex h-4 w-4 items-center justify-center text-[#25D366]">
                <WhatsAppGlyph />
              </span>
            }
            label="WhatsApp"
          />
          <ShareTarget
            href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(
              buildShareUrl(slug, 'twitter'),
            )}&text=${encodeURIComponent(shareText)}`}
            icon={<XGlyph />}
            label="Twitter / X"
          />
          <ShareTarget
            href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
              buildShareUrl(slug, 'facebook'),
            )}`}
            icon={<FacebookGlyph />}
            label="Facebook"
          />
          <ShareTarget
            href={`https://t.me/share/url?url=${encodeURIComponent(
              buildShareUrl(slug, 'telegram'),
            )}&text=${encodeURIComponent(shareText)}`}
            icon={<Send size={14} aria-hidden />}
            label="Telegram"
          />
          <ShareTarget
            href={`mailto:?subject=${encodeURIComponent(shareTitle)}&body=${encodeURIComponent(
              `${shareText}\n\n${buildShareUrl(slug, 'email')}`,
            )}`}
            icon={<Mail size={14} aria-hidden />}
            label="Email"
          />
        </div>
      )}
    </div>
  );
}

function ShareTarget({
  href,
  icon,
  label,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <a
      role="menuitem"
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-2 rounded-input px-3 py-2 font-sans text-sm text-charcoal hover:bg-page"
    >
      {icon}
      {label}
    </a>
  );
}

/// Brand glyphs that lucide either doesn't ship or ships only in
/// recent versions. Inline SVG, sized to match the other icons.
function WhatsAppGlyph() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="14"
      height="14"
      aria-hidden
      fill="currentColor"
    >
      <path d="M19.05 4.94A10.05 10.05 0 0012 2a10 10 0 00-8.6 15l-1.39 5.05 5.18-1.36A10 10 0 0012 22h.01A10 10 0 0019.05 4.94zM12 20.1a8.13 8.13 0 01-4.14-1.13l-.3-.18-3.07.8.82-2.99-.2-.31A8.1 8.1 0 1112 20.1zm4.42-6.1c-.24-.12-1.43-.7-1.66-.78-.22-.08-.38-.12-.55.12-.16.24-.62.78-.76.94-.14.16-.28.18-.52.06-.24-.12-1.02-.38-1.93-1.2-.71-.64-1.2-1.42-1.34-1.66-.14-.24-.02-.37.1-.49.1-.1.24-.28.36-.42.12-.14.16-.24.24-.4.08-.16.04-.3-.02-.42-.06-.12-.55-1.32-.75-1.81-.2-.48-.4-.41-.55-.42h-.47c-.16 0-.42.06-.64.3-.22.24-.83.81-.83 1.98 0 1.16.85 2.29.97 2.45.12.16 1.68 2.56 4.06 3.59.57.24 1.01.39 1.36.5.57.18 1.09.16 1.5.1.46-.07 1.43-.58 1.63-1.14.2-.56.2-1.04.14-1.14-.06-.1-.22-.16-.46-.28z" />
    </svg>
  );
}

function XGlyph() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="14"
      height="14"
      aria-hidden
      fill="currentColor"
    >
      <path d="M18.244 2H21l-6.51 7.44L22 22h-6.84l-4.79-6.27L4.8 22H2l7-8.01L2 2h6.99l4.33 5.73L18.244 2zm-1.2 18h1.86L7.04 4H5.1l11.945 16z" />
    </svg>
  );
}

function FacebookGlyph() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="14"
      height="14"
      aria-hidden
      fill="currentColor"
    >
      <path d="M22 12a10 10 0 10-11.56 9.88V14.9H7.9V12h2.54V9.8c0-2.5 1.49-3.89 3.77-3.89 1.09 0 2.23.2 2.23.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56V12h2.78l-.45 2.9h-2.33v6.98A10 10 0 0022 12z" />
    </svg>
  );
}
