import { CategoriesSection } from '@/components/sections/CategoriesSection';
import { listCategories } from '@/lib/api/categories';
import type {
  ApiPageSection,
  CategoryShelfSectionConfig,
} from '@/lib/api/page-builder';

interface Props {
  section: ApiPageSection;
}

/// Renders the homepage's "Everything Made in Africa" categories strip
/// by delegating to the existing CategoriesSection. The builder owns
/// the category list (slugs); the visual layout (scroll, card sizing,
/// chevrons) stays in code so admin edits can never change the design.
export async function BuilderCategoryShelfSection({ section }: Props) {
  const config = section.config as CategoryShelfSectionConfig;
  const slugs = config.categorySlugs ?? [];
  if (slugs.length === 0) return <CategoriesSection />;

  // Resolve slugs → display info from the live category tree so the
  // strip uses the real category names + images each one has been
  // assigned. Falls back to a humanised slug + the catch-all for-her
  // image when the slug isn't in the tree.
  const tree = await listCategories();
  const flat = tree.flatMap((c) => [c, ...(c.children ?? [])]);
  const items = slugs.map((slug) => {
    const found = flat.find((c) => c.slug === slug);
    return {
      name: found?.name ?? slug.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
      image: found?.image ?? '/images/categories/for-her.jpg',
      href: found?.parentId ? `/shop/${found.parentId}/${slug}` : `/shop/${slug}`,
    };
  });
  return <CategoriesSection categories={items} />;
}
