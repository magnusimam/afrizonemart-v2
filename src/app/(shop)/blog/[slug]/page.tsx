import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { ChevronRight, Clock, Home as HomeIcon } from 'lucide-react';
import { fetchBlogPost, fetchBlogPosts } from '@/lib/api/blog';
import { SITE_NAME, SITE_URL, absUrl } from '@/lib/seo';

interface PageProps {
  params: { slug: string };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const post = await fetchBlogPost(params.slug);
  if (!post) {
    return { title: 'Post not found — Afrizonemart Blog' };
  }
  const title = post.metaTitle ?? `${post.title} — Afrizonemart Blog`;
  const description = post.metaDescription ?? post.excerpt ?? `Read ${post.title} on Afrizonemart.`;
  const url = `/blog/${post.slug}`;
  const image = post.ogImage ?? post.heroImage ?? null;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: 'article',
      url: absUrl(url),
      siteName: SITE_NAME,
      title,
      description,
      publishedTime: post.publishedAt ?? undefined,
      authors: post.authorName ? [post.authorName] : undefined,
      tags: post.tags,
      images: image
        ? [{ url: image.startsWith('http') ? image : absUrl(image), alt: post.heroImageAlt ?? post.title }]
        : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: image ? [image.startsWith('http') ? image : absUrl(image)] : undefined,
    },
  };
}

export default async function BlogPostPage({ params }: PageProps) {
  const post = await fetchBlogPost(params.slug);
  if (!post) notFound();

  // 3 latest other posts for the "Continue reading" footer.
  const morePosts = await fetchBlogPosts({ limit: 4 });
  const related =
    morePosts?.items.filter((p) => p.slug !== post.slug).slice(0, 3) ?? [];

  // Article JSON-LD — Google Discover + rich result eligibility.
  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.metaDescription ?? post.excerpt ?? undefined,
    image: post.heroImage
      ? [post.heroImage.startsWith('http') ? post.heroImage : absUrl(post.heroImage)]
      : undefined,
    author: post.authorName
      ? { '@type': 'Person', name: post.authorName }
      : { '@type': 'Organization', name: SITE_NAME },
    publisher: {
      '@type': 'Organization',
      name: SITE_NAME,
      logo: { '@type': 'ImageObject', url: `${SITE_URL}/icon.png` },
    },
    datePublished: post.publishedAt ?? post.createdAt,
    dateModified: post.publishedAt ?? post.createdAt,
    mainEntityOfPage: { '@type': 'WebPage', '@id': absUrl(`/blog/${post.slug}`) },
    keywords: post.tags.join(', '),
  };

  const publishedLabel = post.publishedAt
    ? new Date(post.publishedAt).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : null;

  return (
    <main className="bg-white pb-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />

      <nav aria-label="Breadcrumb" className="border-b border-border bg-page">
        <ol className="mx-auto flex max-w-site items-center gap-1.5 px-4 py-3 font-sans text-xs text-muted md:text-sm">
          <li>
            <Link href="/" className="flex items-center gap-1 hover:text-navy">
              <HomeIcon size={14} aria-hidden /> Home
            </Link>
          </li>
          <li aria-hidden>
            <ChevronRight size={12} className="text-border" />
          </li>
          <li>
            <Link href="/blog" className="hover:text-navy">
              Blog
            </Link>
          </li>
          <li aria-hidden>
            <ChevronRight size={12} className="text-border" />
          </li>
          <li>
            <span className="line-clamp-1 font-medium text-charcoal">{post.title}</span>
          </li>
        </ol>
      </nav>

      <article className="mx-auto max-w-3xl px-4 py-10">
        {post.tags.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-1.5">
            {post.tags.map((t) => (
              <Link
                key={t}
                href={`/blog?tag=${encodeURIComponent(t)}`}
                className="rounded-full bg-amber/10 px-2.5 py-0.5 font-raleway text-[10px] font-bold uppercase tracking-btn text-amber hover:bg-amber/20"
              >
                {t}
              </Link>
            ))}
          </div>
        )}
        <h1 className="font-raleway text-3xl font-bold text-navy md:text-4xl lg:text-5xl">
          {post.title}
        </h1>
        {post.excerpt && (
          <p className="mt-4 font-sans text-lg text-muted">{post.excerpt}</p>
        )}
        <div className="mt-5 flex flex-wrap items-center gap-4 border-y border-border py-3 font-sans text-sm text-muted">
          <span className="font-medium text-charcoal">{post.authorName ?? 'Afrizonemart'}</span>
          {publishedLabel && <time dateTime={post.publishedAt ?? undefined}>{publishedLabel}</time>}
          {post.readingTimeMin && (
            <span className="flex items-center gap-1">
              <Clock size={14} aria-hidden /> {post.readingTimeMin} min read
            </span>
          )}
        </div>

        {post.heroImage && (
          <div className="relative my-8 aspect-[16/9] w-full overflow-hidden rounded-card">
            <Image
              src={post.heroImage}
              alt={post.heroImageAlt ?? post.title}
              fill
              priority
              sizes="(min-width: 768px) 768px, 100vw"
              className="object-cover"
            />
          </div>
        )}

        <div
          className="prose prose-navy mt-6 max-w-none font-sans text-base text-charcoal"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />
      </article>

      {related.length > 0 && (
        <section className="border-t border-border bg-page py-12">
          <div className="mx-auto max-w-site px-4">
            <h2 className="mb-6 font-raleway text-2xl font-bold text-navy">Continue reading</h2>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((p) => (
                <Link
                  key={p.id}
                  href={`/blog/${p.slug}`}
                  className="group flex flex-col overflow-hidden rounded-card border border-border bg-white shadow-sm transition-shadow hover:shadow-card"
                >
                  {p.heroImage ? (
                    <div className="relative aspect-[16/9] w-full">
                      <Image
                        src={p.heroImage}
                        alt={p.heroImageAlt ?? p.title}
                        fill
                        sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 90vw"
                        className="object-cover transition-transform group-hover:scale-105"
                      />
                    </div>
                  ) : (
                    <div className="flex aspect-[16/9] items-center justify-center bg-amber/10 font-raleway text-2xl font-bold text-amber">
                      {p.title.slice(0, 2).toUpperCase()}
                    </div>
                  )}
                  <div className="flex flex-1 flex-col gap-2 p-5">
                    <h3 className="font-raleway text-base font-bold text-navy group-hover:text-amber">
                      {p.title}
                    </h3>
                    {p.excerpt && (
                      <p className="line-clamp-2 font-sans text-sm text-muted">{p.excerpt}</p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </main>
  );
}
