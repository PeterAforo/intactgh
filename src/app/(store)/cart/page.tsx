"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Minus,
  Plus,
  Trash2,
  ShoppingBag,
  ArrowRight,
  Truck,
  ShieldCheck,
  Tag,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatPrice } from "@/lib/utils";
import { useCartStore } from "@/store/cart-store";

export default function CartPage() {
  const { items, updateQuantity, removeItem, clearCart, getTotal } = useCartStore();

  const subtotal = getTotal();
  const shipping = subtotal >= 3000 ? 0 : 50;
  const total = subtotal + shipping;

  if (items.length === 0) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <ShoppingBag className="w-20 h-20 text-border mx-auto mb-6" />
          <h1 className="text-2xl font-bold text-text mb-3">Your Cart is Empty</h1>
          <p className="text-text-muted mb-8 max-w-md">
            Looks like you haven&apos;t added any products to your cart yet. 
            Start shopping to fill it up!
          </p>
          <Link href="/shop">
            <Button size="lg" className="rounded-full">
              Start Shopping
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface">
      <div className="max-w-7xl mx-auto px-4 py-8 md:py-12">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl font-bold text-text mb-8"
        >
          Shopping Cart ({items.length} item{items.length > 1 ? "s" : ""})
        </motion.h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            <AnimatePresence>
              {items.map((item) => (
                <motion.div
                  key={item.product.id}
                  layout
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20, height: 0 }}
                  className="bg-white rounded-2xl border border-border p-4 md:p-6 flex gap-4 md:gap-6"
                >
                  {/* Image */}
                  <Link href={`/product/${item.product.slug}`} className="shrink-0">
                    <div className="relative w-24 h-24 md:w-32 md:h-32 rounded-xl overflow-hidden bg-surface">
                      <Image
                        src={item.product.image}
                        alt={item.product.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                  </Link>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <Link href={`/product/${item.product.slug}`}>
                      <h3 className="font-semibold text-text hover:text-accent transition-colors line-clamp-2 mb-1">
                        {item.product.name}
                      </h3>
                    </Link>
                    {item.product.variantLabel && (
                      <p className="text-xs text-text-muted mb-1">{item.product.variantLabel}</p>
                    )}

                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-lg font-bold text-accent">
                        {formatPrice(item.product.price)}
                      </span>
                      {item.product.comparePrice && item.product.comparePrice > item.product.price && (
                        <span className="text-sm text-text-muted line-through">
                          {formatPrice(item.product.comparePrice)}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between">
                      {/* Quantity */}
                      <div className="flex items-center border border-border rounded-lg overflow-hidden">
                        <button
                          onClick={() => updateQuantity(item.product.cartId, item.quantity - 1)}
                          className="px-2.5 py-1.5 hover:bg-surface transition-colors"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="px-4 py-1.5 font-medium text-sm border-x border-border min-w-[40px] text-center">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.product.cartId, item.quantity + 1)}
                          className="px-2.5 py-1.5 hover:bg-surface transition-colors"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Subtotal */}
                      <span className="font-bold text-text hidden sm:block">
                        {formatPrice(item.product.price * item.quantity)}
                      </span>

                      {/* Remove */}
                      <button
                        onClick={() => removeItem(item.product.cartId)}
                        className="text-text-muted hover:text-accent transition-colors p-2"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            <div className="flex justify-between items-center pt-4">
              <Link href="/shop">
                <Button variant="ghost" className="text-accent">
                  Continue Shopping
                </Button>
              </Link>
              <Button variant="ghost" onClick={clearCart} className="text-text-muted hover:text-accent">
                <Trash2 className="w-4 h-4 mr-2" />
                Clear Cart
              </Button>
            </div>
          </div>

          {/* Order Summary */}
          <div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-2xl border border-border p-6 sticky top-24"
            >
              <h2 className="text-lg font-bold text-text mb-6">Order Summary</h2>

              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-sm">
                  <span className="text-text-light">Subtotal</span>
                  <span className="font-medium">{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-text-light">Shipping</span>
                  <span className="font-medium">
                    {shipping === 0 ? (
                      <span className="text-success">FREE</span>
                    ) : (
                      formatPrice(shipping)
                    )}
                  </span>
                </div>
                {shipping > 0 && (
                  <p className="text-xs text-text-muted bg-surface p-2 rounded-lg">
                    <Truck className="w-3.5 h-3.5 inline mr-1" />
                    Add {formatPrice(3000 - subtotal)} more for free delivery
                  </p>
                )}
                <div className="border-t border-border pt-3 flex justify-between">
                  <span className="font-bold text-text">Total</span>
                  <span className="font-bold text-xl text-accent">{formatPrice(total)}</span>
                </div>
              </div>

              {/* Coupon */}
              <div className="mb-6">
                <div className="flex gap-2">
                  <Input placeholder="Coupon code" className="rounded-lg bg-surface border-0 text-sm" />
                  <Button variant="outline" size="sm" className="shrink-0">
                    <Tag className="w-4 h-4 mr-1" />
                    Apply
                  </Button>
                </div>
              </div>

              <Link href="/checkout">
                <Button size="xl" className="w-full rounded-xl">
                  Proceed to Checkout
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>

              <div className="mt-4 flex items-center justify-center gap-2 text-xs text-text-muted">
                <ShieldCheck className="w-4 h-4" />
                Secure checkout - Your data is protected
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
