"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Plus, Edit, Trash2, Loader2, Check, ChevronDown, ChevronRight,
  FolderTree, FolderOpen,
  Tv, Smartphone, Laptop, Monitor, Printer, Network, Headphones, Music,
  Camera, Gamepad2, Gift, Zap, Wifi, Watch, Mic, Mouse,
  HardDrive, Server, Wind, Sparkles, Package, Cpu,
  Volume2, Radio, Tablet, Fan, Home, Layers,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import toast from "react-hot-toast";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = any;

const ICON_OPTIONS = [
  { name: "Tv",         Icon: Tv,         label: "TV"          },
  { name: "Monitor",    Icon: Monitor,    label: "Monitor"     },
  { name: "Smartphone", Icon: Smartphone, label: "Phone"       },
  { name: "Tablet",     Icon: Tablet,     label: "Tablet"      },
  { name: "Laptop",     Icon: Laptop,     label: "Laptop"      },
  { name: "Cpu",        Icon: Cpu,        label: "CPU"         },
  { name: "HardDrive",  Icon: HardDrive,  label: "Drive"       },
  { name: "Mouse",      Icon: Mouse,      label: "Mouse"       },
  { name: "Printer",    Icon: Printer,    label: "Printer"     },
  { name: "Network",    Icon: Network,    label: "Network"     },
  { name: "Wifi",       Icon: Wifi,       label: "WiFi"        },
  { name: "Server",     Icon: Server,     label: "Server"      },
  { name: "Headphones", Icon: Headphones, label: "Headphones"  },
  { name: "Volume2",    Icon: Volume2,    label: "Audio"       },
  { name: "Music",      Icon: Music,      label: "Music"       },
  { name: "Mic",        Icon: Mic,        label: "Mic"         },
  { name: "Radio",      Icon: Radio,      label: "Radio"       },
  { name: "Camera",     Icon: Camera,     label: "Camera"      },
  { name: "Gamepad2",   Icon: Gamepad2,   label: "Gaming"      },
  { name: "Watch",      Icon: Watch,      label: "Watch"       },
  { name: "Gift",       Icon: Gift,       label: "Gift"        },
  { name: "Zap",        Icon: Zap,        label: "Power"       },
  { name: "Wind",       Icon: Wind,       label: "Aircon"      },
  { name: "Fan",        Icon: Fan,        label: "Fan"         },
  { name: "Home",       Icon: Home,       label: "Home"        },
  { name: "Sparkles",   Icon: Sparkles,   label: "AI"          },
  { name: "Package",    Icon: Package,    label: "Package"     },
  { name: "Layers",     Icon: Layers,     label: "General"     },
];

function CatIcon({ name, size = 16 }: { name?: string | null; size?: number }) {
  if (!name) return <FolderTree size={size} />;
  const found = ICON_OPTIONS.find((o) => o.name === name);
  if (found) { const I = found.Icon; return <I size={size} />; }
  return <FolderTree size={size} />;
}

