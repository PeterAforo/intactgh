"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { Calendar, ArrowRight, User, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const newsArticles = [
  {
    id: "news-1",
    title: "Samsung Galaxy S25 Ultra: Everything We Know So Far",
    excerpt: "The next generation of Samsung's flagship smartphone promises groundbreaking AI features and a redesigned camera system.",
    image: "https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=800&h=450&fit=crop",
    category: "Smartphones",
    author: "Intact Ghana",
    date: "2026-03-20",
    readTime: "5 min read",
  },
  {
    id: "news-2",
    title: "Best Laptops for Students in Ghana 2026",
    excerpt: "Our comprehensive guide to finding the perfect laptop for your studies without breaking the bank.",
    image: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=800&h=450&fit=crop",
    category: "Laptops",
    author: "Intact Ghana",
    date: "2026-03-15",
    readTime: "8 min read",
  },
  {
    id: "news-3",
    title: "How AI is Transforming Home Appliances in 2026",
    excerpt: "From smart refrigerators to AI-powered washing machines, discover how artificial intelligence is revolutionizing your home.",
    image: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&h=450&fit=crop",
    category: "Home Appliances",
    author: "Intact Ghana",
    date: "2026-03-10",
    readTime: "6 min read",
  },
  {
    id: "news-4",
    title: "Intact Ghana Opens New Showroom in Kumasi",
    excerpt: "We're excited to announce the opening of our newest showroom in the Ashanti Region, bringing technology closer to you.",
    image: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&h=450&fit=crop",
    category: "Company News",
    author: "Intact Ghana",
    date: "2026-03-05",
    readTime: "3 min read",
  },
  {
    id: "news-5",
    title: "Top 10 Gaming Accessories You Need in 2026",
    excerpt: "Level up your gaming setup with these must-have accessories, all available at Intact Ghana.",
    image: "https://images.unsplash.com/photo-1612287230202-1ff1d85d1bdf?w=800&h=450&fit=crop",
    category: "Gaming",
    author: "Intact Ghana",
    date: "2026-02-28",
    readTime: "7 min read",
  },
  {
    id: "news-6",
    title: "Mobile Money vs Card Payments: What Ghanaians Prefer",
    excerpt: "An in-depth look at payment trends in Ghana's e-commerce sector and how we're adapting to serve you better.",
    image: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&h=450&fit=crop",
    category: "Industry",
    author: "Intact Ghana",
    date: "2026-02-20",
    readTime: "4 min read",
  },
];

export default function NewsPage() {
  const featured = newsArticles[0];
  const rest = newsArticles.slice(1);

  return (
    <div className="min-h-screen bg-surface">
      {/* Hero */}
      <section className="bg-gradient-to-r from-primary to-primary-light text-white py-16 md:py-20">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="text-3xl md:text-5xl font-bold mb-4">
              News & <span className="gradient-text">Blog</span>
            </h1>
            <p className="text-white/70 max-w-2xl mx-auto text-lg">
              Stay updated with the latest tech news, product reviews, and company announcements.
            </p>
          </motion.div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Featured Article */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <Link href={`/news/${featured.id}`} className="block group">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white rounded-2xl border border-border/50 overflow-hidden product-card">
              <div className="relative aspect-[16/10] md:aspect-auto overflow-hidden">
                <Image
                  src={featured.image}
                  alt={featured.title}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
              </div>
              <div className="p-6 md:p-8 flex flex-col justify-center">
                <Badge className="w-fit mb-3">{featured.category}</Badge>
                <h2 className="text-2xl md:text-3xl font-bold text-text mb-3 group-hover:text-accent transition-colors">
                  {featured.title}
                </h2>
                <p className="text-text-muted mb-4 line-clamp-3">{featured.excerpt}</p>
                <div className="flex items-center gap-4 text-sm text-text-light">
                  <span className="flex items-center gap-1"><User className="w-3.5 h-3.5" />{featured.author}</span>
                  <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />{new Date(featured.date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</span>
                  <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{featured.readTime}</span>
                </div>
              </div>
            </div>
          </Link>
        </motion.div>

        {/* Articles Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {rest.map((article, i) => (
            <motion.div
              key={article.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
            >
              <Link href={`/news/${article.id}`} className="block group h-full">
                <div className="bg-white rounded-2xl border border-border/50 overflow-hidden h-full product-card flex flex-col">
                  <div className="relative aspect-[16/10] overflow-hidden">
                    <Image
                      src={article.image}
                      alt={article.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                      sizes="(max-width: 768px) 100vw, 33vw"
                    />
                    <Badge className="absolute top-3 left-3">{article.category}</Badge>
                  </div>
                  <div className="p-5 flex-1 flex flex-col">
                    <h3 className="font-bold text-text mb-2 group-hover:text-accent transition-colors line-clamp-2">
                      {article.title}
                    </h3>
                    <p className="text-sm text-text-muted mb-4 line-clamp-2 flex-1">{article.excerpt}</p>
                    <div className="flex items-center justify-between text-xs text-text-light">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(article.date).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                      </span>
                      <span className="flex items-center gap-1 text-accent font-medium">
                        Read More <ArrowRight className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        <div className="text-center mt-12">
          <Button variant="outline" size="lg" className="rounded-xl">
            Load More Articles
          </Button>
        </div>
      </div>
    </div>
  );
}
