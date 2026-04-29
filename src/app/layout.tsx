import type { Metadata } from 'next';
import { Raleway } from 'next/font/google';
import { headers } from 'next/headers';
import { AnalyticsProvider } from '@/components/providers/AnalyticsProvider';
import { CartSyncProvider } from '@/components/providers/CartSyncProvider';
import { QueryProvider } from '@/components/providers/QueryProvider';
import { GeoProvider } from '@/components/providers/GeoProvider';
import { GoogleTranslate } from '@/components/providers/GoogleTranslate';
import {
  GoogleTagManagerHead,
  GoogleTagManagerNoScript,
} from '@/components/providers/GoogleTagManager';
import { GeoBanner } from '@/components/common/GeoBanner';
import './globals.css';

const raleway = Raleway({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-raleway',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Afrizonemart — Buy Everything Made in Africa',
  description:
    'Afrizonemart — the marketplace for African-made products. Delivered worldwide.',
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const h = headers();
  const country = h.get('x-azm-country') ?? 'NG';
  const currency = h.get('x-azm-currency') ?? 'NGN';

  return (
    <html lang="en" className={raleway.variable}>
      <head>
        <GoogleTagManagerHead />
      </head>
      <body className="bg-page font-sans text-charcoal antialiased">
        <GoogleTagManagerNoScript />
        <AnalyticsProvider>
          <QueryProvider>
            <GeoProvider initialCountry={country} initialCurrency={currency}>
              <CartSyncProvider>
                <GeoBanner />
                {children}
                <GoogleTranslate />
              </CartSyncProvider>
            </GeoProvider>
          </QueryProvider>
        </AnalyticsProvider>
      </body>
    </html>
  );
}
