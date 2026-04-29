import Link from 'next/link';
import { SafeBoundary } from '@/components/common/SafeBoundary';

/**
 * Phase 10.6 — CMS block renderer.
 *
 * Each block in the CMS page's `blocks` JSON tree maps to a small
 * React component below. The `renderBlocks` helper walks the tree.
 *
 * Adding a new block type:
 *  1. Append to `CmsBlock` union
 *  2. Add a case in `renderBlock`
 *  3. Add a palette entry in `BLOCK_PALETTE` so admin sees it
 */

export type CmsBlock =
  | { type: 'hero'; eyebrow?: string; heading: string; subheading?: string; ctaLabel?: string; ctaHref?: string; image?: string }
  | { type: 'rich-text'; html: string }
  | { type: 'banner'; text: string; href?: string; tone?: 'navy' | 'amber' | 'success' }
  | { type: 'image'; src: string; alt?: string; caption?: string }
  | { type: 'image-grid'; images: Array<{ src: string; alt?: string; href?: string }> }
  | { type: 'cta'; heading: string; subheading?: string; label: string; href: string }
  | { type: 'spacer'; size?: number }
  | { type: 'divider' };

export interface BlockPaletteEntry {
  type: CmsBlock['type'];
  label: string;
  description: string;
  factory: () => CmsBlock;
}

export const CMS_BLOCK_PALETTE: BlockPaletteEntry[] = [
  {
    type: 'hero',
    label: 'Hero',
    description: 'Big eyebrow + headline + CTA',
    factory: () => ({
      type: 'hero',
      eyebrow: 'About Afrizonemart',
      heading: 'Africa, delivered.',
      subheading: 'Authentic groceries, beauty, fashion and home goods, shipped reliably across Nigeria.',
      ctaLabel: 'Start shopping',
      ctaHref: '/',
      image: 'https://images.afrizonemart.com/about/hero.jpg',
    }),
  },
  {
    type: 'rich-text',
    label: 'Rich text',
    description: 'HTML body — paste from a doc',
    factory: () => ({ type: 'rich-text', html: '<p>Your story here.</p>' }),
  },
  {
    type: 'banner',
    label: 'Banner',
    description: 'Full-width call-out strip',
    factory: () => ({ type: 'banner', text: 'Free shipping over ₦15,000', tone: 'amber' }),
  },
  {
    type: 'image',
    label: 'Image',
    description: 'Full-width image with optional caption',
    factory: () => ({ type: 'image', src: 'https://images.afrizonemart.com/...', alt: '' }),
  },
  {
    type: 'image-grid',
    label: 'Image grid',
    description: 'Up to 6 images side-by-side',
    factory: () => ({ type: 'image-grid', images: [] }),
  },
  {
    type: 'cta',
    label: 'CTA section',
    description: 'Centered heading + button',
    factory: () => ({
      type: 'cta',
      heading: 'Ready to start?',
      subheading: 'Join thousands of customers shopping Afrizonemart every day.',
      label: 'Sign up',
      href: '/register',
    }),
  },
  {
    type: 'divider',
    label: 'Divider',
    description: 'Thin horizontal line',
    factory: () => ({ type: 'divider' }),
  },
  {
    type: 'spacer',
    label: 'Spacer',
    description: 'Vertical breathing room',
    factory: () => ({ type: 'spacer', size: 48 }),
  },
];

export function renderBlocks(blocks: CmsBlock[]): React.ReactNode {
  // Each block gets its own boundary so a single malformed admin-authored
  // block can't take down the whole CMS page.
  return blocks.map((b, i) => (
    <SafeBoundary key={i} name={`cms:${b.type}`} fallback={null}>
      <BlockOne block={b} />
    </SafeBoundary>
  ));
}

