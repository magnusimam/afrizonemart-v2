import { NewsletterSection } from '@/components/sections/NewsletterSection';
import type { ApiPageSection, NewsletterSectionConfig } from '@/lib/api/page-builder';
import { resolveAccentColor } from '../section-registry';

interface Props {
  section: ApiPageSection;
}

/// Wraps the existing NewsletterSection. The underlying component owns
/// the form + submit; this section optionally renders a builder-styled
/// header above it so admins can override the copy without us having
/// to fork the existing component.
export function BuilderNewsletterSection({ section }: Props) {
  const config = section.config as NewsletterSectionConfig;
  const headline = config.headline ?? section.headline ?? null;
  const subheadline = config.subheadline ?? section.subheadline ?? null;

  return (
    <>
      {(headline || subheadline) && (
        <div className="bg-page pt-10">
          <div className="mx-auto max-w-site px-4 text-center">
            {headline && (
              <>
                <div
                  className="mx-auto h-1 w-12 rounded-full"
                  style={{ backgroundColor: resolveAccentColor(section.accentColor) }}
                  aria-hidden
                />
                <h2 className="mt-3 font-raleway text-2xl font-bold text-navy md:text-3xl">
                  {headline}
                </h2>
              </>
            )}
            {subheadline && (
              <p className="mt-1 font-sans text-sm text-muted md:text-base">{subheadline}</p>
            )}
          </div>
        </div>
      )}
      <NewsletterSection />
    </>
  );
}
