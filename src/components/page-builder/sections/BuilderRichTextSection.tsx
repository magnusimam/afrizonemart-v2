import type { ApiPageSection, RichTextSectionConfig } from '@/lib/api/page-builder';

interface Props {
  section: ApiPageSection;
}

/// Renders sanitised HTML produced by the rich-text editor. Trusted
/// because (1) only ADMIN-role users can write it via the admin UI,
/// (2) the editor strips disallowed tags. We still constrain styling
/// via prose classes so a rogue <h1> can't blow out the layout.
export function BuilderRichTextSection({ section }: Props) {
  const config = section.config as RichTextSectionConfig;
  const align = config.align === 'center' ? 'text-center' : 'text-left';
  return (
    <section className={`bg-white py-10 md:py-14 ${align}`}>
      <div className="mx-auto max-w-3xl px-4">
        {section.headline && (
          <h2 className="mb-4 font-raleway text-2xl font-bold text-navy md:text-3xl">
            {section.headline}
          </h2>
        )}
        <div
          className="prose prose-navy max-w-none font-sans text-base text-charcoal"
          dangerouslySetInnerHTML={{ __html: config.html }}
        />
      </div>
    </section>
  );
}
