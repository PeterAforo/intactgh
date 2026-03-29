"use client";

import React, { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  MoreVertical,
  Filter,
  Download,
  Upload,
  Camera,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/utils";
import toast from "react-hot-toast";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = any;

export default function AdminProductsPage() {
  const [search, setSearch] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [filteredProducts, setFilteredProducts] = useState<Any[]>([]);
  const [totalCount, setTotalCount] = useState(0);

  const fetchProducts = useCallback(() => {
    const params = new URLSearchParams({ limit: "50" });
    if (search) params.set("q", search);
    fetch(`/api/admin/products?${params}`).then(r => r.json()).then(d => {
      if (d.products) setFilteredProducts(d.products);
      if (d.pagination) setTotalCount(d.pagination.total);
    }).catch(() => {});
  }, [search]);

  useEffect(() => {
    const t = setTimeout(fetchProducts, 300);
    return () => clearTimeout(t);
  }, [fetchProducts]);

  const handleDelete = async (id: string, pName: string) => {
    if (!confirm(`Delete product "${pName}"? This cannot be undone.`)) return;
    try {
      const res = await fetch(`/api/admin/products/${id}`, { method: "DELETE" });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
      toast.success("Product deleted"); fetchProducts();
    } catch (e: Any) { toast.error(e.message || "Failed to delete"); }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text">Products</h1>
          <p className="text-text-muted text-sm mt-1">
            Manage your product catalog ({totalCount} products)
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="rounded-lg">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button variant="outline" className="rounded-lg">
            <Upload className="w-4 h-4 mr-2" />
            Import
          </Button>
          <Link href="/admin/products/new">
            <Button className="rounded-lg">
              <Plus className="w-4 h-4 mr-2" />
              Add Product
            </Button>
          </Link>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-white rounded-2xl border border-border p-4 flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <Input
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 rounded-lg bg-surface border-0"
          />
        </div>
        <div className="flex items-center gap-2">
          <select className="bg-surface border-0 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-accent">
            <option>All Categories</option>
            <option>AI Smartphones</option>
            <option>Laptops & Computers</option>
            <option>TVs & Home Theatre</option>
          </select>
          <select className="bg-surface border-0 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-accent">
            <option>All Status</option>
            <option>Active</option>
            <option>Draft</option>
            <option>Out of Stock</option>
          </select>
          <Button variant="ghost" size="icon" className="rounded-lg">
            <Filter className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Products Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl border border-border overflow-hidden"
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-xs text-text-muted uppercase tracking-wider border-b border-border">
                <th className="px-5 py-4">
                  <input type="checkbox" className="rounded border-border" />
                </th>
                <th className="px-5 py-4">Product</th>
                <th className="px-5 py-4">SKU</th>
                <th className="px-5 py-4">Price</th>
                <th className="px-5 py-4">Stock</th>
                <th className="px-5 py-4">Category</th>
                <th className="px-5 py-4">Status</th>
                <th className="px-5 py-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredProducts.map((product) => (
                <tr key={product.id} className="hover:bg-surface/50 transition-colors">
                  <td className="px-5 py-4">
                    <input type="checkbox" className="rounded border-border" />
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-surface shrink-0">
                        <Image
                          src={product.images[0]?.url || "/placeholder.svg"}
                          alt={product.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-text truncate max-w-[250px]">
                          {product.name}
                        </p>
                        <p className="text-xs text-text-muted">{product.brand?.name}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-sm text-text-muted font-mono">{product.sku}</td>
                  <td className="px-5 py-4">
                    <div>
                      <span className="text-sm font-semibold text-text">{formatPrice(product.price)}</span>
                      {product.comparePrice && (
                        <span className="text-xs text-text-muted line-through block">
                          {formatPrice(product.comparePrice)}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`text-sm font-medium ${
                      product.stock > 10 ? "text-success" : product.stock > 0 ? "text-warning" : "text-accent"
                    }`}>
                      {product.stock}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <Badge variant="outline" className="text-xs">{product.category.name}</Badge>
                  </td>
                  <td className="px-5 py-4">
                    <Badge variant="success" className="text-xs">Active</Badge>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-1">
                      <Link href={`/product/${product.slug}`} target="_blank" className="p-1.5 hover:bg-surface rounded-lg transition-colors text-text-muted hover:text-info">
                        <Eye className="w-4 h-4" />
                      </Link>
                      <button onClick={() => handleDelete(product.id, product.name)} className="p-1.5 hover:bg-surface rounded-lg transition-colors text-text-muted hover:text-red-500">
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
            Showing {filteredProducts.length} of {totalCount} products
          </p>
          <div className="flex items-center gap-1">
            {[1, 2, 3].map((page) => (
              <button
                key={page}
                className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                  page === 1 ? "bg-accent text-white" : "hover:bg-surface text-text-muted"
                }`}
              >
                {page}
              </button>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
