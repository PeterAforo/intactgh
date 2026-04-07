"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Plus, Edit, Trash2, FileText, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import toast from "react-hot-toast";
import RichTextEditor from "@/components/ui/rich-text-editor";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = any;

export default function AdminPagesPage() {
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [content, setContent] = useState("");
  const [metaTitle, setMetaTitle] = useState("");
  const [metaDesc, setMetaDesc] = useState("");
  const [published, setPublished] = useState(true);
  const [pages, setPages] = useState<Any[]>([]);

  const fetchPages = useCallback(() => {
    fetch("/api/admin/pages").then(r => r.json()).then(d => {
      if (d.pages) setPages(d.pages);
    }).catch(() => toast.error("Failed to load pages"));
  }, []);

  useEffect(() => { fetchPages(); }, [fetchPages]);

  const resetForm = () => { setEditId(null); setTitle(""); setSlug(""); setContent(""); setMetaTitle(""); setMetaDesc(""); setPublished(true); setShowForm(false); };

  const handleEdit = (p: Any) => {
    setEditId(p.id); setTitle(p.title); setSlug(p.slug); setContent(p.content || "");
    setMetaTitle(p.metaTitle || ""); setMetaDesc(p.metaDesc || ""); setPublished(p.published); setShowForm(true);
  };

  const handleSubmit = async () => {
    if (!title || !slug || !content) { toast.error("Title, slug, and content are required"); return; }
    setSaving(true);
    try {
      const body = { title, slug, content, metaTitle, metaDesc, published };
      const res = editId
        ? await fetch(`/api/admin/pages/${editId}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
        : await fetch("/api/admin/pages", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
      toast.success(editId ? "Page updated" : "Page created");
      resetForm(); fetchPages();
    } catch (e: Any) { toast.error(e.message || "Failed to save"); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: string, pTitle: string) => {
    if (!confirm(`Delete page "${pTitle}"?`)) return;
    try {
      const res = await fetch(`/api/admin/pages/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed");
      toast.success("Page deleted"); fetchPages();
    } catch { toast.error("Failed to delete"); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text">Pages</h1>
          <p className="text-text-muted text-sm mt-1">Manage static pages and content</p>
        </div>
        <Button onClick={() => { resetForm(); setShowForm(true); }} className="rounded-lg">
          <Plus className="w-4 h-4 mr-2" /> Add Page
        </Button>
      </div>

      {showForm && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl border border-border p-6">
          <h2 className="font-bold text-text mb-4">{editId ? "Edit Page" : "New Page"}</h2>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><label className="text-sm font-medium text-text block mb-1.5">Title</label><Input value={title} onChange={(e) => { setTitle(e.target.value); if (!editId) setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/-$/, "")); }} placeholder="Page title" className="rounded-lg" /></div>
              <div><label className="text-sm font-medium text-text block mb-1.5">Slug</label><Input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="page-slug" className="rounded-lg" /></div>
            </div>
            <div><label className="text-sm font-medium text-text block mb-1.5">Content</label><RichTextEditor value={content} onChange={setContent} placeholder="Page content..." minHeight="300px" /></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><label className="text-sm font-medium text-text block mb-1.5">Meta Title</label><Input value={metaTitle} onChange={(e) => setMetaTitle(e.target.value)} placeholder="SEO title" className="rounded-lg" /></div>
              <div><label className="text-sm font-medium text-text block mb-1.5">Meta Description</label><Input value={metaDesc} onChange={(e) => setMetaDesc(e.target.value)} placeholder="SEO description" className="rounded-lg" /></div>
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={published} onChange={(e) => setPublished(e.target.checked)} className="rounded border-border text-accent focus:ring-accent" />
              <span className="text-sm text-text">Published</span>
            </label>
            <div className="flex gap-3">
              <Button onClick={handleSubmit} disabled={saving} className="rounded-lg">{saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}{editId ? "Update" : "Save"} Page</Button>
              <Button variant="ghost" onClick={resetForm} className="rounded-lg">Cancel</Button>
            </div>
          </div>
        </motion.div>
      )}

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl border border-border overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="text-left text-xs text-text-muted uppercase tracking-wider border-b border-border">
              <th className="px-5 py-4">Page</th>
              <th className="px-5 py-4">Slug</th>
              <th className="px-5 py-4">Status</th>
              <th className="px-5 py-4">Updated</th>
              <th className="px-5 py-4">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {pages.map((page: Any) => (
              <tr key={page.id} className="hover:bg-surface/50 transition-colors">
                <td className="px-5 py-3.5"><div className="flex items-center gap-3"><FileText className="w-4 h-4 text-accent" /><span className="text-sm font-medium text-text">{page.title}</span></div></td>
                <td className="px-5 py-3.5 text-sm text-text-muted font-mono">/{page.slug}</td>
                <td className="px-5 py-3.5"><Badge variant={page.published ? "success" : "outline"} className="text-xs">{page.published ? "Published" : "Draft"}</Badge></td>
                <td className="px-5 py-3.5 text-sm text-text-muted">{new Date(page.updatedAt).toLocaleDateString()}</td>
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-1">
                    <button onClick={() => handleEdit(page)} className="p-1.5 hover:bg-surface rounded-lg transition-colors text-text-muted hover:text-accent"><Edit className="w-4 h-4" /></button>
                    <button onClick={() => handleDelete(page.id, page.title)} className="p-1.5 hover:bg-surface rounded-lg transition-colors text-text-muted hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </td>
              </tr>
            ))}
            {pages.length === 0 && <tr><td colSpan={5} className="px-5 py-10 text-center text-text-muted">No pages yet</td></tr>}
          </tbody>
        </table>
      </motion.div>
    </div>
  );
}
