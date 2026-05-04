import { PageRenderer } from '@/components/page-builder/PageRenderer';
import { DealsPageClient } from './DealsPageClient';

/**
 * Server-component shell. Until an admin publishes the "deals" page in
 * the builder, the existing client-component implementation
 * (timer-driven UI) renders as the fallback. Publishing flips the
 * storefront to render the section list instead.
 */
export default function DealsPage() {
  return <PageRenderer slug="deals" fallback={<DealsPageClient />} />;
}
