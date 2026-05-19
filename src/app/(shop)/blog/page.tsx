import Image from 'next/image';
import Link from 'next/link';
import type { Metadata } from 'next';
import { ChevronRight, Home as HomeIcon } from 'lucide-react';
import { fetchBlogPosts, fetchBlogTags } from '@/lib/api/blog';
import { SITE_NAME, absUrl } from '@/lib/seo';

interface PageProps {
  searchParams: { page?: string; tag?: string };
}

const PAGE_TITLE = 'Blog — Afrizonemart';
const PAGE_DESCRIPTION =
  'Stories, guides, and insights about African products, suppliers, and the people behind the Afrizonemart marketplace.';

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const tag = searchParams.tag?.trim();
  const title = tag ? `${tag} posts — Afrizonemart Blog` : PAGE_TITLE;
  const description = tag
    ? `Articles tagged "${tag}" on the Afrizonemart blog.`
    : PAGE_DESCRIPTION;
  const url = tag ? `/blog?tag=${encodeURIComponent(tag)}` : '/blog';
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: 'website',
      url: absUrl(url),
      siteName: SITE_NAME,
      title,
      description,
    },
    twitter: { card: 'summary_large_image', title, description },
  };
}

export default async function BlogIndexPage({ searchParams }: PageProps) {
  const page = Math.max(1, Number(searchParams.page ?? '1') || 1);
  const tag = searchParams.tag?.trim() || undefined;

  const [postsRes, tags] = await Promise.all([
    fetchBlogPosts({ page, limit: 12, tag }),
    fetchBlogTags(),
  ]);

  const posts = postsRes?.items ?? [];
  const pagination = postsRes?.pagination;

  return (
    <main className="bg-page pb-16">
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
            <span className="font-medium text-charcoal">Blog</span>
          </li>
          {tag && (
            <>
              <li aria-hidden>
                <ChevronRight size={12} className="text-border" />
              </li>
              <li>
                <span className="font-medium text-charcoal">{tag}</span>
              </li>
            </>
          )}
        </ol>
      </nav>

      <header className="mx-auto max-w-site px-4 py-8 md:py-12">
        <p className="font-raleway text-xs font-bold uppercase tracking-btn text-amber">Blog</p>
        <h1 className="mt-2 font-raleway text-3xl font-bold text-navy md:text-4xl">
          {tag ? `Posts tagged "${tag}"` : 'Stories from the African marketplace'}
        </h1>
        <p className="mt-2 max-w-2xl font-sans text-sm text-muted md:text-base">
          {PAGE_DESCRIPTION}
        </p>
      </header>

      {tags.length > 0 && (
        <section className="mb-6 border-y border-border bg-white">
          <div className="mx-auto flex max-w-site flex-wrap items-center gap-2 px-4 py-3">
            <Link
              href="/blog"
              className={`rounded-full px-3 py-1 font-raleway text-[11px] font-bold uppercase tracking-btn ${
                !tag
                  ? 'bg-navy text-white'
                  : 'bg-page text-charcoal hover:bg-amber/10 hover:text-navy'
              }`}
            >
              All
            </Link>
            {tags.map((t) => (
              <Link
                key={t}
                href={`/blog?tag=${encodeURIComponent(t)}`}
                className={`inline-flex min-h-[40px] items-center rounded-full px-4 font-raleway text-[11px] font-bold uppercase tracking-btn transition-colors ${
                  tag === t
                    ? 'bg-navy text-white'
                    : 'bg-page text-charcoal hover:bg-amber/10 hover:text-navy active:bg-amber/10 active:text-navy'
                }`}
              >
                {t}
              </Link>
            ))}
          </div>
        </section>
      )}

      <div className="mx-auto max-w-site px-4">
        {posts.length === 0 ? (
          <div className="rounded-card border border-border bg-white p-10 text-center font-sans text-sm text-muted">
            {tag ? `No posts yet tagged "${tag}".` : 'No posts published yet — check back soon.'}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((p) => (
              <PostCard key={p.id} post={p} />
            ))}
          </div>
        )}

        {pagination && pagination.pages > 1 && (
          <nav
            aria-label="Pagination"
            className="mt-10 flex items-center justify-center gap-2 font-sans text-sm"
          >
            {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((n) => {
              const href =
                n === 1
                  ? `/blog${tag ? `?tag=${encodeURIComponent(tag)}` : ''}`
                  : `/blog?page=${n}${tag ? `&tag=${encodeURIComponent(tag)}` : ''}`;
              const active = n === pagination.page;
              return (
                <Link
                  key={n}
                  href={href}
                  className={`inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-md px-3 transition-colors ${
                    active
                      ? 'bg-navy text-white'
                      : 'border border-border bg-white text-charcoal hover:border-navy active:border-navy'
                  }`}
                >
                  {n}
                </Link>
              );
            })}
          </nav>
        )}
      </div>
    </main>
  );
}

function PostCard({ post }: { post: Awaited<ReturnType<typeof fetchBlogPosts>> extends infer R ? R extends { items: infer I } ? I extends Array<infer P> ? P : never : never : never }) {
  return (
    <Link
      href={`/blog/${post.slug}`}
      className="group flex flex-col overflow-hidden rounded-card border border-border bg-white shadow-sm transition-shadow hover:shadow-card"
    >
      {post.heroImage ? (
        <div className="relative aspect-[16/9] w-full overflow-hidden">
          <Image
            src={post.heroImage}
            alt={post.heroImageAlt ?? post.title}
            fill
            sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 90vw"
            className="object-cover transition-transform group-hover:scale-105"
          />
        </div>
      ) : (
        <div className="flex aspect-[16/9] items-center justify-center bg-amber/10 font-raleway text-3xl font-bold text-amber">
          {post.title.slice(0, 2).toUpperCase()}
        </div>
      )}
      <div className="flex flex-1 flex-col gap-2 p-5">
        {post.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {post.tags.slice(0, 2).map((t) => (
              <span
                key={t}
                className="rounded-full bg-amber/10 px-2 py-0.5 font-raleway text-[10px] font-bold uppercase tracking-btn text-amber"
              >
                {t}
              </span>
            ))}
          </div>
        )}
        <h2 className="font-raleway text-lg font-bold text-navy group-hover:text-amber">
          {post.title}
        </h2>
        {post.excerpt && (
          <p className="line-clamp-3 font-sans text-sm text-muted">{post.excerpt}</p>
        )}
        <div className="mt-auto flex items-center justify-between pt-3 font-sans text-xs text-muted">
          <span>{post.authorName ?? 'Afrizonemart'}</span>
          {post.readingTimeMin && <span>{post.readingTimeMin} min read</span>}
        </div>
      </div>
    </Link>
  );
}
