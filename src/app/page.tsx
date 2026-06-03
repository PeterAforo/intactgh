"use client";

import React, { useState, useEffect } from "react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import ChatBot from "@/components/chat/ChatBot";
import HeroSlider from "@/components/home/HeroSlider";
import PromoProducts from "@/components/home/PromoProducts";
import CategoryGrid from "@/components/home/CategoryGrid";
import FeaturedProducts from "@/components/home/FeaturedProducts";
import PromoBanner from "@/components/home/PromoBanner";
import BrandShowcase from "@/components/home/BrandShowcase";
import IntactConnectCTA from "@/components/home/IntactConnectCTA";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = any;

export default function HomePage() {
  const [data, setData] = useState<Any>(null);

  useEffect(() => {
    fetch("/api/homepage")
      .then((r) => r.json())
      .then((d) => setData(d))
      .catch(() => {});
  }, []);

  return (
    <>
      <Header />
      <main className="flex-1">
        {/* Hero: 70% slider + 30% IntactConnect ad */}
        <div className="flex h-[500px] md:h-[600px] lg:h-[700px]">
          <div className="w-full lg:w-[70%]">
            <HeroSlider slides={data?.heroSlides} />
          </div>
          <a
            href="https://intactconnect.com.gh"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden lg:flex w-[30%] relative overflow-hidden group cursor-pointer"
          >
            <div
              className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
              style={{
                backgroundImage:
                  "url('https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=800&q=80')",
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/60 to-black/40 group-hover:from-black/95 group-hover:via-black/70 transition-all duration-300" />
            <div className="relative z-10 flex flex-col justify-end p-6 xl:p-8 text-white h-full">
              <div className="mb-auto pt-6">
                <span className="inline-block bg-gold text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                  Earn With Us
                </span>
              </div>
              <div>
                <h3 className="text-2xl xl:text-3xl font-black leading-tight mb-3">
                  Turn Your Network Into{" "}
                  <span className="text-gold">Income</span>
                </h3>
                <p className="text-white/70 text-sm leading-relaxed mb-5">
                  Get your own branded store page, sell Intact Ghana products, and earn commissions on every sale. No stock needed.
                </p>
                <span className="inline-flex items-center gap-2 bg-gold hover:bg-gold/90 text-white font-bold text-sm px-5 py-2.5 rounded-full transition-all group-hover:gap-3">
                  Join IntactConnect
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                  </svg>
                </span>
              </div>
            </div>
          </a>
        </div>
        <PromoProducts promos={data?.homePromos} />
        <CategoryGrid categories={data?.categories} />
        <FeaturedProducts sections={data?.productSections} />
        <PromoBanner />
        <IntactConnectCTA />
        <BrandShowcase brands={data?.brands} />
      </main>
      <Footer />
      <ChatBot />
    </>
  );
}
