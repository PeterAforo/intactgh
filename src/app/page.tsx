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
        <HeroSlider slides={data?.heroSlides} />
        <PromoProducts promos={data?.homePromos} />
        <CategoryGrid categories={data?.categories} />
        <FeaturedProducts sections={data?.productSections} />
        <PromoBanner />
        <BrandShowcase brands={data?.brands} />
      </main>
      <Footer />
      <ChatBot />
    </>
  );
}
