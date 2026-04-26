import Link from 'next/link';
import { Heart, ShoppingCart, Trash2 } from 'lucide-react';
import { ChatBubble } from '@/components/layout/ChatBubble';
import { Footer } from '@/components/layout/Footer';
import { Header } from '@/components/layout/Header';
import { AccountSidebar } from '@/components/account/AccountSidebar';
import { ProductCardPlaceholder } from '@/components/product/ProductCardPlaceholder';
import { MOCK_USER, MOCK_WISHLIST } from '@/lib/mock-data';

export default function WishlistPage() {
  return (
    <>
      <Header />
      <main className="bg-page pb-12">
        <div className="mx-auto max-w-site px-4 py-6 md:py-10">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:gap-8">
            <div className="lg:col-span-3">
              <AccountSidebar
                active="/account/wishlist"
                userFirstName={MOCK_USER.firstName}
                userLastName={MOCK_USER.lastName}
              />
            </div>

            <div className="flex flex-col gap-5 lg:col-span-9">
              <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <h1 className="font-raleway text-2xl font-bold text-navy md:text-3xl">
                    Your Wishlist
                  </h1>
                  <p className="font-sans text-sm text-muted md:text-base">
                    {MOCK_WISHLIST.length} item{MOCK_WISHLIST.length === 1 ? '' : 's'} you love
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    className="flex items-center gap-1.5 rounded-btn border border-navy bg-white px-4 py-2 font-raleway text-xs font-bold uppercase tracking-btn text-navy hover:bg-navy hover:text-white"
                  >
                    <Trash2 size={14} aria-hidden />
                    Clear All
                  </button>
                  <button
                    type="button"
                    className="flex items-center gap-1.5 rounded-btn bg-navy px-4 py-2 font-raleway text-xs font-bold uppercase tracking-btn text-white hover:bg-amber hover:text-navy"
                  >
                    <ShoppingCart size={14} aria-hidden />
                    Add All to Cart
                  </button>
                </div>
              </header>

              {MOCK_WISHLIST.length === 0 ? (
                <div className="flex flex-col items-center gap-3 rounded-card border border-border bg-white p-12 text-center">
                  <Heart size={36} className="text-border" aria-hidden />
                  <p className="font-raleway text-base font-bold text-navy">
                    Your wishlist is empty
                  </p>
                  <p className="font-sans text-sm text-muted">
                    Tap the heart on any product to save it for later.
                  </p>
                  <Link
                    href="/"
                    className="rounded-btn bg-navy px-6 py-3 font-raleway text-xs font-bold uppercase tracking-btn text-white hover:bg-amber hover:text-navy"
                  >
                    Discover Products
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:gap-4 lg:grid-cols-4 xl:grid-cols-5">
                  {MOCK_WISHLIST.map((item) => (
                    <ProductCardPlaceholder
                      key={item.id}
                      id={item.id}
                      name={item.name}
                      price={item.price}
                      comparePrice={item.comparePrice}
                      discountPercent={item.discountPercent}
                      origin={item.origin}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
      <ChatBubble />
    </>
  );
}
