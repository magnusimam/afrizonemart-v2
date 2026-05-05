'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { BlogPostForm } from '@/components/admin/BlogPostForm';

export default function NewBlogPostPage() {
  const router = useRouter();
  return (
    <div className="px-4 py-6 md:px-8 md:py-10">
      <Link
        href="/admin/blog"
        className="mb-3 inline-flex items-center gap-1 font-raleway text-[11px] font-bold uppercase tracking-btn text-muted hover:text-navy"
      >
        <ArrowLeft size={12} aria-hidden /> All posts
      </Link>
      <AdminPageHeader title="New blog post" subtitle="Draft, schedule, or publish straight away" />
      <BlogPostForm
        onSaved={(post) => {
          router.push(`/admin/blog/${post.id}`);
        }}
      />
    </div>
  );
}
