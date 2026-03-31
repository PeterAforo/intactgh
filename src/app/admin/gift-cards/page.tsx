"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Gift, Plus, Search, Download, Printer, RefreshCw, X,
  CheckCircle2, XCircle, Clock, AlertTriangle, Copy, Eye, EyeOff,
  ChevronLeft, ChevronRight, Loader2, Trash2, Ban,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import toast from "react-hot-toast";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = any;

const DENOMINATIONS = [10, 20, 50, 100, 200, 500];

function statusColor(status: string) {
  switch (status) {
    case "active": return "bg-green-100 text-green-700 border-green-200";
    case "used": return "bg-gray-100 text-gray-500 border-gray-200";
    case "expired": return "bg-amber-100 text-amber-700 border-amber-200";
    case "voided": return "bg-red-100 text-red-700 border-red-200";
    default: return "bg-surface text-text-muted border-border";
  }
}

function StatusIcon({ status }: { status: string }) {
  switch (status) {
    case "active": return <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />;
    case "used": return <XCircle className="w-3.5 h-3.5 text-gray-400" />;
    case "expired": return <Clock className="w-3.5 h-3.5 text-amber-600" />;
    case "voided": return <Ban className="w-3.5 h-3.5 text-red-600" />;
    default: return null;
  }
}

function PrintableCard({ card }: { card: Any }) {
  return (
    <div className="gift-card-print w-[340px] h-[190px] rounded-2xl bg-gradient-to-br from-[#0041a8] to-[#0080ff] text-white p-5 flex flex-col justify-between shadow-xl">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium opacity-70">Intact Ghana</p>
          <p className="text-lg font-black">Gift Card</p>
        </div>
        <Gift className="w-8 h-8 opacity-80" />
      </div>
      <div>
        <p className="text-2xl font-black mb-1">GH₵{card.amount.toFixed(2)}</p>
        <p className="text-sm font-mono tracking-wider opacity-90">{card.code}</p>
        <p className="text-xs opacity-70 mt-0.5">PIN: {card.pin}</p>
      </div>
      <div className="flex justify-between items-end">
        <p className="text-[10px] opacity-60">intactghana.com</p>
        {card.expiresAt && (
          <p className="text-[10px] opacity-60">Exp: {new Date(card.expiresAt).toLocaleDateString()}</p>
        )}
      </div>
    </div>
  );
}

