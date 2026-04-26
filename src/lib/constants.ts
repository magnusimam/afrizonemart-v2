export const SITE = {
  name: 'Afrizonemart',
  tagline: 'Buy Everything Made in Africa — We Deliver Worldwide',
  url: 'https://afrizonemart.com',
} as const;

export const BRAND = {
  navy: '#000066',
  amber: '#FBAC34',
  page: '#F7F7F7',
  charcoal: '#2C2C2C',
  muted: '#555555',
  border: '#E8E8E8',
  success: '#1A6B2E',
  danger: '#C0392B',
} as const;

export const ROUTES = {
  home: '/',
  shop: '/shop',
  category: (slug: string) => `/shop/${slug}`,
  product: (slug: string) => `/product/${slug}`,
  cart: '/cart',
  checkout: '/checkout',
  checkoutSuccess: '/checkout/success',
  search: '/search',
  deals: '/deals',
  newArrivals: '/new-arrivals',
  account: '/account',
  orders: '/account/orders',
  order: (id: string) => `/account/orders/${id}`,
  addresses: '/account/addresses',
  wishlist: '/account/wishlist',
  login: '/login',
  register: '/register',
} as const;
