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

interface ClosingCTAProps {
  product?: Any;
}

/**
 * The object returns — the featured product comes back from another angle
 * to close the page, with the newsletter capture beside it.
 */
export default function ClosingCTA({ product }: ClosingCTAProps) {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [message, setMessage] = useState("");

  const image = product?.images?.[0]?.url;

  const subscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.includes("@") || state === "loading") return;
    setState("loading");
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (res.ok) {
        setState("done");
        setMessage(data.message || "You're subscribed.");
        setEmail("");
      } else {
        setState("error");
        setMessage(data.error || "Something went wrong.");
      }
    } catch {
      setState("error");
      setMessage("Something went wrong. Please try again.");
    }
  };

  return (
    <section className="bg-white" aria-label="Closing offer">
      <div className="mx-auto grid max-w-[1400px] gap-10 px-5 py-16 sm:px-8 md:py-24 lg:grid-cols-12 lg:gap-6">
        {/* The object returns */}
        {image && (
          <div className="relative -mx-5 h-[52svh] overflow-hidden sm:-mx-8 lg:col-span-7 lg:mx-0 lg:h-auto lg:min-h-[90svh]">
            <Image
              src={image}
              alt={product.name}
              fill
              sizes="(max-width: 1024px) 100vw, 58vw"
              className="object-cover object-center lg:scale-[1.15] lg:object-left"
            />
          </div>
        )}

        {/* Text block */}
        <Reveal className={`flex flex-col justify-center ${image ? "lg:col-span-5 lg:pl-10" : "lg:col-span-12"}`} delay={150}>
        <div className="flex flex-col justify-center">
          <h2 className="text-4xl font-black tracking-tight text-[#111] leading-[1.02] md:text-6xl">
            Still deciding?
          </h2>
          <p className="mt-5 max-w-md text-[16px] leading-relaxed text-[#111]/65">
            Every product on Intact Ghana is checked before it ships, packed to arrive
            intact, and backed by the manufacturer&apos;s warranty.
          </p>
          {product && (
            <>
              <p className="mt-6 text-lg font-semibold text-[#111]">{product.name}</p>
              <p className="text-xl font-bold text-accent">{formatPrice(product.price)}</p>
              <Link
                href={`/product/${product.slug}`}
                className="mt-6 inline-flex w-fit items-center justify-center bg-[#111] px-8 py-3.5 text-base font-semibold text-white transition-colors hover:bg-accent"
              >
                View product
              </Link>
            </>
          )}

          {/* Newsletter */}
          <div className="mt-12 bg-[#f5f5f4] p-6 md:p-8">
            <h3 className="text-xl font-bold text-[#111]">Get sale alerts first</h3>
            <p className="mt-1 text-base text-[#111]/60">
              New arrivals and promotions, straight to your inbox.
            </p>
            {state === "done" ? (
              <p className="mt-4 text-base font-semibold text-success" role="status">
                {message}
              </p>
            ) : (
              <form onSubmit={subscribe} className="mt-4 flex max-w-md gap-2">
                <label htmlFor="newsletter-email" className="sr-only">
                  Email address
                </label>
                <input
                  id="newsletter-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="h-12 min-w-0 flex-1 rounded-lg border border-[#111]/15 bg-white px-4 text-base text-[#111] placeholder:text-[#111]/35 focus:border-accent focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={state === "loading"}
                  className="h-12 shrink-0 rounded-lg bg-accent px-6 text-base font-semibold text-white transition-colors hover:bg-accent-hover disabled:opacity-50"
                >
                  {state === "loading" ? "Joining…" : "Join"}
                </button>
              </form>
            )}
            {state === "error" && (
              <p className="mt-3 text-base text-red-600" role="alert">{message}</p>
            )}
          </div>
        </div>
        </Reveal>
      </div>
    </section>
  );
}
