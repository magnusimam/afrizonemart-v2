import type { Metadata } from 'next';
import { SITE_NAME, absUrl } from '@/lib/seo';

const TITLE = 'New Arrivals — Latest African-Made Products';
const DESCRIPTION =
  "This week's drops on Afrizonemart — fresh arrivals from makers across Africa. Curated, captioned, and shipped from the country of origin.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: '/new-arrivals' },
  openGraph: {
    type: 'website',
    url: absUrl('/new-arrivals'),
    siteName: SITE_NAME,
    title: TITLE,
    description: DESCRIPTION,
  },
  twitter: { card: 'summary_large_image', title: TITLE, description: DESCRIPTION },
};

export default function NewArrivalsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
