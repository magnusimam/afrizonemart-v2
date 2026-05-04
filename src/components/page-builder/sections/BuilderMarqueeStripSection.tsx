import type { ApiPageSection, MarqueeStripSectionConfig } from '@/lib/api/page-builder';
import { resolveAccentColor } from '../section-registry';

interface Props {
  section: ApiPageSection;
}

/// Auto-scrolling text ticker — endless horizontal loop. Items are
/// duplicated inline so the CSS translate-X loop reads as continuous.
/// Used on /special-discount as the eye-catch under the hero.
export function BuilderMarqueeStripSection({ section }: Props) {
  const config = section.config as MarqueeStripSectionConfig;
  const items = config.items ?? [];
  if (items.length === 0) return null;
  const bg = resolveAccentColor(config.background ?? 'amber');
  const duration = `${config.durationSeconds ?? 30}s`;

  return (
    <div
      className="overflow-hidden border-b border-border py-3"
      style={{ backgroundColor: bg }}
    >
      <div
        className="flex gap-10 whitespace-nowrap"
        style={{ animation: `marquee-strip ${duration} linear infinite` }}
      >
        {[...items, ...items].map((it, i) => (
          <span
            key={i}
            className="font-raleway text-sm font-bold uppercase tracking-btn text-navy"
          >
            {it}
          </span>
        ))}
      </div>
      <style>{`
        @keyframes marquee-strip {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
}
