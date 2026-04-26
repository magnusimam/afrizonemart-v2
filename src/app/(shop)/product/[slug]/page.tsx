import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronRight, Home as HomeIcon } from 'lucide-react';
import { ChatBubble } from '@/components/layout/ChatBubble';
import { Footer } from '@/components/layout/Footer';
import { Header } from '@/components/layout/Header';
import { AboutProductSection } from '@/components/product/AboutProductSection';
import { ProductGallery } from '@/components/product/ProductGallery';
import { ProductInfo } from '@/components/product/ProductInfo';
import { RelatedProducts } from '@/components/product/RelatedProducts';
import { ReviewsSection } from '@/components/product/ReviewsSection';
import { NewsletterSection } from '@/components/sections/NewsletterSection';
import { TrustBarSection } from '@/components/sections/TrustBarSection';
import { getProduct, getRelatedProducts } from '@/lib/products';
import type { Metadata } from 'next';

interface PageProps {
  params: { slug: string };
}

export function generateMetadata({ params }: PageProps): Metadata {
  const product = getProduct(params.slug);
  if (!product) return { title: 'Product Not Found' };
  return {
    title: `${product.name} — ${product.brand} | Afrizonemart`,
    description: product.shortDescription,
  };
}

export default function ProductPage({ params }: PageProps) {
  const product = getProduct(params.slug);
  if (!product) notFound();

  const related = getRelatedProducts(params.slug);

  return (
    <>
      <Header />
      <main className="bg-white">
        <nav
          aria-label="Breadcrumb"
          className="border-b border-border bg-page"
        >
          <ol className="mx-auto flex max-w-site items-center gap-1.5 overflow-x-auto px-4 py-3 font-sans text-xs text-muted md:text-sm">
            <li>
              <Link
                href="/"
                className="flex items-center gap-1 transition-colors hover:text-navy"
              >
                <HomeIcon size={14} aria-hidden /> Home
              </Link>
            </li>
            <li aria-hidden>
              <ChevronRight size={12} className="text-border" />
            </li>
            <li>
              <Link
                href={`/shop/${product.category.slug}`}
                className="transition-colors hover:text-navy"
              >
                {product.category.name}
              </Link>
            </li>
            <li aria-hidden>
              <ChevronRight size={12} className="text-border" />
            </li>
            <li>
              <span className="font-medium text-charcoal">{product.name}</span>
            </li>
          </ol>
        </nav>

        <section className="bg-white py-6 md:py-10">
          <div className="mx-auto grid max-w-site grid-cols-1 gap-8 px-4 lg:grid-cols-12 lg:gap-12">
            <div className="lg:col-span-6">
              <ProductGallery
                images={product.images}
                origin={product.origin}
                discountPercent={product.discountPercent}
              />
            </div>
            <div className="lg:col-span-6">
              <ProductInfo product={product} />
            </div>
          </div>
        </section>

        <AboutProductSection
          title={product.aboutTitle}
          body={product.aboutBody}
          image={product.aboutImage}
          brand={product.brand}
        />

        <ReviewsSection
          rating={product.rating}
          reviewCount={product.reviewCount}
          reviews={product.reviews}
        />

        <RelatedProducts products={related} />

        <TrustBarSection />
        <NewsletterSection />
      </main>
      <Footer />
      <ChatBubble />
    </>
  );
}
