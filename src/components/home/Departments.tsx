"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import Reveal from "@/components/home/Reveal";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = any;

function formatPrice(price: number) {
  return `GH₵${price.toLocaleString("en-GH", { minimumFractionDigits: 2 })}`;
}

interface DepartmentsProps {
  picks?: Any[];
}

/**
 * "Object on a disc" — a flat disc holds the selected department's product
 * photo; the name list on the left swaps it. One live thing on the page.
 */
export default function Departments({ picks }: DepartmentsProps) {
  const [active, setActive] = useState(0);
  const items = (picks || []).filter((p: Any) => p?.product?.images?.[0]?.url);
  if (!items.length) return null;

  const current = items[active];
  const product = current.product;

  return (
    <section className="bg-white py-16 md:py-24" aria-label="Shop by department">
      <div className="mx-auto max-w-[1400px] px-5 sm:px-8">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:items-center">
          {/* Name list */}
          <Reveal className="min-w-0">
          <div>
            <h2 className="text-3xl md:text-5xl font-black tracking-tight text-[#111] leading-[1.05]">
              Every department,
              <br />
              one standard.
            </h2>
            <ul className="mt-8 md:mt-12" role="list">
              {items.map((item: Any, i: number) => (
                <li key={item.id}>
                  <button
                    onClick={() => setActive(i)}
                    aria-pressed={i === active}
                    className={`block w-full text-left py-3 md:py-4 text-[clamp(26px,3vw,42px)] font-bold leading-tight transition-colors ${
                      i === active ? "text-[#111]" : "text-[#111]/45 hover:text-[#111]/80"
                    }`}
                  >
                    {item.name}
                  </button>
                </li>
              ))}
            </ul>
          </div>
          </Reveal>

          {/* Disc + product */}
          <Reveal className="min-w-0" delay={120}>
          <div className="relative flex items-center justify-center lg:justify-end">
            <div className="relative aspect-square w-full max-w-[540px]">
              {/* Flat disc */}
              <div className="absolute inset-0 rounded-full bg-accent" aria-hidden="true" />
              {/* Product photos crossfade */}
              <div className="absolute inset-0 flex items-center justify-center">
                {items.map((item: Any, i: number) => (
                  <Image
                    key={item.id}
                    src={item.product.images[0].url}
                    alt={item.product.name}
                    width={640}
                    height={640}
                    priority={i === 0}
                    className={`h-[86%] w-auto max-w-[86%] object-contain mix-blend-multiply transition-opacity duration-300 ${
                      i === active ? "opacity-100" : "opacity-0"
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Fact at the disc's edge */}
            <div className="absolute bottom-2 right-0 sm:bottom-6 sm:right-2 text-right">
              <p className="text-base text-[#111]/60">Featured in {current.name}</p>
              <Link
                href={`/product/${product.slug}`}
                className="group inline-flex items-baseline gap-2 mt-1"
              >
                <span className="text-lg font-bold text-[#111] group-hover:text-accent transition-colors">
                  {product.name}
                </span>
                <span className="text-base font-semibold text-accent">
                  {formatPrice(product.price)}
                </span>
              </Link>
            </div>
          </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
