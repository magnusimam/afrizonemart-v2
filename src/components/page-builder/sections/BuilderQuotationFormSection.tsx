import { QuotationFormSection } from '@/components/sections/QuotationFormSection';
import type { ApiPageSection, QuotationFormSectionConfig } from '@/lib/api/page-builder';

interface Props {
  section: ApiPageSection;
}

/// Wrapper around the existing QuotationFormSection. Underlying form
/// owns its own copy + handlers; this section optionally renders a
/// builder-styled header above so admins can override the heading
/// without us forking the component.
export function BuilderQuotationFormSection({ section }: Props) {
  const config = section.config as QuotationFormSectionConfig;
  const headline = config.headline ?? section.headline ?? null;
  const subheadline = config.subheadline ?? section.subheadline ?? null;

  return (
    <>
      {(headline || subheadline) && (
        <div className="bg-white pt-10">
          <div className="mx-auto max-w-site px-4 text-center">
            {headline && (
              <h2 className="font-raleway text-2xl font-bold text-navy md:text-3xl">
                {headline}
              </h2>
            )}
            {subheadline && (
              <p className="mt-1 font-sans text-sm text-muted md:text-base">{subheadline}</p>
            )}
          </div>
        </div>
      )}
      <QuotationFormSection />
    </>
  );
}
