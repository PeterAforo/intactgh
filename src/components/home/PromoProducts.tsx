"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { Flame, Clock, Tag, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCartStore } from "@/store/cart-store";
import { useCartPopupStore } from "@/store/cart-popup-store";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = any;

function formatPrice(price: number) {
  return `GH₵${price.toLocaleString("en-GH", { minimumFractionDigits: 2 })}`;
}

function Countdown({ endDate }: { endDate: string }) {
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    const tick = () => {
      const diff = new Date(endDate).getTime() - Date.now();
      if (diff <= 0) { setTimeLeft("Ended"); return; }
      const d = Math.floor(diff / 86400000);
      const h = Math.floor((diff % 86400000) / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setTimeLeft(d > 0 ? `${d}d ${h}h ${m}m` : `${h}h ${m}m ${s}s`);
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [endDate]);

  return (
    <span className="flex items-center gap-1 text-xs font-semibold text-white/90">
      <Clock className="w-3.5 h-3.5" />
      {timeLeft}
    </span>
  );
}

export default function PromoProducts({ promos }: { promos: Any[] }) {
  const addItem = useCartStore((s) => s.addItem);
  const openPopup = useCartPopupStore((s) => s.open);

  if (!promos || promos.length === 0) return null;

  return (
    <section className="py-10 md:py-14">
      {promos.map((promo: Any) => {
        if (!promo.products || promo.products.length === 0) return null;
        const discountPct = promo.type === "percentage" ? promo.discount : 0;

        return (
          <div key={promo.id} className="max-w-7xl mx-auto px-4 mb-10 last:mb-0">
            {/* Promo Header */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="bg-gradient-to-r from-red-600 via-red-500 to-orange-500 rounded-2xl p-5 md:p-6 mb-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
            >
              <div className="flex items-center gap-3">
                <div className="bg-white/20 p-2.5 rounded-xl">
                  <Flame className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl md:text-2xl font-bold text-white">{promo.title}</h2>
                  {promo.description && (
                    <p className="text-white/70 text-sm mt-0.5" dangerouslySetInnerHTML={{ __html: promo.description }} />
                  )}
                </div>
              </div>
              <div className="flex items-center gap-4">
                {discountPct > 0 && (
                  <div className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-xl">
                    <span className="text-2xl font-black text-white">{discountPct}%</span>
                    <span className="text-white/80 text-xs ml-1">OFF</span>
                  </div>
                )}
                <div className="bg-black/20 backdrop-blur-sm px-4 py-2 rounded-xl">
                  <p className="text-[10px] text-white/60 uppercase tracking-wider">Ends in</p>
                  <Countdown endDate={promo.endDate} />
                </div>
              </div>
            </motion.div>

            {/* Products Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4">
              {promo.products.map((product: Any, i: number) => {
                const originalPrice = product.price;
                const salePrice = discountPct > 0 ? originalPrice * (1 - discountPct / 100) : originalPrice;
                const imageUrl = product.images?.[0]?.url;

                const handleAdd = (e: React.MouseEvent) => {
                  e.preventDefault();
                  e.stopPropagation();
                  const cartProduct = {
                    id: product.id,
                    cartId: product.id,
                    name: product.name,
                    price: salePrice,
                    image: imageUrl || "/placeholder.png",
                    slug: product.slug,
                    stock: product.stock ?? 99,
                  };
                  addItem(cartProduct);
                  openPopup(cartProduct, 1);
                };

                return (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <Link href={`/product/${product.slug}`} className="group block bg-white rounded-xl border border-border hover:shadow-lg transition-all overflow-hidden">
                      {/* Image */}
                      <div className="relative aspect-square bg-surface overflow-hidden">
                        {imageUrl ? (
                          <Image src={imageUrl} alt={product.name} fill className="object-cover group-hover:scale-105 transition-transform duration-300" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-text-muted">No image</div>
                        )}
                        {discountPct > 0 && (
                          <div className="absolute top-2 left-2 bg-red-600 text-white text-[10px] font-bold px-2 py-1 rounded-lg flex items-center gap-0.5">
                            <Tag className="w-3 h-3" />
                            -{discountPct}%
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="p-3">
                        <p className="text-xs text-text-muted truncate">{product.brand?.name || product.category?.name}</p>
                        <h3 className="text-sm font-semibold text-text line-clamp-2 mt-0.5 min-h-[2.5rem]">{product.name}</h3>
                        <div className="mt-2 flex items-center gap-2">
                          <span className="text-base font-bold text-accent">{formatPrice(salePrice)}</span>
                          {discountPct > 0 && (
                            <span className="text-xs text-text-muted line-through">{formatPrice(originalPrice)}</span>
                          )}
                        </div>
                        <Button
                          onClick={handleAdd}
                          size="sm"
                          className="w-full mt-2 rounded-lg text-xs h-8"
                        >
                          <ShoppingCart className="w-3.5 h-3.5 mr-1" />
                          Add to Cart
                        </Button>
                      </div>
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          </div>
        );
      })}
    </section>
  );
}
