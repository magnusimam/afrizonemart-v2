'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ChevronLeft } from 'lucide-react';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { ProductForm } from '@/components/admin/ProductForm';
import { toast } from '@/components/admin/Toast';
import { HttpApiError } from '@/lib/api/client';
import {
  adminCreateProduct,
  adminListCategories,
  type AdminCategory,
  type AdminProductInput,
} from '@/lib/api/admin';

export default function NewProductPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    void adminListCategories().then((r) => setCategories(r.items)).catch(() => {});
  }, []);

  const handleSubmit = async (input: AdminProductInput) => {
    setSubmitting(true);
    try {
      const created = await adminCreateProduct(input);
      toast(`Created "${created.name}"`);
      router.push(`/admin/products/${created.id}/edit`);
    } catch (e) {
      toast(e instanceof HttpApiError ? e.message : 'Failed to create product', 'error');
      setSubmitting(false);
    }
  };

  return (
    <div className="px-8 py-10">
      <Link
        href="/admin/products"
        className="mb-3 inline-flex items-center gap-1 font-raleway text-xs font-semibold uppercase tracking-btn text-muted hover:text-navy"
      >
        <ChevronLeft size={14} aria-hidden /> Products
      </Link>
      <AdminPageHeader title="New product" subtitle="Create a new catalog entry." />

      <ProductForm
        categories={categories}
        submitting={submitting}
        submitLabel="Create product"
        onSubmit={handleSubmit}
        onCancel={() => router.push('/admin/products')}
      />
    </div>
  );
}
