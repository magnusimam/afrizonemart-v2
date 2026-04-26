import type { CountryCode } from './countries';

export type OrderStatus =
  | 'pending'
  | 'paid'
  | 'processing'
  | 'shipped'
  | 'out-for-delivery'
  | 'delivered'
  | 'cancelled';

export interface MockOrderItem {
  productId: string;
  slug: string;
  name: string;
  variant?: string;
  price: number;
  quantity: number;
  origin?: CountryCode;
}

export interface MockOrder {
  id: string;
  status: OrderStatus;
  placedAt: string;
  total: number;
  itemCount: number;
  items: MockOrderItem[];
  shippingAddress: {
    fullName: string;
    line1: string;
    city: string;
    region: string;
    country: CountryCode;
  };
  trackingNumber?: string;
  carrier?: string;
  estimatedDelivery: string;
  paymentMethod: string;
}

export const MOCK_ORDERS: MockOrder[] = [
  {
    id: 'AZM-78451293',
    status: 'out-for-delivery',
    placedAt: '2026-04-23',
    total: 12340,
    itemCount: 3,
    items: [
      {
        productId: 'p1',
        slug: 'maya-himalaya-facial-scrub',
        name: 'Maya Himalaya Facial Scrub',
        variant: '3 Pack · 100ml',
        price: 9500,
        quantity: 1,
        origin: 'NG',
      },
      {
        productId: 'p2',
        slug: 'tara-bronzer',
        name: 'Tara Bronzer',
        price: 3200,
        quantity: 1,
        origin: 'EG',
      },
    ],
    shippingAddress: {
      fullName: 'Adaeze Okonkwo',
      line1: '12 Adeola Odeku Street, Apt 4B',
      city: 'Lagos',
      region: 'Lagos',
      country: 'NG',
    },
    trackingNumber: 'AZM-EXP-7G8H9J',
    carrier: 'Afrizonemart Express',
    estimatedDelivery: '2026-04-25',
    paymentMethod: 'Card · Visa •• 4242',
  },
  {
    id: 'AZM-78229410',
    status: 'shipped',
    placedAt: '2026-04-21',
    total: 24600,
    itemCount: 2,
    items: [
      {
        productId: 'p3',
        slug: 'four-cousins-sparkling-brut',
        name: 'Four Cousins Sparkling Brut 750ml × 6',
        price: 5974,
        quantity: 4,
        origin: 'ZA',
      },
    ],
    shippingAddress: {
      fullName: 'Adaeze Okonkwo',
      line1: '12 Adeola Odeku Street, Apt 4B',
      city: 'Lagos',
      region: 'Lagos',
      country: 'NG',
    },
    trackingNumber: 'AZM-AFCFTA-3K2L1M',
    carrier: 'AfCFTA Cross-Border',
    estimatedDelivery: '2026-04-28',
    paymentMethod: 'Mobile Money · OPay',
  },
  {
    id: 'AZM-77983201',
    status: 'delivered',
    placedAt: '2026-04-12',
    total: 6800,
    itemCount: 1,
    items: [
      {
        productId: 'p4',
        slug: 'we-naturals-moringa',
        name: 'We Naturals Moringa Powder Tin',
        price: 6800,
        quantity: 1,
        origin: 'NG',
      },
    ],
    shippingAddress: {
      fullName: 'Adaeze Okonkwo',
      line1: '12 Adeola Odeku Street, Apt 4B',
      city: 'Lagos',
      region: 'Lagos',
      country: 'NG',
    },
    trackingNumber: 'AZM-STD-9N8M7B',
    carrier: 'Afrizonemart Standard',
    estimatedDelivery: '2026-04-13',
    paymentMethod: 'Bank Transfer · GTBank',
  },
  {
    id: 'AZM-77654009',
    status: 'cancelled',
    placedAt: '2026-04-08',
    total: 1500,
    itemCount: 1,
    items: [
      {
        productId: 'p5',
        slug: 'big-bites-lemon',
        name: 'Big Bites Lemon 60cl',
        price: 150,
        quantity: 10,
        origin: 'NG',
      },
    ],
    shippingAddress: {
      fullName: 'Adaeze Okonkwo',
      line1: '12 Adeola Odeku Street, Apt 4B',
      city: 'Lagos',
      region: 'Lagos',
      country: 'NG',
    },
    estimatedDelivery: '—',
    paymentMethod: 'Refunded · Card',
  },
];

