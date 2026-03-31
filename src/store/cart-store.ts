import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface CartProduct {
  id: string;
  cartId: string;         // unique per product+variant combo
  name: string;
  slug: string;
  price: number;          // adjusted price (base + variant adds)
  comparePrice?: number | null;
  image: string;
  stock: number;
  variantLabel?: string;  // e.g. "Color: Red · Storage: 256GB"
}

export interface CartItemType {
  product: CartProduct;
  quantity: number;
}

interface CartStore {
  items: CartItemType[];
  addItem: (product: CartProduct, quantity?: number) => void;
  removeItem: (cartId: string) => void;
  updateQuantity: (cartId: string, quantity: number) => void;
  clearCart: () => void;
  getTotal: () => number;
  getItemCount: () => number;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (product, quantity = 1) => {
        const items = get().items;
        const existingItem = items.find((item) => item.product.cartId === product.cartId);
        if (existingItem) {
          set({
            items: items.map((item) =>
              item.product.cartId === product.cartId
                ? { ...item, quantity: Math.min(item.quantity + quantity, product.stock) }
                : item
            ),
          });
        } else {
          set({ items: [...items, { product, quantity }] });
        }
      },
      removeItem: (cartId) => {
        set({ items: get().items.filter((item) => item.product.cartId !== cartId) });
      },
      updateQuantity: (cartId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(cartId);
          return;
        }
        set({
          items: get().items.map((item) =>
            item.product.cartId === cartId
              ? { ...item, quantity: Math.min(quantity, item.product.stock) }
              : item
          ),
        });
      },
      clearCart: () => set({ items: [] }),
      getTotal: () => {
        return get().items.reduce(
          (total, item) => total + item.product.price * item.quantity,
          0
        );
      },
      getItemCount: () => {
        return get().items.reduce((count, item) => count + item.quantity, 0);
      },
    }),
    { name: "intact-cart" }
  )
);
