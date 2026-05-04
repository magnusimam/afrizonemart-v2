import type { ApiPageSection, TextStripSectionConfig } from '@/lib/api/page-builder';
import { resolveAccentColor } from '../section-registry';

interface Props {
  section: ApiPageSection;
}

/// Single-line accent banner — matches the homepage's
/// "For Your Ultimate Satisfaction" amber strip. Background uses the
/// section's accentColor (or the config's bgColor override). Text is
/// always white-on-color, uppercase, raleway-bold.
export function BuilderTextStripSection({ section }: Props) {
  const config = section.config as TextStripSectionConfig;
  const bg = config.bgColor ?? section.accentColor ?? 'amber';
  return (
    <div
      className="w-full py-3 text-center"
      style={{ backgroundColor: resolveAccentColor(bg) }}
    >
      <p className="font-raleway text-base font-bold uppercase tracking-btn text-navy md:text-lg">
        {config.text}
      </p>
    </div>
  );
}
