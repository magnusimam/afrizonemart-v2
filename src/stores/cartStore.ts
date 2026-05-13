import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CartItem } from '@/types';

interface CartState {
  items: CartItem[];
  /// Continental Rewards (Tracker #44 PR 3) — number of Afrizone
  /// Coins the customer wants to apply at checkout. Validated +
  /// debited server-side inside placeOrder. Persisted locally so
  /// the choice survives page reloads. Cleared on order placement
  /// (via clear()).
  coinRedeemRequest: number;
  setItems: (items: CartItem[]) => void;
  addItem: (item: Omit<CartItem, 'quantity'>, quantity?: number) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  setCoinRedeemRequest: (coins: number) => void;
  clear: () => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      coinRedeemRequest: 0,
      setItems: (items) => set({ items }),
      setCoinRedeemRequest: (coins) => set({ coinRedeemRequest: Math.max(0, Math.floor(coins)) }),
      addItem: (item, quantity = 1) =>
        set((state) => {
          const existing = state.items.find((i) => i.productId === item.productId);
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.productId === item.productId
                  ? { ...i, quantity: i.quantity + quantity }
                  : i,
              ),
            };
          }
          return { items: [...state.items, { ...item, quantity }] };
        }),
      removeItem: (productId) =>
        set((state) => ({
          items: state.items.filter((i) => i.productId !== productId),
        })),
      updateQuantity: (productId, quantity) =>
        set((state) => ({
          items:
            quantity <= 0
              ? state.items.filter((i) => i.productId !== productId)
              : state.items.map((i) =>
                  i.productId === productId ? { ...i, quantity } : i,
                ),
        })),
      clear: () => set({ items: [], coinRedeemRequest: 0 }),
    }),
    /// Tracker #45 — storage key bumped from 'azm-cart' to 'azm-cart-v2'.
    /// Old key stored synthetic productIds (`${slug}-${bundle}-${variant}`)
    /// that no longer match anything server-side. Bumping the key
    /// means every existing visitor lands on a fresh, clean cart the
    /// next time they hit the site, so the broken-checkout bug can't
    /// linger in stale localStorage.
    { name: 'azm-cart-v2' },
  ),
);

export const selectCartTotalQuantity = (state: CartState): number =>
  state.items.reduce((sum, i) => sum + i.quantity, 0);

export const selectCartTotalAmount = (state: CartState): number =>
  state.items.reduce((sum, i) => sum + i.price * i.quantity, 0);
