"use client";

import React, { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Edit, Trash2, Megaphone, Loader2, X, Home, Package,
  Zap, Calendar, Clock, Tag, ShoppingBag, AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import toast from "react-hot-toast";
import RichTextEditor from "@/components/ui/rich-text-editor";
import ProductPickerModal, { SelectedProduct } from "@/components/admin/ProductPickerModal";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = any;

// ── Helpers ──────────────────────────────────────────────────────────────────

type PromoStatus = "active" | "scheduled" | "expired" | "inactive";

function getPromoStatus(p: Any): PromoStatus {
  if (!p.active) return "inactive";
  const now = Date.now();
  if (new Date(p.startDate).getTime() > now) return "scheduled";
  if (new Date(p.endDate).getTime() < now) return "expired";
  return "active";
}

const statusConfig: Record<PromoStatus, { label: string; dot: string; pill: string }> = {
  active:    { label: "Active",    dot: "bg-green-500",  pill: "bg-green-50 text-green-700 ring-green-200" },
  scheduled: { label: "Scheduled", dot: "bg-blue-500",   pill: "bg-blue-50 text-blue-700 ring-blue-200" },
  expired:   { label: "Expired",   dot: "bg-gray-400",   pill: "bg-gray-100 text-gray-500 ring-gray-200" },
  inactive:  { label: "Inactive",  dot: "bg-gray-300",   pill: "bg-gray-100 text-gray-500 ring-gray-200" },
};

function daysUntil(dateStr: string): number {
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86400000);
}

function formatRange(start: string, end: string): string {
  const opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short" };
  return `${new Date(start).toLocaleDateString("en-GB", opts)} — ${new Date(end).toLocaleDateString("en-GB", opts)}`;
}

// Stacked product thumbnails
function ProductStack({ products }: { products: Any[] }) {
  const thumbs = (products || []).slice(0, 4);
  const extra = (products?.length || 0) - thumbs.length;
  return (
    <div className="flex items-center">
      <div className="flex -space-x-2">
        {thumbs.map((pp: Any) => {
          const url = pp.product?.images?.[0]?.url;
          return (
            <div key={pp.id} className="w-7 h-7 rounded-full bg-surface border-2 border-white overflow-hidden shrink-0" title={pp.product?.name}>
              {url ? (
                <Image src={url} alt="" width={28} height={28} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Package className="w-3 h-3 text-text-muted" />
                </div>
              )}
            </div>
          );
        })}
        {extra > 0 && (
          <div className="w-7 h-7 rounded-full bg-surface-dark border-2 border-white flex items-center justify-center shrink-0">
            <span className="text-[9px] font-bold text-text-muted">+{extra}</span>
          </div>
        )}
      </div>
      <span className="ml-2.5 text-xs font-medium text-text-muted tabular-nums">
        {products?.length || 0}
      </span>
    </div>
  );
}

// Section label inside the form drawer
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] font-semibold uppercase tracking-wider text-text-muted mb-3">
      {children}
    </p>
  );
}

