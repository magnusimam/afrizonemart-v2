import type { CountryCode } from './countries';

export const COUNTRY_REGIONS: Partial<Record<CountryCode, string[]>> = {
  NG: [
    'Lagos', 'FCT (Abuja)', 'Rivers', 'Kano', 'Oyo', 'Kaduna', 'Anambra', 'Edo',
    'Delta', 'Enugu', 'Imo', 'Akwa Ibom', 'Plateau', 'Cross River', 'Ogun', 'Osun',
    'Ondo', 'Ekiti', 'Kogi', 'Niger', 'Benue', 'Adamawa', 'Borno', 'Yobe',
    'Bauchi', 'Gombe', 'Taraba', 'Sokoto', 'Kebbi', 'Zamfara', 'Katsina', 'Jigawa',
    'Nasarawa', 'Bayelsa', 'Abia', 'Ebonyi',
  ],
  KE: [
    'Nairobi', 'Mombasa', 'Kisumu', 'Nakuru', 'Eldoret', 'Kiambu', 'Machakos',
    'Kakamega', 'Uasin Gishu', 'Kilifi', 'Kwale', 'Meru', 'Nyeri', 'Kericho',
    'Nyandarua', 'Other',
  ],
  ZA: [
    'Gauteng', 'Western Cape', 'KwaZulu-Natal', 'Eastern Cape', 'Free State',
    'Limpopo', 'Mpumalanga', 'North West', 'Northern Cape',
  ],
  EG: [
    'Cairo', 'Alexandria', 'Giza', 'Qalyubia', 'Sharqia', 'Dakahlia', 'Beheira',
    'Minya', 'Asyut', 'Sohag', 'Aswan', 'Luxor', 'Other',
  ],
  GH: [
    'Greater Accra', 'Ashanti', 'Western', 'Eastern', 'Central', 'Volta',
    'Northern', 'Upper East', 'Upper West', 'Brong-Ahafo',
  ],
};

export type DeliveryMethodId = 'express' | 'standard' | 'pickup' | 'afcfta';

export interface DeliveryMethod {
  id: DeliveryMethodId;
  label: string;
  eta: string;
  price: number;
  description: string;
  icon: 'zap' | 'package' | 'store' | 'globe';
}

export const DELIVERY_METHODS: DeliveryMethod[] = [
  {
    id: 'express',
    label: 'Express Delivery',
    eta: '1 hr (Lagos) · 24 hrs nationwide · 3-5 days international',
    price: 3000,
    description: 'Fastest option. Priority handling and direct route.',
    icon: 'zap',
  },
  {
    id: 'standard',
    label: 'Standard Delivery',
    eta: '1-3 hrs (Lagos) · 24-48 hrs nationwide · 5-10 days intl',
    price: 1500,
    description: 'Reliable, tracked, and the most popular choice.',
    icon: 'package',
  },
  {
    id: 'pickup',
    label: 'Store Pickup',
    eta: 'Same day · Any AfriZoneMart partner store',
    price: 0,
    description: 'Free. Collect at your nearest pickup location.',
    icon: 'store',
  },
  {
    id: 'afcfta',
    label: 'AfCFTA Pan-African Shipping',
    eta: '5-10 days to any Free Trade Agreement member country',
    price: 2500,
    description: 'Trade Agreement preferential rates across Africa.',
    icon: 'globe',
  },
];

export type PaymentMethodId =
  | 'card'
  | 'mobile-money'
  | 'bank-transfer'
  | 'ussd'
  | 'crypto'
  | 'pay-on-delivery';

export interface PaymentMethod {
  id: PaymentMethodId;
  label: string;
  description: string;
  icon: 'credit-card' | 'smartphone' | 'building-2' | 'hash' | 'bitcoin' | 'truck';
  popular?: boolean;
}

export const PAYMENT_METHODS: PaymentMethod[] = [
  {
    id: 'card',
    label: 'Card',
    description: 'Visa · Mastercard · Verve · American Express',
    icon: 'credit-card',
    popular: true,
  },
  {
    id: 'mobile-money',
    label: 'Mobile Money',
    description: 'M-Pesa · MTN MoMo · OPay · Orange Money · Vodafone Cash',
    icon: 'smartphone',
    popular: true,
  },
  {
    id: 'bank-transfer',
    label: 'Bank Transfer',
    description: 'Direct deposit to our verified Africa-wide accounts',
    icon: 'building-2',
  },
  {
    id: 'ussd',
    label: 'USSD / Bank Code',
    description: 'Pay from your bank using a USSD code — no internet needed',
    icon: 'hash',
  },
  {
    id: 'crypto',
    label: 'Crypto',
    description: 'BitCoin · USDT · ETH — instant settlement',
    icon: 'bitcoin',
  },
  {
    id: 'pay-on-delivery',
    label: 'Pay on Delivery',
    description: 'Cash or card at the doorstep — Lagos, Nairobi, Accra only',
    icon: 'truck',
  },
];

export interface MobileMoneyProvider {
  code: string;
  name: string;
  countries: CountryCode[];
}

export const MOBILE_MONEY_PROVIDERS: MobileMoneyProvider[] = [
  { code: 'mpesa', name: 'M-Pesa', countries: ['KE', 'TZ', 'UG'] },
  { code: 'mtn-momo', name: 'MTN MoMo', countries: ['NG', 'GH', 'UG', 'RW', 'CM', 'CI'] },
  { code: 'airtel-money', name: 'Airtel Money', countries: ['KE', 'TZ', 'UG', 'RW', 'NG'] },
  { code: 'opay', name: 'OPay', countries: ['NG'] },
  { code: 'palmpay', name: 'PalmPay', countries: ['NG'] },
  { code: 'orange-money', name: 'Orange Money', countries: ['EG', 'ML', 'SN', 'CI'] },
  { code: 'vodafone-cash', name: 'Vodafone Cash', countries: ['EG', 'GH'] },
  { code: 'tigo-pesa', name: 'Tigo Pesa', countries: ['TZ'] },
  { code: 'snapscan', name: 'SnapScan', countries: ['ZA'] },
];

export const NIGERIAN_BANKS = [
  'Access Bank', 'GTBank', 'Zenith Bank', 'First Bank', 'UBA', 'Sterling Bank',
  'Fidelity Bank', 'Wema Bank', 'Stanbic IBTC', 'Ecobank', 'FCMB', 'Polaris Bank',
  'Union Bank', 'Heritage Bank', 'Keystone Bank', 'Providus Bank',
];

export const USSD_CODES: Record<string, string> = {
  'Access Bank': '*901*000*[Amount]#',
  'GTBank': '*737*000*[Amount]#',
  'Zenith Bank': '*966*000*[Amount]#',
  'First Bank': '*894*000*[Amount]#',
  'UBA': '*919*000*[Amount]#',
  'Sterling Bank': '*822*000*[Amount]#',
  'Fidelity Bank': '*770*000*[Amount]#',
};
