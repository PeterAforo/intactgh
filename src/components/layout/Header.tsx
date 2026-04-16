"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  ShoppingCart,
  Heart,
  User,
  Menu,
  X,
  Phone,
  Mail,
  MapPin,
  ChevronDown,
  ChevronRight,
  Smartphone,
  Laptop,
  Tv,
  Headphones,
  Gamepad2,
  Wifi,
  Printer,
  Gift,
  Monitor,
  Network,
  Music,
  Camera,
  Zap,
  Watch,
  Mic,
  Mouse,
  HardDrive,
  Server,
  Wind,
  Sparkles,
  Package,
  Cpu,
  Volume2,
  Radio,
  Tablet,
  Fan,
  Home,
  Layers,
  FolderTree,
  LayoutDashboard,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useCartStore } from "@/store/cart-store";
import { useWishlistStore } from "@/store/wishlist-store";
import { formatPrice } from "@/lib/utils";
import { useRouter } from "next/navigation";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Cat = any;

const ICON_MAP: Record<string, React.ElementType> = {
  Tv, Smartphone, Laptop, Monitor, Printer, Network, Headphones, Music,
  Camera, Gamepad2, Gift, Zap, Wifi, Watch, Mic, Mouse,
  HardDrive, Server, Wind, Sparkles, Package, Cpu,
  Volume2, Radio, Tablet, Fan, Home, Layers,
};

function CatIcon({ name, className = "w-5 h-5" }: { name?: string | null; className?: string }) {
  const Icon = name ? (ICON_MAP[name] ?? FolderTree) : FolderTree;
  return <Icon className={className} />;
}

