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

export default function AdminHeroSlidesPage() {
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [description, setDescription] = useState("");
  const [image, setImageUrl] = useState("");
  const [buttonText, setButtonText] = useState("");
  const [buttonLink, setButtonLink] = useState("");
  const [active, setActive] = useState(true);
  const [slides, setSlides] = useState<Any[]>([]);

  const fetchSlides = useCallback(() => {
    fetch("/api/admin/hero-slides").then(r => r.json()).then(d => {
      if (d.slides) setSlides(d.slides);
    }).catch(() => toast.error("Failed to load slides"));
  }, []);

  useEffect(() => { fetchSlides(); }, [fetchSlides]);

  const resetForm = () => { setEditId(null); setTitle(""); setSubtitle(""); setDescription(""); setImageUrl(""); setButtonText(""); setButtonLink(""); setActive(true); setShowForm(false); };

  const handleEdit = (s: Any) => {
    setEditId(s.id); setTitle(s.title); setSubtitle(s.subtitle || ""); setDescription(s.description || "");
    setImageUrl(s.image); setButtonText(s.buttonText || ""); setButtonLink(s.buttonLink || ""); setActive(s.active); setShowForm(true);
  };

  const handleSubmit = async () => {
    if (!title || !image) { toast.error("Title and image are required"); return; }
    setSaving(true);
    try {
      const body = { title, subtitle, description, image, buttonText, buttonLink, active };
      const res = editId
        ? await fetch(`/api/admin/hero-slides/${editId}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
        : await fetch("/api/admin/hero-slides", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
      toast.success(editId ? "Slide updated" : "Slide created");
      resetForm(); fetchSlides();
    } catch (e: Any) { toast.error(e.message || "Failed to save"); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this slide?")) return;
    try {
      const res = await fetch(`/api/admin/hero-slides/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed");
      toast.success("Slide deleted"); fetchSlides();
    } catch { toast.error("Failed to delete"); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text">Hero Slides</h1>
          <p className="text-text-muted text-sm mt-1">Manage homepage hero banner slides</p>
        </div>
        <Button onClick={() => { resetForm(); setShowForm(true); }} className="rounded-lg">
          <Plus className="w-4 h-4 mr-2" /> Add Slide
        </Button>
      </div>

      {showForm && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl border border-border p-6">
          <h2 className="font-bold text-text mb-4">{editId ? "Edit Slide" : "New Hero Slide"}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><label className="text-sm font-medium text-text block mb-1.5">Title</label><Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Slide title" className="rounded-lg" /></div>
            <div><label className="text-sm font-medium text-text block mb-1.5">Subtitle</label><Input value={subtitle} onChange={(e) => setSubtitle(e.target.value)} placeholder="Slide subtitle" className="rounded-lg" /></div>
            <div className="md:col-span-2"><label className="text-sm font-medium text-text block mb-1.5">Description</label><textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Slide description" rows={3} className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent resize-none" /></div>
            <div><label className="text-sm font-medium text-text block mb-1.5">Button Text</label><Input value={buttonText} onChange={(e) => setButtonText(e.target.value)} placeholder="e.g. Shop Now" className="rounded-lg" /></div>
            <div><label className="text-sm font-medium text-text block mb-1.5">Button Link</label><Input value={buttonLink} onChange={(e) => setButtonLink(e.target.value)} placeholder="e.g. /shop" className="rounded-lg" /></div>
            <div className="md:col-span-2"><label className="text-sm font-medium text-text block mb-1.5">Background Image URL</label><Input value={image} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://..." className="rounded-lg" /></div>
          </div>
          <label className="flex items-center gap-2 cursor-pointer mt-4">
            <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} className="rounded border-border text-accent focus:ring-accent" />
            <span className="text-sm text-text">Active</span>
          </label>
          <div className="flex gap-3 mt-4">
            <Button onClick={handleSubmit} disabled={saving} className="rounded-lg">{saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}{editId ? "Update" : "Save"} Slide</Button>
            <Button variant="ghost" onClick={resetForm} className="rounded-lg">Cancel</Button>
          </div>
        </motion.div>
      )}

      <div className="space-y-4">
        {slides.map((slide: Any, i: number) => (
          <motion.div key={slide.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="bg-white rounded-2xl border border-border overflow-hidden flex flex-col md:flex-row">
            <div className="relative w-full md:w-72 h-40 md:h-auto shrink-0">
              <Image src={slide.image} alt={slide.title} fill className="object-cover" sizes="288px" />
            </div>
            <div className="p-5 flex-1">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <Badge variant="outline" className="text-xs mb-2">Slide {i + 1}</Badge>
                  <h3 className="font-bold text-text text-lg">{slide.title}</h3>
                  <p className="text-sm text-accent font-medium">{slide.subtitle}</p>
                </div>
              </div>
              <p className="text-sm text-text-light mb-4 line-clamp-2">{slide.description}</p>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => handleEdit(slide)} className="rounded-lg"><Edit className="w-3.5 h-3.5 mr-1" /> Edit</Button>
                <Button variant="ghost" size="sm" onClick={() => handleDelete(slide.id)} className="rounded-lg text-text-muted hover:text-red-500"><Trash2 className="w-3.5 h-3.5 mr-1" /> Delete</Button>
                <Badge variant={slide.active ? "success" : "outline"} className="ml-auto text-xs">{slide.active ? "Active" : "Inactive"}</Badge>
              </div>
            </div>
          </motion.div>
        ))}
        {slides.length === 0 && <div className="text-center py-10 text-text-muted">No slides yet. Add your first hero slide.</div>}
      </div>
    </div>
  );
}
