import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { DeliveryMethodId, PaymentMethodId } from '@/lib/checkout-data';

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
  notify: NotifyPrefs;
  paymentMethod?: PaymentMethodId;
  orderId?: string;
  setShipping: (address: ShippingAddress) => void;
  setDeliveryMethod: (id: DeliveryMethodId) => void;
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
      notify: { email: true, sms: true, whatsapp: false },
      paymentMethod: undefined,
      orderId: undefined,
      setShipping: (address) => set({ shipping: address }),
      setDeliveryMethod: (id) => set({ deliveryMethod: id }),
      setNotify: (prefs) => set({ notify: prefs }),
      setPaymentMethod: (id) => set({ paymentMethod: id }),
      setOrderId: (id) => set({ orderId: id }),
      reset: () =>
        set({
          shipping: undefined,
          deliveryMethod: 'standard',
          notify: { email: true, sms: true, whatsapp: false },
          paymentMethod: undefined,
          orderId: undefined,
        }),
    }),
    { name: 'azm-checkout' },
  ),
);
