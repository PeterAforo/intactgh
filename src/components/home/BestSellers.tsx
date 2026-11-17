"use client";

import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Plus } from "lucide-react";
import { useCartStore } from "@/store/cart-store";
import { useCartPopupStore } from "@/store/cart-popup-store";
import Reveal from "@/components/home/Reveal";
import toast from "react-hot-toast";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = any;

function formatPrice(price: number) {
  return `GH₵${price.toLocaleString("en-GH", { minimumFractionDigits: 2 })}`;
}

interface BestSellersProps {
  products?: Any[];
}

/**
 * Sticky photograph, active list — the page's commerce moment.
 * Scrolling (or hovering) a row swaps the pinned photo and reveals the
 * product; each row carries a one-tap quick add.
 */
export default function BestSellers({ products }: BestSellersProps) {
  const items = (products || []).filter((p: Any) => p?.images?.[0]?.url).slice(0, 8);
  const [active, setActive] = useState(0);
  const rowRefs = useRef<(HTMLLIElement | null)[]>([]);
  const addItem = useCartStore((s) => s.addItem);
  const openPopup = useCartPopupStore((s) => s.open);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const idx = rowRefs.current.indexOf(entry.target as HTMLLIElement);
            if (idx >= 0) setActive(idx);
          }
        });
      },
      { rootMargin: "-42% 0px -42% 0px", threshold: 0 }
    );
    rowRefs.current.forEach((el) => el && observer.observe(el));
    return () => observer.disconnect();
  }, [items.length]);

  if (!items.length) return null;

  const handleAdd = (e: React.MouseEvent, product: Any) => {
    e.preventDefault();
    e.stopPropagation();
    if (product.stock === 0) {
      toast.error("This product is out of stock");
      return;
    }
    const cartProduct = {
      id: product.id,
      cartId: product.id,
      name: product.name,
      price: product.price,
      image: product.images?.[0]?.url || "/placeholder.png",
      slug: product.slug,
      stock: product.stock ?? 99,
    };
    addItem(cartProduct);
    openPopup(cartProduct, 1);
  };

  return (
    <section className="overflow-x-clip bg-[#f5f5f4] py-16 md:py-24" aria-label="Best sellers">
      <div className="mx-auto max-w-[1400px] px-5 sm:px-8">
        <div className="grid gap-8 lg:grid-cols-12">
          {/* Pinned photograph */}
          <Reveal className="min-w-0 lg:col-span-5">
          <div>
            <div className="lg:sticky lg:top-[12vh]">
              <h2 className="text-3xl md:text-5xl font-black tracking-tight text-[#111] leading-[1.05]">
                What Ghana buys
                <br />
                first.
              </h2>
              <p className="mt-4 max-w-sm text-base leading-relaxed text-[#111]/60">
                Our best sellers, ranked by what customers actually keep coming back for.{" "}
                <Link href="/shop?sort=rating" className="font-semibold text-accent hover:underline">
                  Browse all →
                </Link>
              </p>
              <div className="relative mt-8 aspect-[4/5] w-full overflow-hidden bg-[#eee] lg:mt-10">
                {items.map((p: Any, i: number) => (
                  <Image
                    key={p.id}
                    src={p.images[0].url}
                    alt={p.name}
                    fill
                    sizes="(max-width: 1024px) 100vw, 40vw"
                    className={`object-cover transition-opacity duration-300 ${i === active ? "opacity-100" : "opacity-0"}`}
                  />
                ))}
              </div>
            </div>
          </div>
          </Reveal>

          {/* Active list */}
          <div className="min-w-0 lg:col-span-7">
            <ul role="list">
              {items.map((p: Any, i: number) => (
                <li
                  key={p.id}
                  ref={(el) => {
                    rowRefs.current[i] = el;
                  }}
                  onMouseEnter={() => setActive(i)}
                  onFocus={() => setActive(i)}
                  className="group"
                >
                  <Link
                    href={`/product/${p.slug}`}
                    className="flex items-center gap-4 py-5 transition-colors hover:bg-[#111]/[0.04] md:py-6"
                  >
                    <span className="min-w-0 flex-1">
                      <span
                        className={`block truncate text-lg md:text-xl font-bold transition-colors ${
                          i === active ? "text-[#111]" : "text-[#111]/55"
                        }`}
                      >
                        {p.name}
                      </span>
                      {p.brand?.name && (
                        <span className="mt-0.5 block text-base text-[#111]/45">{p.brand.name}</span>
                      )}
                    </span>
                    <span className="shrink-0 text-base md:text-lg font-semibold text-[#111]">
                      {formatPrice(p.price)}
                    </span>
                    <button
                      onClick={(e) => handleAdd(e, p)}
                      disabled={p.stock === 0}
                      aria-label={`Add ${p.name} to cart`}
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#111]/20 text-[#111] transition-colors hover:bg-[#111] hover:text-white disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-[#111]"
                    >
                      <Plus className="h-5 w-5" />
                    </button>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
