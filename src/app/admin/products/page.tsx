"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Search, Edit, Trash2, Eye,
  Download, Upload, CheckSquare, X, ChevronLeft, ChevronRight,
  AlertTriangle, RefreshCw, Copy, Check, ChevronDown, ChevronUp, Package,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/utils";
import toast from "react-hot-toast";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = any;

const PAGE_SIZE = 20;

function statusColor(s: string) {
  if (s === "active") return "bg-green-100 text-green-700";
  if (s === "draft") return "bg-yellow-100 text-yellow-700";
  return "bg-gray-100 text-gray-500";
}

export default function AdminProductsPage() {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [products, setProducts] = useState<Any[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);

  // Bulk selection
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const allChecked = products.length > 0 && products.every((p) => selected.has(p.id));
  const someChecked = selected.size > 0 && !allChecked;

  // Import modal
  const [showImport, setShowImport] = useState(false);
  const [importing, setImporting] = useState(false);
  const importFileRef = useRef<HTMLInputElement>(null);

  // Categories for filter dropdown + import lookup
  const [categories, setCategories] = useState<Any[]>([]);
  const [showCatLookup, setShowCatLookup] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/categories").then(r => r.json()).then(d => d.categories && setCategories(d.categories)).catch(() => {});
  }, []);

  // Flat list: all categories + all subcategories
  const allCategoriesFlat: Any[] = [
    ...categories.filter((c: Any) => !c.parentId),
    ...categories.flatMap((c: Any) => (c.children ?? []).map((ch: Any) => ({ ...ch, _parentName: c.name }))),
  ];

  const copyId = (id: string) => {
    navigator.clipboard.writeText(id).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 1800);
    });
  };

  const fetchProducts = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ limit: String(PAGE_SIZE), page: String(page) });
    if (search) params.set("q", search);
    if (statusFilter) params.set("status", statusFilter);
    if (categoryFilter) params.set("category", categoryFilter);
    fetch(`/api/admin/products?${params}`)
      .then(r => r.json())
      .then(d => {
        if (d.products) setProducts(d.products);
        if (d.pagination) setTotalCount(d.pagination.total);
      })
      .catch(() => toast.error("Failed to load products"))
      .finally(() => setLoading(false));
  }, [search, statusFilter, categoryFilter, page]);

  useEffect(() => {
    const t = setTimeout(fetchProducts, 300);
    return () => clearTimeout(t);
  }, [fetchProducts]);

  // Reset page when filters change
  useEffect(() => { setPage(1); }, [search, statusFilter, categoryFilter]);

  // ── Delete single ────────────────────────────────────────────────────────
  const handleDelete = async (id: string, pName: string) => {
    if (!confirm(`Delete "${pName}"? This cannot be undone.`)) return;
    try {
      const res = await fetch(`/api/admin/products/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error((await res.json()).error);
      toast.success("Product deleted");
      setSelected((s) => { const n = new Set(s); n.delete(id); return n; });
      fetchProducts();
    } catch (e: Any) { toast.error(e.message || "Delete failed"); }
  };

  // ── Bulk delete ──────────────────────────────────────────────────────────
  const handleBulkDelete = async () => {
    if (!confirm(`Delete ${selected.size} product(s)? This cannot be undone.`)) return;
    const ids = Array.from(selected);
    const results = await Promise.allSettled(
      ids.map((id) => fetch(`/api/admin/products/${id}`, { method: "DELETE" }))
    );
    const failed = results.filter((r) => r.status === "rejected").length;
    toast.success(`Deleted ${ids.length - failed} product(s)${failed ? `, ${failed} failed` : ""}`);
    setSelected(new Set());
    fetchProducts();
  };

  // ── Bulk status change ───────────────────────────────────────────────────
  const handleBulkStatus = async (newStatus: string) => {
    const ids = Array.from(selected);
    await Promise.allSettled(
      ids.map((id) =>
        fetch(`/api/admin/products/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: newStatus }),
        })
      )
    );
    toast.success(`${ids.length} product(s) set to "${newStatus}"`);
    setSelected(new Set());
    fetchProducts();
  };

  // ── Export CSV ───────────────────────────────────────────────────────────
  const handleExport = async () => {
    toast.loading("Preparing export…", { id: "export" });
    try {
      const res = await fetch("/api/admin/products?limit=10000");
      const data = await res.json();
      const rows: Any[] = data.products ?? [];
      const headers = ["ID", "Name", "SKU", "Price", "Compare Price", "Cost Price", "Stock", "Category", "Brand", "Status", "Featured", "Tags", "Created"];
      const csvRows = rows.map((p) => [
        p.id, `"${(p.name ?? "").replace(/"/g, '""')}"`, p.sku ?? "",
        p.price, p.comparePrice ?? "", p.costPrice ?? "", p.stock,
        `"${p.category?.name ?? ""}"`, `"${p.brand?.name ?? ""}"`,
        p.status, p.featured ? "Yes" : "No",
        `"${(p.tags ?? "").replace(/"/g, '""')}"`,
        new Date(p.createdAt).toLocaleDateString(),
      ]);
      const csv = [headers, ...csvRows].map((r) => r.join(",")).join("\n");
      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a"); a.href = url;
      a.download = `products-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click(); URL.revokeObjectURL(url);
      toast.success(`Exported ${rows.length} products`, { id: "export" });
    } catch { toast.error("Export failed", { id: "export" }); }
  };

  // ── Export selected rows only ────────────────────────────────────────────
  const handleExportSelected = () => {
    const rows = products.filter((p) => selected.has(p.id));
    const headers = ["ID", "Name", "SKU", "Price", "Stock", "Category", "Status"];
    const csvRows = rows.map((p) => [p.id, `"${p.name}"`, p.sku, p.price, p.stock, `"${p.category?.name}"`, p.status]);
    const csv = [headers, ...csvRows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url;
    a.download = `products-selected-${Date.now()}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  // ── Download CSV template ────────────────────────────────────────────────
  const handleDownloadTemplate = () => {
    const headers = ["name", "description", "price", "comparePrice", "costPrice", "sku", "stock", "status", "tags", "categoryId", "brandId"];
    const example = ["Example Product", "Product description here", "299.99", "399.99", "199.99", "", "10", "active", "electronics,gadget", allCategoriesFlat[0]?.id || "CATEGORY_ID_HERE", ""];
    const csv = [headers, example].map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url;
    a.download = "products-import-template.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  // ── Import CSV ───────────────────────────────────────────────────────────
  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    try {
      const text = await file.text();
      const lines = text.split("\n").filter(Boolean);
      const headers = lines[0].split(",").map((h) => h.trim().toLowerCase().replace(/\s+/g, ""));
      const getCol = (row: string[], key: string) => {
        const i = headers.indexOf(key);
        return i >= 0 ? row[i]?.replace(/^"|"$/g, "").trim() : "";
      };

      // Build name→id map for all categories + subcategories
      const catNameMap: Record<string, string> = {};
      allCategoriesFlat.forEach((c: Any) => {
        catNameMap[c.name.toLowerCase().trim()] = c.id;
      });

      const rows = lines.slice(1);
      let created = 0; let failed = 0; let skipped = 0;
      for (const line of rows) {
        const cols = line.split(",");
        const name = getCol(cols, "name"); if (!name) continue;

        // Resolve categoryId: try direct ID first, then name lookup
        let categoryId = getCol(cols, "categoryid");
        if (!categoryId) {
          const catName = getCol(cols, "category").toLowerCase().trim();
          categoryId = catNameMap[catName] || "";
        }
        // Also try matching by ID existence if it's a subcategory
        if (categoryId && !allCategoriesFlat.find((c: Any) => c.id === categoryId)) {
          // Try name match as last resort
          const fallback = catNameMap[categoryId.toLowerCase().trim()];
          if (fallback) categoryId = fallback;
        }

        if (!categoryId) { skipped++; continue; }

        const body = {
          name, slug: name.toLowerCase().replace(/[^a-z0-9]+/g, "-") + "-" + Date.now().toString(36),
          description: getCol(cols, "description") || name,
          price: getCol(cols, "price") || "0",
          comparePrice: getCol(cols, "compareprice") || "",
          costPrice: getCol(cols, "costprice") || "",
          sku: getCol(cols, "sku") || "",
          stock: getCol(cols, "stock") || "0",
          status: getCol(cols, "status") || "active",
          tags: getCol(cols, "tags") || "",
          categoryId,
          brandId: getCol(cols, "brandid") || "",
          images: [],
        };
        const res = await fetch("/api/admin/products", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
        res.ok ? created++ : failed++;
      }
      const msg = [`Imported ${created}`];
      if (failed) msg.push(`${failed} failed`);
      if (skipped) msg.push(`${skipped} skipped (no category match)`);
      toast.success(msg.join(" · "));
      setShowImport(false); fetchProducts();
    } catch { toast.error("Import failed — check CSV format"); }
    finally { setImporting(false); if (importFileRef.current) importFileRef.current.value = ""; }
  };

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text">Products</h1>
          <p className="text-text-muted text-sm mt-0.5">Manage your product catalog ({totalCount} products)</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="outline" className="rounded-lg" onClick={handleExport}>
            <Download className="w-4 h-4 mr-2" />Export
          </Button>
          <Button variant="outline" className="rounded-lg" onClick={() => setShowImport(true)}>
            <Upload className="w-4 h-4 mr-2" />Import
          </Button>
          <Link href="/admin/products/new">
            <Button className="rounded-lg"><Plus className="w-4 h-4 mr-2" />Add Product</Button>
          </Link>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-white rounded-2xl border border-border p-4 flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <Input placeholder="Search by name, SKU, brand, category, tags…" value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 rounded-lg bg-surface border-0" />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-surface border-0 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-accent">
            <option value="">All Categories</option>
            {categories.filter((c: Any) => !c.parentId).map((c: Any) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-surface border-0 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-accent">
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="draft">Draft</option>
            <option value="archived">Archived</option>
          </select>
          <Button variant="ghost" size="icon" className="rounded-lg" onClick={fetchProducts} title="Refresh">
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Bulk Actions Bar */}
      <AnimatePresence>
        {selected.size > 0 && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            className="bg-[#0052cc] text-white rounded-xl px-5 py-3 flex items-center gap-4 flex-wrap">
            <CheckSquare className="w-4 h-4 shrink-0" />
            <span className="text-sm font-medium">{selected.size} selected</span>
            <div className="flex items-center gap-2 ml-auto flex-wrap">
              <button onClick={handleExportSelected}
                className="text-xs bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors">
                <Download className="w-3.5 h-3.5" />Export Selected
              </button>
              <button onClick={() => handleBulkStatus("active")}
                className="text-xs bg-green-500/80 hover:bg-green-500 px-3 py-1.5 rounded-lg transition-colors">
                Set Active
              </button>
              <button onClick={() => handleBulkStatus("draft")}
                className="text-xs bg-yellow-500/80 hover:bg-yellow-500 px-3 py-1.5 rounded-lg transition-colors">
                Set Draft
              </button>
              <button onClick={handleBulkDelete}
                className="text-xs bg-red-500/80 hover:bg-red-500 px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors">
                <Trash2 className="w-3.5 h-3.5" />Delete
              </button>
              <button onClick={() => setSelected(new Set())} className="ml-2 p-1 hover:bg-white/20 rounded-lg">
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Products Table */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-xs text-text-muted uppercase tracking-wider border-b border-border bg-surface/50">
                <th className="px-5 py-4 w-10">
                  <input type="checkbox" checked={allChecked} ref={(el) => { if (el) el.indeterminate = someChecked; }}
                    onChange={(e) => setSelected(e.target.checked ? new Set(products.map((p) => p.id)) : new Set())}
                    className="rounded border-border cursor-pointer" />
                </th>
                <th className="px-5 py-4">Product</th>
                <th className="px-5 py-4">SKU</th>
                <th className="px-5 py-4">Price</th>
                <th className="px-5 py-4">Stock</th>
                <th className="px-5 py-4">Category</th>
                <th className="px-5 py-4">Status</th>
                <th className="px-5 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading && (
                <tr><td colSpan={8} className="px-5 py-12 text-center text-text-muted text-sm">Loading…</td></tr>
              )}
              {!loading && products.length === 0 && (
                <tr><td colSpan={8} className="px-5 py-12 text-center text-text-muted text-sm">No products found</td></tr>
              )}
              {!loading && products.map((product) => (
                <tr key={product.id}
                  className={`hover:bg-surface/50 transition-colors ${selected.has(product.id) ? "bg-accent/5" : ""}`}>
                  <td className="px-5 py-4">
                    <input type="checkbox" checked={selected.has(product.id)}
                      onChange={(e) => setSelected((s) => { const n = new Set(s); e.target.checked ? n.add(product.id) : n.delete(product.id); return n; })}
                      className="rounded border-border cursor-pointer" />
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="relative w-11 h-11 rounded-lg overflow-hidden bg-surface shrink-0">
                        {product.images[0]?.url ? (
                          <Image src={product.images[0].url} alt={product.name} fill className="object-cover" />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <Package className="w-5 h-5 text-border" />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-text truncate max-w-[220px]">{product.name}</p>
                        <p className="text-xs text-text-muted">{product.brand?.name ?? "—"}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-xs text-text-muted font-mono">{product.sku ?? "—"}</td>
                  <td className="px-5 py-4">
                    <span className="text-sm font-semibold text-text">{formatPrice(product.price)}</span>
                    {product.comparePrice && (
                      <span className="text-xs text-text-muted line-through block">{formatPrice(product.comparePrice)}</span>
                    )}
                  </td>
                  <td className="px-5 py-4">
                    <span className={`text-sm font-medium ${product.stock > 10 ? "text-green-600" : product.stock > 0 ? "text-yellow-600" : "text-red-500"}`}>
                      {product.stock}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <Badge variant="outline" className="text-xs">{product.category?.name}</Badge>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`text-xs font-medium px-2 py-1 rounded-full capitalize ${statusColor(product.status)}`}>
                      {product.status}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-1 justify-end">
                      <Link href={`/product/${product.slug}`} target="_blank"
                        className="p-1.5 hover:bg-surface rounded-lg transition-colors text-text-muted hover:text-blue-500" title="View on store">
                        <Eye className="w-4 h-4" />
                      </Link>
                      <Link href={`/admin/products/${product.id}/edit`}
                        className="p-1.5 hover:bg-surface rounded-lg transition-colors text-text-muted hover:text-accent" title="Edit product">
                        <Edit className="w-4 h-4" />
                      </Link>
                      <button onClick={() => handleDelete(product.id, product.name)}
                        className="p-1.5 hover:bg-surface rounded-lg transition-colors text-text-muted hover:text-red-500" title="Delete product">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-5 py-4 border-t border-border flex items-center justify-between">
          <p className="text-sm text-text-muted">
            Showing {Math.min((page - 1) * PAGE_SIZE + 1, totalCount)}–{Math.min(page * PAGE_SIZE, totalCount)} of {totalCount} products
          </p>
          <div className="flex items-center gap-1">
            <button disabled={page === 1} onClick={() => setPage((p) => p - 1)}
              className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-surface disabled:opacity-30 transition-colors">
              <ChevronLeft className="w-4 h-4" />
            </button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              const p = page <= 3 ? i + 1 : page + i - 2;
              if (p < 1 || p > totalPages) return null;
              return (
                <button key={p} onClick={() => setPage(p)}
                  className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${p === page ? "bg-accent text-white" : "hover:bg-surface text-text-muted"}`}>
                  {p}
                </button>
              );
            })}
            <button disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}
              className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-surface disabled:opacity-30 transition-colors">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </motion.div>

      {/* Import Modal */}
      <AnimatePresence>
        {showImport && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={(e) => e.target === e.currentTarget && setShowImport(false)}>
            <motion.div initial={{ scale: 0.95, y: 10 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 10 }}
              className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-text text-lg">Import Products via CSV</h2>
                <button onClick={() => setShowImport(false)} className="p-1.5 hover:bg-surface rounded-lg"><X className="w-4 h-4" /></button>
              </div>

              {/* CSV columns info */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 mb-3 text-sm text-blue-800">
                <p className="font-semibold mb-1">Required CSV columns:</p>
                <p className="font-mono text-xs leading-relaxed break-all">
                  name, description, price, comparePrice, costPrice, sku, stock, status, tags, <strong>categoryId</strong> or <strong>category</strong>, brandId
                </p>
                <p className="text-xs mt-2 text-blue-700">
                  💡 Use <strong>categoryId</strong> (ID from table below) <em>or</em> <strong>category</strong> (exact category name — works for subcategories too).
                </p>
              </div>

              {/* Category lookup */}
              <button onClick={() => setShowCatLookup(!showCatLookup)}
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl border border-border hover:bg-surface/50 transition-colors text-sm font-medium text-text mb-3">
                <span>📂 Category &amp; Subcategory ID Lookup</span>
                {showCatLookup ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
              {showCatLookup && (
                <div className="mb-3 border border-border rounded-xl overflow-hidden">
                  <div className="bg-surface/50 px-3 py-2 text-xs font-semibold text-text-muted uppercase tracking-wider border-b border-border">Category Name → ID</div>
                  <div className="max-h-52 overflow-y-auto divide-y divide-border">
                    {categories.filter((c: Any) => !c.parentId).map((cat: Any) => (
                      <React.Fragment key={cat.id}>
                        {/* Parent row */}
                        <div className="flex items-center justify-between px-3 py-2 bg-white">
                          <div>
                            <span className="text-xs font-semibold text-text">{cat.name}</span>
                            <span className="ml-2 text-[10px] text-text-muted bg-surface px-1.5 py-0.5 rounded">parent</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-mono text-text-muted truncate max-w-[120px]">{cat.id}</span>
                            <button onClick={() => copyId(cat.id)}
                              className="p-1 hover:bg-surface rounded-md text-text-muted hover:text-accent transition-colors">
                              {copiedId === cat.id ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                            </button>
                          </div>
                        </div>
                        {/* Subcategory rows */}
                        {(cat.children ?? []).map((sub: Any) => (
                          <div key={sub.id} className="flex items-center justify-between px-3 py-2 bg-surface/30">
                            <div>
                              <span className="text-[10px] text-text-muted mr-1">↳</span>
                              <span className="text-xs text-text">{sub.name}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] font-mono text-text-muted truncate max-w-[120px]">{sub.id}</span>
                              <button onClick={() => copyId(sub.id)}
                                className="p-1 hover:bg-surface rounded-md text-text-muted hover:text-accent transition-colors">
                                {copiedId === sub.id ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                              </button>
                            </div>
                          </div>
                        ))}
                      </React.Fragment>
                    ))}
                    {categories.length === 0 && (
                      <div className="px-3 py-4 text-xs text-text-muted text-center">No categories found</div>
                    )}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 mb-3">
                <button onClick={handleDownloadTemplate}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border border-border hover:bg-surface/50 text-sm font-medium text-text transition-colors">
                  <Download className="w-4 h-4" />Download Template
                </button>
                <input ref={importFileRef} type="file" accept=".csv" onChange={handleImportFile} className="hidden" />
                <Button onClick={() => importFileRef.current?.click()} disabled={importing} className="flex-1 rounded-xl">
                  {importing ? (
                    <><svg className="w-4 h-4 mr-2 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>Importing…</>
                  ) : (
                    <><Upload className="w-4 h-4 mr-2" />Choose CSV File</>
                  )}
                </Button>
              </div>
              <p className="text-xs text-text-muted text-center">
                Rows where category cannot be matched by ID or name will be skipped.
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
