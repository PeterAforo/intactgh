"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  SlidersHorizontal,
  Grid3X3,
  LayoutList,
  ChevronDown,
  X,
  ArrowLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import ProductCard from "@/components/products/ProductCard";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = any;

const sortOptions = [
  { value: "featured", label: "Featured" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
  { value: "newest", label: "Newest First" },
  { value: "rating", label: "Top Rated" },
];

export default function CategoryPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [category, setCategory] = useState<Any>(null);
  const [allCategories, setAllCategories] = useState<Any[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Any[]>([]);
  const [categoryBrands, setCategoryBrands] = useState<Any[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [selectedBrand, setSelectedBrand] = useState("");
  const [sortBy, setSortBy] = useState("featured");
  const [gridCols, setGridCols] = useState(4);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 30000]);
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>("");

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetch("/api/categories").then(r => r.json()).then(d => {
        if (d.categories) {
          setAllCategories(d.categories);
          const cat = d.categories.find((c: Any) => c.slug === slug);
          setCategory(cat || null);
        }
      }),
      fetch("/api/brands").then(r => r.json()).then(d => {
        if (d.brands) setCategoryBrands(d.brands);
      }),
    ]).catch(() => {}).finally(() => setLoading(false));
  }, [slug]);

  const fetchProducts = useCallback(() => {
    const categorySlug = selectedSubcategory || slug;
    const params = new URLSearchParams({ category: categorySlug, limit: "48", sort: sortBy });
    if (search) params.set("q", search);
    if (selectedBrand) params.set("brand", selectedBrand);
    if (priceRange[0] > 0) params.set("minPrice", String(priceRange[0]));
    if (priceRange[1] < 30000) params.set("maxPrice", String(priceRange[1]));
    fetch(`/api/products?${params}`).then(r => r.json()).then(d => {
      if (d.products) setFilteredProducts(d.products);
    }).catch(() => {});
  }, [slug, search, selectedBrand, sortBy, priceRange, selectedSubcategory]);

  useEffect(() => {
    const t = setTimeout(fetchProducts, 300);
    return () => clearTimeout(t);
  }, [fetchProducts]);

  if (loading) {
    return (
      <div className="min-h-screen bg-surface">
        <div className="bg-gradient-to-r from-primary to-primary-light text-white py-12">
          <div className="max-w-7xl mx-auto px-4">
            <div className="h-4 w-24 bg-white/20 rounded mb-4 animate-pulse" />
            <div className="h-9 w-64 bg-white/20 rounded animate-pulse mb-2" />
            <div className="h-4 w-40 bg-white/20 rounded animate-pulse" />
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-border p-4 animate-pulse">
                <div className="aspect-square bg-surface rounded-xl mb-3" />
                <div className="h-4 bg-surface rounded w-3/4 mb-2" />
                <div className="h-4 bg-surface rounded w-1/2" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!category) {
    return (
      <div className="min-h-screen bg-surface">
        <div className="bg-gradient-to-r from-primary to-primary-light text-white py-12">
          <div className="max-w-7xl mx-auto px-4">
            <Link href="/shop" className="inline-flex items-center gap-1.5 text-white/70 hover:text-white text-sm mb-3 transition-colors">
              <ArrowLeft className="w-4 h-4" /> Back to Shop
            </Link>
            <h1 className="text-3xl font-bold">Shop</h1>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 py-16 text-center">
          <p className="text-text-muted mb-6">We couldn&apos;t find that category. Browse our full catalog instead.</p>
          <Link href="/shop">
            <Button className="rounded-xl">Browse All Products</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface">
      {/* Page Header */}
      <div className="bg-gradient-to-r from-primary to-primary-light text-white py-12">
        <div className="max-w-7xl mx-auto px-4">
          <Link
            href="/shop"
            className="inline-flex items-center gap-1.5 text-white/70 hover:text-white text-sm mb-3 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Shop
          </Link>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="text-3xl md:text-4xl font-bold mb-2">{category.name}</h1>
            <p className="text-white/70">
              {filteredProducts.length} {filteredProducts.length === 1 ? "product" : "products"} available
            </p>
          </motion.div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Toolbar */}
        <div className="bg-white rounded-2xl shadow-sm border border-border p-4 mb-6">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
            <div className="flex-1 w-full md:w-auto">
              <Input
                placeholder={`Search in ${category.name}...`}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="rounded-full bg-surface border-0"
              />
            </div>

            {/* Brand Filter */}
            {categoryBrands.length > 0 && (
              <div className="relative">
                <select
                  value={selectedBrand}
                  onChange={(e) => setSelectedBrand(e.target.value)}
                  className="appearance-none bg-surface border-0 rounded-full px-4 py-2 pr-8 text-sm focus:ring-2 focus:ring-accent cursor-pointer"
                >
                  <option value="">All Brands</option>
                  {categoryBrands.map((brand) => (
                    <option key={brand.id} value={brand.slug}>
                      {brand.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
              </div>
            )}

            {/* Sort */}
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="appearance-none bg-surface border-0 rounded-full px-4 py-2 pr-8 text-sm focus:ring-2 focus:ring-accent cursor-pointer"
              >
                {sortOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
            </div>

            {/* Grid Toggle */}
            <div className="hidden md:flex items-center gap-1 bg-surface rounded-full p-1">
              {[3, 4].map((cols) => (
                <button
                  key={cols}
                  onClick={() => setGridCols(cols)}
                  className={`p-2 rounded-full transition-colors ${
                    gridCols === cols
                      ? "bg-accent text-white"
                      : "text-text-muted hover:text-text"
                  }`}
                >
                  {cols === 3 ? (
                    <LayoutList className="w-4 h-4" />
                  ) : (
                    <Grid3X3 className="w-4 h-4" />
                  )}
                </button>
              ))}
            </div>

            <p className="text-sm text-text-muted ml-auto hidden md:block">
              {filteredProducts.length} products
            </p>
          </div>
        </div>

        {/* Subcategory filter chips — shown when this category has children */}
        {category.children?.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6 items-center">
            <span className="text-xs font-semibold text-text-muted uppercase tracking-wide mr-1">Filter:</span>
            <button
              onClick={() => setSelectedSubcategory("")}
              className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                selectedSubcategory === ""
                  ? "bg-accent text-white border-accent"
                  : "border-border text-text-muted hover:border-accent hover:text-accent"
              }`}
            >
              All {category.name}
            </button>
            {category.children.map((sub: Any) => (
              <button
                key={sub.id}
                onClick={() => setSelectedSubcategory(sub.slug)}
                className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                  selectedSubcategory === sub.slug
                    ? "bg-accent text-white border-accent"
                    : "border-border text-text-muted hover:border-accent hover:text-accent"
                }`}
              >
                {sub.name}
              </button>
            ))}
          </div>
        )}

        {/* Sibling/parent navigation — shown when this is a subcategory or has no children */}
        {!category.children?.length && (
          <div className="flex flex-wrap gap-2 mb-6">
            {allCategories
              .filter((c: Any) => c.slug !== slug && !c.parentId)
              .map((cat: Any) => (
                <Link key={cat.id} href={`/shop/${cat.slug}`}>
                  <Badge
                    variant="outline"
                    className="cursor-pointer hover:border-accent hover:text-accent transition-colors px-3 py-1.5"
                  >
                    {cat.name}
                  </Badge>
                </Link>
              ))}
          </div>
        )}

        {/* Products Grid */}
        {filteredProducts.length > 0 ? (
          <div
            className={`grid gap-4 md:gap-6 ${
              gridCols === 3
                ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
                : "grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
            }`}
          >
            {filteredProducts.map((product, i) => (
              <ProductCard key={product.id} product={product} index={i} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <p className="text-text-muted text-lg mb-4">
              No products found in {category.name} matching your filters.
            </p>
            <div className="flex gap-3 justify-center">
              <Button
                onClick={() => {
                  setSearch("");
                  setSelectedBrand("");
                  setPriceRange([0, 30000]);
                }}
                variant="outline"
                className="rounded-xl"
              >
                Clear Filters
              </Button>
              <Link href="/shop">
                <Button className="rounded-xl">Browse All Products</Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
