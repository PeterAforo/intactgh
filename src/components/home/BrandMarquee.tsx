"use client";

import React from "react";
import Link from "next/link";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Brand = any;

interface BrandMarqueeProps {
  brands?: Brand[];
}

/**
 * Names running off the edges — a single line of real brand names,
 * cropped by both viewport edges, drifting slowly left.
 */
export default function BrandMarquee({ brands }: BrandMarqueeProps) {
  const names = (brands || [])
    .map((b: Brand) => b.name)
    .filter(Boolean)
    .slice(0, 14);
  if (names.length < 3) return null;

  const track = [...names, ...names];

  return (
    <section aria-label="Brands we carry">
      <div className="overflow-hidden bg-[#111] py-5 md:py-7">
        <div className="animate-marquee flex w-max items-center whitespace-nowrap">
          {track.map((name, i) => (
            <span key={i} className="flex items-center">
              <span className="px-5 text-[12vw] md:px-10 md:text-[5vw] font-black tracking-tight text-white/90">
                {name}
              </span>
              <span className="h-3 w-3 rounded-full bg-accent md:h-4 md:w-4" aria-hidden="true" />
            </span>
          ))}
        </div>
      </div>
      <p className="mx-auto max-w-[1400px] px-5 pt-5 text-base text-[#111]/60 sm:px-8 md:px-8">
        Authorized dealers for every brand above — genuine products with the
        manufacturer&apos;s warranty. <Link href="/brands" className="font-semibold text-accent hover:underline">See all brands →</Link>
      </p>
    </section>
  );
}
