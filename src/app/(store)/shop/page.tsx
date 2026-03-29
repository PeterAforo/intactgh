"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  SlidersHorizontal,
  Grid3X3,
  LayoutList,
  ChevronDown,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

export default function ShopPage() {
  const searchParams = useSearchParams();
  const filterParam = searchParams.get("filter") || "";
  const sortParam = searchParams.get("sort") || "";
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedBrand, setSelectedBrand] = useState("");
  const [sortBy, setSortBy] = useState(sortParam || "featured");
  const [gridCols, setGridCols] = useState(4);
  const [showFilters, setShowFilters] = useState(false);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 30000]);
  const [filteredProducts, setFilteredProducts] = useState<Any[]>([]);
  const [categories, setCategories] = useState<Any[]>([]);
  const [brands, setBrands] = useState<Any[]>([]);

  useEffect(() => {
    fetch("/api/categories").then(r => r.json()).then(d => d.categories && setCategories(d.categories)).catch(() => {});
    fetch("/api/brands").then(r => r.json()).then(d => d.brands && setBrands(d.brands)).catch(() => {});
  }, []);

  const fetchProducts = useCallback(() => {
    const params = new URLSearchParams({ limit: "48", sort: sortBy });
    if (search) params.set("q", search);
    if (selectedCategory) params.set("category", selectedCategory);
    if (selectedBrand) params.set("brand", selectedBrand);
    if (priceRange[0] > 0) params.set("minPrice", String(priceRange[0]));
    if (priceRange[1] < 30000) params.set("maxPrice", String(priceRange[1]));
    if (filterParam === "new") params.set("isNew", "true");
    else if (filterParam === "featured") params.set("featured", "true");
    else if (filterParam === "sale") params.set("onSale", "true");
    fetch(`/api/products?${params}`).then(r => r.json()).then(d => {
      if (d.products) setFilteredProducts(d.products);
    }).catch(() => {});
  }, [search, selectedCategory, selectedBrand, sortBy, priceRange, filterParam]);

  useEffect(() => {
    const timer = setTimeout(fetchProducts, 300);
    return () => clearTimeout(timer);
  }, [fetchProducts]);

  const clearFilters = () => {
    setSearch("");
    setSelectedCategory("");
    setSelectedBrand("");
    setSortBy("featured");
    setPriceRange([0, 30000]);
  };

  const hasActiveFilters = search || selectedCategory || selectedBrand || priceRange[0] > 0 || priceRange[1] < 30000;

  return (
    <div className="min-h-screen bg-surface">
      {/* Page Header */}
      <div className="bg-gradient-to-r from-primary to-primary-light text-white py-12">
        <div className="max-w-7xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="text-3xl md:text-4xl font-bold mb-2">Shop All Products</h1>
            <p className="text-white/70">
              Discover amazing electronics, smartphones, laptops and more
            </p>
          </motion.div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Toolbar */}
        <div className="bg-white rounded-2xl shadow-sm border border-border p-4 mb-6">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
            {/* Search */}
            <div className="flex-1 w-full md:w-auto">
              <Input
                placeholder="Search products..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="rounded-full bg-surface border-0"
              />
            </div>

            {/* Filter Toggle */}
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="rounded-full"
            >
              <SlidersHorizontal className="w-4 h-4 mr-2" />
              Filters
              {hasActiveFilters && (
                <span className="ml-2 w-5 h-5 bg-accent text-white text-xs rounded-full flex items-center justify-center">!</span>
              )}
            </Button>

            {/* Sort */}
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="appearance-none bg-surface border-0 rounded-full px-4 py-2 pr-8 text-sm focus:ring-2 focus:ring-accent cursor-pointer"
              >
                {sortOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
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
                    gridCols === cols ? "bg-accent text-white" : "text-text-muted hover:text-text"
                  }`}
                >
                  {cols === 3 ? <LayoutList className="w-4 h-4" /> : <Grid3X3 className="w-4 h-4" />}
                </button>
              ))}
            </div>

            <p className="text-sm text-text-muted ml-auto hidden md:block">
              {filteredProducts.length} products found
            </p>
          </div>

          {/* Expanded Filters */}
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="mt-4 pt-4 border-t border-border"
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Category Filter */}
                <div>
                  <label className="text-sm font-medium text-text mb-2 block">Category</label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full bg-surface border-0 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-accent"
                  >
                    <option value="">All Categories</option>
                    {categories.map((cat: Any) => (
                      <option key={cat.id} value={cat.slug}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                {/* Brand Filter */}
                <div>
                  <label className="text-sm font-medium text-text mb-2 block">Brand</label>
                  <select
                    value={selectedBrand}
                    onChange={(e) => setSelectedBrand(e.target.value)}
                    className="w-full bg-surface border-0 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-accent"
                  >
                    <option value="">All Brands</option>
                    {brands.map((brand: Any) => (
                      <option key={brand.id} value={brand.slug}>{brand.name}</option>
                    ))}
                  </select>
                </div>

                {/* Price Range */}
                <div>
                  <label className="text-sm font-medium text-text mb-2 block">
                    Price Range: GH₵{priceRange[0].toLocaleString()} - GH₵{priceRange[1].toLocaleString()}
                  </label>
                  <input
                    type="range"
                    min={0}
                    max={30000}
                    step={500}
                    value={priceRange[1]}
                    onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value)])}
                    className="w-full accent-accent"
                  />
                </div>
              </div>

              {hasActiveFilters && (
                <div className="mt-4 flex items-center gap-2">
                  <Button variant="ghost" size="sm" onClick={clearFilters} className="text-accent">
                    <X className="w-4 h-4 mr-1" />
                    Clear All Filters
                  </Button>
                </div>
              )}
            </motion.div>
          )}
        </div>

        {/* Products Grid */}
        {filteredProducts.length > 0 ? (
          <div className={`grid gap-4 md:gap-6 ${
            gridCols === 3
              ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
              : "grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
          }`}>
            {filteredProducts.map((product, i) => (
              <ProductCard key={product.id} product={product} index={i} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <p className="text-text-muted text-lg mb-4">No products found matching your filters.</p>
            <Button onClick={clearFilters} variant="outline">Clear Filters</Button>
          </div>
        )}
      </div>
    </div>
  );
}
