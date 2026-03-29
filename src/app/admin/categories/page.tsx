"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Plus, Edit, Trash2, FolderTree, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import toast from "react-hot-toast";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = any;

export default function AdminCategoriesPage() {
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [parentId, setParentId] = useState("");
  const [featured, setFeatured] = useState(false);
  const [categories, setCategories] = useState<Any[]>([]);

  const fetchCategories = useCallback(() => {
    fetch("/api/admin/categories").then(r => r.json()).then(d => {
      if (d.categories) setCategories(d.categories);
    }).catch(() => toast.error("Failed to load categories"));
  }, []);

  useEffect(() => { fetchCategories(); }, [fetchCategories]);

  const resetForm = () => { setEditId(null); setName(""); setSlug(""); setDescription(""); setParentId(""); setFeatured(false); setShowForm(false); };

  const handleEdit = (cat: Any) => {
    setEditId(cat.id); setName(cat.name); setSlug(cat.slug);
    setDescription(cat.description || ""); setParentId(cat.parentId || "");
    setFeatured(!!cat.featured); setShowForm(true);
  };

  const handleSubmit = async () => {
    if (!name || !slug) { toast.error("Name and slug are required"); return; }
    setSaving(true);
    try {
      const body = { name, slug, description, parentId: parentId || null, featured };
      const res = editId
        ? await fetch(`/api/admin/categories/${editId}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
        : await fetch("/api/admin/categories", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      toast.success(editId ? "Category updated" : "Category created");
      resetForm(); fetchCategories();
    } catch (e: Any) { toast.error(e.message || "Failed to save"); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: string, catName: string) => {
    if (!confirm(`Delete category "${catName}"? Products in this category may be affected.`)) return;
    try {
      const res = await fetch(`/api/admin/categories/${id}`, { method: "DELETE" });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
      toast.success("Category deleted"); fetchCategories();
    } catch (e: Any) { toast.error(e.message || "Failed to delete"); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text">Categories</h1>
          <p className="text-text-muted text-sm mt-1">Manage product categories and subcategories</p>
        </div>
        <Button onClick={() => { resetForm(); setShowForm(true); }} className="rounded-lg">
          <Plus className="w-4 h-4 mr-2" /> Add Category
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl border border-border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-xs text-text-muted uppercase tracking-wider border-b border-border">
                    <th className="px-5 py-4">Category</th>
                    <th className="px-5 py-4">Slug</th>
                    <th className="px-5 py-4">Products</th>
                    <th className="px-5 py-4">Featured</th>
                    <th className="px-5 py-4">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {categories.map((cat: Any) => (
                    <tr key={cat.id} className="hover:bg-surface/50 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-accent/10 rounded-lg flex items-center justify-center">
                            <FolderTree className="w-4 h-4 text-accent" />
                          </div>
                          <span className="text-sm font-medium text-text">{cat.name}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-sm text-text-muted font-mono">{cat.slug}</td>
                      <td className="px-5 py-3.5">
                        <Badge variant="outline" className="text-xs">{cat._count?.products ?? 0}</Badge>
                      </td>
                      <td className="px-5 py-3.5">
                        {cat.featured ? <Badge variant="success" className="text-xs">Featured</Badge> : <span className="text-xs text-text-muted">—</span>}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-1">
                          <button onClick={() => handleEdit(cat)} className="p-1.5 hover:bg-surface rounded-lg transition-colors text-text-muted hover:text-accent"><Edit className="w-4 h-4" /></button>
                          <button onClick={() => handleDelete(cat.id, cat.name)} className="p-1.5 hover:bg-surface rounded-lg transition-colors text-text-muted hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {categories.length === 0 && <tr><td colSpan={5} className="px-5 py-10 text-center text-text-muted">No categories yet</td></tr>}
                </tbody>
              </table>
            </div>
          </motion.div>
        </div>

        {showForm && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="bg-white rounded-2xl border border-border p-6">
            <h2 className="font-bold text-text mb-4">{editId ? "Edit Category" : "New Category"}</h2>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-text block mb-1.5">Name</label>
                <Input value={name} onChange={(e) => { setName(e.target.value); if (!editId) setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/-$/, "")); }} placeholder="Category name" className="rounded-lg" />
              </div>
              <div>
                <label className="text-sm font-medium text-text block mb-1.5">Slug</label>
                <Input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="category-slug" className="rounded-lg" />
              </div>
              <div>
                <label className="text-sm font-medium text-text block mb-1.5">Description</label>
                <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Category description" rows={3} className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent resize-none" />
              </div>
              <div>
                <label className="text-sm font-medium text-text block mb-1.5">Parent Category</label>
                <select value={parentId} onChange={(e) => setParentId(e.target.value)} className="w-full bg-surface border-0 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-accent">
                  <option value="">None (Top Level)</option>
                  {categories.filter((c: Any) => c.id !== editId).map((cat: Any) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={featured} onChange={(e) => setFeatured(e.target.checked)} className="rounded border-border text-accent focus:ring-accent" />
                <span className="text-sm text-text">Featured category</span>
              </label>
              <div className="flex gap-3 pt-2">
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
