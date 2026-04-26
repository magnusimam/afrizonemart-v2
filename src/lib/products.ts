export interface ProductBundle {
  units: number;
  label: string;
  price: number;
  comparePrice: number;
  savings?: number;
  popular?: boolean;
}

export type FeatureIcon = 'sparkles' | 'leaf' | 'globe' | 'shield' | 'heart' | 'check' | 'gem';

export interface ProductFeature {
  icon: FeatureIcon;
  text: string;
}

export interface ProductSpec {
  label: string;
  value: string;
}

export interface ProductImage {
  src: string;
  alt: string;
}

export interface ProductReview {
  id: string;
  author: string;
  country: string;
  rating: number;
  date: string;
  title: string;
  body: string;
  verified: boolean;
}

export interface ProductDetail {
  slug: string;
  name: string;
  brand: string;
  category: { name: string; slug: string };
  origin: string;
  rating: number;
  reviewCount: number;
  inStock: boolean;
  shortDescription: string;
  longDescription: string;
  price: number;
  comparePrice?: number;
  discountPercent?: number;
  variants?: { type: string; options: string[]; default: string };
  bundles: ProductBundle[];
  features: ProductFeature[];
  specifications: ProductSpec[];
  shipping: string;
  ingredients?: string;
  images: ProductImage[];
  aboutTitle: string;
  aboutBody: string;
  aboutImage: string;
  reviews: ProductReview[];
}

