'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { BlogPostForm } from '@/components/admin/BlogPostForm';
import { toast } from '@/components/admin/Toast';
import { adminGetBlogPost, type AdminBlogPost } from '@/lib/api/admin';

export default function EditBlogPostPage({ params }: { params: { id: string } }) {
  const [post, setPost] = useState<AdminBlogPost | null>(null);

  useEffect(() => {
    adminGetBlogPost(params.id)
      .then(setPost)
      .catch((e) => toast(e instanceof Error ? e.message : 'Failed to load', 'error'));
  }, [params.id]);

  if (!post) {
    return <div className="px-8 py-10 font-sans text-sm text-muted">Loading post…</div>;
  }

  return (
    <div className="px-8 py-10">
      <Link
        href="/admin/blog"
        className="mb-3 inline-flex items-center gap-1 font-raleway text-[11px] font-bold uppercase tracking-btn text-muted hover:text-navy"
      >
        <ArrowLeft size={12} aria-hidden /> All posts
      </Link>
      <AdminPageHeader
        title={post.title}
        subtitle={`/blog/${post.slug} · ${post.status}`}
        action={
          post.status === 'PUBLISHED' && (
            <Link
              href={`/blog/${post.slug}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 rounded-btn border border-border bg-white px-4 py-2 font-raleway text-xs font-bold uppercase tracking-btn text-navy hover:border-navy"
            >
              <ExternalLink size={14} aria-hidden /> View live
            </Link>
          )
        }
      />
      <BlogPostForm initial={post} onSaved={setPost} />
    </div>
  );
}
