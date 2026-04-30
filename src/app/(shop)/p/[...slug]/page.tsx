import { notFound } from 'next/navigation';
import { renderBlocks, type CmsBlock } from '@/components/cms/PageBlocks';
import { SITE_NAME, absUrl, metaDescription } from '@/lib/seo';
import type { Metadata } from 'next';

interface PageProps {
  params: { slug: string[] };
}

interface CmsPageRow {
  id: string;
  slug: string;
  title: string;
  metaDescription: string | null;
  blocks: CmsBlock[];
}

async function loadPage(slug: string): Promise<CmsPageRow | null> {
  const base = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';
  try {
    const r = await fetch(`${base}/api/pages/${slug}`, { cache: 'no-store' });
    if (!r.ok) return null;
    return (await r.json()) as CmsPageRow;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const slug = params.slug.join('/');
  const page = await loadPage(slug);
  if (!page) {
    return {
      title: 'Page not found',
      robots: { index: false, follow: true },
    };
  }
  const url = `/p/${slug}`;
  const description = metaDescription(page.metaDescription);
  return {
    title: page.title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: 'article',
      url: absUrl(url),
      siteName: SITE_NAME,
      title: page.title,
      description,
    },
    twitter: { card: 'summary_large_image', title: page.title, description },
  };
}

export default async function CmsPageRoute({ params }: PageProps) {
  const slug = params.slug.join('/');
  const page = await loadPage(slug);
  if (!page) notFound();

  return (
    <>
      <main className="bg-white">{renderBlocks(page.blocks)}</main>
    </>
  );
}
