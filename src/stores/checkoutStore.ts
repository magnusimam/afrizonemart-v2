import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { DeliveryMethodId, PaymentMethodId } from '@/lib/checkout-data';
import type { ShippingQuote } from '@/lib/api/shipping';

export interface ShippingAddress {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  country: string;
  region: string;
  city: string;
  street: string;
  apartment?: string;
  postalCode?: string;
  instructions?: string;
}

export interface NotifyPrefs {
  email: boolean;
  sms: boolean;
  whatsapp: boolean;
}

interface CheckoutState {
  shipping?: ShippingAddress;
  deliveryMethod: DeliveryMethodId;
  /** ID of the API-driven ShippingRate the customer picked. */
  shippingRateId?: string;
  /// Phase 11 — the full quote object so the payment page can render
  /// price + ETA + provider without re-querying the API. `provider`
  /// is also forwarded to order-create so fulfilment knows which
  /// carrier to actually book (manual / gig / dhl …).
  selectedQuote?: ShippingQuote;
  notify: NotifyPrefs;
  paymentMethod?: PaymentMethodId;
  orderId?: string;
  setShipping: (address: ShippingAddress) => void;
  setDeliveryMethod: (id: DeliveryMethodId) => void;
  setShippingRateId: (id: string | undefined) => void;
  setSelectedQuote: (q: ShippingQuote | undefined) => void;
  setNotify: (prefs: NotifyPrefs) => void;
  setPaymentMethod: (id: PaymentMethodId | undefined) => void;
  setOrderId: (id: string) => void;
  reset: () => void;
}

export const useCheckoutStore = create<CheckoutState>()(
  persist(
    (set) => ({
      shipping: undefined,
      deliveryMethod: 'standard',
      shippingRateId: undefined,
      selectedQuote: undefined,
      notify: { email: true, sms: true, whatsapp: false },
      paymentMethod: undefined,
      orderId: undefined,
      setShipping: (address) => set({ shipping: address }),
      setDeliveryMethod: (id) => set({ deliveryMethod: id }),
      setShippingRateId: (id) => set({ shippingRateId: id }),
      setSelectedQuote: (q) => set({ selectedQuote: q }),
      setNotify: (prefs) => set({ notify: prefs }),
      setPaymentMethod: (id) => set({ paymentMethod: id }),
      setOrderId: (id) => set({ orderId: id }),
      reset: () =>
        set({
          shipping: undefined,
          deliveryMethod: 'standard',
          shippingRateId: undefined,
          selectedQuote: undefined,
          notify: { email: true, sms: true, whatsapp: false },
          paymentMethod: undefined,
          orderId: undefined,
        }),
    }),
    { name: 'azm-checkout' },
  ),
);