// Toggle switch (keeps native checkbox semantics)
function Toggle({ checked, onChange, icon, label }: {
  checked: boolean;
  onChange: (v: boolean) => void;
  icon?: React.ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="flex items-center gap-3 cursor-pointer select-none py-1 text-left"
    >
      <span className={`relative w-9 h-5 rounded-full transition-colors shrink-0 ${checked ? "bg-accent" : "bg-border"}`}>
        <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${checked ? "translate-x-4" : "translate-x-0"}`} />
      </span>
      {icon}
      <span className="text-sm text-text">{label}</span>
    </button>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function AdminPromotionsPage() {
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [code, setCode] = useState("");
  const [discount, setDiscount] = useState("");
  const [type, setType] = useState("percentage");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [active, setActive] = useState(true);
  const [showOnHome, setShowOnHome] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState<SelectedProduct[]>([]);
  const [promotions, setPromotions] = useState<Any[]>([]);
  const [pickerOpen, setPickerOpen] = useState(false);

  const fetchPromotions = useCallback(() => {
    setLoading(true);
    fetch("/api/admin/promotions").then(r => r.json()).then(d => {
      if (d.promotions) setPromotions(d.promotions);
    }).catch(() => toast.error("Failed to load promotions"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchPromotions(); }, [fetchPromotions]);

  const resetForm = () => {
    setEditId(null); setTitle(""); setDescription(""); setCode(""); setDiscount("");
    setType("percentage"); setStartDate(""); setEndDate(""); setActive(true);
    setShowOnHome(false); setSelectedProducts([]); setPickerOpen(false);
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

  const removeProduct = (id: string) => {
    setSelectedProducts(selectedProducts.filter((p) => p.id !== id));
  };

  const handleSubmit = async () => {
    if (!title || !discount || !startDate || !endDate) { toast.error("Title, discount, start & end dates required"); return; }
    setSaving(true);
    try {
      const body = {
        title, description, code: code.toUpperCase(), discount, type, startDate, endDate, active, showOnHome,
        productIds: selectedProducts.map((p) => p.id),
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

  // ── Derived stats ──────────────────────────────────────────────────────────
  const stats = React.useMemo(() => {
    const statuses = promotions.map(getPromoStatus);
    return {
      active: statuses.filter((s) => s === "active").length,
      scheduled: statuses.filter((s) => s === "scheduled").length,
      totalProducts: promotions.reduce((n: number, p: Any) => n + (p.products?.length || 0), 0),
      expiringSoon: promotions.filter(
        (p: Any) => p.active && daysUntil(p.endDate) >= 0 && daysUntil(p.endDate) <= 7
      ).length,
    };
  }, [promotions]);

  const statCards = [
    { label: "Active Now", value: stats.active, icon: Zap, color: "text-green-600", bg: "bg-green-50" },
    { label: "Scheduled", value: stats.scheduled, icon: Calendar, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "Products on Promo", value: stats.totalProducts, icon: ShoppingBag, color: "text-accent", bg: "bg-accent/10" },
    { label: "Expiring in 7d", value: stats.expiringSoon, icon: AlertTriangle, color: "text-amber-600", bg: "bg-amber-50" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text tracking-tight">Promotions</h1>
          <p className="text-text-muted text-sm mt-1">
            {promotions.length} {promotions.length === 1 ? "promotion" : "promotions"} · manage discount codes and featured deals
          </p>
        </div>
        <Button onClick={() => { resetForm(); setShowForm(true); }} className="rounded-lg gap-2">
          <Plus className="w-4 h-4" /> Add Promotion
        </Button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {statCards.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="bg-white rounded-2xl border border-border p-4 flex items-center gap-3"
          >
            <div className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center shrink-0`}>
              <s.icon className={`w-5 h-5 ${s.color}`} />
            </div>
            <div className="min-w-0">
              <p className="text-2xl font-bold text-text tabular-nums leading-none">
                {loading ? <Skeleton className="h-6 w-8 inline-block" /> : s.value}
              </p>
              <p className="text-xs text-text-muted mt-1.5 truncate">{s.label}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Promotions table */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="bg-white rounded-2xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px]">
            <thead>
              <tr className="text-left text-[11px] text-text-muted uppercase tracking-wider border-b border-border bg-surface/50">
                <th className="px-5 py-3.5 font-semibold">Promotion</th>
                <th className="px-5 py-3.5 font-semibold">Code</th>
                <th className="px-5 py-3.5 font-semibold">Discount</th>
                <th className="px-5 py-3.5 font-semibold">Products</th>
                <th className="px-5 py-3.5 font-semibold">Period</th>
                <th className="px-5 py-3.5 font-semibold">Status</th>
                <th className="px-5 py-3.5 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i}>
                    <td className="px-5 py-4"><div className="flex items-center gap-3"><Skeleton className="w-9 h-9 rounded-xl" /><Skeleton className="h-4 w-36" /></div></td>
                    <td className="px-5 py-4"><Skeleton className="h-5 w-16" /></td>
                    <td className="px-5 py-4"><Skeleton className="h-4 w-12" /></td>
                    <td className="px-5 py-4"><Skeleton className="h-7 w-20" /></td>
                    <td className="px-5 py-4"><Skeleton className="h-4 w-32" /></td>
                    <td className="px-5 py-4"><Skeleton className="h-5 w-16 rounded-full" /></td>
                    <td className="px-5 py-4"><Skeleton className="h-6 w-14 ml-auto" /></td>
                  </tr>
                ))
              ) : promotions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-16">
                    <div className="flex flex-col items-center text-center">
                      <div className="w-14 h-14 rounded-2xl bg-surface flex items-center justify-center mb-4">
                        <Megaphone className="w-7 h-7 text-text-muted" />
                      </div>
                      <p className="text-sm font-semibold text-text">No promotions yet</p>
                      <p className="text-xs text-text-muted mt-1 mb-4">Create your first promotion to boost sales</p>
                      <Button onClick={() => { resetForm(); setShowForm(true); }} size="sm" className="rounded-lg gap-1.5">
                        <Plus className="w-3.5 h-3.5" /> Create Promotion
                      </Button>
                    </div>
                  </td>
                </tr>
              ) : (
                promotions.map((promo: Any) => {
                  const status = getPromoStatus(promo);
                  const sc = statusConfig[status];
                  const daysLeft = daysUntil(promo.endDate);
                  return (
                    <tr key={promo.id} className="hover:bg-surface/60 transition-colors cursor-pointer" onClick={() => handleEdit(promo)}>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-accent/10 flex items-center justify-center shrink-0">
                            <Tag className="w-4 h-4 text-accent" />
                          </div>
                          <div className="min-w-0">
                            <span className="text-sm font-semibold text-text truncate block max-w-[220px]">{promo.title}</span>
                            {promo.showOnHome && (
                              <div className="flex items-center gap-1 mt-0.5">
                                <Home className="w-3 h-3 text-accent" />
                                <span className="text-[10px] text-accent font-medium">Homepage</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        {promo.code ? (
                          <code className="bg-surface px-2 py-1 rounded-md text-xs font-mono font-bold text-accent">{promo.code}</code>
                        ) : (
                          <span className="text-xs text-text-muted">—</span>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-sm font-bold text-text tabular-nums">
                          {promo.type === "percentage" ? `${promo.discount}%` : `GH₵${promo.discount}`}
                        </span>
                      </td>
                      <td className="px-5 py-4"><ProductStack products={promo.products} /></td>
                      <td className="px-5 py-4">
                        <div>
                          <p className="text-xs text-text whitespace-nowrap">{formatRange(promo.startDate, promo.endDate)}</p>
                          {status === "active" && daysLeft <= 7 && (
                            <p className="text-[10px] text-amber-600 font-medium flex items-center gap-1 mt-0.5">
                              <Clock className="w-3 h-3" /> ends in {daysLeft}d
                            </p>
                          )}
                          {status === "scheduled" && (
                            <p className="text-[10px] text-blue-600 font-medium mt-0.5">
                              starts in {Math.max(1, daysUntil(promo.startDate))}d
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium ring-1 ${sc.pill}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
                          {sc.label}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                          <button onClick={() => handleEdit(promo)} className="p-1.5 hover:bg-surface rounded-lg transition-colors text-text-muted hover:text-accent" title="Edit">
                            <Edit className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDelete(promo.id)} className="p-1.5 hover:bg-surface rounded-lg transition-colors text-text-muted hover:text-red-500" title="Delete">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* ── Slide-over form drawer ─────────────────────────────────────────── */}
      <AnimatePresence>
        {showForm && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-40"
              onClick={resetForm}
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 32, stiffness: 300 }}
              className="fixed inset-y-0 right-0 w-full max-w-xl bg-white shadow-2xl z-50 flex flex-col"
            >
              {/* Drawer header */}
              <div className="px-6 py-4 border-b border-border flex items-center justify-between shrink-0">
                <div>
                  <h2 className="text-lg font-bold text-text">{editId ? "Edit Promotion" : "New Promotion"}</h2>
                  <p className="text-xs text-text-muted mt-0.5">{editId ? "Update promotion details" : "Create a discount campaign"}</p>
                </div>
                <button onClick={resetForm} className="p-2 hover:bg-surface rounded-lg transition-colors">
                  <X className="w-5 h-5 text-text-muted" />
                </button>
              </div>

              {/* Drawer body */}
              <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
                {/* Basics */}
                <section>
                  <SectionLabel>Basics</SectionLabel>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-text block mb-1.5">Title</label>
                      <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Black Friday Mega Sale" className="rounded-lg" />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-text block mb-1.5">Coupon Code</label>
                      <Input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="e.g. SALE10 (optional)" className="rounded-lg font-mono uppercase" />
                      <p className="text-[11px] text-text-muted mt-1">Customers enter this at checkout. Leave blank for automatic promo display.</p>
                    </div>
                  </div>
                </section>

                {/* Discount */}
                <section>
                  <SectionLabel>Discount</SectionLabel>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-sm font-medium text-text block mb-1.5">Type</label>
                      <select value={type} onChange={(e) => setType(e.target.value)} className="w-full bg-surface border-0 rounded-lg px-3 py-2.5 text-sm text-text focus:ring-2 focus:ring-accent">
                        <option value="percentage">Percentage (%)</option>
                        <option value="fixed">Fixed (GH₵)</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-text block mb-1.5">Value</label>
                      <Input type="number" min="0" value={discount} onChange={(e) => setDiscount(e.target.value)} placeholder={type === "percentage" ? "e.g. 15" : "e.g. 500"} className="rounded-lg" />
                    </div>
                  </div>
                </section>

                {/* Schedule */}
                <section>
                  <SectionLabel>Schedule</SectionLabel>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-sm font-medium text-text block mb-1.5">Start Date</label>
                      <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="rounded-lg" />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-text block mb-1.5">End Date</label>
                      <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="rounded-lg" />
                    </div>
                  </div>
                </section>

                {/* Details */}
                <section>
                  <SectionLabel>Details</SectionLabel>
                  <RichTextEditor value={description} onChange={setDescription} placeholder="Promotion details shown on storefront..." simple minHeight="100px" />
                </section>

                {/* Products */}
                <section>
                  <div className="flex items-center justify-between mb-3">
                    <SectionLabel>
                      Products <span className="text-accent font-bold tabular-nums">({selectedProducts.length})</span>
                    </SectionLabel>
                  </div>
                  <button
                    onClick={() => setPickerOpen(true)}
                    className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-border rounded-xl text-sm font-medium text-text-muted hover:border-accent hover:text-accent hover:bg-accent/5 transition-all"
                  >
                    <Package className="w-4 h-4" />
                    Browse &amp; select products
                  </button>
                  <p className="text-[11px] text-text-muted mt-1.5">
                    Unlimited selection. Products appear in the homepage promo section when &ldquo;Show on Homepage&rdquo; is on.
                  </p>

                  {selectedProducts.length > 0 && (
                    <div className="mt-3 max-h-64 overflow-y-auto rounded-xl border border-border divide-y divide-border">
                      {selectedProducts.map((p) => (
                        <div key={p.id} className="flex items-center gap-3 px-3 py-2 hover:bg-surface/50 transition-colors">
                          <div className="w-8 h-8 rounded-lg bg-surface overflow-hidden shrink-0">
                            {p.image ? (
                              <Image src={p.image} alt="" width={32} height={32} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center"><Package className="w-3.5 h-3.5 text-border" /></div>
                            )}
                          </div>
                          <p className="flex-1 text-xs font-medium text-text truncate">{p.name}</p>
                          <span className="text-[11px] text-text-muted tabular-nums">GH₵{p.price?.toLocaleString()}</span>
                          <button onClick={() => removeProduct(p.id)} className="p-1 text-text-muted hover:text-red-500 transition-colors">
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </section>

                {/* Visibility */}
                <section>
                  <SectionLabel>Visibility</SectionLabel>
                  <div className="space-y-1">
                    <Toggle checked={active} onChange={setActive} label="Active" />
                    <Toggle checked={showOnHome} onChange={setShowOnHome} icon={<Home className="w-4 h-4 text-accent" />} label="Show on Homepage" />
                  </div>
                </section>
              </div>

              {/* Drawer footer */}
              <div className="border-t border-border px-6 py-4 flex items-center justify-between gap-3 shrink-0 bg-white">
                <Button variant="ghost" onClick={resetForm} className="rounded-lg">Cancel</Button>
                <Button onClick={handleSubmit} disabled={saving} className="rounded-lg gap-2 min-w-[160px]">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  {editId ? "Update Promotion" : "Create Promotion"}
                </Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Product picker modal */}
      <ProductPickerModal
        open={pickerOpen}
        initialSelected={selectedProducts}
        onClose={() => setPickerOpen(false)}
        onApply={(products) => {
          setSelectedProducts(products);
          setPickerOpen(false);
        }}
      />
    </div>
  );
}