export function getMockOrder(id: string): MockOrder | undefined {
  return MOCK_ORDERS.find((o) => o.id === id);
}

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  pending: 'Pending',
  paid: 'Paid',
  processing: 'Processing',
  shipped: 'Shipped',
  'out-for-delivery': 'Out for Delivery',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

export const ORDER_STATUS_COLOR: Record<OrderStatus, string> = {
  pending: 'bg-amber/20 text-navy',
  paid: 'bg-success/15 text-success',
  processing: 'bg-amber/20 text-navy',
  shipped: 'bg-success/15 text-success',
  'out-for-delivery': 'bg-amber text-navy',
  delivered: 'bg-success text-white',
  cancelled: 'bg-danger/15 text-danger',
};

export interface MockAddress {
  id: string;
  label: string;
  fullName: string;
  phone: string;
  street: string;
  apartment?: string;
  city: string;
  region: string;
  country: CountryCode;
  postalCode?: string;
  isDefault?: boolean;
}

export const MOCK_ADDRESSES: MockAddress[] = [
  {
    id: 'addr-1',
    label: 'Home',
    fullName: 'Adaeze Okonkwo',
    phone: '+234 80 1234 5678',
    street: '12 Adeola Odeku Street',
    apartment: 'Apt 4B',
    city: 'Victoria Island',
    region: 'Lagos',
    country: 'NG',
    isDefault: true,
  },
  {
    id: 'addr-2',
    label: 'Office',
    fullName: 'Adaeze Okonkwo',
    phone: '+234 80 1234 5678',
    street: '7 Marina',
    city: 'Lagos Island',
    region: 'Lagos',
    country: 'NG',
  },
  {
    id: 'addr-3',
    label: "Mum's Place",
    fullName: 'Ngozi Okonkwo',
    phone: '+234 80 9876 5432',
    street: 'Plot 23, Independence Layout',
    city: 'Enugu',
    region: 'Enugu',
    country: 'NG',
  },
];

export interface MockWishlistItem {
  id: string;
  slug: string;
  name: string;
  price: number;
  comparePrice?: number;
  discountPercent?: number;
  origin: CountryCode;
}

export const MOCK_WISHLIST: MockWishlistItem[] = [
  {
    id: 'w1',
    slug: 'maya-himalaya-facial-scrub',
    name: 'Maya Himalaya Facial Scrub',
    price: 3800,
    comparePrice: 5000,
    discountPercent: 24,
    origin: 'NG',
  },
  {
    id: 'w2',
    slug: 'genuine-white-leather-couch',
    name: 'Genuine White Leather Couch',
    price: 215000,
    comparePrice: 280000,
    discountPercent: 23,
    origin: 'MA',
  },
  {
    id: 'w3',
    slug: 'tara-bronzer',
    name: 'Tara Bronzer',
    price: 3200,
    origin: 'EG',
  },
  {
    id: 'w4',
    slug: 'ann-chair-20',
    name: 'Ann Chair 20',
    price: 140000,
    origin: 'ZA',
  },
  {
    id: 'w5',
    slug: 'tastic-rice',
    name: 'Tastic Long Grain Rice 5kg',
    price: 6700,
    origin: 'ZA',
  },
];

export const MOCK_USER = {
  firstName: 'Adaeze',
  lastName: 'Okonkwo',
  email: 'adaeze@example.com',
  phone: '+234 80 1234 5678',
  country: 'NG' as CountryCode,
  joined: 'March 2025',
  loyaltyPoints: 1240,
};
