import Image from 'next/image';
import Link from 'next/link';
import type { ApiPageSection, ImageBannerSectionConfig } from '@/lib/api/page-builder';

interface Props {
  section: ApiPageSection;
}

/// Single full-width image with optional overlay text + CTA. Two width
/// modes: 'full' edge-to-edge (campaign banners) or 'container' clamped
/// to the site's max width (for in-flow promo strips).
export function BuilderImageBannerSection({ section }: Props) {
  const config = section.config as ImageBannerSectionConfig;
  const widthClass = config.width === 'full' ? '' : 'mx-auto max-w-site px-4';

  const inner = (
    <div className="relative aspect-[16/5] w-full overflow-hidden rounded-card">
      <Image
        src={config.imageUrl}
        alt={config.imageAlt}
        fill
        sizes="100vw"
        className="object-cover"
      />
      {(config.overlayHeadline || config.overlayCtaLabel) && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/30 px-4 text-center text-white">
          {config.overlayHeadline && (
            <h2 className="font-raleway text-2xl font-extrabold drop-shadow md:text-4xl">
              {config.overlayHeadline}
            </h2>
          )}
          {config.overlayCtaLabel && (
            <span className="rounded-btn bg-amber px-5 py-2 font-raleway text-xs font-bold uppercase tracking-btn text-navy">
              {config.overlayCtaLabel}
            </span>
          )}
        </div>
      )}
    </div>
  );

  return (
    <section className={`py-6 ${widthClass}`}>
      {config.href ? (
        <Link href={config.href} aria-label={config.imageAlt}>
          {inner}
        </Link>
      ) : (
        inner
      )}
    </section>
  );
}
