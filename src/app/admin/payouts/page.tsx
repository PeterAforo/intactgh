"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Wallet, CheckCircle, XCircle, Clock, Loader2, MessageSquare } from "lucide-react";
import { Input } from "@/components/ui/input";

interface Payout {
  id: string; amount: number; method: string; accountDetails: string; status: string;
  adminNotes: string | null; requestedAt: string; processedAt: string | null;
  reseller: { storeName: string; user: { name: string; email: string } };
}

const STATUS_COLORS: Record<string, string> = {
  requested: "bg-yellow-100 text-yellow-700",
  paid: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
};

export default function PayoutsPage() {
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [actionId, setActionId] = useState<string | null>(null);
  const [actionType, setActionType] = useState<"paid" | "rejected">("paid");
  const [adminNotes, setAdminNotes] = useState("");
  const [processing, setProcessing] = useState(false);

  const load = () => {
    const params = filter !== "all" ? `?status=${filter}` : "";
    fetch(`/api/admin/payouts${params}`).then(r => r.json()).then(setPayouts).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, [filter]);

  const handleAction = async () => {
    if (!actionId) return;
    setProcessing(true);
    await fetch(`/api/admin/payouts/${actionId}`, {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: actionType, adminNotes: adminNotes || null }),
    });
    setProcessing(false); setActionId(null); setAdminNotes("");
    load();
  };

  const openAction = (id: string, type: "paid" | "rejected") => {
    setActionId(id); setActionType(type); setAdminNotes("");
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text flex items-center gap-2">
            <Wallet className="w-6 h-6 text-accent" /> Payouts
          </h1>
          <p className="text-text-muted text-sm">Review and process reseller payout requests</p>
        </div>
      </div>

      <div className="flex gap-2 mb-6">
        {["all", "requested", "paid", "rejected"].map(s => (
          <button key={s} onClick={() => setFilter(s)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium capitalize ${filter === s ? "bg-accent text-white" : "bg-surface text-text-muted hover:bg-border"}`}>
            {s}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className="h-16 bg-white rounded-xl animate-pulse" />)}</div>
      ) : payouts.length === 0 ? (
        <div className="bg-white rounded-xl border border-border p-12 text-center">
          <Wallet className="w-12 h-12 text-text-muted mx-auto mb-3" />
          <p className="text-text-muted">No payout requests found</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-border overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-surface/50">
                <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase">Reseller</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase">Amount</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase">Method</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase">Account</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase">Date</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {payouts.map(p => (
                <tr key={p.id} className="hover:bg-surface/30">
                  <td className="px-4 py-3">
                    <p className="text-sm font-medium text-text">{p.reseller.user.name}</p>
                    <p className="text-xs text-text-muted">{p.reseller.storeName}</p>
                  </td>
                  <td className="px-4 py-3 text-sm font-bold text-text">GH₵{p.amount.toFixed(2)}</td>
                  <td className="px-4 py-3 text-sm text-text capitalize">{p.method.replace("_", " ")}</td>
                  <td className="px-4 py-3 text-sm text-text-muted max-w-[160px] truncate">{p.accountDetails}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full capitalize ${STATUS_COLORS[p.status] || "bg-gray-100 text-gray-700"}`}>
                      {p.status === "requested" ? <Clock className="w-3 h-3" /> : p.status === "paid" ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                      {p.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-text-muted">{new Date(p.requestedAt).toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    {p.status === "requested" ? (
                      <div className="flex gap-1">
                        <button onClick={() => openAction(p.id, "paid")} className="p-1.5 hover:bg-green-50 rounded-lg" title="Mark Paid">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        </button>
                        <button onClick={() => openAction(p.id, "rejected")} className="p-1.5 hover:bg-red-50 rounded-lg" title="Reject">
                          <XCircle className="w-4 h-4 text-red-600" />
                        </button>
                      </div>
                    ) : (
                      <span className="text-xs text-text-muted">{p.processedAt ? new Date(p.processedAt).toLocaleDateString() : "—"}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Action Modal */}
      {actionId && (
        <>
          <div className="fixed inset-0 bg-black/50 z-50" onClick={() => setActionId(null)} />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-2xl shadow-2xl z-50 p-6 w-[400px]">
            <h3 className="font-bold text-text mb-2">{actionType === "paid" ? "Confirm Payment" : "Reject Payout"}</h3>
            <p className="text-sm text-text-muted mb-4">
              {actionType === "paid" ? "Confirm that this payout has been sent to the reseller." : "Reject this payout request. The amount will be returned to the reseller's balance."}
            </p>
            <div className="mb-4">
              <label className="text-sm font-medium text-text block mb-1 flex items-center gap-1"><MessageSquare className="w-3.5 h-3.5" /> Admin Notes (optional)</label>
              <Input value={adminNotes} onChange={e => setAdminNotes(e.target.value)} placeholder="e.g. Paid via MoMo ref #123" />
            </div>
            <div className="flex gap-2">
              <button onClick={() => setActionId(null)} className="flex-1 py-2.5 rounded-lg border border-border text-sm font-medium hover:bg-surface">Cancel</button>
              <button onClick={handleAction} disabled={processing}
                className={`flex-1 py-2.5 rounded-lg text-white text-sm font-medium disabled:opacity-50 ${actionType === "paid" ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"}`}>
                {processing ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : actionType === "paid" ? "Confirm Paid" : "Reject"}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