const products: ProductDetail[] = [
  {
    slug: 'maya-himalaya-facial-scrub',
    name: 'Maya Himalaya Facial Scrub',
    brand: 'Maya Naturals',
    category: { name: 'Beauty & Personal Care', slug: 'beauty' },
    origin: 'NG',
    rating: 4.8,
    reviewCount: 342,
    inStock: true,
    shortDescription:
      'Reveal radiant skin with our gentle exfoliating scrub — handcrafted with Himalayan minerals and West African shea butter.',
    longDescription:
      'Maya Himalaya Facial Scrub is a luxurious exfoliator that combines the mineral-rich power of Himalayan pink salt with creamy West African shea butter and East African rosehip oil. The result is a gentle yet effective scrub that buffs away dead skin without stripping your natural moisture barrier. Suitable for all skin types — including sensitive — and 100% cruelty-free. Each batch is hand-poured in our Lagos workshop in small runs to guarantee freshness.',
    price: 3800,
    comparePrice: 5000,
    discountPercent: 24,
    variants: {
      type: 'Size',
      options: ['50ml', '100ml', '200ml'],
      default: '100ml',
    },
    bundles: [
      { units: 1, label: '1 Pack', price: 3800, comparePrice: 5000 },
      { units: 3, label: '3 Pack', price: 9500, comparePrice: 15000, savings: 37, popular: true },
      { units: 6, label: '6 Pack', price: 17000, comparePrice: 30000, savings: 43 },
    ],
    features: [
      { icon: 'leaf', text: '100% natural ingredients sourced across Africa' },
      { icon: 'sparkles', text: 'Gentle exfoliation safe for daily use' },
      { icon: 'globe', text: 'Pan-African artisanal sourcing — Nigeria, Ghana, Kenya' },
      { icon: 'shield', text: 'Cruelty-free and dermatologist tested' },
    ],
    specifications: [
      { label: 'Net Weight', value: '120g' },
      { label: 'Dimensions', value: '5 × 5 × 8 cm' },
      { label: 'Skin Type', value: 'All skin types incl. sensitive' },
      { label: 'Origin', value: 'Lagos, Nigeria' },
      { label: 'Shelf Life', value: '24 months unopened' },
      { label: 'Vegan', value: 'Yes' },
    ],
    shipping:
      'Free shipping on orders over NGN10,000. Delivers in 1-3 hours within Lagos, 24-48 hours nationwide, and 5-10 business days internationally. 30-day no-questions-asked returns.',
    ingredients:
      'Sucrose, Coconut Oil, Glycerin, Himalayan Pink Salt, Shea Butter (Butyrospermum Parkii), Rosehip Oil, Vitamin E, Natural Fragrance, Plant-derived antioxidants.',
    images: [
      { src: '/images/categories/beauty.jpg', alt: 'Maya Himalaya Facial Scrub' },
      { src: '/images/featured/for-her.jpg', alt: 'Maya Himalaya Facial Scrub — lifestyle' },
      { src: '/images/categories/for-her.jpg', alt: 'Maya Himalaya Facial Scrub — in use' },
      { src: '/images/featured/home-essentials.jpg', alt: 'Maya Himalaya Facial Scrub — open jar' },
    ],
    aboutTitle: 'Reveal Your Natural Glow',
    aboutBody:
      "Maya Himalaya Facial Scrub is hand-crafted in Lagos using a centuries-old African beauty ritual reimagined for modern skin. Each batch combines Himalayan pink salt with shea butter from West Africa and rosehip oil from East African highlands — a true pan-African beauty experience that exfoliates without stripping. We work directly with women's cooperatives across the continent to source our ingredients, supporting over 200 families and ensuring every jar carries the story of Africa's natural beauty.",
    aboutImage: '/images/featured/for-her.jpg',
    reviews: [
      {
        id: 'r1',
        author: 'Adaeze O.',
        country: 'NG',
        rating: 5,
        date: '2 weeks ago',
        title: 'Skin transformation in 2 weeks',
        body: 'I have sensitive skin and most scrubs leave me red and irritated. Maya is the gentlest scrub I have ever used and my skin glows after every use. Will buy the 6-pack next time!',
        verified: true,
      },
      {
        id: 'r2',
        author: 'Naledi M.',
        country: 'ZA',
        rating: 5,
        date: '1 month ago',
        title: 'Best skincare from Africa',
        body: "Shipping to Joburg was fast and the packaging is gorgeous. The shea butter smell is heavenly. I love that it's truly pan-African.",
        verified: true,
      },
      {
        id: 'r3',
        author: 'Amina K.',
        country: 'KE',
        rating: 4,
        date: '3 weeks ago',
        title: 'Love the scent, wish jar was bigger',
        body: 'Excellent product but the 100ml goes fast if you use it 3x a week. Switched to the 200ml which is much better value.',
        verified: true,
      },
      {
        id: 'r4',
        author: 'Fatima B.',
        country: 'EG',
        rating: 5,
        date: '5 days ago',
        title: 'Glowing skin in Cairo',
        body: 'In our dry climate exfoliation is critical and most products feel harsh. This one is balm-like, my skin feels soft for hours.',
        verified: true,
      },
    ],
  },
];

export function getProduct(slug: string): ProductDetail | undefined {
  return products.find((p) => p.slug === slug);
}

export interface RelatedProduct {
  id: string;
  slug: string;
  name: string;
  price: number;
  comparePrice?: number;
  discountPercent?: number;
  origin?: string;
}

export function getRelatedProducts(currentSlug: string): RelatedProduct[] {
  const all: RelatedProduct[] = [
    { id: 'r1', slug: 'tara-half-dual-powder-palette', name: 'Tara Half-Dual Powder Palette', price: 4500, origin: 'EG' },
    { id: 'r2', slug: 'bi-bi-doll-browpencil', name: 'Bi Bi Doll Browpencil', price: 800, origin: 'NG' },
    { id: 'r3', slug: 'opera-silky-pressed-powder', name: 'Opera Silky Pressed Powder', price: 3500, origin: 'KE' },
    { id: 'r4', slug: 'tara-bronzer', name: 'Tara Bronzer', price: 3200, comparePrice: 4000, discountPercent: 20, origin: 'EG' },
    { id: 'r5', slug: 'snow-total-coverage-foundation', name: 'Snow Total Coverage Foundation', price: 4800, origin: 'ZA' },
    { id: 'r6', slug: 'fanda-lipstick', name: 'Fanda Lipstick', price: 1000, origin: 'NG' },
  ];
  return all.filter((p) => p.slug !== currentSlug);
}
