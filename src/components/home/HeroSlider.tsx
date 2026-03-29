"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { gsap } from "gsap";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
type Slide = { id: string; title: string; subtitle: string | null; description: string | null; image: string; buttonText: string | null; buttonLink: string | null };

interface HeroSliderProps {
  slides?: Slide[];
}

export default function HeroSlider({ slides: propSlides }: HeroSliderProps) {
  const [current, setCurrent] = useState(0);
  const [slides, setSlides] = useState<Slide[]>([]);
  const slideRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (propSlides?.length) { setSlides(propSlides); return; }
    fetch("/api/hero-slides").then(r => r.json()).then(d => {
      if (d.slides?.length) setSlides(d.slides);
    }).catch(() => {});
  }, [propSlides]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrent((prev) => (prev + 1) % slides.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [slides.length]);

  useEffect(() => {
    if (textRef.current) {
      const children = textRef.current.children;
      gsap.fromTo(
        children,
        { opacity: 0, y: 40 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          stagger: 0.15,
          ease: "power3.out",
        }
      );
    }
  }, [current]);

  const goTo = (index: number) => setCurrent(index);
  const goPrev = () => setCurrent((prev) => (prev - 1 + slides.length) % slides.length);
  const goNext = () => setCurrent((prev) => (prev + 1) % slides.length);

  const slide = slides[current];

  if (!slides.length || !slide) {
    return (
      <section className="relative h-[500px] md:h-[600px] lg:h-[700px] overflow-hidden bg-primary flex items-center justify-center">
        <div className="text-white/40 text-lg animate-pulse">Loading...</div>
      </section>
    );
  }

  return (
    <section className="relative h-[500px] md:h-[600px] lg:h-[700px] overflow-hidden bg-primary">
      <AnimatePresence mode="wait">
        <motion.div
          key={current}
          initial={{ opacity: 0, scale: 1.1 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.8 }}
          className="absolute inset-0"
          ref={slideRef}
        >
          <Image
            src={slide.image}
            alt={slide.title}
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-r from-primary/90 via-primary/60 to-transparent" />
        </motion.div>
      </AnimatePresence>

      {/* Content */}
      <div className="relative z-10 h-full max-w-7xl mx-auto px-4 flex items-center">
        <div ref={textRef} className="max-w-2xl text-white">
          <span className="inline-block bg-accent/90 text-white px-4 py-1.5 rounded-full text-sm font-medium mb-4">
            {slides[current]?.subtitle}
          </span>
          <h1 className="text-4xl md:text-5xl lg:text-7xl font-black mb-4 leading-tight">
            {slides[current]?.title}
          </h1>
          <p className="text-lg md:text-xl text-white/80 mb-8 max-w-xl leading-relaxed">
            {slides[current]?.description}
          </p>
          <div className="flex items-center gap-4">
            <Link href={slides[current]?.buttonLink || "/shop"}>
              <Button size="xl" className="rounded-full animate-pulse-glow">
                {slides[current]?.buttonText || "Shop Now"}
                <ChevronRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <Link href="/shop">
              <Button size="xl" variant="outline" className="rounded-full border-white text-white hover:bg-white hover:text-primary">
                Browse All
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Navigation Arrows */}
      <button
        onClick={goPrev}
        className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-12 h-12 bg-white/10 hover:bg-white/30 backdrop-blur-sm rounded-full flex items-center justify-center text-white transition-all"
      >
        <ChevronLeft className="w-6 h-6" />
      </button>
      <button
        onClick={goNext}
        className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-12 h-12 bg-white/10 hover:bg-white/30 backdrop-blur-sm rounded-full flex items-center justify-center text-white transition-all"
      >
        <ChevronRight className="w-6 h-6" />
      </button>

      {/* Dots */}
      <div className="absolute bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => goTo(i)}
            className="p-2 group"
            aria-label={`Go to slide ${i + 1}`}
          >
            <span className={`block h-2 rounded-full transition-all duration-300 ${
              i === current ? "w-8 bg-accent" : "w-2 bg-white/50 group-hover:bg-white/80"
            }`} />
          </button>
        ))}
      </div>

      {/* Scroll indicator */}
      <motion.div
        animate={{ y: [0, 10, 0] }}
        transition={{ repeat: Infinity, duration: 1.5 }}
        className="absolute bottom-8 right-8 z-20 text-white/60 text-xs hidden lg:flex flex-col items-center gap-2"
      >
        <span>Scroll Down</span>
        <div className="w-[1px] h-8 bg-white/40" />
      </motion.div>
    </section>
  );
}