function BlockOne({ block }: { block: CmsBlock }) {
  switch (block.type) {
    case 'hero':
      return (
        <section className="bg-page py-16 md:py-24">
          <div className="mx-auto grid max-w-site grid-cols-1 items-center gap-10 px-4 md:grid-cols-2">
            <div className="flex flex-col gap-4">
              {block.eyebrow && (
                <span className="font-raleway text-xs font-bold uppercase tracking-btn text-amber">
                  {block.eyebrow}
                </span>
              )}
              <h1 className="font-raleway text-3xl font-bold leading-tight text-navy md:text-5xl">
                {block.heading}
              </h1>
              {block.subheading && (
                <p className="font-sans text-base text-charcoal md:text-lg">{block.subheading}</p>
              )}
              {block.ctaLabel && block.ctaHref && (
                <div>
                  <Link
                    href={block.ctaHref}
                    className="inline-flex rounded-btn bg-navy px-6 py-3 font-raleway text-sm font-bold uppercase tracking-btn text-white shadow-card hover:bg-amber hover:text-navy"
                  >
                    {block.ctaLabel}
                  </Link>
                </div>
              )}
            </div>
            {block.image && (
              <div className="overflow-hidden rounded-card border border-border">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={block.image} alt={block.heading} className="h-full w-full object-cover" />
              </div>
            )}
          </div>
        </section>
      );
    case 'rich-text':
      return (
        <section className="py-10">
          <div
            className="prose prose-lg mx-auto max-w-prose px-4 text-charcoal"
            // eslint-disable-next-line react/no-danger
            dangerouslySetInnerHTML={{ __html: block.html }}
          />
        </section>
      );
    case 'banner': {
      const toneCls =
        block.tone === 'navy'
          ? 'bg-navy text-white'
          : block.tone === 'success'
            ? 'bg-success text-white'
            : 'bg-amber text-navy';
      const inner = (
        <div className={`px-4 py-4 text-center font-raleway text-sm font-bold uppercase tracking-btn ${toneCls}`}>
          {block.text}
        </div>
      );
      return block.href ? <Link href={block.href}>{inner}</Link> : inner;
    }
    case 'image':
      return (
        <section className="py-8">
          <figure className="mx-auto max-w-site px-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={block.src}
              alt={block.alt ?? ''}
              className="h-auto w-full rounded-card border border-border"
            />
            {block.caption && (
              <figcaption className="mt-2 text-center font-sans text-xs text-muted">
                {block.caption}
              </figcaption>
            )}
          </figure>
        </section>
      );
    case 'image-grid':
      return (
        <section className="py-8">
          <div className="mx-auto grid max-w-site grid-cols-2 gap-3 px-4 md:grid-cols-3 md:gap-4">
            {block.images.map((img, i) => {
              const tile = (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={img.src}
                  alt={img.alt ?? ''}
                  className="h-full w-full rounded-card border border-border object-cover"
                />
              );
              return (
                <div key={i} className="aspect-square overflow-hidden">
                  {img.href ? <Link href={img.href}>{tile}</Link> : tile}
                </div>
              );
            })}
          </div>
        </section>
      );
    case 'cta':
      return (
        <section className="bg-navy py-16 text-center text-white">
          <div className="mx-auto flex max-w-2xl flex-col items-center gap-3 px-4">
            <h2 className="font-raleway text-2xl font-bold md:text-4xl">{block.heading}</h2>
            {block.subheading && (
              <p className="font-sans text-base text-white/80">{block.subheading}</p>
            )}
            <Link
              href={block.href}
              className="mt-4 rounded-btn bg-amber px-6 py-3 font-raleway text-sm font-bold uppercase tracking-btn text-navy hover:bg-white"
            >
              {block.label}
            </Link>
          </div>
        </section>
      );
    case 'divider':
      return (
        <hr className="mx-auto my-10 max-w-site border-t border-border" />
      );
    case 'spacer':
      return <div style={{ height: `${block.size ?? 48}px` }} aria-hidden />;
    default:
      return null;
  }
}
