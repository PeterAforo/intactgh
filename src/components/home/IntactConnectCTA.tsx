"use client";

import React, { useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ArrowRight, Wifi, Shield, Headphones, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export default function IntactConnectCTA() {
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (sectionRef.current) {
      gsap.fromTo(
        sectionRef.current,
        { opacity: 0, y: 40 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          ease: "power3.out",
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top 85%",
          },
        }
      );
    }
  }, []);

  const features = [
    { icon: Wifi, label: "High-Speed Internet" },
    { icon: Shield, label: "Reliable & Secure" },
    { icon: Headphones, label: "24/7 Support" },
    { icon: Globe, label: "Nationwide Coverage" },
  ];

  return (
    <section className="py-12 md:py-16">
      <div className="max-w-7xl mx-auto px-4">
        <div
          ref={sectionRef}
          className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0a1628] via-[#0f2847] to-[#1a3a5c] p-8 md:p-14"
        >
          {/* Background decoration */}
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-cyan-400/10 rounded-full blur-3xl translate-y-1/3 -translate-x-1/4" />
          <div className="absolute top-1/2 left-1/2 w-40 h-40 bg-blue-400/5 rounded-full blur-2xl -translate-x-1/2 -translate-y-1/2" />

          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-10">
            {/* Left content */}
            <div className="text-white text-center md:text-left flex-1">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="flex items-center gap-2 justify-center md:justify-start mb-4"
              >
                <div className="h-8 w-8 rounded-lg bg-cyan-400/20 flex items-center justify-center">
                  <Globe className="w-4 h-4 text-cyan-400" />
                </div>
                <span className="text-cyan-400 font-semibold text-sm uppercase tracking-wider">
                  Intact Connect
                </span>
              </motion.div>
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className="text-3xl md:text-4xl lg:text-5xl font-black mb-4 leading-tight"
              >
                Stay Connected<br />
                <span className="text-cyan-400">With Intact Connect</span>
              </motion.h2>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
                className="text-white/70 text-lg max-w-lg mb-8"
              >
                Experience blazing-fast internet and connectivity solutions for your home and business. Reliable, affordable, and always on.
              </motion.p>

              {/* Features grid */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 }}
                className="grid grid-cols-2 gap-3 mb-8 max-w-md mx-auto md:mx-0"
              >
                {features.map((f) => (
                  <div
                    key={f.label}
                    className="flex items-center gap-2.5 bg-white/5 backdrop-blur-sm rounded-xl px-4 py-3 border border-white/10"
                  >
                    <f.icon className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                    <span className="text-white/90 text-sm font-medium">{f.label}</span>
                  </div>
                ))}
              </motion.div>
            </div>

            {/* Right CTA */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4 }}
              className="flex flex-col items-center gap-5"
            >
              <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 text-center border border-white/10">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center mx-auto mb-4">
                  <Wifi className="w-8 h-8 text-white" />
                </div>
                <p className="text-white font-bold text-lg mb-1">Get Connected Today</p>
                <p className="text-white/50 text-sm">Fast. Reliable. Affordable.</p>
              </div>
              <a
                href="https://intactconnect.com.gh"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button
                  size="lg"
                  className="rounded-full shadow-xl bg-cyan-500 hover:bg-cyan-400 text-white font-bold px-8"
                >
                  Visit Intact Connect
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </a>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
