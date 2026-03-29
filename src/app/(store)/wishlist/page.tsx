"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, ShoppingCart, Trash2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/utils";
import { useWishlistStore } from "@/store/wishlist-store";
import { useCartStore, type CartProduct } from "@/store/cart-store";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = any;

export default function WishlistPage() {
  const { items, removeItem, clearWishlist } = useWishlistStore();
  const addToCart = useCartStore((s) => s.addItem);
  const [allProducts, setAllProducts] = useState<Any[]>([]);

  useEffect(() => {
    fetch("/api/products?limit=100").then(r => r.json()).then(d => {
      if (d.products) setAllProducts(d.products);
    }).catch(() => {});
  }, []);

  const wishlistProducts = allProducts.filter((p: Any) => items.includes(p.id));

  const handleAddToCart = (product: Any) => {
    const cartProduct: CartProduct = {
      id: product.id,
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
            <Button variant="outline" onClick={clearWishlist} className="rounded-xl text-sm">
              Clear All
            </Button>
          )}
        </div>

        {wishlistProducts.length === 0 ? (
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
        ) : (
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
                      <Image
                        src={product.images[0]?.url || "/placeholder.svg"}
                        alt={product.name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                        sizes="(max-width: 768px) 50vw, 25vw"
                      />
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
                        onClick={() => removeItem(product.id)}
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
