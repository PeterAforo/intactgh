"use client";

import React, { useRef, useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ArrowRight } from "lucide-react";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Cat = any;

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

interface CategoryGridProps {
  categories?: Cat[];
}

export default function CategoryGrid({ categories: propCategories }: CategoryGridProps) {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [featured, setFeatured] = useState<Cat[]>([]);

  useEffect(() => {
    if (propCategories?.length) { setFeatured(propCategories.filter((c: Cat) => c.featured)); return; }
    fetch("/api/categories").then(r => r.json()).then(d => {
      if (d.categories) setFeatured(d.categories.filter((c: Cat) => c.featured));
    }).catch(() => {});
  }, [propCategories]);

  useEffect(() => {
    if (sectionRef.current && featured.length) {
      const cards = sectionRef.current.querySelectorAll(".cat-card");
      gsap.fromTo(
        cards,
        { opacity: 0, y: 60, scale: 0.9 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.6,
          stagger: 0.1,
          ease: "power3.out",
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top 80%",
          },
        }
      );
    }
  }, [featured]);

  return (
    <section className="py-16 md:py-20" ref={sectionRef}>
      <div className="max-w-7xl mx-auto px-4">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <span className="text-accent text-sm font-semibold uppercase tracking-wider">
            Browse By Category
          </span>
          <h2 className="text-3xl md:text-4xl font-bold mt-2 text-text">
            Shop Our Top Categories
          </h2>
          <p className="text-text-light mt-3 max-w-2xl mx-auto">
            Find everything you need from the latest smartphones to home appliances.
            Quality products at unbeatable prices.
          </p>
        </motion.div>

        {/* Category Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 md:gap-6">
          {featured.map((category) => (
            <Link
              key={category.id}
              href={`/shop/${category.slug}`}
              className="cat-card category-card group rounded-2xl h-48 md:h-56 flex items-end p-4 cursor-pointer"
            >
              <Image
                src={category.image}
                alt={category.name}
                fill
                className="object-cover rounded-2xl group-hover:scale-110 transition-transform duration-500"
                sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 16vw"
              />
              <div className="relative z-10 text-white w-full">
                <h3 className="font-bold text-sm md:text-base">{category.name}</h3>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-xs text-white/70">{category.productCount} Products</span>
                  <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
