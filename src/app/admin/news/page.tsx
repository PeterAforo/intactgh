"use client";

import React, { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { Plus, Edit, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import toast from "react-hot-toast";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = any;

export default function AdminNewsPage() {
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [content, setContent] = useState("");
  const [image, setImage] = useState("");
  const [published, setPublished] = useState(true);
  const [posts, setPosts] = useState<Any[]>([]);

  const fetchPosts = useCallback(() => {
    fetch("/api/admin/news").then(r => r.json()).then(d => {
      if (d.posts) setPosts(d.posts);
    }).catch(() => toast.error("Failed to load posts"));
  }, []);

  useEffect(() => { fetchPosts(); }, [fetchPosts]);

  const resetForm = () => { setEditId(null); setTitle(""); setSlug(""); setExcerpt(""); setContent(""); setImage(""); setPublished(true); setShowForm(false); };

  const handleEdit = (p: Any) => {
    setEditId(p.id); setTitle(p.title); setSlug(p.slug); setExcerpt(p.excerpt || "");
    setContent(p.content || ""); setImage(p.image || ""); setPublished(p.published); setShowForm(true);
  };

  const handleSubmit = async (pub: boolean) => {
    if (!title || !slug || !content) { toast.error("Title, slug, and content are required"); return; }
    setSaving(true);
    try {
      const body = { title, slug, excerpt, content, image, published: pub };
      const res = editId
        ? await fetch(`/api/admin/news/${editId}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
        : await fetch("/api/admin/news", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
      toast.success(editId ? "Post updated" : pub ? "Post published" : "Draft saved");
      resetForm(); fetchPosts();
    } catch (e: Any) { toast.error(e.message || "Failed to save"); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this post?")) return;
    try {
      const res = await fetch(`/api/admin/news/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed");
      toast.success("Post deleted"); fetchPosts();
    } catch { toast.error("Failed to delete"); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text">News & Blog</h1>
          <p className="text-text-muted text-sm mt-1">Manage news posts and blog articles</p>
        </div>
        <Button onClick={() => { resetForm(); setShowForm(true); }} className="rounded-lg">
          <Plus className="w-4 h-4 mr-2" /> New Post
        </Button>
      </div>

      {showForm && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl border border-border p-6">
          <h2 className="font-bold text-text mb-4">{editId ? "Edit Post" : "New Blog Post"}</h2>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><label className="text-sm font-medium text-text block mb-1.5">Title</label><Input value={title} onChange={(e) => { setTitle(e.target.value); if (!editId) setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/-$/, "")); }} placeholder="Post title" className="rounded-lg" /></div>
              <div><label className="text-sm font-medium text-text block mb-1.5">Slug</label><Input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="post-slug" className="rounded-lg" /></div>
            </div>
            <div><label className="text-sm font-medium text-text block mb-1.5">Excerpt</label><Input value={excerpt} onChange={(e) => setExcerpt(e.target.value)} placeholder="Short description" className="rounded-lg" /></div>
            <div><label className="text-sm font-medium text-text block mb-1.5">Content</label><textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="Write your blog post..." rows={8} className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent resize-none" /></div>
            <div><label className="text-sm font-medium text-text block mb-1.5">Featured Image URL</label><Input value={image} onChange={(e) => setImage(e.target.value)} placeholder="https://..." className="rounded-lg" /></div>
            <div className="flex gap-3">
              <Button onClick={() => handleSubmit(true)} disabled={saving} className="rounded-lg">{saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}{editId ? "Update" : "Publish"}</Button>
              <Button variant="outline" onClick={() => handleSubmit(false)} disabled={saving} className="rounded-lg">Save Draft</Button>
              <Button variant="ghost" onClick={resetForm} className="rounded-lg">Cancel</Button>
            </div>
          </div>
        </motion.div>
      )}

      <div className="space-y-4">
        {posts.map((post: Any, i: number) => (
          <motion.div key={post.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="bg-white rounded-2xl border border-border overflow-hidden flex flex-col sm:flex-row">
            {post.image && (
              <div className="relative w-full sm:w-48 h-32 sm:h-auto shrink-0">
                <Image src={post.image} alt={post.title} fill className="object-cover" sizes="192px" />
              </div>
            )}
            <div className="p-5 flex-1">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="font-bold text-text mb-1">{post.title}</h3>
                  <p className="text-sm text-text-light mb-3">{post.excerpt}</p>
                  <div className="flex items-center gap-3">
                    <Badge variant={post.published ? "success" : "outline"} className="text-xs">{post.published ? "Published" : "Draft"}</Badge>
                    <span className="text-xs text-text-muted">{new Date(post.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={() => handleEdit(post)} className="p-1.5 hover:bg-surface rounded-lg transition-colors text-text-muted hover:text-accent"><Edit className="w-4 h-4" /></button>
                  <button onClick={() => handleDelete(post.id)} className="p-1.5 hover:bg-surface rounded-lg transition-colors text-text-muted hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
        {posts.length === 0 && <div className="text-center py-10 text-text-muted">No posts yet. Create your first blog post.</div>}
      </div>
    </div>
  );
}
