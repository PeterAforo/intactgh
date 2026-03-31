"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, ShoppingCart, Trash2, ArrowRight, Package, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/utils";
import { useWishlistStore } from "@/store/wishlist-store";
import { useCartStore, type CartProduct } from "@/store/cart-store";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = any;

export default function WishlistPage() {
  const { items, removeItemDB, removeItem, clearWishlist } = useWishlistStore();
  const addToCart = useCartStore((s) => s.addItem);
  const [wishlistProducts, setWishlistProducts] = useState<Any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    async function loadWishlist() {
      setLoading(true);
      // Try DB wishlist first (logged-in user)
      try {
        const res = await fetch("/api/wishlist");
        if (res.ok) {
          const data = await res.json();
          setWishlistProducts(data.items ?? []);
          setIsLoggedIn(true);
          setLoading(false);
          return;
        }
      } catch { /* fall through */ }
      // Guest: fetch all products and filter by local IDs
      try {
        const res = await fetch("/api/products?limit=200");
        const data = await res.json();
        const all: Any[] = data.products ?? [];
        setWishlistProducts(all.filter((p) => items.includes(p.id)));
      } catch { /* silent */ }
      setLoading(false);
    }
    loadWishlist();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRemove = async (productId: string) => {
    setWishlistProducts((prev) => prev.filter((p) => p.id !== productId));
    if (isLoggedIn) await removeItemDB(productId);
    else removeItem(productId);
  };

  const handleClearAll = async () => {
    setWishlistProducts([]);
    if (isLoggedIn) {
      await Promise.all(wishlistProducts.map((p) => removeItemDB(p.id)));
    } else {
      clearWishlist();
    }
  };

  const handleAddToCart = (product: Any) => {
    const cartProduct: CartProduct = {
      id: product.id,
      cartId: product.id,
      name: product.name,
      slug: product.slug,
      price: product.price,
      comparePrice: product.comparePrice,
      image: product.images[0]?.url || "",
      stock: product.stock,
    };
    addToCart(cartProduct);
  };

  return (
    <div className="min-h-screen bg-surface">
      <div className="max-w-7xl mx-auto px-4 py-8 md:py-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-text">My Wishlist</h1>
            <p className="text-text-muted text-sm mt-1">
              {wishlistProducts.length} {wishlistProducts.length === 1 ? "item" : "items"} saved
            </p>
          </div>
          {wishlistProducts.length > 0 && (
            <Button variant="outline" onClick={handleClearAll} className="rounded-xl text-sm">
              Clear All
            </Button>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="w-8 h-8 animate-spin text-accent" />
          </div>
        ) : wishlistProducts.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-20"
          >
            <div className="w-20 h-20 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <Heart className="w-10 h-10 text-accent" />
            </div>
            <h2 className="text-xl font-bold text-text mb-2">Your wishlist is empty</h2>
            <p className="text-text-muted mb-6">Save items you love to buy them later.</p>
            <Link href="/shop">
              <Button size="lg" className="rounded-xl">
                Browse Products <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </motion.div>
        ) : loading ? null : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            <AnimatePresence>
              {wishlistProducts.map((product, i) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: i * 0.05 }}
                  className="bg-white rounded-2xl border border-border/50 overflow-hidden group"
                >
                  <Link href={`/product/${product.slug}`}>
                    <div className="relative aspect-square bg-surface overflow-hidden">
                      {product.images[0]?.url ? (
                        <Image
                          src={product.images[0].url}
                          alt={product.name}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-500"
                          sizes="(max-width: 768px) 50vw, 25vw"
                        />
                      ) : (
                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                          <Package className="w-10 h-10 text-border" />
                          <span className="text-[10px] text-text-muted uppercase tracking-wider">No Image</span>
                        </div>
                      )}
                    </div>
                  </Link>
                  <div className="p-4">
                    {product.brand && (
                      <p className="text-xs text-text-muted uppercase tracking-wider mb-1">
                        {product.brand.name}
                      </p>
                    )}
                    <Link href={`/product/${product.slug}`}>
                      <h3 className="font-semibold text-sm text-text line-clamp-2 mb-2 hover:text-accent transition-colors">
                        {product.name}
                      </h3>
                    </Link>
                    <div className="flex items-center gap-2 mb-4">
                      <span className="text-lg font-bold text-accent">
                        {formatPrice(product.price)}
                      </span>
                      {product.comparePrice && product.comparePrice > product.price && (
                        <span className="text-sm text-text-muted line-through">
                          {formatPrice(product.comparePrice)}
                        </span>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleAddToCart(product)}
                        size="sm"
                        className="flex-1 rounded-xl text-xs"
                      >
                        <ShoppingCart className="w-3.5 h-3.5 mr-1.5" />
                        Add to Cart
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRemove(product.id)}
                        className="rounded-xl px-2.5"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-accent" />
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
