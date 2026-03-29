"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { Tag, Clock, Percent, ArrowRight, Zap, Gift, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/utils";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = any;

const activePromotions = [
  {
    id: "promo-1",
    title: "Mega Electronics Sale",
    description: "Get up to 30% off on selected smartphones, laptops, and accessories. Limited time offer!",
    code: "MEGA30",
    discount: "Up to 30% OFF",
    bgColor: "from-accent to-pink-600",
    icon: Zap,
    endsAt: "2026-04-30",
  },
  {
    id: "promo-2",
    title: "Free Delivery Week",
    description: "Enjoy free delivery on ALL orders this week. No minimum purchase required!",
    code: "FREEDELIVERY",
    discount: "FREE DELIVERY",
    bgColor: "from-success to-emerald-600",
    icon: Truck,
    endsAt: "2026-04-07",
  },
  {
    id: "promo-3",
    title: "Bundle & Save",
    description: "Buy any smartphone and get 20% off on accessories. Mix and match your perfect setup.",
    code: "BUNDLE20",
    discount: "20% OFF Accessories",
    bgColor: "from-info to-blue-600",
    icon: Gift,
    endsAt: "2026-05-15",
  },
];

export default function PromotionsPage() {
  const [saleProducts, setSaleProducts] = useState<Any[]>([]);

  useEffect(() => {
    fetch("/api/products?onSale=true&limit=12").then(r => r.json()).then(d => {
      if (d.products) setSaleProducts(d.products);
    }).catch(() => {});
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          {activePromotions.map((promo, i) => (
            <motion.div
              key={promo.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className={`bg-gradient-to-br ${promo.bgColor} text-white rounded-2xl p-6 relative overflow-hidden`}
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
              <promo.icon className="w-8 h-8 mb-4 opacity-80" />
              <h3 className="text-xl font-bold mb-2">{promo.title}</h3>
              <p className="text-white/80 text-sm mb-4 line-clamp-2">{promo.description}</p>
              <div className="bg-white/20 rounded-lg px-3 py-2 inline-flex items-center gap-2 mb-4">
                <Percent className="w-4 h-4" />
                <span className="font-bold text-sm">{promo.discount}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="bg-black/20 rounded-lg px-3 py-1.5">
                  <span className="text-xs opacity-70">Code: </span>
                  <span className="font-mono font-bold text-sm">{promo.code}</span>
                </div>
                <div className="flex items-center gap-1 text-xs opacity-70">
                  <Clock className="w-3 h-3" />
                  Ends {new Date(promo.endsAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Discount banner */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="bg-gradient-to-r from-gold/20 to-accent/20 border-2 border-dashed border-accent/30 rounded-2xl p-8 text-center mb-16"
        >
          <h3 className="text-2xl font-bold text-text mb-2">
            Buy up to GH₵5,000 worth of products and get <span className="text-accent">5% Discount</span>
          </h3>
          <p className="text-text-muted mb-4">Applicable on all products. Automatically applied at checkout.</p>
          <Link href="/shop">
            <Button size="lg" className="rounded-xl">
              Start Shopping <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </motion.div>

        {/* Sale Products */}
        <h2 className="text-2xl font-bold text-text mb-6">Products on Sale</h2>
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
                      <Image
                        src={product.images[0]?.url || "/placeholder.svg"}
                        alt={product.name}
                        fill
                        className="object-cover group-hover:scale-110 transition-transform duration-500"
                        sizes="(max-width: 768px) 50vw, 25vw"
                      />
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
      </div>
    </div>
  );
}
