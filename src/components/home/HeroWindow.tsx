"use client";

import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { imgUrl } from "@/lib/images";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = any;

function formatPrice(price: number) {
  return `GH₵${price.toLocaleString("en-GH", { minimumFractionDigits: 2 })}`;
}

interface HeroWindowProps {
  picks?: Any[];
  fallbackSlides?: Any[];
}

/**
 * Pinned hero: the first screen shows the shop's product inside a small
 * window on a white field. Scrolling opens the window to full bleed while
 * the headline lifts away. A live switcher swaps the product per category.
 */
export default function HeroWindow({ picks, fallbackSlides }: HeroWindowProps) {
  const stageRef = useRef<HTMLDivElement>(null);
  const layerRef = useRef<HTMLDivElement>(null);
  const uiRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);

  // Build the switchable product list: one per featured category, else top products
  const items = (picks?.length ? picks : fallbackSlides?.slice(0, 4) || [])
    .map((p: Any) => ({
      key: p.product?.id || p.id,
      name: p.product?.name || p.name,
      slug: p.product?.slug || p.slug,
      price: p.product?.price ?? p.price,
      image: p.product?.images?.[0]?.url || p.image,
      label: p.name || p.product?.category?.name || "Featured",
    }))
    .filter((i: Any) => i.image)
    .slice(0, 6);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;

    let raf = 0;
    const update = () => {
      raf = 0;
      const stage = stageRef.current;
      if (!stage) return;
      const rect = stage.getBoundingClientRect();
      const total = rect.height - window.innerHeight;
      const p = total > 0 ? Math.min(1, Math.max(0, -rect.top / total)) : 1;

      // Window geometry: portrait opening that grows to full bleed
      const w = window.innerWidth;
      const h = window.innerHeight;
      const mobile = w < 768;
      let winW: number, top: number, bottom: number;
      if (mobile) {
        winW = w * 0.78;
        const winH = winW * 1.25;
        top = h * 0.3 - (winH - h * 0.62) / 2; // centred in lower-middle band
        bottom = h - top - winH;
        if (bottom < h * 0.06) {
          // keep the window inside the viewport on short screens
          const scale = (h * 0.94) / winH;
          winW *= scale;
          top = h * 0.03;
          bottom = h * 0.03;
        }
      } else {
        winW = Math.min(w * 0.36, (h * 0.86) * 0.8);
        const winH = winW * 1.25;
        top = (h - winH) / 2;
        bottom = top;
      }
      const side = (w - winW) / 2;
      const e = 1 - p; // 1 = closed window, 0 = fully open
      const layer = layerRef.current;
      if (layer) {
        layer.style.clipPath = `inset(${top * e}px ${side * e}px ${bottom * e}px ${side * e}px)`;
      }
      if (uiRef.current) {
        uiRef.current.style.opacity = String(Math.max(0, 1 - p * 1.6));
        uiRef.current.style.transform = `translateY(${-p * 60}px)`;
      }
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  const current = items[active] || items[0];

  return (
    <section ref={stageRef} className="relative" style={{ height: "200svh" }} aria-label="Featured product">
      <div className="sticky top-0 h-[100svh] w-full overflow-hidden bg-white">
        {/* The window: product photography revealed by scroll */}
        <div ref={layerRef} className="hero-window-layer bg-[#111]">
          {items.map((item, i) => (
            <Image
              key={item.key}
              src={imgUrl(item.image, 1600)}
              alt={item.name}
              fill
              priority={i === 0}
              sizes="100vw"
              className={`object-cover transition-opacity duration-500 ${i === active ? "opacity-100" : "opacity-0"}`}
            />
          ))}
        </div>

        {/* Headline + controls — lift away as the window opens */}
        <div
          ref={uiRef}
          className="absolute inset-0 z-10 flex flex-col justify-between p-5 sm:p-8 md:p-12 pointer-events-none"
        >
          <div className="max-w-xl">
            <h1 className="text-[13vw] sm:text-7xl md:text-8xl font-black tracking-tight leading-[0.95] text-[#111]">
              Intact Ghana<span className="text-accent">.</span>
            </h1>
            <p className="mt-4 text-lg md:text-xl text-[#111]/70 max-w-md leading-relaxed">
              Phones, laptops, TVs and home appliances — shipped safe, delivered nationwide across Ghana.
            </p>
          </div>

          <div className="flex flex-col gap-5">
            {current && (
              <div className="flex items-baseline gap-3 pointer-events-auto">
                <span className="text-base font-semibold text-[#111]">{current.name}</span>
                <span className="text-base text-[#111]/60">{formatPrice(current.price)}</span>
                <Link
                  href={`/product/${current.slug}`}
                  className="text-base font-semibold text-accent hover:underline"
                >
                  View product
                </Link>
              </div>
            )}

            <div className="flex flex-wrap items-center gap-2 pointer-events-auto">
              {items.map((item, i) => (
                <button
                  key={item.key}
                  onClick={() => setActive(i)}
                  aria-pressed={i === active}
                  className={`px-4 py-2 text-base font-medium rounded-full border transition-colors ${
                    i === active
                      ? "bg-[#111] text-white border-[#111]"
                      : "bg-white/80 text-[#111]/70 border-[#111]/15 hover:border-[#111]/40"
                  }`}
                >
                  {item.label}
                </button>
              ))}
              <Link
                href="/shop"
                className="ml-1 px-6 py-2.5 text-base font-semibold bg-accent text-white rounded-full hover:bg-accent-hover transition-colors"
              >
                Shop now
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