export default function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [categories, setCategories] = useState<Cat[]>([]);
  const [authUser, setAuthUser] = useState<{ name?: string; email?: string; role?: string } | null>(null);
  const [hoveredCat, setHoveredCat] = useState<Cat | null>(null);
  const [instant, setInstant] = useState<{ products: Cat[]; brands: Cat[]; categories: Cat[] } | null>(null);
  const [instantOpen, setInstantOpen] = useState(false);
  const [instantLoading, setInstantLoading] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const [sitePhone, setSitePhone] = useState("+233 543 645 126");

  const cartItemCount = useCartStore((s) => s.getItemCount());
  const cartTotal = useCartStore((s) => s.getTotal());
  const wishlistItems = useWishlistStore((s) => s.items);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
    fetch("/api/categories").then(r => r.json()).then(d => {
      if (d.categories) setCategories(d.categories);
    }).catch(() => {});
    fetch("/api/auth/me").then(r => r.json()).then(d => {
      if (d.user) setAuthUser({ name: d.user.name, email: d.user.email, role: d.user.role });
    }).catch(() => {});
    fetch("/api/settings/public").then(r => r.json()).then(d => {
      if (d.settings?.phone) setSitePhone(d.settings.phone);
    }).catch(() => {});
  }, []);

  const fetchInstant = useCallback((q: string) => {
    if (!q.trim()) { setInstant(null); setInstantOpen(false); return; }
    setInstantLoading(true);
    fetch(`/api/search?q=${encodeURIComponent(q.trim())}&limit=6`)
      .then(r => r.json())
      .then(d => { setInstant(d); setInstantOpen(true); })
      .catch(() => {})
      .finally(() => setInstantLoading(false));
  }, []);

  useEffect(() => {
    const t = setTimeout(() => fetchInstant(searchQuery), 250);
    return () => clearTimeout(t);
  }, [searchQuery, fetchInstant]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setInstantOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setInstantOpen(false);
      setSearchOpen(false);
    }
  };

  const goToResult = (href: string) => {
    router.push(href);
    setInstantOpen(false);
    setSearchQuery("");
    setSearchOpen(false);
  };

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 40);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header className="w-full z-50 relative">
      {/* Top Bar */}
      <div className="bg-primary text-white text-sm">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-10">
          <div className="hidden md:flex items-center gap-4">
            <a href="mailto:info@intactghana.com" className="flex items-center gap-1 hover:text-white/80 transition-colors">
              <Mail className="w-3.5 h-3.5" />
              info@intactghana.com
            </a>
            <a href={`tel:${sitePhone.replace(/\s/g, "")}`} className="flex items-center gap-1 hover:text-white/80 transition-colors">
              <Phone className="w-3.5 h-3.5" />
              {sitePhone}
            </a>
          </div>
          <div className="flex items-center gap-4 ml-auto">
            <Link href="/store-locations" className="flex items-center gap-1 hover:text-white/80 transition-colors">
              <MapPin className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Store Location</span>
            </Link>
            <Link href="/about" className="hover:text-white/80 transition-colors hidden sm:block">About</Link>
            <Link href="/contact" className="hover:text-white/80 transition-colors hidden sm:block">Contact Us</Link>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <div className={`bg-white transition-all duration-300 ${isScrolled ? "shadow-lg sticky top-0 z-50" : "shadow-sm"}`}>
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-16 md:h-20">
          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 hover:bg-surface rounded-lg transition-colors"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <Image
              src="/logo.png"
              alt="Intact Ghana"
              width={210}
              height={68}
              className="h-8 md:h-10 w-auto"
              priority
            />
          </Link>

          {/* Search Bar - Desktop */}
          <div ref={searchRef} className="hidden lg:flex flex-1 max-w-xl mx-8 relative">
            <form onSubmit={handleSearch} className="w-full">
              <div className="relative w-full">
                <Input
                  placeholder="Search products, brands, categories..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => searchQuery.trim() && instant && setInstantOpen(true)}
                  className="pr-12 h-11 rounded-full bg-surface border-0 focus-visible:ring-accent"
                />
                <button type="submit" className="absolute right-1 top-1/2 -translate-y-1/2 bg-accent text-white p-2 rounded-full hover:bg-accent-hover transition-colors">
                  {instantLoading ? <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : <Search className="w-4 h-4" />}
                </button>
              </div>
            </form>

            {/* Instant typeahead dropdown */}
            <AnimatePresence>
              {instantOpen && instant && (instant.products.length > 0 || instant.brands.length > 0 || instant.categories.length > 0) && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  transition={{ duration: 0.15 }}
                  className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-border z-[200] overflow-hidden max-h-[520px] overflow-y-auto"
                >
                  {/* Brands */}
                  {instant.brands.length > 0 && (
                    <div className="p-3 border-b border-border/50">
                      <p className="text-[10px] font-semibold text-text-muted uppercase tracking-wider px-2 mb-2">Brands</p>
                      <div className="flex flex-wrap gap-2">
                        {instant.brands.map((b: Cat) => (
                          <button key={b.id} onClick={() => goToResult(`/shop?brand=${b.slug}`)}
                            className="px-3 py-1.5 bg-surface hover:bg-accent/10 hover:text-accent border border-border rounded-full text-sm font-medium transition-colors">
                            {b.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Categories */}
                  {instant.categories.length > 0 && (
                    <div className="p-3 border-b border-border/50">
                      <p className="text-[10px] font-semibold text-text-muted uppercase tracking-wider px-2 mb-2">Categories</p>
                      <div className="flex flex-wrap gap-2">
                        {instant.categories.map((c: Cat) => (
                          <button key={c.id} onClick={() => goToResult(`/shop/${c.slug}`)}
                            className="px-3 py-1.5 bg-surface hover:bg-accent/10 hover:text-accent border border-border rounded-full text-sm font-medium transition-colors">
                            {c.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Products */}
                  {instant.products.length > 0 && (
                    <div className="p-2">
                      <p className="text-[10px] font-semibold text-text-muted uppercase tracking-wider px-2 mb-2">Products</p>
                      {instant.products.map((p: Cat) => (
                        <button key={p.id} onClick={() => goToResult(`/product/${p.slug}`)}
                          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-surface transition-colors text-left">
                          <div className="w-10 h-10 rounded-lg bg-surface border border-border overflow-hidden shrink-0">
                            {p.images?.[0]?.url
                              ? <Image src={p.images[0].url} alt={p.name} width={40} height={40} className="w-full h-full object-cover" />
                              : <div className="w-full h-full flex items-center justify-center"><Package className="w-4 h-4 text-border" /></div>}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-text truncate">{p.name}</p>
                            <p className="text-xs text-text-muted">{p.brand?.name} &middot; GH&#8373;{p.price?.toFixed(2)}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* View all */}
                  <div className="border-t border-border/50 p-3">
                    <button onClick={() => goToResult(`/search?q=${encodeURIComponent(searchQuery.trim())}`)}
                      className="w-full flex items-center justify-center gap-2 py-2 text-sm font-semibold text-accent hover:bg-accent/5 rounded-xl transition-colors">
                      <Search className="w-4 h-4" />
                      See all results for &quot;{searchQuery}&quot;
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Action Icons */}
          <div className="flex items-center gap-1 md:gap-3">
            {/* Mobile Search Toggle */}
            <button
              onClick={() => setSearchOpen(!searchOpen)}
              className="lg:hidden p-2 hover:bg-surface rounded-lg transition-colors"
            >
              <Search className="w-5 h-5" />
            </button>

            <Link
              href="/wishlist"
              className="relative p-2 hover:bg-surface rounded-lg transition-colors hidden sm:block"
            >
              <Heart className="w-5 h-5" />
              {mounted && wishlistItems.length > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-accent text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                  {wishlistItems.length}
                </span>
              )}
            </Link>

            {mounted && authUser && (authUser.role === "admin" || authUser.role === "staff") && (
              <Link
                href="/admin"
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white text-xs font-medium rounded-full hover:bg-primary-light transition-colors"
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Admin</span>
              </Link>
            )}

            <Link
              href="/account"
              className="flex items-center gap-1.5 px-2 py-2 hover:bg-surface rounded-lg transition-colors hidden sm:flex"
            >
              <User className="w-5 h-5 shrink-0" />
              {mounted && authUser && (
                <span className="text-sm font-medium text-text hidden md:block max-w-[130px] truncate">
                  Welcome! {authUser.name?.split(" ")[0] || authUser.email?.split("@")[0]}
                </span>
              )}
            </Link>

            <Link
              href="/cart"
              className={`relative flex items-center gap-2 text-white px-3 py-2 md:px-4 md:py-2.5 rounded-full transition-colors ${
                mounted && cartItemCount > 0 ? "bg-red-600 hover:bg-red-700" : "bg-accent hover:bg-accent-hover"
              }`}
            >
              <ShoppingCart className="w-5 h-5" />
              <span className="hidden md:inline text-sm font-medium">
                {formatPrice(mounted ? cartTotal : 0)}
              </span>
              {mounted && cartItemCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-gold text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
                  {cartItemCount}
                </span>
              )}
            </Link>
          </div>
        </div>

        {/* Mobile Search */}
        <AnimatePresence>
          {searchOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="lg:hidden border-t border-border overflow-hidden"
            >
              <form onSubmit={handleSearch} className="p-4">
                <div className="relative">
                  <Input
                    placeholder="Search products..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pr-12 rounded-full bg-surface border-0"
                    autoFocus
                  />
                  <button type="submit" className="absolute right-1 top-1/2 -translate-y-1/2 bg-accent text-white p-2 rounded-full">
                    <Search className="w-4 h-4" />
                  </button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Navigation Bar */}
      <nav className="bg-primary-light text-white hidden lg:block">
        <div className="max-w-7xl mx-auto px-4 flex items-center h-12">
          {/* Categories Dropdown */}
          <div className="relative mega-menu-trigger">
            <button
              className="flex items-center gap-2 bg-accent px-5 h-12 font-medium hover:bg-accent-hover transition-colors"
              onMouseEnter={() => setCategoriesOpen(true)}
              onMouseLeave={() => setCategoriesOpen(false)}
            >
              <Menu className="w-4 h-4" />
              Our Categories
              <ChevronDown className="w-4 h-4" />
            </button>

            <AnimatePresence>
              {categoriesOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute top-full left-0 bg-white text-text shadow-2xl rounded-b-xl z-50 flex"
                  onMouseEnter={() => setCategoriesOpen(true)}
                  onMouseLeave={() => { setCategoriesOpen(false); setHoveredCat(null); }}
                >
                  {/* Primary list - top-level only */}
                  <div className="w-[260px] overflow-hidden rounded-bl-xl">
                    {categories.filter((c: Cat) => !c.parentId).map((cat: Cat) => (
                      <div
                        key={cat.id}
                        className="group relative"
                        onMouseEnter={() => setHoveredCat(cat.children?.length ? cat : null)}
                      >
                        <Link
                          href={`/shop/${cat.slug}`}
                          className={`flex items-center gap-3 px-4 py-3 hover:bg-surface transition-colors border-b border-border/50 last:border-0 ${
                            hoveredCat?.id === cat.id ? "bg-surface" : ""
                          }`}
                        >
                          <span className="text-accent"><CatIcon name={cat.icon} /></span>
                          <span className="font-medium text-sm flex-1">{cat.name}</span>
                          {cat.children?.length > 0 ? (
                            <ChevronRight className="w-3.5 h-3.5 text-text-muted" />
                          ) : (
                            <Badge variant="outline" className="text-[10px]">{cat.productCount}</Badge>
                          )}
                        </Link>
                      </div>
                    ))}
                  </div>

                  {/* Subcategory panel */}
                  {hoveredCat && hoveredCat.children?.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, x: -4 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="w-[220px] border-l border-border bg-surface/60 rounded-br-xl py-2"
                    >
                      <p className="px-4 pb-2 pt-1 text-[10px] font-semibold text-text-muted uppercase tracking-wider">
                        {hoveredCat.name}
                      </p>
                      <Link
                        href={`/shop/${hoveredCat.slug}`}
                        className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-white hover:text-accent transition-colors font-medium"
                      >
                        All {hoveredCat.name}
                      </Link>
                      {hoveredCat.children.map((sub: Cat) => (
                        <Link
                          key={sub.id}
                          href={`/shop/${sub.slug}`}
                          className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-white hover:text-accent transition-colors"
                        >
                          <span className="w-1 h-1 rounded-full bg-accent/50 shrink-0" />
                          {sub.name}
                        </Link>
                      ))}
                    </motion.div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Nav Links */}
          <div className="flex items-center gap-1 ml-6">
            {[
              { href: "/", label: "Home" },
              { href: "/shop", label: "Shop" },
              { href: "/promotions", label: "Promotions" },
              { href: "/brands", label: "Brands" },
              { href: "/ai-solutions", label: "AI Solutions" },
              { href: "/news", label: "News" },
            ].map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="px-4 py-2 text-sm font-medium hover:text-white/80 transition-colors rounded-lg hover:bg-white/10"
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Promo text */}
          <div className="ml-auto text-xs text-red-500 font-medium animate-pulse">
            Fast Nationwide Delivery — Shop Now!
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-40 lg:hidden"
              onClick={() => setMobileMenuOpen(false)}
            />
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed left-0 top-0 h-full w-[300px] bg-white z-50 shadow-2xl overflow-y-auto"
            >
              <div className="p-4 border-b border-border flex items-center justify-between">
                <Image src="/logo.png" alt="Intact Ghana" width={180} height={60} className="h-12 w-auto" />
                <button onClick={() => setMobileMenuOpen(false)}>
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="p-4 space-y-1">
                {[
                  { href: "/", label: "Home" },
                  { href: "/shop", label: "Shop All" },
                  { href: "/promotions", label: "Promotions" },
                  { href: "/brands", label: "Brands" },
                  { href: "/ai-solutions", label: "AI Solutions" },
                  { href: "/news", label: "News" },
                  { href: "/about", label: "About Us" },
                  { href: "/contact", label: "Contact" },
                ].map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-4 py-3 rounded-lg hover:bg-surface font-medium transition-colors"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>

              <div className="p-4 border-t border-border">
                <p className="text-sm font-semibold text-text-light mb-3">Categories</p>
                <div className="space-y-1">
                  {categories.filter((c: Cat) => !c.parentId).map((cat: Cat) => (
                    <div key={cat.id}>
                      <Link
                        href={`/shop/${cat.slug}`}
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 rounded-lg hover:bg-surface transition-colors"
                      >
                        <span className="text-accent"><CatIcon name={cat.icon} /></span>
                        <span className="text-sm font-medium">{cat.name}</span>
                      </Link>
                      {cat.children?.map((sub: Cat) => (
                        <Link
                          key={sub.id}
                          href={`/shop/${sub.slug}`}
                          onClick={() => setMobileMenuOpen(false)}
                          className="flex items-center gap-2 pl-12 pr-4 py-2 rounded-lg hover:bg-surface transition-colors text-text-muted hover:text-accent"
                        >
                          <span className="w-1 h-1 rounded-full bg-accent/50 shrink-0" />
                          <span className="text-xs">{sub.name}</span>
                        </Link>
                      ))}
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-4 border-t border-border space-y-2">
                {mounted && authUser && (authUser.role === "admin" || authUser.role === "staff") && (
                  <Link
                    href="/admin"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 rounded-lg bg-primary/5 hover:bg-primary/10 transition-colors"
                  >
                    <LayoutDashboard className="w-5 h-5 text-primary" />
                    <span className="font-medium text-primary">Admin Dashboard</span>
                  </Link>
                )}
                <Link
                  href="/account"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-surface transition-colors"
                >
                  <User className="w-5 h-5 text-accent" />
                  <span className="font-medium">My Account</span>
                </Link>
                <Link
                  href="/wishlist"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-surface transition-colors"
                >
                  <Heart className="w-5 h-5 text-accent" />
                  <span className="font-medium">Wishlist</span>
                </Link>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </header>
  );
}
