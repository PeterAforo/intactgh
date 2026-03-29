"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Plus, Edit, Trash2, Image as ImageIcon, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import toast from "react-hot-toast";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = any;

export default function AdminBannersPage() {
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState("");
  const [image, setImage] = useState("");
  const [link, setLink] = useState("");
  const [position, setPosition] = useState("homepage-top");
  const [active, setActive] = useState(true);
  const [banners, setBanners] = useState<Any[]>([]);

  const fetchBanners = useCallback(() => {
    fetch("/api/admin/banners").then(r => r.json()).then(d => {
      if (d.banners) setBanners(d.banners);
    }).catch(() => toast.error("Failed to load banners"));
  }, []);

  useEffect(() => { fetchBanners(); }, [fetchBanners]);

  const resetForm = () => { setEditId(null); setTitle(""); setImage(""); setLink(""); setPosition("homepage-top"); setActive(true); setShowForm(false); };

  const handleEdit = (b: Any) => {
    setEditId(b.id); setTitle(b.title); setImage(b.image); setLink(b.link || "");
    setPosition(b.position); setActive(b.active); setShowForm(true);
  };

  const handleSubmit = async () => {
    if (!title || !image) { toast.error("Title and image are required"); return; }
    setSaving(true);
    try {
      const body = { title, image, link, position, active };
      const res = editId
        ? await fetch(`/api/admin/banners/${editId}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
        : await fetch("/api/admin/banners", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
      toast.success(editId ? "Banner updated" : "Banner created");
      resetForm(); fetchBanners();
    } catch (e: Any) { toast.error(e.message || "Failed to save"); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this banner?")) return;
    try {
      const res = await fetch(`/api/admin/banners/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed");
      toast.success("Banner deleted"); fetchBanners();
    } catch { toast.error("Failed to delete"); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text">Banners</h1>
          <p className="text-text-muted text-sm mt-1">Manage promotional banners across the site</p>
        </div>
        <Button onClick={() => { resetForm(); setShowForm(true); }} className="rounded-lg">
          <Plus className="w-4 h-4 mr-2" /> Add Banner
        </Button>
      </div>

      {showForm && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl border border-border p-6">
          <h2 className="font-bold text-text mb-4">{editId ? "Edit Banner" : "New Banner"}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><label className="text-sm font-medium text-text block mb-1.5">Title</label><Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Banner title" className="rounded-lg" /></div>
            <div>
              <label className="text-sm font-medium text-text block mb-1.5">Position</label>
              <select value={position} onChange={(e) => setPosition(e.target.value)} className="w-full bg-surface border-0 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-accent">
                <option value="homepage-top">Homepage Top</option>
                <option value="homepage-middle">Homepage Middle</option>
                <option value="category-top">Category Page Top</option>
                <option value="sidebar">Sidebar</option>
                <option value="footer">Footer</option>
              </select>
            </div>
            <div><label className="text-sm font-medium text-text block mb-1.5">Image URL</label><Input value={image} onChange={(e) => setImage(e.target.value)} placeholder="https://..." className="rounded-lg" /></div>
            <div><label className="text-sm font-medium text-text block mb-1.5">Link URL</label><Input value={link} onChange={(e) => setLink(e.target.value)} placeholder="/shop or https://..." className="rounded-lg" /></div>
          </div>
          <label className="flex items-center gap-2 cursor-pointer mt-4">
            <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} className="rounded border-border text-accent focus:ring-accent" />
            <span className="text-sm text-text">Active</span>
          </label>
          <div className="flex gap-3 mt-4">
            <Button onClick={handleSubmit} disabled={saving} className="rounded-lg">{saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}{editId ? "Update" : "Save"} Banner</Button>
            <Button variant="ghost" onClick={resetForm} className="rounded-lg">Cancel</Button>
          </div>
        </motion.div>
      )}

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl border border-border overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="text-left text-xs text-text-muted uppercase tracking-wider border-b border-border">
              <th className="px-5 py-4">Banner</th>
              <th className="px-5 py-4">Position</th>
              <th className="px-5 py-4">Status</th>
              <th className="px-5 py-4">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {banners.map((banner: Any) => (
              <tr key={banner.id} className="hover:bg-surface/50 transition-colors">
                <td className="px-5 py-3.5"><div className="flex items-center gap-3"><ImageIcon className="w-4 h-4 text-accent" /><span className="text-sm font-medium text-text">{banner.title}</span></div></td>
                <td className="px-5 py-3.5"><Badge variant="outline" className="text-xs capitalize">{banner.position.replace("-", " ")}</Badge></td>
                <td className="px-5 py-3.5"><Badge variant={banner.active ? "success" : "outline"} className="text-xs">{banner.active ? "Active" : "Inactive"}</Badge></td>
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-1">
                    <button onClick={() => handleEdit(banner)} className="p-1.5 hover:bg-surface rounded-lg transition-colors text-text-muted hover:text-accent"><Edit className="w-4 h-4" /></button>
                    <button onClick={() => handleDelete(banner.id)} className="p-1.5 hover:bg-surface rounded-lg transition-colors text-text-muted hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </td>
              </tr>
            ))}
            {banners.length === 0 && <tr><td colSpan={4} className="px-5 py-10 text-center text-text-muted">No banners yet</td></tr>}
          </tbody>
        </table>
      </motion.div>
    </div>
  );
}
