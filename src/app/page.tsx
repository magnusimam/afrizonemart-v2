import { ChatBubble } from '@/components/layout/ChatBubble';
import { Footer } from '@/components/layout/Footer';
import { Header } from '@/components/layout/Header';
import { Hero } from '@/components/layout/Hero';
import { BooksSection } from '@/components/sections/BooksSection';
import { BrandBanner } from '@/components/sections/BrandBanner';
import { CategoriesSection } from '@/components/sections/CategoriesSection';
import { DealsSection } from '@/components/sections/DealsSection';
import { FavouritesSection } from '@/components/sections/FavouritesSection';
import { FemaleProductsSection } from '@/components/sections/FemaleProductsSection';
import { MixedCategoriesSection } from '@/components/sections/MixedCategoriesSection';
import { NewsletterSection } from '@/components/sections/NewsletterSection';
import { ProductsSection } from '@/components/sections/ProductsSection';
import { PurchaseBigSection } from '@/components/sections/PurchaseBigSection';
import { QuotationFormSection } from '@/components/sections/QuotationFormSection';
import { SatisfactionStrip } from '@/components/sections/SatisfactionStrip';
import { ServicesSection } from '@/components/sections/ServicesSection';
import { ShopByCategorySection } from '@/components/sections/ShopByCategorySection';
import { ShopByCountrySection } from '@/components/sections/ShopByCountrySection';
import { TrustBarSection } from '@/components/sections/TrustBarSection';
import { SafeBoundary } from '@/components/common/SafeBoundary';
import { PageRenderer } from '@/components/page-builder/PageRenderer';
import type { ReactNode } from 'react';

function S({ name, children }: { name: string; children: ReactNode }) {
  return <SafeBoundary name={`home:${name}`}>{children}</SafeBoundary>;
}

/// Hardcoded homepage layout. Used as the fallback when the page-builder
/// "home" page either doesn't exist or hasn't been published. As soon as
/// /admin/site-pages → home is published, the PageRenderer takes over and
/// this fallback never renders.
function HomeFallback() {
  return (
    <main>
      <S name="hero"><Hero /></S>
      <S name="categories"><CategoriesSection /></S>
      <S name="shop-by-country"><ShopByCountrySection /></S>
      <S name="products"><ProductsSection /></S>
      <S name="deals"><DealsSection /></S>
      <S name="favourites"><FavouritesSection /></S>
      <S name="shop-by-category"><ShopByCategorySection /></S>
      <S name="quotation-form"><QuotationFormSection /></S>
      <S name="female-products"><FemaleProductsSection /></S>
      <S name="purchase-big"><PurchaseBigSection /></S>
      <S name="brand-banner"><BrandBanner /></S>
      <S name="books"><BooksSection /></S>
      <S name="services"><ServicesSection /></S>
      <S name="mixed-categories"><MixedCategoriesSection /></S>
      <S name="satisfaction-strip"><SatisfactionStrip /></S>
      <S name="trust-bar"><TrustBarSection /></S>
      <S name="newsletter"><NewsletterSection /></S>
    </main>
  );
}

export default function Home() {
  return (
    <>
      <SafeBoundary name="header"><Header /></SafeBoundary>
      <main>
        <PageRenderer slug="home" fallback={<HomeFallback />} />
      </main>
      <SafeBoundary name="footer"><Footer /></SafeBoundary>
      <SafeBoundary name="chat-bubble"><ChatBubble /></SafeBoundary>
    </>
  );
}
