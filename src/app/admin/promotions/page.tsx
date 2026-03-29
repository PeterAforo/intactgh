"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Plus, Edit, Trash2, Megaphone, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import toast from "react-hot-toast";
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
  const [promotions, setPromotions] = useState<Any[]>([]);

  const fetchPromotions = useCallback(() => {
    fetch("/api/admin/promotions").then(r => r.json()).then(d => {
      if (d.promotions) setPromotions(d.promotions);
    }).catch(() => toast.error("Failed to load promotions"));
  }, []);

  useEffect(() => { fetchPromotions(); }, [fetchPromotions]);

  const resetForm = () => { setEditId(null); setTitle(""); setDescription(""); setCode(""); setDiscount(""); setType("percentage"); setStartDate(""); setEndDate(""); setActive(true); setShowForm(false); };

  const handleEdit = (p: Any) => {
    setEditId(p.id); setTitle(p.title); setDescription(p.description || ""); setCode(p.code || "");
    setDiscount(String(p.discount)); setType(p.type); setStartDate(p.startDate?.split("T")[0] || "");
    setEndDate(p.endDate?.split("T")[0] || ""); setActive(p.active); setShowForm(true);
  };

  const handleSubmit = async () => {
    if (!title || !discount || !startDate || !endDate) { toast.error("Title, discount, start & end dates required"); return; }
    setSaving(true);
    try {
      const body = { title, description, code, discount, type, startDate, endDate, active };
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
          <p className="text-text-muted text-sm mt-1">Manage discount codes and promotions</p>
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
            <div><label className="text-sm font-medium text-text block mb-1.5">Coupon Code</label><Input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="e.g. SALE10" className="rounded-lg font-mono uppercase" /></div>
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
            <div className="md:col-span-2"><label className="text-sm font-medium text-text block mb-1.5">Description</label><textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Promotion details..." rows={3} className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent resize-none" /></div>
          </div>
          <label className="flex items-center gap-2 cursor-pointer mt-4">
            <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} className="rounded border-border text-accent focus:ring-accent" />
            <span className="text-sm text-text">Active</span>
          </label>
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
              <th className="px-5 py-4">Period</th>
              <th className="px-5 py-4">Status</th>
              <th className="px-5 py-4">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {promotions.map((promo: Any) => (
              <tr key={promo.id} className="hover:bg-surface/50 transition-colors">
                <td className="px-5 py-3.5"><div className="flex items-center gap-3"><Megaphone className="w-4 h-4 text-accent" /><span className="text-sm font-medium text-text">{promo.title}</span></div></td>
                <td className="px-5 py-3.5">{promo.code ? <code className="bg-surface px-2 py-1 rounded text-xs font-mono font-bold text-accent">{promo.code}</code> : <span className="text-xs text-text-muted">—</span>}</td>
                <td className="px-5 py-3.5 text-sm font-semibold text-text">{promo.type === "percentage" ? `${promo.discount}%` : `GH₵${promo.discount}`}</td>
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
            {promotions.length === 0 && <tr><td colSpan={6} className="px-5 py-10 text-center text-text-muted">No promotions yet</td></tr>}
          </tbody>
        </table>
      </motion.div>
    </div>
  );
}
