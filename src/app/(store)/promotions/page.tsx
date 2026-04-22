"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { Tag, Clock, Percent, ArrowRight, Zap, Gift, Truck, Package, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/utils";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = any;

const GRADIENT_COLORS = [
  "from-accent to-pink-600",
  "from-success to-emerald-600",
  "from-info to-blue-600",
  "from-purple-500 to-violet-600",
  "from-orange-500 to-red-500",
  "from-cyan-500 to-blue-500",
];
const PROMO_ICONS = [Zap, Gift, Truck, Sparkles, Percent, Tag];

export default function PromotionsPage() {
  const [promotions, setPromotions] = useState<Any[]>([]);
  const [saleProducts, setSaleProducts] = useState<Any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetch("/api/promotions").then(r => r.json()).then(d => {
        if (d.promotions) setPromotions(d.promotions);
      }),
      fetch("/api/products?onSale=true&limit=12").then(r => r.json()).then(d => {
        if (d.products) setSaleProducts(d.products);
      }),
    ]).catch(() => {}).finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-surface">
      {/* Hero */}
      <section className="bg-gradient-to-r from-primary to-primary-light text-white py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Badge className="bg-accent/20 text-accent border-accent/30 mb-4">
              <Tag className="w-3 h-3 mr-1" /> Hot Deals
            </Badge>
            <h1 className="text-3xl md:text-5xl font-bold mb-4">
              Promotions & <span className="gradient-text">Special Offers</span>
            </h1>
            <p className="text-white/70 max-w-2xl mx-auto text-lg">
              Don&apos;t miss out on incredible deals. Save big on electronics, smartphones, and more.
            </p>
          </motion.div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Active Promotions */}
        <h2 className="text-2xl font-bold text-text mb-6">Active Promotions</h2>
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-gradient-to-br from-gray-200 to-gray-300 rounded-2xl p-6 animate-pulse h-48" />
            ))}
          </div>
        ) : promotions.length === 0 ? (
          <div className="bg-white rounded-2xl border border-border p-12 text-center mb-16">
            <Tag className="w-10 h-10 text-text-muted mx-auto mb-3" />
            <p className="text-text-muted">No active promotions right now. Check back soon!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
            {promotions.map((promo: Any, i: number) => {
              const Icon = PROMO_ICONS[i % PROMO_ICONS.length];
              const bg = GRADIENT_COLORS[i % GRADIENT_COLORS.length];
              const discountLabel = promo.type === "percentage"
                ? `${promo.discount}% OFF`
                : `GH₵${promo.discount} OFF`;
              return (
                <motion.div
                  key={promo.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className={`bg-gradient-to-br ${bg} text-white rounded-2xl p-6 relative overflow-hidden`}
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
                  <Icon className="w-8 h-8 mb-4 opacity-80" />
                  <h3 className="text-xl font-bold mb-2">{promo.title}</h3>
                  {promo.description && (
                    <div className="text-white/80 text-sm mb-4 line-clamp-2" dangerouslySetInnerHTML={{ __html: promo.description }} />
                  )}
                  <div className="bg-white/20 rounded-lg px-3 py-2 inline-flex items-center gap-2 mb-4">
                    <Percent className="w-4 h-4" />
                    <span className="font-bold text-sm">{discountLabel}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    {promo.code && (
                      <div className="bg-black/20 rounded-lg px-3 py-1.5">
                        <span className="text-xs opacity-70">Code: </span>
                        <span className="font-mono font-bold text-sm">{promo.code}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1 text-xs opacity-70">
                      <Clock className="w-3 h-3" />
                      Ends {new Date(promo.endDate).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Sale Products */}
        <h2 className="text-2xl font-bold text-text mb-6">Products on Sale</h2>
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-border p-4 animate-pulse">
                <div className="aspect-square bg-surface rounded-xl mb-3" />
                <div className="h-4 bg-surface rounded w-3/4 mb-2" />
                <div className="h-4 bg-surface rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {saleProducts.map((product, i) => {
            const discount = product.comparePrice
              ? Math.round(((product.comparePrice - product.price) / product.comparePrice) * 100)
              : 0;
            return (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
              >
                <Link href={`/product/${product.slug}`} className="block group">
                  <div className="bg-white rounded-2xl border border-border/50 overflow-hidden product-card">
                    <div className="relative aspect-square bg-surface overflow-hidden">
                      {product.images[0]?.url ? (
                        <Image
                          src={product.images[0].url}
                          alt={product.name}
                          fill
                          className="object-cover group-hover:scale-110 transition-transform duration-500"
                          sizes="(max-width: 768px) 50vw, 25vw"
                        />
                      ) : (
                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                          <Package className="w-10 h-10 text-border" />
                          <span className="text-[10px] text-text-muted uppercase tracking-wider">No Image</span>
                        </div>
                      )}
                      {discount > 0 && (
                        <Badge className="absolute top-3 left-3">-{discount}%</Badge>
                      )}
                    </div>
                    <div className="p-4">
                      {product.brand && (
                        <p className="text-xs text-text-muted uppercase tracking-wider mb-1">
                          {product.brand.name}
                        </p>
                      )}
                      <h3 className="font-semibold text-sm text-text line-clamp-2 mb-2 group-hover:text-accent transition-colors min-h-[2.5rem]">
                        {product.name}
                      </h3>
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-bold text-accent">{formatPrice(product.price)}</span>
                        {product.comparePrice && (
                          <span className="text-sm text-text-muted line-through">
                            {formatPrice(product.comparePrice)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
        )}
      </div>
    </div>
  );
}