export default function AdminCategoriesPage() {
  const [showForm, setShowForm]       = useState(false);
  const [editId, setEditId]           = useState<string | null>(null);
  const [saving, setSaving]           = useState(false);
  const [name, setName]               = useState("");
  const [slug, setSlug]               = useState("");
  const [description, setDescription] = useState("");
  const [parentId, setParentId]       = useState("");
  const [featured, setFeatured]       = useState(false);
  const [icon, setIcon]               = useState("");
  const [categories, setCategories]   = useState<Any[]>([]);
  const [collapsed, setCollapsed]     = useState<Set<string>>(new Set());

  const fetchCategories = useCallback(() => {
    fetch("/api/admin/categories")
      .then((r) => r.json())
      .then((d) => { if (d.categories) setCategories(d.categories); })
      .catch(() => toast.error("Failed to load categories"));
  }, []);

  useEffect(() => { fetchCategories(); }, [fetchCategories]);

  const resetForm = () => {
    setEditId(null); setName(""); setSlug(""); setDescription("");
    setParentId(""); setFeatured(false); setIcon(""); setShowForm(false);
  };

  const handleEdit = (cat: Any) => {
    setEditId(cat.id); setName(cat.name); setSlug(cat.slug);
    setDescription(cat.description || ""); setParentId(cat.parentId || "");
    setFeatured(!!cat.featured); setIcon(cat.icon || ""); setShowForm(true);
    setTimeout(() => window.scrollTo({ top: 0, behavior: "smooth" }), 50);
  };

  const handleSubmit = async () => {
    if (!name || !slug) { toast.error("Name and slug are required"); return; }
    setSaving(true);
    try {
      const body = { name, slug, description, parentId: parentId || null, featured, icon: icon || null };
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
    if (!confirm(`Delete "${catName}"? Products in this category may be affected.`)) return;
    try {
      const res = await fetch(`/api/admin/categories/${id}`, { method: "DELETE" });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
      toast.success("Category deleted"); fetchCategories();
    } catch (e: Any) { toast.error(e.message || "Failed to delete"); }
  };

  const toggle = (id: string) =>
    setCollapsed((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const { parents, childMap } = useMemo(() => {
    const ps = categories.filter((c: Any) => !c.parentId);
    const cm: Record<string, Any[]> = {};
    categories.forEach((c: Any) => { if (c.parentId) { cm[c.parentId] = cm[c.parentId] ?? []; cm[c.parentId].push(c); } });
    return { parents: ps, childMap: cm };
  }, [categories]);

  const parentOptions = categories.filter((c: Any) => !c.parentId && c.id !== editId);
  const isMain = !parentId;

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text">Categories</h1>
          <p className="text-text-muted text-sm mt-1">
            {parents.length} main &middot; {categories.length - parents.length} subcategories
          </p>
        </div>
        <Button onClick={() => { resetForm(); setShowForm(true); }} className="rounded-lg">
          <Plus className="w-4 h-4 mr-2" /> Add Category
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* ── Tree Table ── */}
        <div className="lg:col-span-2">
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl border border-border overflow-hidden"
          >
            {/* Legend */}
            <div className="flex items-center gap-4 px-5 py-3 border-b border-border bg-surface/40 text-xs text-text-muted">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-accent inline-block" />
                Main category
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-border inline-block" />
                Subcategory
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-xs text-text-muted uppercase tracking-wider border-b border-border">
                    <th className="px-5 py-3.5">Category</th>
                    <th className="px-5 py-3.5">Slug</th>
                    <th className="px-5 py-3.5 text-center">Products</th>
                    <th className="px-5 py-3.5 text-center">Featured</th>
                    <th className="px-5 py-3.5">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {parents.map((parent: Any) => {
                    const subs = childMap[parent.id] ?? [];
                    const open = !collapsed.has(parent.id);
                    const totalProds =
                      (parent._count?.products ?? 0) +
                      subs.reduce((s: number, c: Any) => s + (c._count?.products ?? 0), 0);

                    return (
                      <React.Fragment key={parent.id}>
                        {/* ── Main Category Row ── */}
                        <tr className="border-b border-accent/10 bg-accent/5">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              {/* collapse toggle */}
                              {subs.length > 0 ? (
                                <button
                                  onClick={() => toggle(parent.id)}
                                  className="text-accent hover:text-accent/70 transition-colors flex-shrink-0"
                                >
                                  {open ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                                </button>
                              ) : (
                                <span className="w-4" />
                              )}
                              {/* accent icon bubble */}
                              <div className="w-8 h-8 bg-accent text-white rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm">
                                <CatIcon name={parent.icon} size={15} />
                              </div>
                              <div>
                                <p className="text-sm font-semibold text-text leading-tight">{parent.name}</p>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                  <span className="text-[10px] bg-accent text-white px-1.5 py-0.5 rounded-sm font-semibold uppercase tracking-wide">Main</span>
                                  {subs.length > 0 && (
                                    <span className="text-[10px] text-text-muted">{subs.length} subs</span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-3 text-xs text-text-muted font-mono">{parent.slug}</td>
                          <td className="px-5 py-3 text-center">
                            <Badge variant="outline" className="text-xs">{totalProds}</Badge>
                          </td>
                          <td className="px-5 py-3 text-center">
                            {parent.featured
                              ? <Badge variant="success" className="text-xs">Yes</Badge>
                              : <span className="text-xs text-text-muted">—</span>}
                          </td>
                          <td className="px-5 py-3">
                            <div className="flex items-center gap-1">
                              <button onClick={() => handleEdit(parent)} className="p-1.5 hover:bg-white rounded-lg transition-colors text-text-muted hover:text-accent"><Edit className="w-4 h-4" /></button>
                              <button onClick={() => handleDelete(parent.id, parent.name)} className="p-1.5 hover:bg-white rounded-lg transition-colors text-text-muted hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                            </div>
                          </td>
                        </tr>

                        {/* ── Subcategory Rows ── */}
                        {open && subs.map((sub: Any) => (
                          <tr key={sub.id} className="border-b border-border/40 hover:bg-surface/30 transition-colors">
                            <td className="px-4 py-2.5">
                              <div className="flex items-center gap-2 pl-10">
                                <span className="text-text-muted/50 text-base leading-none">↳</span>
                                <div className="w-6 h-6 bg-surface border border-border rounded-md flex items-center justify-center flex-shrink-0">
                                  <FolderOpen className="w-3.5 h-3.5 text-text-muted" />
                                </div>
                                <span className="text-sm text-text">{sub.name}</span>
                              </div>
                            </td>
                            <td className="px-5 py-2.5 text-xs text-text-muted font-mono">{sub.slug}</td>
                            <td className="px-5 py-2.5 text-center">
                              <Badge variant="outline" className="text-xs">{sub._count?.products ?? 0}</Badge>
                            </td>
                            <td className="px-5 py-2.5 text-center">
                              <span className="text-xs text-text-muted">—</span>
                            </td>
                            <td className="px-5 py-2.5">
                              <div className="flex items-center gap-1">
                                <button onClick={() => handleEdit(sub)} className="p-1.5 hover:bg-surface rounded-lg transition-colors text-text-muted hover:text-accent"><Edit className="w-4 h-4" /></button>
                                <button onClick={() => handleDelete(sub.id, sub.name)} className="p-1.5 hover:bg-surface rounded-lg transition-colors text-text-muted hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </React.Fragment>
                    );
                  })}
                  {categories.length === 0 && (
                    <tr><td colSpan={5} className="px-5 py-12 text-center text-text-muted">No categories yet</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </motion.div>
        </div>

        {/* ── Form Panel ── */}
        {showForm ? (
          <motion.div
            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
            className="bg-white rounded-2xl border border-border p-6 sticky top-6"
          >
            {/* Form header */}
            <div className="flex items-center gap-2.5 mb-5">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                isMain ? "bg-accent text-white" : "bg-surface border border-border text-text-muted"
              }`}>
                {isMain ? <CatIcon name={icon} size={15} /> : <FolderOpen className="w-4 h-4" />}
              </div>
              <div>
                <h2 className="font-bold text-text text-sm leading-tight">
                  {editId ? "Edit" : "New"} {isMain ? "Main Category" : "Subcategory"}
                </h2>
                <p className="text-[11px] text-text-muted">
                  {isMain ? "Top-level · shown in navigation" : "Nested under a main category"}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {/* Name */}
              <div>
                <label className="text-xs font-semibold text-text-muted uppercase tracking-wide block mb-1.5">Name</label>
                <Input
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (!editId) setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""));
                  }}
                  placeholder="Category name"
                  className="rounded-lg"
                />
              </div>

              {/* Slug */}
              <div>
                <label className="text-xs font-semibold text-text-muted uppercase tracking-wide block mb-1.5">Slug</label>
                <Input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="category-slug" className="rounded-lg font-mono text-sm" />
              </div>

              {/* Parent */}
              <div>
                <label className="text-xs font-semibold text-text-muted uppercase tracking-wide block mb-1.5">Parent Category</label>
                <select
                  value={parentId}
                  onChange={(e) => setParentId(e.target.value)}
                  className="w-full bg-surface border-0 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-accent"
                >
                  <option value="">None — Main Category</option>
                  {parentOptions.map((cat: Any) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>

              {/* Icon Picker — main categories only */}
              {isMain && (
                <div>
                  <label className="text-xs font-semibold text-text-muted uppercase tracking-wide block mb-1.5">
                    Icon <span className="normal-case font-normal">(storefront navigation)</span>
                  </label>
                  <div className="grid grid-cols-7 gap-1.5">
                    {ICON_OPTIONS.map(({ name: n, Icon, label }) => (
                      <button
                        key={n}
                        type="button"
                        title={label}
                        onClick={() => setIcon(n === icon ? "" : n)}
                        className={`relative p-2 rounded-lg border transition-all flex items-center justify-center ${
                          icon === n
                            ? "border-accent bg-accent text-white shadow-sm"
                            : "border-border hover:border-accent/50 hover:bg-surface text-text-muted"
                        }`}
                      >
                        <Icon size={15} />
                        {icon === n && (
                          <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-green-500 rounded-full flex items-center justify-center">
                            <Check className="w-2 h-2 text-white" />
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                  {icon && (
                    <p className="text-[11px] text-text-muted mt-1.5">Selected: <span className="text-accent font-medium">{icon}</span></p>
                  )}
                </div>
              )}

              {/* Description */}
              <div>
                <label className="text-xs font-semibold text-text-muted uppercase tracking-wide block mb-1.5">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Optional description"
                  rows={2}
                  className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent resize-none"
                />
              </div>

              {/* Featured — main only */}
              {isMain && (
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={featured}
                    onChange={(e) => setFeatured(e.target.checked)}
                    className="rounded border-border text-accent focus:ring-accent"
                  />
                  <span className="text-sm text-text">Show as featured category</span>
                </label>
              )}

              <div className="flex gap-2 pt-1">
                <Button onClick={handleSubmit} disabled={saving} className="flex-1 rounded-lg">
                  {saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                  {editId ? "Update" : "Create"}
                </Button>
                <Button variant="ghost" onClick={resetForm} className="rounded-lg px-4">Cancel</Button>
              </div>
            </div>
          </motion.div>
        ) : (
          /* Quick-add prompt when form is closed */
          <div className="bg-surface/50 rounded-2xl border border-dashed border-border p-6 text-center">
            <div className="w-10 h-10 bg-white border border-border rounded-xl flex items-center justify-center mx-auto mb-3">
              <Plus className="w-5 h-5 text-text-muted" />
            </div>
            <p className="text-sm font-medium text-text">Add a category</p>
            <p className="text-xs text-text-muted mt-1 mb-4">Create main categories or subcategories for your products</p>
            <Button onClick={() => { resetForm(); setShowForm(true); }} variant="outline" className="rounded-lg w-full">
              <Plus className="w-4 h-4 mr-2" /> New Category
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
