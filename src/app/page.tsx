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
import { fetchSiteContent } from '@/lib/site-content';
import type { ReactNode } from 'react';

function S({ name, children }: { name: string; children: ReactNode }) {
  return <SafeBoundary name={`home:${name}`}>{children}</SafeBoundary>;
}

export default async function Home() {
  // Pull every admin-editable text/image override in one round-trip,
  // then pass the relevant ones to each section. Components hold their
  // own defaults — anything missing from `c` falls through to the
  // hardcoded design.
  const c = await fetchSiteContent();

  const heroSlides = c.getImageList('content.home.hero.slides', []);
  const brandBanner = c.getImageWithAlt('content.home.brandBanner.image', { url: '', alt: '' });
  const satisfactionText = c.getText('content.home.satisfactionStrip.text', '');

  return (
    <>
      <SafeBoundary name="header"><Header /></SafeBoundary>
      <main>
        <S name="hero">
          <Hero slides={heroSlides.length > 0 ? heroSlides.map((s) => ({ src: s.url, alt: s.alt })) : undefined} />
        </S>
        <S name="categories"><CategoriesSection /></S>
        <S name="shop-by-country">
          <ShopByCountrySection
            headline={c.getText('content.home.shopByCountry.headline', undefined as unknown as string) || undefined}
          />
        </S>
        <S name="products"><ProductsSection /></S>
        <S name="deals"><DealsSection /></S>
        <S name="favourites"><FavouritesSection /></S>
        <S name="shop-by-category">
          <ShopByCategorySection
            headline={c.getText('content.home.shopByCategory.headline', undefined as unknown as string) || undefined}
          />
        </S>
        <S name="quotation-form"><QuotationFormSection /></S>
        <S name="female-products"><FemaleProductsSection /></S>
        <S name="purchase-big"><PurchaseBigSection /></S>
        <S name="brand-banner">
          <BrandBanner
            src={brandBanner.url || undefined}
            alt={brandBanner.alt || undefined}
          />
        </S>
        <S name="books"><BooksSection /></S>
        <S name="services"><ServicesSection /></S>
        <S name="mixed-categories"><MixedCategoriesSection /></S>
        <S name="satisfaction-strip">
          <SatisfactionStrip text={satisfactionText || undefined} />
        </S>
        <S name="trust-bar"><TrustBarSection /></S>
        <S name="newsletter"><NewsletterSection /></S>
      </main>
      <SafeBoundary name="footer"><Footer /></SafeBoundary>
      <SafeBoundary name="chat-bubble"><ChatBubble /></SafeBoundary>
    </>
  );
}
