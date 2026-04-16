"use client";

import React from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { ArrowLeft, Calendar, Clock, User, Share2, Globe, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const newsArticles: Record<
  string,
  {
    title: string;
    category: string;
    author: string;
    date: string;
    readTime: string;
    image: string;
    content: string[];
  }
> = {
  "news-1": {
    title: "Samsung Galaxy S25 Ultra: Everything We Know So Far",
    category: "Smartphones",
    author: "Intact Ghana",
    date: "2026-03-20",
    readTime: "5 min read",
    image:
      "https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=1200&h=600&fit=crop",
    content: [
      "Samsung's next flagship smartphone, the Galaxy S25 Ultra, is shaping up to be one of the most exciting releases of 2026. With significant upgrades across the board, here's everything we know so far.",
      "## Design & Display\nThe Galaxy S25 Ultra is expected to feature a stunning 6.9-inch Dynamic AMOLED 2X display with a 120Hz adaptive refresh rate. Samsung is reportedly using a new titanium frame that's both lighter and more durable than the previous generation. The display will support up to 3000 nits peak brightness, making it the brightest Galaxy display ever.",
      "## Camera System\nThe camera system receives a major overhaul with a new 200MP main sensor featuring enhanced AI processing. The ultra-wide camera is upgraded to 50MP, and the dual telephoto system offers 3x and 10x optical zoom. Samsung's new AI photography features include automatic scene optimization, enhanced night mode, and real-time video AI stabilization.",
      "## Performance\nPowered by the Snapdragon 8 Gen 4 processor, the S25 Ultra promises up to 40% better performance and 30% improved power efficiency. It comes with 12GB or 16GB of RAM and storage options of 256GB, 512GB, and 1TB.",
      "## AI Features\nSamsung is doubling down on AI with Galaxy AI 2.0, featuring improved real-time translation, AI-powered photo editing, intelligent app suggestions, and a redesigned Bixby assistant powered by a new large language model.",
      "## Availability in Ghana\nIntact Ghana will be among the first retailers in Ghana to stock the Samsung Galaxy S25 Ultra. Pre-orders are expected to open in early April, with devices shipping by mid-April. Stay tuned to our website and social media channels for pricing and availability updates.",
    ],
  },
  "news-2": {
    title: "Best Laptops for Students in Ghana 2026",
    category: "Laptops",
    author: "Intact Ghana",
    date: "2026-03-15",
    readTime: "8 min read",
    image:
      "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=1200&h=600&fit=crop",
    content: [
      "Finding the perfect laptop for your studies doesn't have to be overwhelming. We've compiled a list of the best laptops available in Ghana for every budget and need.",
      "## Budget Pick: Acer Aspire 3\nStarting at GH₵4,500, the Acer Aspire 3 offers excellent value with an Intel Core i3 processor, 8GB RAM, and 256GB SSD. It's lightweight at 1.7kg and offers up to 8 hours of battery life — perfect for a full day of classes.",
      "## Mid-Range: HP Pavilion 15\nAt around GH₵7,500, the HP Pavilion 15 steps things up with an Intel Core i5, 16GB RAM, and 512GB SSD. The 15.6-inch Full HD display is great for reading and research, and it handles multitasking with ease.",
      "## Best Overall: Apple MacBook Air M3\nIf budget allows, the MacBook Air M3 at GH₵14,999 is unmatched in performance, battery life (up to 18 hours), and build quality. The M3 chip handles everything from coding to video editing without breaking a sweat.",
      "## Gaming & Creative Work: ASUS ROG Strix G16\nFor engineering, architecture, or design students who need serious horsepower, the ASUS ROG Strix G16 at GH₵16,500 packs an Intel Core i7, NVIDIA RTX 4060, 16GB RAM, and a 165Hz display.",
      "## Tips for Buying\n- Always check for genuine warranty from the manufacturer.\n- Consider the weight if you'll carry it daily.\n- Prioritize RAM and SSD over a fancy display.\n- Visit our showroom to test before buying.\n\nAll these laptops are available at Intact Ghana with genuine warranty and after-sales support.",
    ],
  },
  "news-3": {
    title: "How AI is Transforming Home Appliances in 2026",
    category: "Home Appliances",
    author: "Intact Ghana",
    date: "2026-03-10",
    readTime: "6 min read",
    image:
      "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=1200&h=600&fit=crop",
    content: [
      "Artificial intelligence is no longer confined to smartphones and computers. In 2026, AI is revolutionizing how we interact with everyday home appliances, making our homes smarter, more efficient, and more convenient.",
      "## Smart Refrigerators\nModern AI-powered refrigerators can now track your food inventory, suggest recipes based on available ingredients, and even automatically reorder groceries when supplies run low. Samsung and LG are leading this revolution with models that feature internal cameras and touchscreen interfaces.",
      "## AI Washing Machines\nAI washing machines can detect fabric types, dirt levels, and load weight to automatically select the optimal wash cycle. This not only saves water and energy but also extends the life of your clothes. Some models can even diagnose and troubleshoot issues remotely.",
      "## Robot Vacuums\nAI-powered robot vacuums have become incredibly sophisticated, mapping your home in 3D, avoiding obstacles with precision, and learning your cleaning preferences over time. Models from iRobot and Roborock can even empty their own dustbins.",
      "## Smart Air Conditioners\nAI-enabled air conditioners learn your temperature preferences and daily routines, automatically adjusting settings for optimal comfort and energy efficiency. Some models can reduce energy consumption by up to 40%.",
      "## What This Means for Ghana\nAs these technologies become more affordable, Ghanaian households can benefit from significant energy savings and convenience. Intact Ghana stocks a growing range of AI-enabled appliances from top brands. Visit our showroom to see them in action.",
    ],
  },
  "news-4": {
    title: "Intact Ghana Opens New Showroom in Kumasi",
    category: "Company News",
    author: "Intact Ghana",
    date: "2026-03-05",
    readTime: "3 min read",
    image:
      "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200&h=600&fit=crop",
    content: [
      "We are thrilled to announce the grand opening of our newest showroom in Kumasi, located in the heart of Adum. This expansion marks a significant milestone in our mission to bring world-class technology to every corner of Ghana.",
      "## About the New Showroom\nThe Kumasi showroom spans over 2,000 square feet and features dedicated sections for smartphones, laptops, TVs, home appliances, and gaming equipment. Customers can experience products firsthand with interactive display areas and knowledgeable staff ready to assist.",
      "## Special Opening Offers\nTo celebrate, we're offering exclusive discounts of up to 20% on selected products throughout the opening week. Additional benefits include discounted delivery within Kumasi for the first month, extended warranty on select products, and special trade-in offers for old devices.",
      "## Location & Hours\nAddress: Adum, Kumasi, Ashanti Region\nOpening Hours: Monday - Saturday, 8:30 AM - 5:30 PM\nPhone: +233 543 008 475",
      "## Visit Us\nWe invite all our customers in the Ashanti Region to visit our new showroom and experience the Intact Ghana difference. Our team is ready to help you find the perfect technology solutions for your needs.",
    ],
  },
  "news-5": {
    title: "Top 10 Gaming Accessories You Need in 2026",
    category: "Gaming",
    author: "Intact Ghana",
    date: "2026-02-28",
    readTime: "7 min read",
    image:
      "https://images.unsplash.com/photo-1612287230202-1ff1d85d1bdf?w=1200&h=600&fit=crop",
    content: [
      "Whether you're a casual gamer or a competitive esports player, having the right accessories can make all the difference. Here are our top 10 picks for 2026.",
      "## 1. PlayStation DualSense Edge Controller\nThe ultimate PS5 controller with customizable buttons, adjustable triggers, and swappable stick modules. Available at GH₵1,299.",
      "## 2. Razer BlackShark V2 Pro Headset\nWireless gaming headset with THX Spatial Audio, comfortable memory foam cushions, and 70-hour battery life. GH₵899.",
      "## 3. Logitech G Pro X Superlight 2\nAt just 60 grams, this wireless gaming mouse offers unmatched precision with a 32K DPI sensor. GH₵749.",
      "## 4. Samsung Odyssey G9 Monitor\n49-inch ultrawide curved gaming monitor with 240Hz refresh rate and 1ms response time. The ultimate immersive experience. GH₵8,999.",
      "## 5-10. More Essentials\n- SteelSeries Apex Pro keyboard (GH₵1,199)\n- Elgato Stream Deck MK.2 (GH₵899)\n- Corsair MM700 RGB mousepad (GH₵349)\n- Blue Yeti X microphone (GH₵799)\n- Secretlab Titan Evo chair (GH₵3,499)\n- Xbox Game Pass Ultimate subscription",
      "All gaming accessories mentioned are available at Intact Ghana. Visit our store or shop online for the best prices in Ghana.",
    ],
  },
  "news-6": {
    title: "Mobile Money vs Card Payments: What Ghanaians Prefer",
    category: "Industry",
    author: "Intact Ghana",
    date: "2026-02-20",
    readTime: "4 min read",
    image:
      "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=1200&h=600&fit=crop",
    content: [
      "As Ghana's e-commerce sector continues to grow rapidly, understanding payment preferences is crucial for both businesses and consumers. Our analysis of payment trends reveals interesting insights.",
      "## Mobile Money Dominance\nMobile Money continues to be the preferred payment method for online purchases in Ghana, accounting for approximately 65% of all e-commerce transactions. MTN MoMo leads with 45% market share, followed by Vodafone Cash at 12% and AirtelTigo Money at 8%.",
      "## Card Payments Growing\nDebit and credit card payments now account for about 25% of online transactions, up from 18% in 2024. The growth is driven by increased card issuance by banks, improved security measures, and growing consumer confidence in online card payments.",
      "## Cash on Delivery\nDespite the growth in digital payments, Cash on Delivery still accounts for about 10% of e-commerce transactions. This method remains popular among first-time online shoppers who prefer to inspect products before paying.",
      "## How Intact Ghana Adapts\nAt Intact Ghana, we support all major payment methods to ensure every customer can shop comfortably. Our checkout process is optimized for both mobile money and card payments, with additional security measures to protect every transaction.",
      "## The Future\nWe predict that by 2028, digital payments will account for over 95% of e-commerce transactions in Ghana, with mobile money maintaining its lead position. We're committed to staying at the forefront of payment innovation to serve our customers better.",
    ],
  },
};

export default function NewsDetailPage() {
  const params = useParams();
  const articleId = params.id as string;
  const article = newsArticles[articleId];

  if (!article) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center px-4">
        <h1 className="text-2xl font-bold text-text mb-3">Article Not Found</h1>
        <p className="text-text-muted mb-6">
          The article you are looking for does not exist.
        </p>
        <Link href="/news">
          <Button className="rounded-xl">Back to News</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface">
      {/* Hero Image */}
      <div className="relative h-[300px] md:h-[450px] bg-primary">
        <Image
          src={article.image}
          alt={article.title}
          fill
          className="object-cover opacity-80"
          sizes="100vw"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10 max-w-4xl mx-auto">
          <Link
            href="/news"
            className="inline-flex items-center gap-2 text-white/70 hover:text-white mb-4 text-sm transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to News
          </Link>
          <Badge className="mb-3">{article.category}</Badge>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-2xl md:text-4xl font-bold text-white mb-4"
          >
            {article.title}
          </motion.h1>
          <div className="flex flex-wrap items-center gap-4 text-sm text-white/70">
            <span className="flex items-center gap-1">
              <User className="w-3.5 h-3.5" />
              {article.author}
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              {new Date(article.date).toLocaleDateString("en-GB", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {article.readTime}
            </span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-10">
        <motion.article
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl border border-border/50 p-6 md:p-10"
        >
          {article.content.map((block, i) => {
            if (block.startsWith("## ")) {
              const parts = block.split("\n");
              const heading = parts[0].replace("## ", "");
              const body = parts.slice(1).join("\n");
              return (
                <div key={i} className="mb-6">
                  <h2 className="text-xl font-bold text-text mb-2 mt-6">
                    {heading}
                  </h2>
                  <p className="text-text-light leading-relaxed whitespace-pre-line">
                    {body}
                  </p>
                </div>
              );
            }
            return (
              <p
                key={i}
                className="text-text-light leading-relaxed mb-4 whitespace-pre-line"
              >
                {block}
              </p>
            );
          })}

          {/* Share */}
          <div className="border-t border-border mt-8 pt-6 flex items-center gap-4">
            <span className="text-sm font-medium text-text-muted flex items-center gap-1">
              <Share2 className="w-4 h-4" /> Share:
            </span>
            <a
              href="#"
              className="w-8 h-8 bg-[#1877F2] text-white rounded-full flex items-center justify-center text-xs font-bold hover:opacity-80 transition-opacity"
              aria-label="Share on Facebook"
            >
              F
            </a>
            <a
              href="#"
              className="w-8 h-8 bg-[#1DA1F2] text-white rounded-full flex items-center justify-center text-xs font-bold hover:opacity-80 transition-opacity"
              aria-label="Share on Twitter"
            >
              T
            </a>
            <a
              href="#"
              className="w-8 h-8 bg-[#25D366] text-white rounded-full flex items-center justify-center text-xs font-bold hover:opacity-80 transition-opacity"
              aria-label="Share on WhatsApp"
            >
              W
            </a>
          </div>
        </motion.article>

        {/* Back link */}
        <div className="text-center mt-8">
          <Link href="/news">
            <Button variant="outline" className="rounded-xl">
              <ArrowLeft className="w-4 h-4 mr-2" /> Back to All Articles
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
