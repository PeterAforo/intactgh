"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, X, Loader2, Package, Check, CheckSquare, Square, Layers,
  ChevronDown, CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = any;

export interface SelectedProduct {
  id: string;
  name: string;
  price: number;
  image: string | null;
}

interface ProductPickerModalProps {
  open: boolean;
  initialSelected: SelectedProduct[];
  onApply: (products: SelectedProduct[]) => void;
  onClose: () => void;
}

const PAGE_SIZE = 24;

function mapProduct(p: Any): SelectedProduct {
  return {
    id: p.id,
    name: p.name,
    price: p.price ?? 0,
    image: p.images?.[0]?.url || p.image || null,
  };
}

export default function ProductPickerModal({
  open,
  initialSelected,
  onApply,
  onClose,
}: ProductPickerModalProps) {
  // Draft selection — keyed map so Cancel never mutates the parent
  const [draft, setDraft] = useState<Map<string, SelectedProduct>>(new Map());
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [categories, setCategories] = useState<Any[]>([]);
  const [products, setProducts] = useState<Any[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [bulkLoading, setBulkLoading] = useState(false);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Seed draft + reset filters whenever the modal opens
  useEffect(() => {
    if (open) {
      setDraft(new Map(initialSelected.map((p) => [p.id, p])));
      setSearch("");
      setCategory("");
      setPage(1);
    }
  }, [open, initialSelected]);

  // Load categories once (flattened parents + children)
  useEffect(() => {
    if (!open) return;
    fetch("/api/admin/categories")
      .then((r) => r.json())
      .then((d) => {
        if (!d.categories) return;
        const flat = [
          ...d.categories.filter((c: Any) => !c.parentId),
          ...d.categories.flatMap((c: Any) =>
            (c.children ?? []).map((ch: Any) => ({ ...ch, _parentName: c.name }))
          ),
        ];
        setCategories(flat);
      })
      .catch(() => {});
  }, [open]);

  const buildUrl = (pageNum: number, ids = false) => {
    const params = new URLSearchParams();
    if (search.trim()) params.set("q", search.trim());
    if (category) params.set("category", category);
    params.set("status", "active");
    if (ids) {
      params.set("idsOnly", "true");
    } else {
      params.set("limit", String(PAGE_SIZE));
      params.set("page", String(pageNum));
    }
    return `/api/admin/products?${params.toString()}`;
  };

  const fetchProducts = async (pageNum: number, append: boolean) => {
    if (pageNum === 1) setLoading(true); else setLoadingMore(true);
    try {
      const res = await fetch(buildUrl(pageNum));
      const d = await res.json();
      setProducts((prev) => (append ? [...prev, ...(d.products || [])] : d.products || []));
      if (d.pagination) {
        setTotalPages(d.pagination.totalPages);
        setTotal(d.pagination.total);
        setPage(d.pagination.page);
      }
    } catch { /* ignore */ }
    if (pageNum === 1) setLoading(false); else setLoadingMore(false);
  };

  // Debounced refetch on search/category change
  useEffect(() => {
    if (!open) return;
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => fetchProducts(1, false), 300);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, category, open]);

  const toggle = (p: Any) => {
    setDraft((prev) => {
      const next = new Map(prev);
      if (next.has(p.id)) next.delete(p.id);
      else next.set(p.id, mapProduct(p));
      return next;
    });
  };

  const selectAllOnPage = () => {
    setDraft((prev) => {
      const next = new Map(prev);
      products.forEach((p) => next.set(p.id, mapProduct(p)));
      return next;
    });
  };

  const pageAllSelected = useMemo(
    () => products.length > 0 && products.every((p) => draft.has(p.id)),
    [products, draft]
  );

  const togglePageSelection = () => {
    if (pageAllSelected) {
      setDraft((prev) => {
        const next = new Map(prev);
        products.forEach((p) => next.delete(p.id));
        return next;
      });
    } else {
      selectAllOnPage();
    }
  };

  const selectAllMatching = async () => {
    setBulkLoading(true);
    try {
      // IDs for all matching products
      const res = await fetch(buildUrl(1, true));
      const d = await res.json();
      const ids: string[] = d.ids || [];
      // Map in bulk without losing products we haven't seen yet —
      // for unseen IDs we need name/price/image, so fetch them in chunks
      const unseen = ids.filter((id) => !draft.has(id));
      const next = new Map(draft);
      // Fetch full data for unseen IDs via paginated fetch (limit 100 per round)
      if (unseen.length > 0) {
        // fetch pages of 100 until we have all
        const CHUNK = 100;
        for (let start = 0; start < ids.length; start += CHUNK) {
          const pageNum = Math.floor(start / CHUNK) + 1;
          const params = new URLSearchParams();
          if (search.trim()) params.set("q", search.trim());
          if (category) params.set("category", category);
          params.set("status", "active");
          params.set("limit", String(CHUNK));
          params.set("page", String(pageNum));
          const r = await fetch(`/api/admin/products?${params.toString()}`);
          const data = await r.json();
          (data.products || []).forEach((p: Any) => next.set(p.id, mapProduct(p)));
          if (!data.pagination || pageNum >= data.pagination.totalPages) break;
        }
      }
      setDraft(next);
    } catch { /* ignore */ }
    setBulkLoading(false);
  };

  const preview = useMemo(() => Array.from(draft.values()).slice(0, 8), [draft]);
  const extraCount = draft.size - preview.length;

  if (!open) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
        {/* Overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/50"
          onClick={onClose}
        />

        {/* Panel */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 12 }}
          transition={{ duration: 0.2 }}
          className="relative bg-white w-full max-w-4xl h-[85vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-border shrink-0">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-bold text-text">Select Products</h2>
                <Badge variant="outline" className="text-xs">
                  {draft.size} selected
                </Badge>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-surface rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-text-muted" />
              </button>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by name, SKU, brand or category..."
                  className="pl-9 rounded-lg"
                  autoFocus
                />
                {search && (
                  <button
                    onClick={() => setSearch("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              <div className="relative sm:w-56">
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full appearance-none bg-surface border-0 rounded-lg pl-3 pr-8 py-2.5 text-sm text-text focus:ring-2 focus:ring-accent"
                >
                  <option value="">All categories</option>
                  {categories.map((c: Any) => (
                    <option key={c.id} value={c.id}>
                      {c._parentName ? `${c._parentName} → ${c.name}` : c.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Bulk bar */}
          <div className="px-6 py-2.5 border-b border-border bg-surface/60 flex flex-wrap items-center gap-x-4 gap-y-2 shrink-0">
            <button
              onClick={togglePageSelection}
              className="flex items-center gap-2 text-xs font-medium text-text hover:text-accent transition-colors"
            >
              {pageAllSelected ? (
                <CheckSquare className="w-4 h-4 text-accent" />
              ) : (
                <Square className="w-4 h-4 text-text-muted" />
              )}
              {pageAllSelected ? "Deselect page" : "Select all on page"}
            </button>
            <button
              onClick={selectAllMatching}
              disabled={bulkLoading}
              className="flex items-center gap-1.5 text-xs font-medium text-accent hover:text-accent-hover transition-colors disabled:opacity-50"
            >
              {bulkLoading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Layers className="w-3.5 h-3.5" />
              )}
              Select all {total.toLocaleString()} matching
            </button>
            {draft.size > 0 && (
              <button
                onClick={() => setDraft(new Map())}
                className="ml-auto text-xs font-medium text-red-500 hover:text-red-600 transition-colors"
              >
                Clear all ({draft.size})
              </button>
            )}
          </div>

          {/* Product list */}
          <div className="flex-1 overflow-y-auto px-6 py-4">
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-xl border border-border">
                    <Skeleton className="w-10 h-10 rounded-lg" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-3.5 w-3/4" />
                      <Skeleton className="h-3 w-1/3" />
                    </div>
                  </div>
                ))}
              </div>
            ) : products.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center py-16">
                <Package className="w-10 h-10 text-border mb-3" />
                <p className="text-sm font-medium text-text">No products found</p>
                <p className="text-xs text-text-muted mt-1">
                  Try a different search term or category filter
                </p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {products.map((p: Any) => {
                    const isSelected = draft.has(p.id);
                    return (
                      <button
                        key={p.id}
                        onClick={() => toggle(p)}
                        className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                          isSelected
                            ? "border-accent bg-accent/5 ring-1 ring-accent/30"
                            : "border-border hover:border-accent/40 hover:bg-surface/50"
                        }`}
                      >
                        <div className="w-10 h-10 rounded-lg bg-surface overflow-hidden shrink-0 relative">
                          {p.images?.[0]?.url ? (
                            <Image
                              src={p.images[0].url}
                              alt=""
                              width={40}
                              height={40}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Package className="w-4 h-4 text-border" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-text truncate">{p.name}</p>
                          <p className="text-xs text-text-muted">
                            GH₵{p.price?.toLocaleString()}
                            {p.category?.name ? ` · ${p.category.name}` : ""}
                            {p.sku ? ` · ${p.sku}` : ""}
                          </p>
                        </div>
                        <div
                          className={`w-5 h-5 rounded-full border-2 shrink-0 flex items-center justify-center transition-colors ${
                            isSelected ? "bg-accent border-accent" : "border-border"
                          }`}
                        >
                          {isSelected && <Check className="w-3 h-3 text-white" />}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {page < totalPages && (
                  <div className="flex justify-center mt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => fetchProducts(page + 1, true)}
                      disabled={loadingMore}
                      className="rounded-lg"
                    >
                      {loadingMore ? (
                        <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Loading...</>
                      ) : (
                        <>Load more ({total - products.length} remaining)</>
                      )}
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Footer — selected preview + actions */}
          <div className="border-t border-border px-6 py-4 shrink-0 bg-white">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                {draft.size === 0 ? (
                  <p className="text-xs text-text-muted">No products selected</p>
                ) : (
                  <div className="flex items-center gap-1.5 overflow-hidden">
                    {preview.map((p) => (
                      <div
                        key={p.id}
                        className="relative group/thumb w-8 h-8 rounded-lg bg-surface overflow-hidden shrink-0"
                        title={p.name}
                      >
                        {p.image ? (
                          <Image
                            src={p.image}
                            alt={p.name}
                            width={32}
                            height={32}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package className="w-3.5 h-3.5 text-border" />
                          </div>
                        )}
                        <button
                          onClick={() =>
                            setDraft((prev) => {
                              const next = new Map(prev);
                              next.delete(p.id);
                              return next;
                            })
                          }
                          className="absolute inset-0 bg-black/60 opacity-0 group-hover/thumb:opacity-100 transition-opacity flex items-center justify-center"
                        >
                          <X className="w-3.5 h-3.5 text-white" />
                        </button>
                      </div>
                    ))}
                    {extraCount > 0 && (
                      <span className="text-xs font-medium text-text-muted whitespace-nowrap">
                        +{extraCount} more
                      </span>
                    )}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Button variant="ghost" onClick={onClose} className="rounded-lg">
                  Cancel
                </Button>
                <Button
                  onClick={() => onApply(Array.from(draft.values()))}
                  className="rounded-lg gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Done ({draft.size})
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
