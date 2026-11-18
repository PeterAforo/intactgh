"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Star } from "lucide-react";
import { imgUrl } from "@/lib/images";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = any;

interface ReviewSpotlightProps {
  review?: Any;
}

/**
 * Quotation over a photograph — the latest written customer review set
 * across the product's own image. Hidden when there is no written review.
 */
export default function ReviewSpotlight({ review }: ReviewSpotlightProps) {
  if (!review?.comment || !review?.image) return null;

  const words = review.comment.trim().split(/\s+/);
  const quote = words.slice(0, 36).join(" ") + (words.length > 36 ? "…" : "");

  return (
    <section className="relative h-[80svh] w-full overflow-hidden md:h-[90svh]" aria-label="Customer review">
      <Image
        src={imgUrl(review.image, 1600)}
        alt={review.productName}
        fill
        sizes="100vw"
        className="animate-slow-drift object-cover"
        style={{ filter: "brightness(0.55)" }}
      />
      <div className="absolute inset-0 flex flex-col justify-end p-5 pb-14 sm:p-8 md:p-14">
        <figure className="max-w-4xl">
          <div className="flex gap-1 text-white" aria-label={`${review.rating} out of 5 stars`}>
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className={`h-5 w-5 ${i < review.rating ? "fill-white" : "fill-white/20"}`}
              />
            ))}
          </div>
          <blockquote className="mt-4 text-[8.5vw] font-bold leading-[1.05] tracking-tight text-white sm:text-5xl md:text-6xl lg:text-7xl">
            “{quote}”
          </blockquote>
          <figcaption className="mt-6 flex items-center gap-3 text-base text-white/80">
            <span className="font-semibold text-white">{review.author}</span>
            <span aria-hidden="true">·</span>
            <Link href={`/product/${review.productSlug}`} className="hover:text-white hover:underline">
              {review.productName}
            </Link>
          </figcaption>
        </figure>
      </div>
    </section>
  );
}
