import { create } from "zustand";
import { persist } from "zustand/middleware";

interface WishlistStore {
  items: string[];
  addItem: (productId: string) => void;
  removeItem: (productId: string) => void;
  toggleItem: (productId: string) => void;
  isInWishlist: (productId: string) => boolean;
  clearWishlist: () => void;
  // DB sync — call these when user is logged in
  syncFromDB: () => Promise<void>;
  addItemDB: (productId: string) => Promise<void>;
  removeItemDB: (productId: string) => Promise<void>;
  toggleItemDB: (productId: string) => Promise<void>;
}

export const useWishlistStore = create<WishlistStore>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (productId) => {
        if (!get().items.includes(productId)) {
          set({ items: [...get().items, productId] });
        }
      },
      removeItem: (productId) => {
        set({ items: get().items.filter((id) => id !== productId) });
      },
      toggleItem: (productId) => {
        if (get().items.includes(productId)) get().removeItem(productId);
        else get().addItem(productId);
      },
      isInWishlist: (productId) => get().items.includes(productId),
      clearWishlist: () => set({ items: [] }),

      syncFromDB: async () => {
        try {
          const res = await fetch("/api/wishlist");
          if (!res.ok) return;
          const data = await res.json();
          const ids: string[] = (data.items ?? []).map((p: { id: string }) => p.id);
          set({ items: ids });
        } catch { /* silently fail */ }
      },

      addItemDB: async (productId) => {
        get().addItem(productId); // optimistic local update
        try {
          await fetch("/api/wishlist", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ productId }),
          });
        } catch { /* keep local state */ }
      },

      removeItemDB: async (productId) => {
        get().removeItem(productId); // optimistic local update
        try {
          await fetch(`/api/wishlist?productId=${productId}`, { method: "DELETE" });
        } catch { /* keep local state */ }
      },

      toggleItemDB: async (productId) => {
        if (get().items.includes(productId)) await get().removeItemDB(productId);
        else await get().addItemDB(productId);
      },
    }),
    { name: "intact-wishlist" }
  )
);
