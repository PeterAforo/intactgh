"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = any;

export default function BrandsPage() {
  const [brands, setBrands] = useState<Any[]>([]);

  useEffect(() => {
    fetch("/api/brands").then(r => r.json()).then(d => {
      if (d.brands) setBrands(d.brands);
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {brands.map((brand: Any, i: number) => {
            const productCount = brand._count?.products || 0;
            return (
              <motion.div
                key={brand.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Link
                  href={`/shop?brand=${brand.slug}`}
                  className="block bg-white rounded-2xl border border-border/50 p-6 text-center group product-card"
                >
                  <div className="relative w-24 h-24 mx-auto mb-4">
                    <Image
                      src={brand.logo}
                      alt={brand.name}
                      fill
                      className="object-contain group-hover:scale-110 transition-transform duration-300"
                      sizes="96px"
                    />
                  </div>
                  <h3 className="text-lg font-bold text-text mb-1 group-hover:text-accent transition-colors">
                    {brand.name}
                  </h3>
                  <Badge variant="outline" className="mb-3">
                    {productCount} {productCount === 1 ? "product" : "products"}
                  </Badge>
                  <div className="flex items-center justify-center gap-1 text-sm text-accent opacity-0 group-hover:opacity-100 transition-opacity">
                    View Products <ArrowRight className="w-3.5 h-3.5" />
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
