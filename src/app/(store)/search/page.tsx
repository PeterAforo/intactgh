"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X, SlidersHorizontal, Tag, ChevronDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import ProductCard from "@/components/products/ProductCard";
import Link from "next/link";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = any;

const POPULAR = ["Samsung", "iPhone", "Sony", "HP Laptop", "LG TV", "Headphones", "PlayStation", "Huawei", "Apple Watch", "Printer"];

export default function SearchPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialQuery = searchParams.get("q") || "";

  const [query, setQuery] = useState(initialQuery);
  const [liveQuery, setLiveQuery] = useState(initialQuery);
  const [results, setResults] = useState<Any[]>([]);
  const [matchedBrands, setMatchedBrands] = useState<Any[]>([]);
  const [matchedCategories, setMatchedCategories] = useState<Any[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [sortBy, setSortBy] = useState("relevance");
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const doSearch = useCallback(async (q: string, catId?: string | null, sort?: string, min?: string, max?: string) => {
    if (!q.trim()) { setResults([]); setMatchedBrands([]); setMatchedCategories([]); setTotal(0); return; }
    setLoading(true);
    try {
      const params = new URLSearchParams({ q: q.trim(), limit: "48" });
      if (sort === "price-low") params.set("sort", "price-asc");
      else if (sort === "price-high") params.set("sort", "price-desc");
      else if (sort === "rating") params.set("sort", "rating");
      if (catId) params.set("category", catId);
      if (min) params.set("minPrice", min);
      if (max) params.set("maxPrice", max);

      // Use /api/products for the full filtered list, /api/search for brand/category metadata
      const [prodRes, searchRes] = await Promise.all([
        fetch(`/api/products?${params}`),
        fetch(`/api/search?q=${encodeURIComponent(q.trim())}&limit=0`),
      ]);
      const [prodData, searchData] = await Promise.all([prodRes.json(), searchRes.json()]);
      setResults(prodData.products || []);
      setTotal(prodData.pagination?.total || prodData.products?.length || 0);
      setMatchedBrands(searchData.brands || []);
      setMatchedCategories(searchData.categories || []);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, []);

  // Trigger search when URL param changes
  useEffect(() => {
    const q = searchParams.get("q") || "";
    setQuery(q);
    setLiveQuery(q);
    setSelectedCategoryId(null);
    doSearch(q, null, sortBy, minPrice, maxPrice);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // Re-search when filters change
  useEffect(() => {
    if (!query.trim()) return;
    const t = setTimeout(() => doSearch(query, selectedCategoryId, sortBy, minPrice, maxPrice), 100);
    return () => clearTimeout(t);
  }, [selectedCategoryId, sortBy, minPrice, maxPrice, query, doSearch]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (liveQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(liveQuery.trim())}`);
    }
  };

  const clearSearch = () => { setLiveQuery(""); inputRef.current?.focus(); };

  return (
    <div className="min-h-screen bg-surface">
      <div className="max-w-7xl mx-auto px-4 py-8 md:py-12">

        {/* Search Bar */}
        <div className="max-w-2xl mx-auto mb-8">
          <form onSubmit={handleSubmit}>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted pointer-events-none" />
              <Input
                ref={inputRef}
                placeholder="Search for products, brands, categories..."
                value={liveQuery}
                onChange={(e) => setLiveQuery(e.target.value)}
                className="h-14 pl-12 pr-24 rounded-2xl bg-white border-border text-base shadow-sm"
                autoFocus
              />
              {liveQuery && (
                <button type="button" onClick={clearSearch}
                  className="absolute right-[60px] top-1/2 -translate-y-1/2 p-1 text-text-muted hover:text-text transition-colors">
                  <X className="w-4 h-4" />
                </button>
              )}
              <button type="submit"
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-accent text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-accent-hover transition-colors">
                Search
              </button>
            </div>
          </form>
        </div>

        {/* Empty state */}
        {!query.trim() && (
          <div className="text-center py-16">
            <Search className="w-16 h-16 text-border mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-text mb-2">What are you looking for?</h2>
            <p className="text-text-muted mb-6">Search for products, brands, or categories above.</p>
            <div className="flex flex-wrap gap-2 justify-center max-w-xl mx-auto">
              {POPULAR.map((term) => (
                <button key={term} onClick={() => router.push(`/search?q=${encodeURIComponent(term)}`)}
                  className="px-4 py-2 bg-white border border-border rounded-full text-sm text-text-muted hover:border-accent hover:text-accent transition-colors">
                  {term}
                </button>
              ))}
            </div>
          </div>
        )}

        {query.trim() && (
          <>
            {/* Brand match banner */}
            <AnimatePresence>
              {matchedBrands.length > 0 && (
                <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="mb-5 flex flex-wrap items-center gap-3">
                  <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">Brand</span>
                  {matchedBrands.map((b) => (
                    <Link key={b.id} href={`/shop?brand=${b.slug}`}
                      className="flex items-center gap-2 px-4 py-2 bg-white border border-accent/30 hover:border-accent rounded-xl text-sm font-semibold text-accent transition-colors shadow-sm">
                      <Tag className="w-3.5 h-3.5" />
                      {b.name} — Shop all
                    </Link>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Category match chips */}
            {matchedCategories.length > 0 && (
              <div className="mb-5 flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">Category</span>
                {matchedCategories.map((c) => (
                  <Link key={c.id} href={`/shop/${c.slug}`}
                    className="px-3 py-1.5 bg-surface border border-border hover:border-accent text-sm rounded-full transition-colors">
                    {c.name}
                  </Link>
                ))}
              </div>
            )}

            {/* Controls row */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <p className="text-sm text-text-muted">
                {loading ? "Searching…" : (
                  <><span className="font-bold text-text">{total.toLocaleString()}</span> result{total !== 1 ? "s" : ""} for <span className="font-bold text-text">&quot;{query}&quot;</span></>
                )}
              </p>
              <div className="flex items-center gap-2">
                <button onClick={() => setShowFilters(!showFilters)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${showFilters ? "bg-accent text-white border-accent" : "bg-white border-border text-text hover:border-accent"}`}>
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  Filters
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showFilters ? "rotate-180" : ""}`} />
                </button>
                <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}
                  className="bg-white border border-border rounded-lg px-3 py-2 text-sm">
                  <option value="relevance">Relevance</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                  <option value="rating">Highest Rated</option>
                </select>
              </div>
            </div>

            {/* Filter panel */}
            <AnimatePresence>
              {showFilters && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden mb-4">
                  <div className="bg-white rounded-xl border border-border p-4 flex flex-wrap items-end gap-4">
                    <div>
                      <label className="text-xs font-medium text-text-muted block mb-1">Min Price (GH₵)</label>
                      <Input type="number" value={minPrice} onChange={(e) => setMinPrice(e.target.value)}
                        placeholder="0" className="w-32 rounded-lg" />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-text-muted block mb-1">Max Price (GH₵)</label>
                      <Input type="number" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)}
                        placeholder="Any" className="w-32 rounded-lg" />
                    </div>
                    {(minPrice || maxPrice) && (
                      <Button variant="outline" size="sm" className="rounded-lg"
                        onClick={() => { setMinPrice(""); setMaxPrice(""); }}>
                        <X className="w-3.5 h-3.5 mr-1" />Clear
                      </Button>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Category filter chips */}
            {matchedCategories.length === 0 && (
              <div className="flex flex-wrap gap-2 mb-5">
                <button onClick={() => setSelectedCategoryId(null)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${!selectedCategoryId ? "bg-accent text-white" : "bg-white text-text-muted border border-border hover:border-accent"}`}>
                  All
                </button>
              </div>
            )}

            {/* Results grid */}
            {loading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="bg-white rounded-2xl aspect-[3/4] animate-pulse" />
                ))}
              </div>
            ) : results.length > 0 ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                {results.map((product, i) => (
                  <ProductCard key={product.id} product={product} index={i} />
                ))}
              </motion.div>
            ) : (
              <div className="text-center py-20">
                <Search className="w-16 h-16 text-border mx-auto mb-4" />
                <h2 className="text-xl font-bold text-text mb-2">No products found for &quot;{query}&quot;</h2>
                <p className="text-text-muted mb-6">Try a different search term or browse our categories.</p>
                <div className="flex flex-wrap gap-2 justify-center max-w-sm mx-auto">
                  {POPULAR.filter(t => t.toLowerCase() !== query.toLowerCase()).slice(0, 6).map((term) => (
                    <button key={term} onClick={() => router.push(`/search?q=${encodeURIComponent(term)}`)}
                      className="px-4 py-2 bg-white border border-border rounded-full text-sm text-text-muted hover:border-accent hover:text-accent transition-colors">
                      {term}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
