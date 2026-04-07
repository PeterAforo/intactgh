"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Plus, Edit, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import toast from "react-hot-toast";
import RichTextEditor from "@/components/ui/rich-text-editor";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = any;

export default function AdminBrandsPage() {
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [logo, setLogo] = useState("");
  const [description, setDescription] = useState("");
  const [featured, setFeatured] = useState(false);
  const [brands, setBrands] = useState<Any[]>([]);

  const fetchBrands = useCallback(() => {
    fetch("/api/admin/brands").then(r => r.json()).then(d => {
      if (d.brands) setBrands(d.brands);
    }).catch(() => toast.error("Failed to load brands"));
  }, []);

  useEffect(() => { fetchBrands(); }, [fetchBrands]);

  const resetForm = () => { setEditId(null); setName(""); setSlug(""); setLogo(""); setDescription(""); setFeatured(false); setShowForm(false); };

  const handleEdit = (b: Any) => {
    setEditId(b.id); setName(b.name); setSlug(b.slug); setLogo(b.logo || "");
    setDescription(b.description || ""); setFeatured(!!b.featured); setShowForm(true);
  };

  const handleSubmit = async () => {
    if (!name || !slug) { toast.error("Name and slug are required"); return; }
    setSaving(true);
    try {
      const body = { name, slug, logo, description, featured };
      const res = editId
        ? await fetch(`/api/admin/brands/${editId}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
        : await fetch("/api/admin/brands", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      toast.success(editId ? "Brand updated" : "Brand created");
      resetForm(); fetchBrands();
    } catch (e: Any) { toast.error(e.message || "Failed to save"); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: string, bName: string) => {
    if (!confirm(`Delete brand "${bName}"?`)) return;
    try {
      const res = await fetch(`/api/admin/brands/${id}`, { method: "DELETE" });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
      toast.success("Brand deleted"); fetchBrands();
    } catch (e: Any) { toast.error(e.message || "Failed to delete"); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text">Brands</h1>
          <p className="text-text-muted text-sm mt-1">Manage product brands</p>
        </div>
        <Button onClick={() => { resetForm(); setShowForm(true); }} className="rounded-lg">
          <Plus className="w-4 h-4 mr-2" /> Add Brand
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl border border-border overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="text-left text-xs text-text-muted uppercase tracking-wider border-b border-border">
                  <th className="px-5 py-4">Brand</th>
                  <th className="px-5 py-4">Slug</th>
                  <th className="px-5 py-4">Products</th>
                  <th className="px-5 py-4">Featured</th>
                  <th className="px-5 py-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {brands.map((brand: Any) => (
                  <tr key={brand.id} className="hover:bg-surface/50 transition-colors">
                    <td className="px-5 py-3.5"><span className="text-sm font-medium text-text">{brand.name}</span></td>
                    <td className="px-5 py-3.5 text-sm text-text-muted font-mono">{brand.slug}</td>
                    <td className="px-5 py-3.5"><Badge variant="outline" className="text-xs">{brand._count?.products ?? 0}</Badge></td>
                    <td className="px-5 py-3.5">
                      {brand.featured ? <Badge variant="success" className="text-xs">Featured</Badge> : <span className="text-xs text-text-muted">—</span>}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1">
                        <button onClick={() => handleEdit(brand)} className="p-1.5 hover:bg-surface rounded-lg transition-colors text-text-muted hover:text-accent"><Edit className="w-4 h-4" /></button>
                        <button onClick={() => handleDelete(brand.id, brand.name)} className="p-1.5 hover:bg-surface rounded-lg transition-colors text-text-muted hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
                {brands.length === 0 && <tr><td colSpan={5} className="px-5 py-10 text-center text-text-muted">No brands yet</td></tr>}
              </tbody>
            </table>
          </motion.div>
        </div>

        {showForm && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="bg-white rounded-2xl border border-border p-6">
            <h2 className="font-bold text-text mb-4">{editId ? "Edit Brand" : "New Brand"}</h2>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-text block mb-1.5">Name</label>
                <Input value={name} onChange={(e) => { setName(e.target.value); if (!editId) setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/-$/, "")); }} placeholder="Brand name" className="rounded-lg" />
              </div>
              <div>
                <label className="text-sm font-medium text-text block mb-1.5">Slug</label>
                <Input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="brand-slug" className="rounded-lg" />
              </div>
              <div>
                <label className="text-sm font-medium text-text block mb-1.5">Logo URL</label>
                <Input value={logo} onChange={(e) => setLogo(e.target.value)} placeholder="https://..." className="rounded-lg" />
              </div>
              <div>
                <label className="text-sm font-medium text-text block mb-1.5">Description</label>
                <RichTextEditor value={description} onChange={setDescription} placeholder="Brand description" simple minHeight="120px" />
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={featured} onChange={(e) => setFeatured(e.target.checked)} className="rounded border-border text-accent focus:ring-accent" />
                <span className="text-sm text-text">Featured brand</span>
              </label>
              <div className="flex gap-3">
                <Button onClick={handleSubmit} disabled={saving} className="flex-1 rounded-lg">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  {editId ? "Update" : "Create"}
                </Button>
                <Button variant="ghost" onClick={resetForm} className="rounded-lg">Cancel</Button>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
