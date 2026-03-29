"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { Heart, ShoppingCart, Eye, Star, Package } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatPrice, getDiscountPercentage } from "@/lib/utils";
import { useCartStore, type CartProduct } from "@/store/cart-store";
import { useWishlistStore } from "@/store/wishlist-store";
interface ProductData {
  id: string;
  name: string;
  slug: string;
  price: number;
  comparePrice?: number | null;
  stock: number;
  rating: number;
  reviewCount: number;
  isNew: boolean;
  onSale: boolean;
  featured: boolean;
  images: { id: string; url: string; alt?: string | null }[];
  brand?: { id: string; name: string; slug: string } | null;
  category?: { id: string; name: string; slug: string } | null;
}

interface ProductCardProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  product: ProductData | any;
  index?: number;
}

export default function ProductCard({ product, index = 0 }: ProductCardProps) {
  const addItem = useCartStore((s) => s.addItem);
  const toggleWishlist = useWishlistStore((s) => s.toggleItemDB);
  const isInWishlist = useWishlistStore((s) => s.isInWishlist(product.id));

  const discount = product.comparePrice
    ? getDiscountPercentage(product.price, product.comparePrice)
    : 0;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const cartProduct: CartProduct = {
      id: product.id,
      name: product.name,
      slug: product.slug,
      price: product.price,
      comparePrice: product.comparePrice,
      image: product.images[0]?.url || "",
      stock: product.stock,
    };
    addItem(cartProduct);
  };

  const handleToggleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    void toggleWishlist(product.id);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.05, duration: 0.4 }}
    >
      <Link href={`/product/${product.slug}`} className="block group">
        <div className="product-card bg-white rounded-2xl border border-border/50 overflow-hidden">
          {/* Image Container */}
          <div className="relative aspect-square bg-surface overflow-hidden">
            {product.images?.[0]?.url ? (
              <Image
                src={product.images[0].url}
                alt={product.name}
                fill
                className="object-cover group-hover:scale-110 transition-transform duration-500"
                sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
              />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-surface gap-2">
                <Package className="w-10 h-10 text-border" />
                <span className="text-[10px] text-text-muted uppercase tracking-wider">No Image</span>
              </div>
            )}

            {/* Badges */}
            <div className="absolute top-3 left-3 flex flex-col gap-1.5">
              {product.isNew && <Badge variant="new">NEW</Badge>}
              {discount > 0 && <Badge variant="default">-{discount}%</Badge>}
              {product.onSale && !discount && <Badge variant="warning">SALE</Badge>}
            </div>

            {/* Quick Actions */}
            <div className="absolute top-3 right-3 flex flex-col gap-2 opacity-100 sm:opacity-0 sm:translate-x-3 sm:group-hover:opacity-100 sm:group-hover:translate-x-0 transition-all duration-300">
              <button
                onClick={handleToggleWishlist}
                className={`w-9 h-9 rounded-full flex items-center justify-center shadow-md transition-colors ${
                  isInWishlist
                    ? "bg-accent text-white"
                    : "bg-white text-text hover:bg-accent hover:text-white"
                }`}
              >
                <Heart className={`w-4 h-4 ${isInWishlist ? "fill-current" : ""}`} />
              </button>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  window.location.href = `/product/${product.slug}`;
                }}
                className="w-9 h-9 bg-white rounded-full flex items-center justify-center shadow-md hover:bg-primary hover:text-white transition-colors"
              >
                <Eye className="w-4 h-4" />
              </button>
            </div>

            {/* Add to Cart Overlay */}
            <div className="absolute bottom-0 left-0 right-0 p-3 translate-y-0 sm:translate-y-full sm:group-hover:translate-y-0 transition-transform duration-300">
              <Button
                onClick={handleAddToCart}
                className="w-full rounded-xl shadow-lg"
                size="sm"
              >
                <ShoppingCart className="w-4 h-4 mr-2" />
                Add to Cart
              </Button>
            </div>
          </div>

          {/* Product Info */}
          <div className="p-4">
            {/* Brand */}
            {product.brand && (
              <p className="text-xs text-text-muted font-medium uppercase tracking-wider mb-1">
                {product.brand.name}
              </p>
            )}

            {/* Name */}
            <h3 className="font-semibold text-sm text-text line-clamp-2 mb-2 group-hover:text-accent transition-colors min-h-[2.5rem]">
              {product.name}
            </h3>

            {/* Rating */}
            <div className="flex items-center gap-1.5 mb-2">
              <div className="flex items-center gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`w-3.5 h-3.5 ${
                      i < Math.floor(product.rating)
                        ? "text-gold fill-gold"
                        : "text-border"
                    }`}
                  />
                ))}
              </div>
              <span className="text-xs text-text-muted">({product.reviewCount})</span>
            </div>

            {/* Price */}
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold text-accent">
                {formatPrice(product.price)}
              </span>
              {product.comparePrice && product.comparePrice > product.price && (
                <span className="text-sm text-text-muted line-through">
                  {formatPrice(product.comparePrice)}
                </span>
              )}
            </div>

            {/* Stock Indicator */}
            {product.stock <= 5 && product.stock > 0 && (
              <p className="text-xs text-warning mt-2 font-medium">
                Only {product.stock} left in stock!
              </p>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
