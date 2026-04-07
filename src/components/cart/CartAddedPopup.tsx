"use client";

import React, { useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, X, ShoppingBag, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCartPopupStore } from "@/store/cart-popup-store";
import { useCartStore } from "@/store/cart-store";
import { formatPrice } from "@/lib/utils";

export default function CartAddedPopup() {
  const { isOpen, product, quantity, close } = useCartPopupStore();
  const cartItemCount = useCartStore((s) => s.getItemCount());
  const cartTotal = useCartStore((s) => s.getTotal());

  // Auto-close after 6 seconds
  useEffect(() => {
    if (!isOpen) return;
    const timer = setTimeout(close, 6000);
    return () => clearTimeout(timer);
  }, [isOpen, close]);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isOpen, close]);

  return (
    <AnimatePresence>
      {isOpen && product && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-[9998]"
            onClick={close}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[9999] w-[92vw] max-w-md"
          >
            <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-border/50">
              {/* Header */}
              <div className="bg-green-50 border-b border-green-100 px-5 py-3.5 flex items-center justify-between">
                <div className="flex items-center gap-2 text-green-700">
                  <CheckCircle2 className="w-5 h-5" />
                  <span className="font-semibold text-sm">Added to Cart!</span>
                </div>
                <button
                  onClick={close}
                  className="text-green-600 hover:text-green-800 transition-colors p-1 rounded-lg hover:bg-green-100"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Product Info */}
              <div className="p-5">
                <div className="flex gap-4 items-center">
                  <div className="relative w-20 h-20 rounded-xl overflow-hidden bg-surface border border-border/50 shrink-0">
                    {product.image ? (
                      <Image
                        src={product.image}
                        alt={product.name}
                        fill
                        className="object-cover"
                        sizes="80px"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <ShoppingBag className="w-8 h-8 text-border" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-text text-sm line-clamp-2 mb-1">
                      {product.name}
                    </h4>
                    {product.variantLabel && (
                      <p className="text-xs text-text-muted mb-1">{product.variantLabel}</p>
                    )}
                    <div className="flex items-center gap-2">
                      <span className="text-accent font-bold text-sm">
                        {formatPrice(product.price)}
                      </span>
                      <span className="text-xs text-text-muted">× {quantity}</span>
                    </div>
                  </div>
                </div>

                {/* Cart Summary */}
                <div className="mt-4 bg-surface rounded-xl px-4 py-3 flex items-center justify-between">
                  <div className="text-xs text-text-muted">
                    <ShoppingBag className="w-3.5 h-3.5 inline mr-1" />
                    {cartItemCount} {cartItemCount === 1 ? "item" : "items"} in cart
                  </div>
                  <div className="text-sm font-bold text-text">
                    {formatPrice(cartTotal)}
                  </div>
                </div>
              </div>

              {/* Buttons */}
              <div className="px-5 pb-5 flex gap-3">
                <Button
                  variant="outline"
                  onClick={close}
                  className="flex-1 rounded-xl"
                >
                  Continue Shopping
                </Button>
                <Link href="/cart" onClick={close} className="flex-1">
                  <Button className="w-full rounded-xl bg-accent hover:bg-accent-hover">
                    Go to Cart
                    <ArrowRight className="w-4 h-4 ml-1.5" />
                  </Button>
                </Link>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
