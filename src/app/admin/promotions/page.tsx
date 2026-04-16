"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { Plus, Edit, Trash2, Megaphone, Loader2, Search, X, Home, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import toast from "react-hot-toast";
import RichTextEditor from "@/components/ui/rich-text-editor";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = any;

export default function AdminPromotionsPage() {
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [code, setCode] = useState("");
  const [discount, setDiscount] = useState("");
  const [type, setType] = useState("percentage");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [active, setActive] = useState(true);
  const [showOnHome, setShowOnHome] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState<Any[]>([]);
  const [promotions, setPromotions] = useState<Any[]>([]);

  // Product search
  const [productSearch, setProductSearch] = useState("");
  const [productResults, setProductResults] = useState<Any[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const searchTimer = useRef<NodeJS.Timeout | null>(null);

  const fetchPromotions = useCallback(() => {
    fetch("/api/admin/promotions").then(r => r.json()).then(d => {
      if (d.promotions) setPromotions(d.promotions);
    }).catch(() => toast.error("Failed to load promotions"));
  }, []);

  useEffect(() => { fetchPromotions(); }, [fetchPromotions]);

  // Debounced product search
  useEffect(() => {
    if (!productSearch.trim()) { setProductResults([]); return; }
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const res = await fetch(`/api/products?search=${encodeURIComponent(productSearch)}&limit=10`);
        const data = await res.json();
        setProductResults(data.products || []);
      } catch { /* ignore */ }
      finally { setSearchLoading(false); }
    }, 300);
  }, [productSearch]);

  const resetForm = () => {
    setEditId(null); setTitle(""); setDescription(""); setCode(""); setDiscount("");
    setType("percentage"); setStartDate(""); setEndDate(""); setActive(true);
    setShowOnHome(false); setSelectedProducts([]); setProductSearch(""); setProductResults([]);
    setShowForm(false);
  };

  const handleEdit = (p: Any) => {
    setEditId(p.id); setTitle(p.title); setDescription(p.description || ""); setCode(p.code || "");
    setDiscount(String(p.discount)); setType(p.type); setStartDate(p.startDate?.split("T")[0] || "");
    setEndDate(p.endDate?.split("T")[0] || ""); setActive(p.active); setShowOnHome(p.showOnHome || false);
    setSelectedProducts(
      (p.products || []).map((pp: Any) => ({
        id: pp.product?.id || pp.productId,
        name: pp.product?.name || "Product",
        price: pp.product?.price || 0,
        image: pp.product?.images?.[0]?.url || null,
      }))
    );
    setShowForm(true);
  };

  const addProduct = (product: Any) => {
    if (selectedProducts.some((p: Any) => p.id === product.id)) return;
    setSelectedProducts([...selectedProducts, {
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.images?.[0]?.url || null,
    }]);
    setProductSearch("");
    setProductResults([]);
  };

  const removeProduct = (id: string) => {
    setSelectedProducts(selectedProducts.filter((p: Any) => p.id !== id));
  };

  const handleSubmit = async () => {
    if (!title || !discount || !startDate || !endDate) { toast.error("Title, discount, start & end dates required"); return; }
    setSaving(true);
    try {
      const body = {
        title, description, code, discount, type, startDate, endDate, active, showOnHome,
        productIds: selectedProducts.map((p: Any) => p.id),
      };
      const res = editId
        ? await fetch(`/api/admin/promotions/${editId}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
        : await fetch("/api/admin/promotions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
      toast.success(editId ? "Promotion updated" : "Promotion created");
      resetForm(); fetchPromotions();
    } catch (e: Any) { toast.error(e.message || "Failed to save"); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this promotion?")) return;
    try {
      const res = await fetch(`/api/admin/promotions/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed");
      toast.success("Promotion deleted"); fetchPromotions();
    } catch { toast.error("Failed to delete"); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text">Promotions</h1>
          <p className="text-text-muted text-sm mt-1">Manage discount codes, promotions, and featured deals</p>
        </div>
        <Button onClick={() => { resetForm(); setShowForm(true); }} className="rounded-lg">
          <Plus className="w-4 h-4 mr-2" /> Add Promotion
        </Button>
      </div>

      {showForm && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl border border-border p-6">
          <h2 className="font-bold text-text mb-4">{editId ? "Edit Promotion" : "New Promotion"}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2"><label className="text-sm font-medium text-text block mb-1.5">Title</label><Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Promotion title" className="rounded-lg" /></div>
            <div><label className="text-sm font-medium text-text block mb-1.5">Coupon Code</label><Input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="e.g. SALE10 (optional)" className="rounded-lg font-mono uppercase" /></div>
            <div>
              <label className="text-sm font-medium text-text block mb-1.5">Discount Type</label>
              <select value={type} onChange={(e) => setType(e.target.value)} className="w-full bg-surface border-0 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-accent">
                <option value="percentage">Percentage (%)</option>
                <option value="fixed">Fixed Amount (GH₵)</option>
              </select>
            </div>
            <div><label className="text-sm font-medium text-text block mb-1.5">Discount Value</label><Input type="number" value={discount} onChange={(e) => setDiscount(e.target.value)} placeholder="0" className="rounded-lg" /></div>
            <div><label className="text-sm font-medium text-text block mb-1.5">Start Date</label><Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="rounded-lg" /></div>
            <div><label className="text-sm font-medium text-text block mb-1.5">End Date</label><Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="rounded-lg" /></div>
            <div className="md:col-span-2"><label className="text-sm font-medium text-text block mb-1.5">Description</label><RichTextEditor value={description} onChange={setDescription} placeholder="Promotion details..." simple minHeight="120px" /></div>
          </div>

          {/* Product Picker */}
          <div className="mt-5 border-t border-border pt-5">
            <label className="text-sm font-medium text-text block mb-2 flex items-center gap-2">
              <Package className="w-4 h-4 text-accent" />
              Assign Products to this Promotion
            </label>
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
              <Input
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                placeholder="Search products by name..."
                className="pl-9 rounded-lg"
              />
              {searchLoading && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-accent" />}
              {productResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 bg-white border border-border rounded-xl shadow-lg mt-1 max-h-60 overflow-y-auto z-20">
                  {productResults.map((p: Any) => {
                    const alreadyAdded = selectedProducts.some((sp: Any) => sp.id === p.id);
                    return (
                      <button
                        key={p.id}
                        onClick={() => !alreadyAdded && addProduct(p)}
                        disabled={alreadyAdded}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-surface transition-colors ${alreadyAdded ? "opacity-50" : ""}`}
                      >
                        <div className="w-8 h-8 rounded bg-surface overflow-hidden shrink-0">
                          {p.images?.[0]?.url && <Image src={p.images[0].url} alt="" width={32} height={32} className="w-full h-full object-cover" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-text truncate">{p.name}</p>
                          <p className="text-xs text-text-muted">GH₵{p.price?.toLocaleString()}</p>
                        </div>
                        {alreadyAdded && <Badge variant="outline" className="text-[10px] shrink-0">Added</Badge>}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Selected Products */}
            {selectedProducts.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {selectedProducts.map((p: Any) => (
                  <div key={p.id} className="flex items-center gap-2 bg-surface rounded-lg px-3 py-1.5">
                    {p.image && <Image src={p.image} alt="" width={20} height={20} className="w-5 h-5 rounded object-cover" />}
                    <span className="text-xs font-medium text-text max-w-[160px] truncate">{p.name}</span>
                    <span className="text-[10px] text-text-muted">GH₵{p.price?.toLocaleString()}</span>
                    <button onClick={() => removeProduct(p.id)} className="text-text-muted hover:text-red-500 ml-1">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            {selectedProducts.length === 0 && (
              <p className="text-xs text-text-muted">No products assigned. Search and add products above.</p>
            )}
          </div>

          {/* Toggles */}
          <div className="flex flex-wrap gap-6 mt-5 border-t border-border pt-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} className="rounded border-border text-accent focus:ring-accent" />
              <span className="text-sm text-text">Active</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={showOnHome} onChange={(e) => setShowOnHome(e.target.checked)} className="rounded border-border text-accent focus:ring-accent" />
              <Home className="w-4 h-4 text-accent" />
              <span className="text-sm text-text">Show on Homepage</span>
            </label>
          </div>

          <div className="flex gap-3 mt-4">
            <Button onClick={handleSubmit} disabled={saving} className="rounded-lg">{saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}{editId ? "Update" : "Create"} Promotion</Button>
            <Button variant="ghost" onClick={resetForm} className="rounded-lg">Cancel</Button>
          </div>
        </motion.div>
      )}

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl border border-border overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="text-left text-xs text-text-muted uppercase tracking-wider border-b border-border">
              <th className="px-5 py-4">Promotion</th>
              <th className="px-5 py-4">Code</th>
              <th className="px-5 py-4">Discount</th>
              <th className="px-5 py-4">Products</th>
              <th className="px-5 py-4">Period</th>
              <th className="px-5 py-4">Status</th>
              <th className="px-5 py-4">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {promotions.map((promo: Any) => (
              <tr key={promo.id} className="hover:bg-surface/50 transition-colors">
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-3">
                    <Megaphone className="w-4 h-4 text-accent shrink-0" />
                    <div>
                      <span className="text-sm font-medium text-text">{promo.title}</span>
                      {promo.showOnHome && (
                        <div className="flex items-center gap-1 mt-0.5">
                          <Home className="w-3 h-3 text-accent" />
                          <span className="text-[10px] text-accent font-medium">Homepage</span>
                        </div>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-5 py-3.5">{promo.code ? <code className="bg-surface px-2 py-1 rounded text-xs font-mono font-bold text-accent">{promo.code}</code> : <span className="text-xs text-text-muted">—</span>}</td>
                <td className="px-5 py-3.5 text-sm font-semibold text-text">{promo.type === "percentage" ? `${promo.discount}%` : `GH₵${promo.discount}`}</td>
                <td className="px-5 py-3.5">
                  <Badge variant="outline" className="text-xs">{promo.products?.length || 0} products</Badge>
                </td>
                <td className="px-5 py-3.5 text-xs text-text-muted">{new Date(promo.startDate).toLocaleDateString()} — {new Date(promo.endDate).toLocaleDateString()}</td>
                <td className="px-5 py-3.5"><Badge variant={promo.active ? "success" : "outline"} className="text-xs">{promo.active ? "Active" : "Inactive"}</Badge></td>
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-1">
                    <button onClick={() => handleEdit(promo)} className="p-1.5 hover:bg-surface rounded-lg transition-colors text-text-muted hover:text-accent"><Edit className="w-4 h-4" /></button>
                    <button onClick={() => handleDelete(promo.id)} className="p-1.5 hover:bg-surface rounded-lg transition-colors text-text-muted hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </td>
              </tr>
            ))}
            {promotions.length === 0 && <tr><td colSpan={7} className="px-5 py-10 text-center text-text-muted">No promotions yet</td></tr>}
          </tbody>
        </table>
      </motion.div>
    </div>
  );
}
