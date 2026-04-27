import type { Metadata } from 'next';
import { Raleway } from 'next/font/google';
import { CartSyncProvider } from '@/components/providers/CartSyncProvider';
import { QueryProvider } from '@/components/providers/QueryProvider';
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
  return (
    <html lang="en" className={raleway.variable}>
      <body className="bg-page font-sans text-charcoal antialiased">
        <QueryProvider>
          <CartSyncProvider>{children}</CartSyncProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
