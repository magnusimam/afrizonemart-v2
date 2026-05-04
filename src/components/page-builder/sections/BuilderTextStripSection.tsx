import { SatisfactionStrip } from '@/components/sections/SatisfactionStrip';
import type { ApiPageSection, TextStripSectionConfig } from '@/lib/api/page-builder';

interface Props {
  section: ApiPageSection;
}

/// Delegates to the existing SatisfactionStrip — full-width amber
/// banner with uppercase navy text. Admin only owns the text; the
/// design (colour, spacing, typography) stays in code.
export function BuilderTextStripSection({ section }: Props) {
  const config = section.config as TextStripSectionConfig;
  return <SatisfactionStrip text={config.text} />;
}
