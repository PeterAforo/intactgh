"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  Phone,
  Mail,
  MapPin,
  ExternalLink,
  Send,
  Truck,
  RotateCcw,
  Headphones,
  ShieldCheck,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const featureBadges = [
  { icon: Truck, title: "Fast Nationwide Delivery", desc: "Swift & reliable across Ghana" },
  { icon: RotateCcw, title: "Easy Returns", desc: "5 days money return" },
  { icon: Headphones, title: "24/7 Support", desc: "Call us anytime" },
  { icon: ShieldCheck, title: "Safe Payment", desc: "Secure online payment" },
];

const footerLinks = {
  company: [
    { href: "/about", label: "About Us" },
    { href: "/contact", label: "Contact Us" },
    { href: "/store-locations", label: "Store Locations" },
    { href: "/news", label: "News & Blog" },
    { href: "/careers", label: "Careers" },
    { href: "/gift-cards", label: "Gift Cards" },
  ],
  support: [
    { href: "/track-order", label: "Track Order" },
    { href: "/pages/shipping-returns", label: "Shipping & Returns" },
    { href: "/pages/privacy-policy", label: "Privacy Policy" },
    { href: "/pages/terms-of-use", label: "Terms & Conditions" },
    { href: "/pages/refund-policy", label: "Refund Policy" },
    { href: "/pages/delivery-policy", label: "Delivery Policy" },
    { href: "/faq", label: "FAQs" },
  ],
  categories: [
    { href: "/shop/phones-gadgets", label: "Phones & Gadgets" },
    { href: "/shop/computers-laptops", label: "Laptops & Computers" },
    { href: "/shop/tv-home-theatre", label: "TVs & Home Theatre" },
    { href: "/shop/headphones-speakers-audio", label: "Audio & Headphones" },
    { href: "/shop/games-photography", label: "Gaming & Consoles" },
    { href: "/shop/appliances", label: "Home Appliances" },
  ],
};

export default function Footer() {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);
  const [sitePhone, setSitePhone] = useState("+233 543 645 126");

  useEffect(() => {
    fetch("/api/settings/public").then(r => r.json()).then(d => {
      if (d.settings?.phone) setSitePhone(d.settings.phone);
    }).catch(() => {});
  }, []);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setSubscribed(true);
      setEmail("");
      setTimeout(() => setSubscribed(false), 3000);
    }
  };

  return (
    <footer className="bg-primary text-white mt-auto">
      {/* Features Bar */}
      <div className="border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
            {featureBadges.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="flex items-center gap-3"
              >
                <div className="bg-accent/20 p-3 rounded-xl">
                  <feature.icon className="w-6 h-6 text-accent" />
                </div>
                <div>
                  <p className="font-semibold text-sm">{feature.title}</p>
                  <p className="text-xs text-white/60">{feature.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Newsletter */}
      <div className="border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h3 className="text-xl font-bold mb-1">Subscribe To Our Newsletter</h3>
              <p className="text-white/60 text-sm">Get the latest deals, promotions, and tech news delivered to your inbox.</p>
            </div>
            <form onSubmit={handleSubscribe} className="flex w-full md:w-auto gap-2">
              <Input
                type="email"
                placeholder="Enter your email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-white/10 border-white/20 text-white placeholder:text-white/40 w-full md:w-80 rounded-full"
                required
              />
              <Button type="submit" className="rounded-full px-6 shrink-0">
                {subscribed ? "Subscribed!" : "Subscribe"}
                <Send className="w-4 h-4 ml-2" />
              </Button>
            </form>
          </div>
        </div>
      </div>

      {/* Main Footer */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
          {/* About */}
          <div className="lg:col-span-2">
            <Image src="/logo-white.png" alt="Intact Ghana" width={160} height={50} className="h-10 w-auto mb-4 brightness-0 invert" />
            <p className="text-white/60 text-sm leading-relaxed mb-6">
              Intact Ghana is your premier destination for electronics, smartphones, laptops, and home appliances. 
              Racing with technology since 2014, we bring you the best products at competitive prices with 
              exceptional customer service across Ghana.
            </p>
            <div className="space-y-3">
              <a href={`tel:${sitePhone.replace(/\s/g, "")}`} className="flex items-center gap-3 text-sm text-white/70 hover:text-gold transition-colors">
                <Phone className="w-4 h-4 text-accent" />
                {sitePhone}
              </a>
              <a href="mailto:sales@intactghana.com" className="flex items-center gap-3 text-sm text-white/70 hover:text-gold transition-colors">
                <Mail className="w-4 h-4 text-accent" />
                sales@intactghana.com
              </a>
              <div className="flex items-start gap-3 text-sm text-white/70">
                <MapPin className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                East Legon, A&C Mall, Greater Accra, Ghana - West Africa
              </div>
            </div>

            <div className="flex items-center gap-3 mt-6">
              {[
                { name: "Facebook", href: "https://www.facebook.com/share/1CV6VqyyYa/", letter: "f" },
                { name: "Instagram", href: "https://www.instagram.com/intact_ghana?igsh=aGE5ajE0djNna2Nr&utm_source=qr", letter: "IG" },
                { name: "TikTok", href: "https://www.tiktok.com/@intactghana_?_r=1&_t=ZS-95944g8qPbQ", letter: "TT" },
                { name: "WhatsApp", href: "https://wa.me/233543645126", letter: "WA" },
              ].map((social) => (
                <a
                  key={social.name}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 bg-white/10 rounded-full flex items-center justify-center hover:bg-accent transition-colors text-xs font-bold"
                  aria-label={social.name}
                >
                  {social.letter}
                </a>
              ))}
            </div>
          </div>

          {/* Links */}
          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h4 className="font-bold text-sm uppercase tracking-wider mb-5">
                {title === "company" ? "Company" : title === "support" ? "Customer Service" : "Categories"}
              </h4>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-white/60 hover:text-gold transition-colors flex items-center gap-1 group"
                    >
                      <ArrowRight className="w-3 h-3 opacity-0 -ml-4 group-hover:opacity-100 group-hover:ml-0 transition-all" />
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-5 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-white/40">
            &copy; {new Date().getFullYear()} Intact Ghana. All rights reserved. Racing with Technology.
            <span className="mx-1">|</span>
            Developed by{" "}
            <a href="http://www.mcaforo.com" target="_blank" rel="noopener noreferrer" className="text-accent hover:text-gold transition-colors font-medium">
              McAforo
            </a>
          </p>
          <div className="flex items-center gap-4 text-xs text-white/40">
            <span>We accept:</span>
            <div className="flex items-center gap-2">
              {["Visa", "Mastercard", "Mobile Money", "Cash"].map((method) => (
                <span key={method} className="bg-white/10 px-2 py-1 rounded text-white/60">{method}</span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
