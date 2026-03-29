"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = any;

const BRAND_COLORS = [
  "from-blue-500 to-blue-600",
  "from-purple-500 to-purple-600",
  "from-emerald-500 to-emerald-600",
  "from-orange-500 to-orange-600",
  "from-rose-500 to-rose-600",
  "from-cyan-500 to-cyan-600",
  "from-indigo-500 to-indigo-600",
  "from-amber-500 to-amber-600",
];

export default function BrandsPage() {
  const [brands, setBrands] = useState<Any[]>([]);

  useEffect(() => {
    fetch("/api/brands").then(r => r.json()).then(d => {
      if (d.brands) {
        // Sort by product count descending, only keep brands with products
        const sorted = d.brands
          .filter((b: Any) => (b._count?.products || 0) > 0)
          .sort((a: Any, b: Any) => (b._count?.products || 0) - (a._count?.products || 0));
        setBrands(sorted);
      }
    }).catch(() => {});
  }, []);

  return (
    <div className="min-h-screen bg-surface">
      {/* Hero */}
      <section className="bg-gradient-to-r from-primary to-primary-light text-white py-16 md:py-20">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="text-3xl md:text-5xl font-bold mb-4">
              Shop by <span className="gradient-text">Brand</span>
            </h1>
            <p className="text-white/70 max-w-2xl mx-auto text-lg">
              We partner with the world&apos;s leading technology brands to bring you premium products.
            </p>
          </motion.div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 py-12">
        <p className="text-text-muted text-sm mb-6">{brands.length} brands available</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {brands.map((brand: Any, i: number) => {
            const productCount = brand._count?.products || 0;
            return (
              <motion.div
                key={brand.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.03, 0.6) }}
              >
                <Link
                  href={`/shop?brand=${brand.slug}`}
                  className="block bg-white rounded-2xl border border-border/50 p-5 text-center group hover:shadow-lg hover:border-accent/30 transition-all duration-300"
                >
                  <div className={`w-14 h-14 mx-auto mb-3 rounded-xl bg-gradient-to-br ${BRAND_COLORS[i % BRAND_COLORS.length]} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                    <span className="text-white font-black text-lg">
                      {brand.name.charAt(0)}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-text mb-1 group-hover:text-accent transition-colors truncate">
                    {brand.name}
                  </h3>
                  <Badge variant="outline" className="text-[10px]">
                    {productCount} {productCount === 1 ? "product" : "products"}
                  </Badge>
                  <div className="flex items-center justify-center gap-1 text-xs text-accent opacity-0 group-hover:opacity-100 transition-opacity mt-2">
                    View Products <ArrowRight className="w-3 h-3" />
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
