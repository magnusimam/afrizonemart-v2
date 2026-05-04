import type { ApiPageSection, TrustBarSectionConfig } from '@/lib/api/page-builder';
import * as Icons from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface Props {
  section: ApiPageSection;
}

/// Horizontal bar of icon + label items — "free shipping over X",
/// "30-day returns", etc. Icon names map to lucide-react components by
/// PascalCase ("shield-check" → ShieldCheck). Falls back to a plain
/// circle if the name doesn't match.
export function BuilderTrustBarSection({ section }: Props) {
  const config = section.config as TrustBarSectionConfig;

  const resolveIcon = (name: string): LucideIcon => {
    const pascal = name
      .split(/[-_\s]/)
      .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : ''))
      .join('');
    const lib = Icons as unknown as Record<string, LucideIcon>;
    return lib[pascal] ?? Icons.Circle;
  };

  return (
    <section className="border-y border-border bg-white py-6">
      <div className="mx-auto grid max-w-site grid-cols-2 gap-4 px-4 md:grid-cols-4">
        {config.items.map((it, i) => {
          const Icon = resolveIcon(it.icon);
          return (
            <div key={`${it.label}-${i}`} className="flex items-start gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber/10 text-amber">
                <Icon size={18} aria-hidden />
              </span>
              <div className="flex flex-col">
                <span className="font-raleway text-sm font-bold text-navy">{it.label}</span>
                {it.sublabel && (
                  <span className="font-sans text-xs text-muted">{it.sublabel}</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
