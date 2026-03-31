"use client";

import React, { useRef, useEffect } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  Award,
  Users,
  Truck,
  ShieldCheck,
  Target,
  Zap,
  Globe,
  Heart,
} from "lucide-react";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

const stats = [
  { value: "5+", label: "Years of Experience" },
  { value: "10K+", label: "Happy Customers" },
  { value: "5K+", label: "Products Sold" },
  { value: "99%", label: "Customer Satisfaction" },
];

const values = [
  { icon: Target, title: "Quality First", description: "We only stock authentic, genuine products from trusted global brands." },
  { icon: Zap, title: "Innovation", description: "Racing with technology - we bring the latest tech innovations to Ghana." },
  { icon: Heart, title: "Customer Focus", description: "Your satisfaction is our priority with 24/7 support and easy returns." },
  { icon: Globe, title: "Accessibility", description: "Making world-class technology accessible and affordable across Ghana." },
];

export default function AboutPage() {
  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (heroRef.current) {
      gsap.fromTo(
        heroRef.current.querySelectorAll(".animate-in"),
        { opacity: 0, y: 40 },
        { opacity: 1, y: 0, duration: 0.8, stagger: 0.15, ease: "power3.out" }
      );
    }
  }, []);

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <div className="bg-gradient-to-br from-primary via-primary-light to-accent text-white py-20 md:py-28">
        <div ref={heroRef} className="max-w-7xl mx-auto px-4 text-center">
          <span className="animate-in inline-block bg-white/10 px-4 py-1.5 rounded-full text-sm font-medium mb-4">
            About Intact Ghana
          </span>
          <h1 className="animate-in text-4xl md:text-5xl lg:text-6xl font-black mb-6">
            Racing With Technology
          </h1>
          <p className="animate-in text-lg md:text-xl text-white/80 max-w-2xl mx-auto leading-relaxed">
            Ghana&apos;s premier destination for electronics, smartphones, laptops, and home appliances.
            We bring the world&apos;s best technology to your doorstep.
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="max-w-7xl mx-auto px-4 -mt-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="bg-white rounded-2xl shadow-lg p-6 text-center"
            >
              <p className="text-3xl md:text-4xl font-black text-accent">{stat.value}</p>
              <p className="text-sm text-text-muted mt-1">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Story */}
      <div className="max-w-7xl mx-auto px-4 py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <span className="text-accent text-sm font-semibold uppercase tracking-wider">Our Story</span>
            <h2 className="text-3xl md:text-4xl font-bold mt-2 mb-6 text-text">
              Empowering Ghana Through Technology
            </h2>
            <div className="space-y-4 text-text-light leading-relaxed">
              <p>
                Founded in 2014, Intact Ghana was born from a simple vision: to make world-class
                technology accessible to every Ghanaian. Located at East Legon (A&amp;C Mall)
                in Greater Accra, we have grown to become one of Ghana&apos;s most trusted electronics
                retailers.
              </p>
              <p>
                Our commitment to authenticity, competitive pricing, and exceptional customer service
                has earned us the trust of thousands of customers across Ghana. We partner directly
                with global brands like Samsung, Apple, HP, LG, Sony, and more to bring you genuine
                products with full manufacturer warranties.
              </p>
              <p>
                Whether you&apos;re looking for the latest AI-powered smartphone, a powerful laptop for work,
                or home appliances to make life easier, Intact Ghana is your one-stop shop for all
                things technology.
              </p>
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="relative"
          >
            <div className="aspect-[4/3] rounded-2xl overflow-hidden bg-surface relative">
              <Image
                src="https://images.unsplash.com/photo-1556761175-b413da4baf72?w=800&h=600&fit=crop"
                alt="Intact Ghana Team"
                fill
                className="object-cover"
              />
            </div>
            <div className="absolute -bottom-6 -left-6 bg-accent text-white p-6 rounded-2xl shadow-xl">
              <p className="text-3xl font-black">Since</p>
              <p className="text-4xl font-black">2014</p>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Values */}
      <div className="bg-surface py-20">
        <div className="max-w-7xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-14"
          >
            <span className="text-accent text-sm font-semibold uppercase tracking-wider">Our Values</span>
            <h2 className="text-3xl md:text-4xl font-bold mt-2 text-text">What Drives Us</h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((value, i) => (
              <motion.div
                key={value.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-white rounded-2xl p-6 text-center hover:shadow-lg transition-shadow"
              >
                <div className="w-14 h-14 bg-accent/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <value.icon className="w-7 h-7 text-accent" />
                </div>
                <h3 className="font-bold text-text mb-2">{value.title}</h3>
                <p className="text-sm text-text-light leading-relaxed">{value.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Why Choose Us */}
      <div className="max-w-7xl mx-auto px-4 py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-14"
        >
          <span className="text-accent text-sm font-semibold uppercase tracking-wider">Why Choose Us</span>
          <h2 className="text-3xl md:text-4xl font-bold mt-2 text-text">The Intact Advantage</h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { icon: Award, title: "100% Authentic", desc: "All products are genuine with manufacturer warranty" },
            { icon: Truck, title: "Free Delivery", desc: "Free delivery on orders over GH₵3,000" },
            { icon: ShieldCheck, title: "Secure Payment", desc: "Safe and secure online payment options" },
            { icon: Users, title: "24/7 Support", desc: "Round-the-clock customer support" },
          ].map((item, i) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="bg-gradient-to-br from-primary to-primary-light text-white rounded-2xl p-6 text-center"
            >
              <item.icon className="w-10 h-10 mx-auto mb-4 text-gold" />
              <h3 className="font-bold mb-2">{item.title}</h3>
              <p className="text-sm text-white/70">{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
