"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Search, Handshake, CheckCircle, XCircle, Clock, Eye, MoreHorizontal, ExternalLink,
  User, ShoppingCart, Users, Wallet,
} from "lucide-react";
import { Input } from "@/components/ui/input";

interface Reseller {
  id: string; storeName: string; storeSlug: string; status: string; picture: string;
  phone: string; email: string; nationalIdType: string; nationalIdNumber: string; nationalIdImage: string;
  commissionBalance: number; createdAt: string;
  user: { name: string; email: string };
  _count: { orders: number; clients: number };
}

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700",
  approved: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
};

const STATUS_ICONS: Record<string, React.ReactNode> = {
  pending: <Clock className="w-3.5 h-3.5" />,
  approved: <CheckCircle className="w-3.5 h-3.5" />,
  rejected: <XCircle className="w-3.5 h-3.5" />,
};

export default function ResellersPage() {
  const [resellers, setResellers] = useState<Reseller[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [selectedReseller, setSelectedReseller] = useState<Reseller | null>(null);
  const [updating, setUpdating] = useState(false);

  const fetchResellers = async () => {
    const params = new URLSearchParams();
    if (filter !== "all") params.set("status", filter);
    if (search) params.set("search", search);
    const res = await fetch(`/api/admin/resellers?${params}`);
    const data = await res.json();
    setResellers(data);
    setLoading(false);
  };

  useEffect(() => { fetchResellers(); }, [filter, search]);

  const updateStatus = async (id: string, status: string) => {
    setUpdating(true);
    await fetch(`/api/admin/resellers/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setUpdating(false);
    fetchResellers();
    if (selectedReseller?.id === id) setSelectedReseller({ ...selectedReseller, status });
  };

  const pendingCount = resellers.filter((r) => r.status === "pending").length;

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text flex items-center gap-2">
            <Handshake className="w-6 h-6 text-accent" /> Resellers
            {pendingCount > 0 && (
              <span className="bg-yellow-100 text-yellow-700 text-xs font-bold px-2 py-0.5 rounded-full">
                {pendingCount} pending
              </span>
            )}
          </h1>
          <p className="text-text-muted text-sm">Manage IntactConnect reseller accounts</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search resellers..." className="pl-10" />
        </div>
        <div className="flex gap-2">
          {["all", "pending", "approved", "rejected"].map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors capitalize ${filter === s ? "bg-accent text-white" : "bg-surface text-text-muted hover:bg-border"}`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-16 bg-white rounded-xl animate-pulse" />)}
        </div>
      ) : resellers.length === 0 ? (
        <div className="bg-white rounded-xl border border-border p-12 text-center">
          <Handshake className="w-12 h-12 text-text-muted mx-auto mb-3" />
          <p className="text-text-muted">No resellers found</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-surface/50">
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase">Reseller</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase">Store</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase">Orders</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase">Balance</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {resellers.map((r) => (
                  <tr key={r.id} className="hover:bg-surface/30 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <img src={r.picture} alt="" className="w-9 h-9 rounded-full object-cover border border-border" />
                        <div>
                          <p className="text-sm font-medium text-text">{r.user.name}</p>
                          <p className="text-xs text-text-muted">{r.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-text">{r.storeName}</p>
                      <p className="text-xs text-text-muted">/{r.storeSlug}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full capitalize ${STATUS_COLORS[r.status] || "bg-gray-100 text-gray-700"}`}>
                        {STATUS_ICONS[r.status]} {r.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-text">{r._count.orders}</td>
                    <td className="px-4 py-3 text-sm font-medium text-text">GH₵{r.commissionBalance.toFixed(2)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button onClick={() => setSelectedReseller(r)} className="p-1.5 hover:bg-surface rounded-lg transition-colors" title="View Details">
                          <Eye className="w-4 h-4 text-text-muted" />
                        </button>
                        {r.status === "pending" && (
                          <>
                            <button onClick={() => updateStatus(r.id, "approved")} disabled={updating} className="p-1.5 hover:bg-green-50 rounded-lg transition-colors" title="Approve">
                              <CheckCircle className="w-4 h-4 text-green-600" />
                            </button>
                            <button onClick={() => updateStatus(r.id, "rejected")} disabled={updating} className="p-1.5 hover:bg-red-50 rounded-lg transition-colors" title="Reject">
                              <XCircle className="w-4 h-4 text-red-600" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Reseller Detail Modal */}
      {selectedReseller && (
        <>
          <div className="fixed inset-0 bg-black/50 z-50" onClick={() => setSelectedReseller(null)} />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="fixed inset-4 sm:inset-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:w-[600px] sm:max-h-[80vh] bg-white rounded-2xl shadow-2xl z-50 overflow-y-auto"
          >
            <div className="p-6">
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-4">
                  <img src={selectedReseller.picture} alt="" className="w-14 h-14 rounded-full object-cover border-2 border-border" />
                  <div>
                    <h2 className="text-lg font-bold text-text">{selectedReseller.user.name}</h2>
                    <p className="text-sm text-text-muted">{selectedReseller.storeName}</p>
                    <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full capitalize mt-1 ${STATUS_COLORS[selectedReseller.status]}`}>
                      {STATUS_ICONS[selectedReseller.status]} {selectedReseller.status}
                    </span>
                  </div>
                </div>
                <button onClick={() => setSelectedReseller(null)} className="text-text-muted hover:text-text text-xl">&times;</button>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-surface rounded-lg p-3">
                  <p className="text-xs text-text-muted mb-1">Email</p>
                  <p className="text-sm font-medium text-text">{selectedReseller.email}</p>
                </div>
                <div className="bg-surface rounded-lg p-3">
                  <p className="text-xs text-text-muted mb-1">Phone</p>
                  <p className="text-sm font-medium text-text">{selectedReseller.phone}</p>
                </div>
                <div className="bg-surface rounded-lg p-3">
                  <p className="text-xs text-text-muted mb-1">ID Type</p>
                  <p className="text-sm font-medium text-text capitalize">{selectedReseller.nationalIdType.replace("_", " ")}</p>
                </div>
                <div className="bg-surface rounded-lg p-3">
                  <p className="text-xs text-text-muted mb-1">ID Number</p>
                  <p className="text-sm font-medium text-text">{selectedReseller.nationalIdNumber}</p>
                </div>
              </div>

              {/* ID Image */}
              <div className="mb-6">
                <p className="text-xs text-text-muted mb-2">National ID Image</p>
                <img src={selectedReseller.nationalIdImage} alt="National ID" className="w-full max-h-48 object-contain rounded-lg border border-border bg-surface" />
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-3 mb-6">
                <div className="bg-blue-50 rounded-lg p-3 text-center">
                  <ShoppingCart className="w-5 h-5 text-blue-600 mx-auto mb-1" />
                  <p className="text-lg font-bold text-blue-700">{selectedReseller._count.orders}</p>
                  <p className="text-xs text-blue-600">Orders</p>
                </div>
                <div className="bg-purple-50 rounded-lg p-3 text-center">
                  <Users className="w-5 h-5 text-purple-600 mx-auto mb-1" />
                  <p className="text-lg font-bold text-purple-700">{selectedReseller._count.clients}</p>
                  <p className="text-xs text-purple-600">Clients</p>
                </div>
                <div className="bg-green-50 rounded-lg p-3 text-center">
                  <Wallet className="w-5 h-5 text-green-600 mx-auto mb-1" />
                  <p className="text-lg font-bold text-green-700">GH₵{selectedReseller.commissionBalance.toFixed(2)}</p>
                  <p className="text-xs text-green-600">Balance</p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                {selectedReseller.status === "pending" && (
                  <>
                    <button
                      onClick={() => { updateStatus(selectedReseller.id, "approved"); setSelectedReseller({ ...selectedReseller, status: "approved" }); }}
                      disabled={updating}
                      className="flex-1 bg-green-600 text-white py-2.5 rounded-lg font-medium text-sm hover:bg-green-700 transition-colors disabled:opacity-50"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => { updateStatus(selectedReseller.id, "rejected"); setSelectedReseller({ ...selectedReseller, status: "rejected" }); }}
                      disabled={updating}
                      className="flex-1 bg-red-600 text-white py-2.5 rounded-lg font-medium text-sm hover:bg-red-700 transition-colors disabled:opacity-50"
                    >
                      Reject
                    </button>
                  </>
                )}
                {selectedReseller.status === "approved" && (
                  <a
                    href={`${process.env.NEXT_PUBLIC_INTACTCONNECT_URL || "http://localhost:3001"}/store/${selectedReseller.storeSlug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 bg-accent text-white py-2.5 rounded-lg font-medium text-sm text-center hover:bg-accent/90 transition-colors flex items-center justify-center gap-2"
                  >
                    <ExternalLink className="w-4 h-4" /> View Store
                  </a>
                )}
                {selectedReseller.status === "rejected" && (
                  <button
                    onClick={() => { updateStatus(selectedReseller.id, "approved"); setSelectedReseller({ ...selectedReseller, status: "approved" }); }}
                    disabled={updating}
                    className="flex-1 bg-green-600 text-white py-2.5 rounded-lg font-medium text-sm hover:bg-green-700 transition-colors disabled:opacity-50"
                  >
                    Re-approve
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </div>
  );
}
