import Link from 'next/link';

/**
 * Reusable internal-link chip row. Used on PDPs, category pages,
 * country pages, and the country×category landing pages to pass link
 * equity into peer SEO pages and give crawlers more paths between
 * deep surfaces.
 *
 * Self-hides when `chips` is empty so callers can compute the list
 * unconditionally and skip a parent `&&` check.
 */
export interface CrossLinkChip {
  href: string;
  label: string;
  /// Optional leading glyph — usually a country flag emoji. Skipped
  /// when absent.
  prefix?: string;
}

export interface CrossLinkChipsProps {
  title: string;
  hint?: string;
  chips: CrossLinkChip[];
}

export function CrossLinkChips({ title, hint, chips }: CrossLinkChipsProps) {
  if (chips.length === 0) return null;
  return (
    <section className="rounded-card border border-border bg-white p-5 md:p-6">
      <h2 className="font-raleway text-lg font-bold text-navy md:text-xl">
        {title}
      </h2>
      {hint ? (
        <p className="mt-1 font-sans text-sm text-muted">{hint}</p>
      ) : null}
      <ul className="mt-4 flex flex-wrap gap-2">
        {chips.map((c) => (
          <li key={c.href}>
            <Link
              href={c.href}
              className="inline-flex items-center gap-1.5 rounded-pill border border-border bg-page px-3 py-1.5 font-raleway text-xs font-semibold text-navy hover:border-amber hover:text-amber"
            >
              {c.prefix ? <span aria-hidden>{c.prefix}</span> : null}
              {c.label}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
