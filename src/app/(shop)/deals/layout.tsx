import type { Metadata } from 'next';
import { SITE_NAME, absUrl } from '@/lib/seo';

const TITLE = "Today's Deals — Discounts on African-Made Products";
const DESCRIPTION =
  'Shop the biggest discounts on African-made products today — beauty, fashion, groceries, home goods, and more. New deals every day on Afrizonemart.';

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: '/deals' },
  openGraph: {
    type: 'website',
    url: absUrl('/deals'),
    siteName: SITE_NAME,
    title: TITLE,
    description: DESCRIPTION,
  },
  twitter: { card: 'summary_large_image', title: TITLE, description: DESCRIPTION },
};

export default function DealsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
