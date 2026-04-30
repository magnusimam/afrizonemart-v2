import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronRight, Home as HomeIcon } from 'lucide-react';
import { AboutProductSection } from '@/components/product/AboutProductSection';
import { DynamicFieldList } from '@/components/product/DynamicFieldDisplay';
import { ProductGallery } from '@/components/product/ProductGallery';
import { ProductInfo } from '@/components/product/ProductInfo';
import { RelatedProducts } from '@/components/product/RelatedProducts';
import { ReviewsSection } from '@/components/product/ReviewsSection';
import { NewsletterSection } from '@/components/sections/NewsletterSection';
import { TrustBarSection } from '@/components/sections/TrustBarSection';
import { listCustomFields } from '@/lib/api/admin';
import { getRelatedProducts, loadProductDetail } from '@/lib/products';
import { SafeBoundary } from '@/components/common/SafeBoundary';
import { SITE_NAME, SITE_URL, absUrl, metaDescription, productImageAlt } from '@/lib/seo';
import type { Metadata } from 'next';

interface PageProps {
  params: { slug: string };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const product = await loadProductDetail(params.slug);
  if (!product) {
    return {
      title: 'Product Not Found',
      robots: { index: false, follow: true },
    };
  }
  const title = product.brand
    ? `${product.name} — ${product.brand}`
    : product.name;
  const description = metaDescription(
    product.shortDescription || product.longDescription,
  );
  const url = `/product/${product.slug}`;
  const ogImage = product.images[0]?.src ?? undefined;
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
      images: ogImage ? [{ url: ogImage, alt: productImageAlt(product) }] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: ogImage ? [ogImage] : undefined,
    },
  };
}

export default async function ProductPage({ params }: PageProps) {
  const [product, customFieldsRes] = await Promise.all([
    loadProductDetail(params.slug),
    listCustomFields('PRODUCT'),
  ]);
  if (!product) notFound();

  const related = getRelatedProducts(params.slug);
  const customFieldDefs = customFieldsRes.items;

  // Schema.org structured data — Product JSON-LD for Google Shopping
  // + BreadcrumbList JSON-LD so Google shows breadcrumb chips in
  // search results. Both wrapped in a single @graph payload.
  const productUrl = `${SITE_URL}/product/${product.slug}`;
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Product',
        '@id': `${productUrl}#product`,
        name: product.name,
        brand: product.brand
          ? { '@type': 'Brand', name: product.brand }
          : undefined,
        description: metaDescription(product.shortDescription || product.longDescription),
        image: product.images.map((i) => i.src),
        sku: product.slug,
        category: product.category.name,
        countryOfOrigin: product.origin,
        aggregateRating:
          product.reviewCount > 0
            ? {
                '@type': 'AggregateRating',
                ratingValue: product.rating,
                reviewCount: product.reviewCount,
              }
            : undefined,
        offers: {
          '@type': 'Offer',
          url: productUrl,
          priceCurrency: 'NGN',
          price: product.price,
          availability: product.inStock
            ? 'https://schema.org/InStock'
            : 'https://schema.org/OutOfStock',
          itemCondition: 'https://schema.org/NewCondition',
          seller: { '@type': 'Organization', name: SITE_NAME },
        },
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: 'Home',
            item: SITE_URL,
          },
          {
            '@type': 'ListItem',
            position: 2,
            name: product.category.name,
            item: `${SITE_URL}/shop/${product.category.slug}`,
          },
          {
            '@type': 'ListItem',
            position: 3,
            name: product.name,
            item: productUrl,
          },
        ],
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
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
              <SafeBoundary name="pdp:gallery">
                <ProductGallery
                  images={product.images}
                  origin={product.origin}
                  discountPercent={product.discountPercent}
                />
              </SafeBoundary>
            </div>
            <div className="lg:col-span-6">
              <SafeBoundary name="pdp:info">
                <ProductInfo product={product} />
              </SafeBoundary>
            </div>
          </div>
        </section>

        {customFieldDefs.length > 0 && (
          <SafeBoundary name="pdp:dynamic-fields">
            <section className="border-t border-border bg-white py-10">
              <div className="mx-auto max-w-site px-4">
                <DynamicFieldList
                  defs={customFieldDefs}
                  attributes={product.attributes}
                />
              </div>
            </section>
          </SafeBoundary>
        )}

        <SafeBoundary name="pdp:about">
          <AboutProductSection
            title={product.aboutTitle}
            body={product.aboutBody}
            image={product.aboutImage}
            brand={product.brand}
          />
        </SafeBoundary>

        <SafeBoundary name="pdp:reviews">
          <ReviewsSection
            rating={product.rating}
            reviewCount={product.reviewCount}
            reviews={product.reviews}
          />
        </SafeBoundary>

        <SafeBoundary name="pdp:related">
          <RelatedProducts products={related} />
        </SafeBoundary>

        <SafeBoundary name="pdp:trust"><TrustBarSection /></SafeBoundary>
        <SafeBoundary name="pdp:newsletter"><NewsletterSection /></SafeBoundary>
      </main>
    </>
  );
}
