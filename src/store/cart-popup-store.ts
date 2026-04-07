import { create } from "zustand";
import type { CartProduct } from "./cart-store";

interface CartPopupStore {
  isOpen: boolean;
  product: CartProduct | null;
  quantity: number;
  open: (product: CartProduct, quantity?: number) => void;
  close: () => void;
}

export const useCartPopupStore = create<CartPopupStore>((set) => ({
  isOpen: false,
  product: null,
  quantity: 1,
  open: (product, quantity = 1) => set({ isOpen: true, product, quantity }),
  close: () => set({ isOpen: false, product: null, quantity: 1 }),
}));
