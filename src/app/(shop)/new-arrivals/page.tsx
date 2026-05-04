import { PageRenderer } from '@/components/page-builder/PageRenderer';
import { NewArrivalsPageClient } from './NewArrivalsPageClient';

/**
 * Server-component shell. The interactive client UI (Africa map +
 * country filter + product grid) renders as the fallback until an
 * admin publishes the "new-arrivals" page in the builder.
 */
export default function NewArrivalsPage() {
  return <PageRenderer slug="new-arrivals" fallback={<NewArrivalsPageClient />} />;
}