export default function AdminGiftCardsPage() {
  const [cards, setCards] = useState<Any[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, total: 0, totalPages: 1 });
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [showGenerate, setShowGenerate] = useState(false);
  const [showPins, setShowPins] = useState<Record<string, boolean>>({});
  const [printCards, setPrintCards] = useState<Any[]>([]);
  const printRef = useRef<HTMLDivElement>(null);

  // Generate form state
  const [genAmount, setGenAmount] = useState("50");
  const [genQty, setGenQty] = useState("1");
  const [genExpiry, setGenExpiry] = useState("");
  const [genNotes, setGenNotes] = useState("");
  const [generating, setGenerating] = useState(false);
  const [newlyGenerated, setNewlyGenerated] = useState<Any[]>([]);

  const fetchCards = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "20" });
      if (search) params.set("q", search);
      if (statusFilter) params.set("status", statusFilter);
      const res = await fetch(`/api/admin/gift-cards?${params}`);
      const data = await res.json();
      setCards(data.cards || []);
      setPagination(data.pagination || { page: 1, total: 0, totalPages: 1 });
    } catch { toast.error("Failed to load gift cards"); }
    finally { setLoading(false); }
  }, [search, statusFilter]);

  useEffect(() => { fetchCards(1); }, [fetchCards]);

  const handleGenerate = async () => {
    if (!genAmount || parseFloat(genAmount) <= 0) { toast.error("Enter a valid amount"); return; }
    if (!genQty || parseInt(genQty) < 1) { toast.error("Enter a valid quantity"); return; }
    setGenerating(true);
    try {
      const res = await fetch("/api/admin/gift-cards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: parseFloat(genAmount),
          quantity: parseInt(genQty),
          expiresAt: genExpiry || null,
          notes: genNotes || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Generation failed");
      setNewlyGenerated(data.cards);
      toast.success(`${data.count} gift card${data.count > 1 ? "s" : ""} generated!`);
      fetchCards(1);
    } catch (e: Any) { toast.error(e.message); }
    finally { setGenerating(false); }
  };

  const handleVoid = async (id: string, code: string) => {
    if (!confirm(`Void gift card ${code}? This cannot be undone.`)) return;
    try {
      await fetch(`/api/admin/gift-cards/${id}`, { method: "DELETE" });
      toast.success("Card voided");
      fetchCards(pagination.page);
    } catch { toast.error("Failed to void card"); }
  };

  const handlePrint = (cardsToPrint: Any[]) => {
    setPrintCards(cardsToPrint);
    setTimeout(() => window.print(), 300);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied!");
  };

  const exportCSV = () => {
    const rows = [
      ["Code", "PIN", "Amount", "Balance", "Status", "Notes", "Expires At", "Created At"],
      ...cards.map((c) => [c.code, c.pin, c.amount, c.balance, c.status, c.notes || "", c.expiresAt ? new Date(c.expiresAt).toLocaleDateString() : "", new Date(c.createdAt).toLocaleDateString()]),
    ];
    const csv = rows.map((r) => r.map((v) => `"${v}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `gift-cards-${Date.now()}.csv`; a.click();
  };

  const stats = {
    total: pagination.total,
    active: cards.filter((c) => c.status === "active").length,
    used: cards.filter((c) => c.status === "used").length,
    totalValue: cards.filter((c) => c.status === "active").reduce((s, c) => s + c.balance, 0),
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Print stylesheet */}
      <style dangerouslySetInnerHTML={{ __html: `@media print { body > * { display: none !important; } #gift-card-print-area { display: flex !important; flex-wrap: wrap; gap: 16px; padding: 20px; } }` }} />
      <div id="gift-card-print-area" ref={printRef} style={{ display: "none" }}>
        {printCards.map((c) => <PrintableCard key={c.id} card={c} />)}
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text">Gift Cards</h1>
          <p className="text-text-muted text-sm mt-0.5">Generate, manage and print gift cards</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="rounded-lg" onClick={exportCSV}>
            <Download className="w-4 h-4 mr-2" />Export CSV
          </Button>
          <Button onClick={() => { setShowGenerate(true); setNewlyGenerated([]); }} className="rounded-lg">
            <Plus className="w-4 h-4 mr-2" />Generate Cards
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Cards", value: stats.total, icon: <Gift className="w-5 h-5 text-accent" /> },
          { label: "Active", value: stats.active, icon: <CheckCircle2 className="w-5 h-5 text-green-600" /> },
          { label: "Used", value: stats.used, icon: <XCircle className="w-5 h-5 text-gray-400" /> },
          { label: "Active Balance", value: `GH₵${stats.totalValue.toFixed(2)}`, icon: <AlertTriangle className="w-5 h-5 text-amber-500" /> },
        ].map((stat) => (
          <div key={stat.label} className="bg-white rounded-2xl border border-border p-4 flex items-center gap-3">
            <div className="p-2 bg-surface rounded-xl">{stat.icon}</div>
            <div>
              <p className="text-xs text-text-muted">{stat.label}</p>
              <p className="text-xl font-black text-text">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Generate Modal */}
      <AnimatePresence>
        {showGenerate && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold text-text">Generate Gift Cards</h2>
                  <p className="text-sm text-text-muted mt-0.5">Cards include a unique code + 6-digit PIN</p>
                </div>
                <button onClick={() => { setShowGenerate(false); setNewlyGenerated([]); }}
                  className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-surface transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {newlyGenerated.length === 0 ? (
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-text block mb-2">Card Value (GH₵)</label>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {DENOMINATIONS.map((d) => (
                        <button key={d} onClick={() => setGenAmount(String(d))}
                          className={`px-3 py-1.5 rounded-lg border text-sm font-medium transition-all ${genAmount === String(d) ? "bg-accent text-white border-accent" : "border-border text-text hover:border-accent/50"}`}>
                          GH₵{d}
                        </button>
                      ))}
                    </div>
                    <Input type="number" value={genAmount} onChange={(e) => setGenAmount(e.target.value)} placeholder="Custom amount" className="rounded-lg" />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-text block mb-1.5">Quantity</label>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {[1, 5, 10, 25, 50].map((q) => (
                        <button key={q} onClick={() => setGenQty(String(q))}
                          className={`px-3 py-1.5 rounded-lg border text-sm font-medium transition-all ${genQty === String(q) ? "bg-accent text-white border-accent" : "border-border text-text hover:border-accent/50"}`}>
                          {q}
                        </button>
                      ))}
                    </div>
                    <Input type="number" value={genQty} onChange={(e) => setGenQty(e.target.value)} min="1" max="200" placeholder="Custom quantity (max 200)" className="rounded-lg" />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-text block mb-1.5">Expiry Date (optional)</label>
                    <Input type="date" value={genExpiry} onChange={(e) => setGenExpiry(e.target.value)} className="rounded-lg" />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-text block mb-1.5">Notes (optional)</label>
                    <Input value={genNotes} onChange={(e) => setGenNotes(e.target.value)} placeholder="e.g. Christmas batch, printed for store" className="rounded-lg" />
                  </div>

                  <div className="bg-surface rounded-xl p-3 text-sm text-text-muted">
                    Generating <strong>{genQty || "0"} × GH₵{genAmount || "0"}</strong> = <strong>GH₵{((parseInt(genQty) || 0) * (parseFloat(genAmount) || 0)).toFixed(2)}</strong> total value
                  </div>

                  <div className="flex gap-3 pt-2">
                    <Button variant="outline" className="flex-1 rounded-xl" onClick={() => setShowGenerate(false)}>Cancel</Button>
                    <Button className="flex-1 rounded-xl" onClick={handleGenerate} disabled={generating}>
                      {generating ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Generating…</> : <><Plus className="w-4 h-4 mr-2" />Generate</>}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 p-3 bg-green-50 rounded-xl border border-green-200">
                    <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />
                    <p className="text-sm font-medium text-green-700">{newlyGenerated.length} gift card{newlyGenerated.length > 1 ? "s" : ""} created successfully!</p>
                  </div>

                  <div className="max-h-[40vh] overflow-y-auto space-y-2 pr-1">
                    {newlyGenerated.map((card) => (
                      <div key={card.id} className="bg-surface rounded-xl p-3 border border-border flex items-center justify-between gap-3">
                        <div>
                          <p className="text-xs font-mono font-bold text-text">{card.code}</p>
                          <p className="text-xs text-text-muted">PIN: <span className="font-mono font-medium">{card.pin}</span> · GH₵{card.amount}</p>
                        </div>
                        <button onClick={() => copyToClipboard(`${card.code} / PIN: ${card.pin}`)}
                          className="p-2 rounded-lg hover:bg-white transition-colors">
                          <Copy className="w-3.5 h-3.5 text-text-muted" />
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-3">
                    <Button variant="outline" className="flex-1 rounded-xl" onClick={() => handlePrint(newlyGenerated)}>
                      <Printer className="w-4 h-4 mr-2" />Print All
                    </Button>
                    <Button className="flex-1 rounded-xl" onClick={() => { setShowGenerate(false); setNewlyGenerated([]); }}>
                      Done
                    </Button>
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-border p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by code, buyer, notes…" className="pl-9 rounded-lg" />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-surface border-0 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-accent">
          <option value="">All Statuses</option>
          <option value="active">Active</option>
          <option value="used">Used</option>
          <option value="expired">Expired</option>
          <option value="voided">Voided</option>
        </select>
        <Button variant="outline" size="icon" className="rounded-lg shrink-0" onClick={() => fetchCards(1)}>
          <RefreshCw className="w-4 h-4" />
        </Button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-border overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-7 h-7 animate-spin text-accent" />
          </div>
        ) : cards.length === 0 ? (
          <div className="text-center py-16">
            <Gift className="w-12 h-12 text-border mx-auto mb-3" />
            <p className="text-text-muted">No gift cards yet. Generate your first batch!</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-border bg-surface">
                <tr>
                  <th className="text-left px-5 py-3.5 font-semibold text-text-muted text-xs uppercase tracking-wide">Code</th>
                  <th className="text-left px-5 py-3.5 font-semibold text-text-muted text-xs uppercase tracking-wide">PIN</th>
                  <th className="text-right px-5 py-3.5 font-semibold text-text-muted text-xs uppercase tracking-wide">Value</th>
                  <th className="text-right px-5 py-3.5 font-semibold text-text-muted text-xs uppercase tracking-wide">Balance</th>
                  <th className="text-center px-5 py-3.5 font-semibold text-text-muted text-xs uppercase tracking-wide">Status</th>
                  <th className="text-left px-5 py-3.5 font-semibold text-text-muted text-xs uppercase tracking-wide">Notes</th>
                  <th className="text-left px-5 py-3.5 font-semibold text-text-muted text-xs uppercase tracking-wide">Expires</th>
                  <th className="px-5 py-3.5" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {cards.map((card) => (
                  <tr key={card.id} className="hover:bg-surface/50 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-text">{card.code}</span>
                        <button onClick={() => copyToClipboard(card.code)} className="opacity-0 group-hover:opacity-100 hover:opacity-100">
                          <Copy className="w-3 h-3 text-text-muted hover:text-accent" />
                        </button>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-xs text-text-muted">
                          {showPins[card.id] ? card.pin : "••••••"}
                        </span>
                        <button onClick={() => setShowPins((p) => ({ ...p, [card.id]: !p[card.id] }))}>
                          {showPins[card.id] ? <EyeOff className="w-3.5 h-3.5 text-text-muted" /> : <Eye className="w-3.5 h-3.5 text-text-muted" />}
                        </button>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-right font-semibold text-text">GH₵{card.amount.toFixed(2)}</td>
                    <td className="px-5 py-4 text-right">
                      <span className={`font-semibold ${card.balance < card.amount ? "text-amber-600" : "text-green-600"}`}>
                        GH₵{card.balance.toFixed(2)}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-center">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${statusColor(card.status)}`}>
                        <StatusIcon status={card.status} />{card.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-xs text-text-muted max-w-[150px] truncate">{card.notes || "—"}</td>
                    <td className="px-5 py-4 text-xs text-text-muted">
                      {card.expiresAt ? new Date(card.expiresAt).toLocaleDateString() : "—"}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1 justify-end">
                        <button onClick={() => handlePrint([card])}
                          className="p-1.5 rounded-lg hover:bg-surface transition-colors" title="Print">
                          <Printer className="w-4 h-4 text-text-muted hover:text-accent" />
                        </button>
                        {card.status === "active" && (
                          <button onClick={() => handleVoid(card.id, card.code)}
                            className="p-1.5 rounded-lg hover:bg-red-50 transition-colors" title="Void">
                            <Trash2 className="w-4 h-4 text-text-muted hover:text-red-600" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-text-muted">Showing {cards.length} of {pagination.total} cards</p>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" className="rounded-lg w-9 h-9"
              disabled={pagination.page === 1} onClick={() => fetchCards(pagination.page - 1)}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-sm text-text px-2">Page {pagination.page} / {pagination.totalPages}</span>
            <Button variant="outline" size="icon" className="rounded-lg w-9 h-9"
              disabled={pagination.page === pagination.totalPages} onClick={() => fetchCards(pagination.page + 1)}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
