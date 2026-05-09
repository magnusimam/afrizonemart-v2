import { ChatBubble } from '@/components/layout/ChatBubble';
import { Footer } from '@/components/layout/Footer';
import { Header } from '@/components/layout/Header';
import { FloatingMobileCart } from '@/components/cart/FloatingMobileCart';
import { SafeBoundary } from '@/components/common/SafeBoundary';

/**
 * Shared chrome for every shop-side page (homepage uses its own copy
 * because it lives at app/page.tsx, outside this group).
 *
 * Header / Footer / ChatBubble are mounted here once and each is its
 * own <SafeBoundary> — so a Header crash won't take down the page body
 * (page content is rendered as `children` inside its own implicit
 * route boundary), and a Footer or ChatBubble crash won't propagate
 * to either.
 */
export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SafeBoundary name="chrome:header"><Header /></SafeBoundary>
      {children}
      <SafeBoundary name="chrome:footer"><Footer /></SafeBoundary>
      <SafeBoundary name="chrome:chat" fallback={null}>
        <ChatBubble />
      </SafeBoundary>
      <SafeBoundary name="chrome:floating-cart" fallback={null}>
        <FloatingMobileCart />
      </SafeBoundary>
    </>
  );
}
