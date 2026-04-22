"use client";

import React, { useEffect, useState } from "react";
import { Percent, Save, Loader2, FolderTree, ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";

interface CategoryWithMargin {
  id: string; name: string; slug: string;
  categoryMargin: { id: string; marginPercent: number } | null;
  children: { id: string; name: string; slug: string; categoryMargin: { id: string; marginPercent: number } | null }[];
  _count: { products: number };
}

export default function CategoryMarginsPage() {
  const [categories, setCategories] = useState<CategoryWithMargin[]>([]);
  const [loading, setLoading] = useState(true);
  const [margins, setMargins] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<string>("");

  useEffect(() => {
    fetch("/api/admin/category-margins").then((r) => r.json()).then((data) => {
      setCategories(data);
      const m: Record<string, string> = {};
      for (const cat of data) {
        m[cat.id] = cat.categoryMargin?.marginPercent?.toString() || "0";
        for (const child of cat.children) {
          m[child.id] = child.categoryMargin?.marginPercent?.toString() || "0";
        }
      }
      setMargins(m);
      setLoading(false);
    });
  }, []);

  const saveMargin = async (categoryId: string) => {
    setSaving(categoryId);
    await fetch("/api/admin/category-margins", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ categoryId, marginPercent: margins[categoryId] || "0" }),
    });
    setSaving("");
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-text flex items-center gap-2">
          <Percent className="w-6 h-6 text-accent" /> Category Margins
        </h1>
        <p className="text-text-muted text-sm">Set the commission margin percentage for each product category. Resellers earn this margin on sales.</p>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-14 bg-white rounded-xl animate-pulse" />)}
        </div>
      ) : (
        <div className="space-y-4">
          {categories.map((cat) => (
            <div key={cat.id} className="bg-white rounded-xl border border-border overflow-hidden">
              {/* Parent Category */}
              <div className="flex items-center gap-4 px-4 py-3 bg-surface/30">
                <FolderTree className="w-4.5 h-4.5 text-accent shrink-0" />
                <div className="flex-1">
                  <p className="font-medium text-text text-sm">{cat.name}</p>
                  <p className="text-xs text-text-muted">{cat._count.products} products</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative w-24">
                    <Input
                      type="number"
                      step="0.5"
                      min="0"
                      max="100"
                      value={margins[cat.id] || "0"}
                      onChange={(e) => setMargins((m) => ({ ...m, [cat.id]: e.target.value }))}
                      className="text-right pr-7 text-sm h-9"
                    />
                    <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted text-xs">%</span>
                  </div>
                  <button
                    onClick={() => saveMargin(cat.id)}
                    disabled={saving === cat.id}
                    className="p-2 bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors disabled:opacity-50"
                  >
                    {saving === cat.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Subcategories */}
              {cat.children.length > 0 && (
                <div className="divide-y divide-border">
                  {cat.children.map((child) => (
                    <div key={child.id} className="flex items-center gap-4 px-4 py-2.5 pl-12">
                      <ChevronRight className="w-3.5 h-3.5 text-text-muted shrink-0" />
                      <p className="flex-1 text-sm text-text">{child.name}</p>
                      <div className="flex items-center gap-2">
                        <div className="relative w-24">
                          <Input
                            type="number"
                            step="0.5"
                            min="0"
                            max="100"
                            value={margins[child.id] || "0"}
                            onChange={(e) => setMargins((m) => ({ ...m, [child.id]: e.target.value }))}
                            className="text-right pr-7 text-sm h-9"
                          />
                          <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted text-xs">%</span>
                        </div>
                        <button
                          onClick={() => saveMargin(child.id)}
                          disabled={saving === child.id}
                          className="p-2 bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors disabled:opacity-50"
                        >
                          {saving === child.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
