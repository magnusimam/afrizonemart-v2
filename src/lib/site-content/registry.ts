/**
 * Site-content slot registry — frontend mirror of
 * `afrizonemart-api/src/modules/content/registry.ts`. Kept in sync
 * manually until we extract a shared workspace package.
 *
 * The admin form reads from this registry to render the right input
 * for each slot. Storefront pages don't need to import it directly —
 * they use the typed helpers in `./index.ts` (getText, getImageList,
 * etc.) which fall back to the component-side defaults when no
 * override is set.
 */

export type SlotKind =
  | 'text'
  | 'longText'
  | 'image'
  | 'imageWithAlt'
  | 'imageList'
  | 'number'
  | 'boolean';

export interface SlotDef {
  key: string;
  label: string;
  page: string;
  section: string;
  kind: SlotKind;
  hint?: string;
  min?: number;
  max?: number;
}

export const SITE_CONTENT_SLOTS: readonly SlotDef[] = [
  {
    key: 'content.home.hero.slides',
    label: 'Hero slider images',
    page: 'Homepage',
    section: 'Hero',
    kind: 'imageList',
    hint: 'The rotating banner at the top. Each slide is an image + alt text.',
  },
  {
    key: 'content.home.products.headline',
    label: 'Headline',
    page: 'Homepage',
    section: 'Groceries shelf',
    kind: 'text',
    hint: 'Navy band text above the product grid.',
  },
  {
    key: 'content.home.products.deliveryNote',
    label: 'Delivery note',
    page: 'Homepage',
    section: 'Groceries shelf',
    kind: 'longText',
    hint: 'Amber strip under the headline. HTML supported.',
  },
  {
    key: 'content.home.shopByCountry.headline',
    label: 'Headline',
    page: 'Homepage',
    section: 'Shop by country',
    kind: 'text',
  },
  {
    key: 'content.home.deals.headline',
    label: 'Headline',
    page: 'Homepage',
    section: 'Deals shelf',
    kind: 'text',
  },
  {
    key: 'content.home.favourites.headline',
    label: 'Headline',
    page: 'Homepage',
    section: 'Favourites shelf',
    kind: 'text',
  },
  {
    key: 'content.home.shopByCategory.headline',
    label: 'Headline',
    page: 'Homepage',
    section: 'Shop by category',
    kind: 'text',
  },
  {
    key: 'content.home.female.headline',
    label: 'Headline',
    page: 'Homepage',
    section: 'For Her shelf',
    kind: 'text',
  },
  {
    key: 'content.home.purchaseBig.headline',
    label: 'Headline',
    page: 'Homepage',
    section: 'Buy Big shelf',
    kind: 'text',
  },
  {
    key: 'content.home.books.headline',
    label: 'Headline',
    page: 'Homepage',
    section: 'Books shelf',
    kind: 'text',
  },
  {
    key: 'content.home.brandBanner.image',
    label: 'Banner image',
    page: 'Homepage',
    section: 'Made-in-Africa banner',
    kind: 'imageWithAlt',
    hint: 'Full-width banner that sits between the Buy Big and Books shelves.',
  },
  {
    key: 'content.home.satisfactionStrip.text',
    label: 'Strip text',
    page: 'Homepage',
    section: 'Satisfaction strip',
    kind: 'text',
    hint: 'Single line on the amber strip near the bottom of the page.',
  },
];

export const SLOT_KEYS = SITE_CONTENT_SLOTS.map((s) => s.key);
