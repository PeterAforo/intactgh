"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import ProductCard from "@/components/products/ProductCard";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = any;

export default function SearchPage() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") || "";
  const [query, setQuery] = useState(initialQuery);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState("relevance");
  const [results, setResults] = useState<Any[]>([]);
  const [categories, setCategories] = useState<Any[]>([]);

  useEffect(() => {
    fetch("/api/categories").then(r => r.json()).then(d => d.categories && setCategories(d.categories)).catch(() => {});
  }, []);

  const doSearch = useCallback(() => {
    if (!query.trim()) { setResults([]); return; }
    const params = new URLSearchParams({ q: query });
    if (sortBy === "price-low") params.set("sort", "price-asc");
    else if (sortBy === "price-high") params.set("sort", "price-desc");
    else if (sortBy === "rating") params.set("sort", "rating");
    if (selectedCategory) params.set("category", selectedCategory);
    fetch(`/api/products?${params}&limit=48`).then(r => r.json()).then(d => {
      if (d.products) setResults(d.products);
    }).catch(() => {});
  }, [query, selectedCategory, sortBy]);

  useEffect(() => {
    const t = setTimeout(doSearch, 300);
    return () => clearTimeout(t);
  }, [doSearch]);

  return (
    <div className="min-h-screen bg-surface">
      <div className="max-w-7xl mx-auto px-4 py-8 md:py-12">
        {/* Search Bar */}
        <div className="max-w-2xl mx-auto mb-8">
          <div className="relative">
            <Input
              placeholder="Search for products, brands, categories..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="h-14 pr-14 rounded-2xl bg-white border-border text-lg pl-5"
              autoFocus
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 bg-accent text-white p-2.5 rounded-xl">
              <Search className="w-5 h-5" />
            </div>
          </div>
        </div>

        {query.trim() && (
          <>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <p className="text-text-light">
                <span className="font-bold text-text">{results.length}</span> results for{" "}
                <span className="font-bold text-text">&quot;{query}&quot;</span>
              </p>
              <div className="flex items-center gap-3">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="bg-white border border-border rounded-lg px-3 py-2 text-sm"
                >
                  <option value="relevance">Relevance</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                  <option value="rating">Highest Rated</option>
                </select>
              </div>
            </div>

            {/* Category filters */}
            <div className="flex flex-wrap gap-2 mb-6">
              <button
                onClick={() => setSelectedCategory(null)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  !selectedCategory ? "bg-accent text-white" : "bg-white text-text-muted border border-border hover:border-accent"
                }`}
              >
                All
              </button>
              {categories.map((cat: Any) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(selectedCategory === cat.id ? null : cat.id)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    selectedCategory === cat.id ? "bg-accent text-white" : "bg-white text-text-muted border border-border hover:border-accent"
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>

            {results.length > 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6"
              >
                {results.map((product, i) => (
                  <ProductCard key={product.id} product={product} index={i} />
                ))}
              </motion.div>
            ) : (
              <div className="text-center py-20">
                <Search className="w-16 h-16 text-border mx-auto mb-4" />
                <h2 className="text-xl font-bold text-text mb-2">No results found</h2>
                <p className="text-text-muted">Try different keywords or browse our categories.</p>
              </div>
            )}
          </>
        )}

        {!query.trim() && (
          <div className="text-center py-20">
            <Search className="w-16 h-16 text-border mx-auto mb-4" />
            <h2 className="text-xl font-bold text-text mb-2">What are you looking for?</h2>
            <p className="text-text-muted mb-6">Search for products, brands, or categories.</p>
            <div className="flex flex-wrap gap-2 justify-center">
              {["Samsung", "iPhone", "Laptop", "TV", "Headphones", "PS5"].map((term) => (
                <button
                  key={term}
                  onClick={() => setQuery(term)}
                  className="px-4 py-2 bg-white border border-border rounded-full text-sm text-text-light hover:border-accent hover:text-accent transition-colors"
                >
                  {term}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
