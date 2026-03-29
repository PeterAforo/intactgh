"use client";

import React, { useRef, useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Brand = any;

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

interface BrandShowcaseProps {
  brands?: Brand[];
}

export default function BrandShowcase({ brands: propBrands }: BrandShowcaseProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [brands, setBrands] = useState<Brand[]>([]);

  useEffect(() => {
    if (propBrands?.length) { setBrands(propBrands); return; }
    fetch("/api/brands").then(r => r.json()).then(d => {
      if (d.brands) setBrands(d.brands);
    }).catch(() => {});
  }, [propBrands]);

  useEffect(() => {
    if (containerRef.current && brands.length) {
      const logos = containerRef.current.querySelectorAll(".brand-logo");
      gsap.fromTo(
        logos,
        { opacity: 0, y: 30 },
        {
          opacity: 1,
          y: 0,
          duration: 0.5,
          stagger: 0.08,
          ease: "power2.out",
          scrollTrigger: {
            trigger: containerRef.current,
            start: "top 85%",
          },
        }
      );
    }
  }, [brands]);

  return (
    <section className="py-16 md:py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <span className="text-accent text-sm font-semibold uppercase tracking-wider">
            Trusted Brands
          </span>
          <h2 className="text-3xl md:text-4xl font-bold mt-2 text-text">
            Shop By Brand
          </h2>
          <p className="text-text-light mt-3 max-w-xl mx-auto">
            We partner with the world&apos;s leading technology brands to bring you authentic, quality products.
          </p>
        </motion.div>

        <div
          ref={containerRef}
          className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4"
        >
          {brands.map((brand: Brand) => (
            <Link
              key={brand.id}
              href={`/brands/${brand.slug}`}
              className="brand-logo group bg-surface hover:bg-white border border-border/50 hover:border-accent/30 rounded-xl p-6 flex items-center justify-center h-24 transition-all duration-300 hover:shadow-lg"
            >
              <span className="text-lg font-bold text-text-light group-hover:text-accent transition-colors">
                {brand.name}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
