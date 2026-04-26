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

export default function Home() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <CategoriesSection />
        <ShopByCountrySection />
        <ProductsSection />
        <DealsSection />
        <FavouritesSection />
        <ShopByCategorySection />
        <QuotationFormSection />
        <FemaleProductsSection />
        <PurchaseBigSection />
        <BrandBanner />
        <BooksSection />
        <ServicesSection />
        <MixedCategoriesSection />
        <SatisfactionStrip />
        <TrustBarSection />
        <NewsletterSection />
      </main>
      <Footer />
      <ChatBubble />
    </>
  );
}
