"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  Bot,
  Brain,
  Camera,
  MessageSquare,
  Sparkles,
  ShieldCheck,
  ArrowRight,
  Cpu,
  Zap,
  Package,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/utils";

const aiFeatures = [
  {
    icon: Bot,
    title: "AI Shopping Assistant",
    description: "Our intelligent chatbot helps you find the perfect product, compare specs, and answer your questions 24/7.",
  },
  {
    icon: Camera,
    title: "AI Product Photography",
    description: "Sellers can snap a photo and our AI transforms it into professional product images with clean backgrounds.",
  },
  {
    icon: Brain,
    title: "Smart Recommendations",
    description: "Get personalized product suggestions based on your browsing history and preferences.",
  },
  {
    icon: MessageSquare,
    title: "Natural Language Search",
    description: "Search for products using everyday language. Just describe what you need and we'll find it.",
  },
  {
    icon: ShieldCheck,
    title: "AI Fraud Detection",
    description: "Advanced AI systems protect every transaction, ensuring safe and secure shopping.",
  },
  {
    icon: Zap,
    title: "Instant Price Alerts",
    description: "AI monitors price changes and notifies you when products you love drop in price.",
  },
];

export default function AISolutionsPage() {
  const [aiProducts, setAiProducts] = React.useState<any[]>([]);

  React.useEffect(() => {
    fetch("/api/products?featured=true&limit=4").then(r => r.json()).then(d => {
      if (d.products) setAiProducts(d.products);
    }).catch(() => {});
  }, []);

  return (
    <div className="min-h-screen bg-surface">
      {/* Hero */}
      <section className="relative bg-gradient-to-br from-primary via-primary-light to-primary text-white py-20 md:py-28 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-72 h-72 bg-accent rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-info rounded-full blur-3xl" />
        </div>
        <div className="max-w-7xl mx-auto px-4 text-center relative">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Badge className="bg-accent/20 text-accent border-accent/30 mb-4">
              <Sparkles className="w-3 h-3 mr-1" /> Powered by AI
            </Badge>
            <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold mb-6">
              AI-Powered Shopping<br />
              <span className="gradient-text">Experience</span>
            </h1>
            <p className="text-white/70 max-w-2xl mx-auto text-lg mb-8">
              Intact Ghana leverages cutting-edge artificial intelligence to deliver a smarter, faster, and more personalized shopping experience.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/shop?category=ai-smartphones">
                <Button size="lg" className="rounded-xl">
                  <Cpu className="w-4 h-4 mr-2" />
                  Shop AI Devices
                </Button>
              </Link>
              <Link href="/contact">
                <Button variant="outline" size="lg" className="rounded-xl border-white/20 text-white hover:bg-white/10">
                  Learn More
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="max-w-7xl mx-auto px-4 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl font-bold text-text mb-3">How AI Powers Intact Ghana</h2>
          <p className="text-text-muted max-w-xl mx-auto">
            From intelligent search to automated photography, AI is at the heart of everything we do.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {aiFeatures.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className="bg-white rounded-2xl border border-border/50 p-6 group hover:border-accent/30 hover:shadow-lg transition-all"
            >
              <div className="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center mb-4 group-hover:bg-accent group-hover:text-white transition-colors">
                <feature.icon className="w-6 h-6 text-accent group-hover:text-white transition-colors" />
              </div>
              <h3 className="text-lg font-bold text-text mb-2">{feature.title}</h3>
              <p className="text-sm text-text-muted leading-relaxed">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* AI Products */}
      <section className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold text-text">AI-Enabled Devices</h2>
              <p className="text-text-muted text-sm mt-1">Smartphones with built-in AI capabilities</p>
            </div>
            <Link href="/shop?category=ai-smartphones">
              <Button variant="outline" className="rounded-xl">
                View All <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {aiProducts.map((product, i) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
              >
                <Link href={`/product/${product.slug}`} className="block group">
                  <div className="bg-white rounded-2xl border border-border/50 overflow-hidden product-card">
                    <div className="relative aspect-square bg-surface overflow-hidden">
                      {product.images[0]?.url ? (
                        <Image
                          src={product.images[0].url}
                          alt={product.name}
                          fill
                          className="object-cover group-hover:scale-110 transition-transform duration-500"
                          sizes="(max-width: 768px) 50vw, 25vw"
                        />
                      ) : (
                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                          <Package className="w-10 h-10 text-border" />
                          <span className="text-[10px] text-text-muted uppercase tracking-wider">No Image</span>
                        </div>
                      )}
                      <Badge className="absolute top-3 left-3" variant="new">AI</Badge>
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold text-sm text-text line-clamp-2 mb-2 group-hover:text-accent transition-colors">
                        {product.name}
                      </h3>
                      <span className="text-lg font-bold text-accent">{formatPrice(product.price)}</span>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
