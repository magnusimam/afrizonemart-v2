import Image from 'next/image';
import type { CustomFieldDef } from '@/lib/api/admin';

/**
 * Renders a custom field value on the storefront. Each type knows its
 * own visual treatment — a VIDEO URL becomes a YouTube/Vimeo iframe, an
 * IMAGE URL becomes a `<picture>`, a SELECT becomes a styled chip.
 */
export interface DynamicFieldDisplayProps {
  def: CustomFieldDef;
  value: unknown;
  className?: string;
}

export function DynamicFieldDisplay({ def, value, className }: DynamicFieldDisplayProps) {
  if (value === undefined || value === null || value === '') return null;

  return (
    <div className={className}>
      <span className="block font-raleway text-[10px] font-bold uppercase tracking-btn text-muted">
        {def.label}
      </span>
      <div className="mt-1 font-sans text-sm text-charcoal">{renderValue()}</div>
    </div>
  );

  function renderValue() {
    switch (def.type) {
      case 'TEXT':
      case 'LONGTEXT':
        return <p className="whitespace-pre-line">{String(value)}</p>;
      case 'RICHTEXT':
        return (
          <div
            className="prose prose-sm max-w-none text-charcoal"
            // eslint-disable-next-line react/no-danger
            dangerouslySetInnerHTML={{ __html: String(value) }}
          />
        );
      case 'NUMBER':
        return <span className="font-mono">{Number(value).toLocaleString()}</span>;
      case 'BOOLEAN':
        return <span>{value ? 'Yes' : 'No'}</span>;
      case 'URL':
        return (
          <a
            href={String(value)}
            target="_blank"
            rel="noopener noreferrer"
            className="text-navy underline hover:text-amber"
          >
            {String(value)}
          </a>
        );
      case 'VIDEO': {
        const url = String(value);
        const embed = toEmbedUrl(url);
        if (embed) {
          return (
            <div className="aspect-video w-full overflow-hidden rounded-card">
              <iframe
                src={embed}
                title={def.label}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                className="h-full w-full border-0"
              />
            </div>
          );
        }
        // Fallback: native HTML5 video for direct .mp4 etc.
        return (
          <video controls src={url} className="w-full rounded-card">
            Your browser does not support video.
          </video>
        );
      }
      case 'IMAGE': {
        const url = String(value);
        return (
          <div className="relative aspect-square w-full max-w-md overflow-hidden rounded-card border border-border">
            {/* Use plain img to avoid Next.js domain whitelist friction for
                user-supplied URLs. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={url} alt={def.label} className="h-full w-full object-cover" />
          </div>
        );
      }
      case 'SELECT':
        return (
          <span className="inline-flex rounded-full border border-border bg-page px-3 py-1 font-raleway text-xs font-semibold text-navy">
            {String(value)}
          </span>
        );
      case 'JSON':
        return (
          <pre className="overflow-x-auto rounded bg-page p-3 font-mono text-[11px] text-charcoal">
            {JSON.stringify(value, null, 2)}
          </pre>
        );
    }
  }
}

/**
 * Converts a YouTube or Vimeo URL into its embed form. Returns null for
 * anything else so the caller can fall back to a native `<video>` tag.
 */
function toEmbedUrl(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname === 'youtu.be') {
      return `https://www.youtube.com/embed/${u.pathname.slice(1)}`;
    }
    if (u.hostname.endsWith('youtube.com')) {
      const id = u.searchParams.get('v') ?? u.pathname.split('/').pop();
      if (id) return `https://www.youtube.com/embed/${id}`;
    }
    if (u.hostname.endsWith('vimeo.com')) {
      const id = u.pathname.split('/').filter(Boolean).pop();
      if (id) return `https://player.vimeo.com/video/${id}`;
    }
  } catch {
    /* not a URL we can parse */
  }
  return null;
}

// Convenience: render a list of custom fields that have values. Skips
// the ones the product hasn't filled in.
export function DynamicFieldList({
  defs,
  attributes,
}: {
  defs: CustomFieldDef[];
  attributes: Record<string, unknown>;
}) {
  const present = defs.filter((d) => {
    const v = attributes[d.key];
    return v !== undefined && v !== null && v !== '';
  });
  if (present.length === 0) return null;

  return (
    <section className="flex flex-col gap-6">
      {present.map((def) => (
        <DynamicFieldDisplay
          key={def.id}
          def={def}
          value={attributes[def.key]}
        />
      ))}
    </section>
  );
}

// Helps Next/Image and avoids the unused-import warning when this file
// is bundled but Image isn't actually rendered (we use raw <img> for now).
void Image;
