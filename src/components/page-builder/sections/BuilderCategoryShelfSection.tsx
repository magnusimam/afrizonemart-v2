import Image from 'next/image';
import Link from 'next/link';
import { listCategories } from '@/lib/api/categories';
import type {
  ApiPageSection,
  CategoryShelfSectionConfig,
} from '@/lib/api/page-builder';
import { resolveAccentColor } from '../section-registry';

interface Props {
  section: ApiPageSection;
}

/// Strip of category tiles. Layout 'grid' wraps; 'scroll' overflows
/// horizontally (mobile-friendly carousel without JS).
export async function BuilderCategoryShelfSection({ section }: Props) {
  const config = section.config as CategoryShelfSectionConfig;
  const all = await listCategories();
  const wanted = new Set(config.categorySlugs);
  // Flatten parent/children — category-shelf can reference subs too.
  const flat = all.flatMap((c) => [c, ...(c.children ?? [])]);
  const ordered = config.categorySlugs
    .map((slug) => flat.find((c) => c.slug === slug))
    .filter((c): c is NonNullable<typeof c> => Boolean(c) && wanted.has((c as { slug: string }).slug));

  if (ordered.length === 0) return null;

  const containerClass =
    config.layout === 'scroll'
      ? 'flex gap-4 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden'
      : 'grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6';

  return (
    <section className="bg-page py-10 md:py-14">
      <div className="mx-auto max-w-site px-4">
        {section.headline && (
          <header className="mb-6">
            <div
              className="h-1 w-12 rounded-full"
              style={{ backgroundColor: resolveAccentColor(section.accentColor) }}
              aria-hidden
            />
            <h2 className="mt-3 font-raleway text-2xl font-bold text-navy md:text-3xl">
              {section.headline}
            </h2>
          </header>
        )}

        <div className={containerClass}>
          {ordered.map((c) => (
            <Link
              key={c.id}
              href={c.parentId ? `/shop/${c.parentId}/${c.slug}` : `/shop/${c.slug}`}
              className={`group flex flex-col items-center gap-2 rounded-card border border-border bg-white p-4 transition-shadow hover:shadow-card ${
                config.layout === 'scroll' ? 'min-w-[140px] shrink-0' : ''
              }`}
            >
              {c.image ? (
                <div className="relative h-20 w-20 overflow-hidden rounded-full">
                  <Image
                    src={c.image}
                    alt={`${c.name} category`}
                    fill
                    sizes="80px"
                    className="object-cover"
                  />
                </div>
              ) : (
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-amber/10 font-raleway text-2xl font-bold text-amber">
                  {c.name[0]?.toUpperCase()}
                </div>
              )}
              <span className="text-center font-raleway text-xs font-semibold text-navy group-hover:text-amber">
                {c.name}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
