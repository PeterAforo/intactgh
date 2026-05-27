"use client";

import React, { useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ArrowRight, Store, DollarSign, PackageCheck, Users } from "lucide-react";
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

  const perks = [
    { icon: Store, label: "Your Own Branded Store" },
    { icon: DollarSign, label: "Earn Commissions" },
    { icon: PackageCheck, label: "No Stock Needed" },
    { icon: Users, label: "Sell to Your Network" },
  ];

  return (
    <section className="py-12 md:py-16">
      <div className="max-w-7xl mx-auto px-4">
        <div
          ref={sectionRef}
          className="relative overflow-hidden rounded-3xl min-h-[420px]"
        >
          {/* Parallax background image */}
          <div
            className="absolute inset-0 bg-cover bg-fixed bg-center"
            style={{
              backgroundImage:
                "url('https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=1920&q=80')",
            }}
          />
          {/* Dark overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/75 to-black/60" />

          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-10 p-8 md:p-14">
            {/* Left content */}
            <div className="text-white text-center md:text-left flex-1">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="flex items-center gap-2 justify-center md:justify-start mb-4"
              >
                <div className="h-8 w-8 rounded-lg bg-gold/20 flex items-center justify-center">
                  <Store className="w-4 h-4 text-gold" />
                </div>
                <span className="text-gold font-semibold text-sm uppercase tracking-wider">
                  IntactConnect
                </span>
              </motion.div>
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className="text-3xl md:text-4xl lg:text-5xl font-black mb-4 leading-tight"
              >
                Turn Your Network<br />
                <span className="text-gold">Into Income.</span>
              </motion.h2>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
                className="text-white/70 text-lg max-w-lg mb-8"
              >
                Join IntactConnect — get your own branded store page, sell Intact Ghana products to your people, and earn commissions on every single sale. No stock needed. No stress.
              </motion.p>

              {/* Perks grid */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 }}
                className="grid grid-cols-2 gap-3 mb-8 max-w-md mx-auto md:mx-0"
              >
                {perks.map((p) => (
                  <div
                    key={p.label}
                    className="flex items-center gap-2.5 bg-white/10 backdrop-blur-sm rounded-xl px-4 py-3 border border-white/10"
                  >
                    <p.icon className="w-4 h-4 text-gold flex-shrink-0" />
                    <span className="text-white/90 text-sm font-medium">{p.label}</span>
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
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 text-center border border-white/15">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-gold to-yellow-500 flex items-center justify-center mx-auto mb-4">
                  <DollarSign className="w-8 h-8 text-white" />
                </div>
                <p className="text-white font-bold text-lg mb-1">Start Earning Today</p>
                <p className="text-white/50 text-sm">No stock. No stress.</p>
              </div>
              <a
                href="https://intactconnect.com.gh"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button
                  size="lg"
                  variant="gold"
                  className="rounded-full shadow-xl font-bold px-8"
                >
                  Join IntactConnect
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
