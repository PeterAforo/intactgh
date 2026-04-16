"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Shield,
  ChevronLeft,
  ChevronRight,
  Filter,
  User,
  Edit,
  Trash2,
  Plus,
  Eye,
  LogIn,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import toast from "react-hot-toast";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = any;

const actionIcons: Record<string, React.ReactNode> = {
  create: <Plus className="w-3.5 h-3.5 text-green-600" />,
  update: <Edit className="w-3.5 h-3.5 text-blue-600" />,
  delete: <Trash2 className="w-3.5 h-3.5 text-red-600" />,
  login: <LogIn className="w-3.5 h-3.5 text-purple-600" />,
  view: <Eye className="w-3.5 h-3.5 text-gray-600" />,
};

const actionColors: Record<string, string> = {
  create: "bg-green-50 text-green-700 border-green-200",
  update: "bg-blue-50 text-blue-700 border-blue-200",
  delete: "bg-red-50 text-red-700 border-red-200",
  login: "bg-purple-50 text-purple-700 border-purple-200",
};

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<Any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [entityFilter, setEntityFilter] = useState("");
  const [actionFilter, setActionFilter] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "30" });
      if (entityFilter) params.set("entity", entityFilter);
      if (actionFilter) params.set("action", actionFilter);
      const res = await fetch(`/api/admin/audit-logs?${params}`);
      const data = await res.json();
      if (data.logs) {
        setLogs(data.logs);
        setTotal(data.total);
        setTotalPages(data.totalPages);
      }
    } catch {
      toast.error("Failed to load audit logs");
    } finally {
      setLoading(false);
    }
  }, [page, entityFilter, actionFilter]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  const formatDetails = (details: string | null) => {
    if (!details) return null;
    try {
      const parsed = JSON.parse(details);
      return Object.entries(parsed)
        .map(([key, val]) => {
          if (typeof val === "object" && val !== null) {
            return `${key}: ${JSON.stringify(val)}`;
          }
          return `${key}: ${val}`;
        })
        .join(" · ");
    } catch {
      return details;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text flex items-center gap-2">
            <Shield className="w-6 h-6 text-accent" />
            Audit Trail
          </h1>
          <p className="text-text-muted text-sm mt-1">Track all admin and staff activities ({total} entries)</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-border p-4 flex flex-wrap gap-3 items-center">
        <Filter className="w-4 h-4 text-text-muted" />
        <select
          value={entityFilter}
          onChange={(e) => { setEntityFilter(e.target.value); setPage(1); }}
          className="bg-surface border-0 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-accent"
        >
          <option value="">All Entities</option>
          <option value="order">Orders</option>
          <option value="product">Products</option>
          <option value="promotion">Promotions</option>
          <option value="user">Users</option>
          <option value="category">Categories</option>
          <option value="brand">Brands</option>
          <option value="page">Pages</option>
          <option value="news">News</option>
          <option value="hero-slide">Hero Slides</option>
          <option value="banner">Banners</option>
          <option value="setting">Settings</option>
        </select>
        <select
          value={actionFilter}
          onChange={(e) => { setActionFilter(e.target.value); setPage(1); }}
          className="bg-surface border-0 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-accent"
        >
          <option value="">All Actions</option>
          <option value="create">Create</option>
          <option value="update">Update</option>
          <option value="delete">Delete</option>
          <option value="login">Login</option>
        </select>
      </div>

      {/* Logs Table */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl border border-border overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-6 h-6 border-3 border-accent border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-xs text-text-muted uppercase tracking-wider border-b border-border">
                  <th className="px-5 py-4">Timestamp</th>
                  <th className="px-5 py-4">User</th>
                  <th className="px-5 py-4">Action</th>
                  <th className="px-5 py-4">Entity</th>
                  <th className="px-5 py-4">Details</th>
                  <th className="px-5 py-4">IP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {logs.map((log: Any) => (
                  <tr key={log.id} className="hover:bg-surface/50 transition-colors">
                    <td className="px-5 py-3 text-xs text-text-muted whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-accent/10 rounded-full flex items-center justify-center">
                          <User className="w-3 h-3 text-accent" />
                        </div>
                        <div>
                          <p className="text-xs font-medium text-text">{log.user?.name || "Unknown"}</p>
                          <p className="text-[10px] text-text-muted">{log.user?.role}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${actionColors[log.action] || "bg-gray-50 text-gray-700 border-gray-200"}`}>
                        {actionIcons[log.action] || null}
                        {log.action}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <Badge variant="outline" className="text-xs capitalize">{log.entity}</Badge>
                      {log.entityId && <p className="text-[10px] text-text-muted font-mono mt-0.5">{log.entityId.slice(0, 12)}...</p>}
                    </td>
                    <td className="px-5 py-3 max-w-[300px]">
                      {log.details ? (
                        <p className="text-xs text-text-muted truncate" title={formatDetails(log.details) || ""}>
                          {formatDetails(log.details)}
                        </p>
                      ) : (
                        <span className="text-xs text-text-muted">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-xs text-text-muted font-mono">{log.ipAddress || "—"}</td>
                  </tr>
                ))}
                {logs.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-5 py-16 text-center text-text-muted">
                      <Shield className="w-8 h-8 mx-auto mb-2 opacity-30" />
                      <p>No audit logs found</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-border">
            <p className="text-xs text-text-muted">
              Page {page} of {totalPages} ({total} entries)
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page <= 1}
                className="rounded-lg"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page >= totalPages}
                className="rounded-lg"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
