import { fetchPage, type ApiPageSection } from '@/lib/api/page-builder';
import { SafeBoundary } from '@/components/common/SafeBoundary';
import { renderSection } from './section-registry';

interface Props {
  slug: string;
  /// Fallback rendered when the page doesn't exist or hasn't published.
  /// Pass null to render nothing.
  fallback?: React.ReactNode;
}

/**
 * Server component. Fetches the page's section list from the API and
 * dispatches each section to the matching renderer. Each section is
 * wrapped in a SafeBoundary so a single bad config can't take down
 * the whole page.
 */
export async function PageRenderer({ slug, fallback = null }: Props) {
  const page = await fetchPage(slug);
  if (!page) return <>{fallback}</>;

  return (
    <>
      {page.sections.map((section: ApiPageSection) => (
        <SafeBoundary key={section.id} name={`builder:${section.type}`} fallback={null}>
          {renderSection(section)}
        </SafeBoundary>
      ))}
    </>
  );
}
