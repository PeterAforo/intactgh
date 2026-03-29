"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Flame, Sparkles, Star, Tag } from "lucide-react";
import ProductCard from "@/components/products/ProductCard";
import { Button } from "@/components/ui/button";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Product = any;

interface SectionConfig {
  id: string;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  key: string;
  href: string;
  bg: string;
}

const sectionConfigs: SectionConfig[] = [
  {
    id: "sale",
    title: "On Sale",
    subtitle: "Hot deals you don't want to miss",
    icon: <Tag className="w-5 h-5" />,
    key: "sale",
    href: "/promotions",
    bg: "bg-background",
  },
  {
    id: "new",
    title: "New Arrivals",
    subtitle: "Just landed — the latest in tech",
    icon: <Sparkles className="w-5 h-5" />,
    key: "new",
    href: "/shop?filter=new",
    bg: "bg-surface",
  },
  {
    id: "featured",
    title: "Featured",
    subtitle: "Hand-picked by our team for you",
    icon: <Flame className="w-5 h-5" />,
    key: "featured",
    href: "/shop?filter=featured",
    bg: "bg-background",
  },
  {
    id: "top",
    title: "Top Rated",
    subtitle: "Highest rated by our customers",
    icon: <Star className="w-5 h-5" />,
    key: "top",
    href: "/shop?sort=rating",
    bg: "bg-surface",
  },
];

function ProductSection({ section, products }: { section: SectionConfig; products: Product[] }) {
  if (!products?.length) return null;

  return (
    <section className={`py-14 md:py-18 ${section.bg}`}>
      <div className="max-w-7xl mx-auto px-4">
        {/* Section Header */}
        <div className="flex items-end justify-between mb-8">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex items-center gap-2 text-accent mb-1">
              {section.icon}
              <span className="text-sm font-semibold uppercase tracking-wider">
                {section.title}
              </span>
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-text">
              {section.subtitle}
            </h2>
          </motion.div>

          <Link href={section.href}>
            <Button variant="outline" className="hidden md:flex items-center gap-2 rounded-full">
              View More <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>

        {/* Products Grid — 4 per row, 2 rows = 8 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.4 }}
          className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6"
        >
          {products.map((product: Product, i: number) => (
            <ProductCard key={product.id} product={product} index={i} />
          ))}
        </motion.div>

        {/* Mobile View More */}
        <div className="mt-8 text-center md:hidden">
          <Link href={section.href}>
            <Button variant="outline" className="rounded-full px-8">
              View More <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}

interface FeaturedProductsProps {
  sections?: Record<string, Product[]>;
}

export default function FeaturedProducts({ sections }: FeaturedProductsProps) {
  return (
    <>
      {sectionConfigs.map((config) => (
        <ProductSection
          key={config.id}
          section={config}
          products={sections?.[config.key] || []}
        />
      ))}
    </>
  );
}
