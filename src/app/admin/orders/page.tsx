"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Search,
  Eye,
  CheckCircle,
  Clock,
  AlertTriangle,
  XCircle,
  Truck,
  X,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/utils";
import toast from "react-hot-toast";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = any;

const statusConfig: Record<string, { color: string; icon: React.ReactNode }> = {
  completed: { color: "bg-success/10 text-success", icon: <CheckCircle className="w-3.5 h-3.5" /> },
  confirmed: { color: "bg-info/10 text-info", icon: <CheckCircle className="w-3.5 h-3.5" /> },
  processing: { color: "bg-info/10 text-info", icon: <Clock className="w-3.5 h-3.5" /> },
  pending: { color: "bg-warning/10 text-warning", icon: <AlertTriangle className="w-3.5 h-3.5" /> },
  cancelled: { color: "bg-accent/10 text-accent", icon: <XCircle className="w-3.5 h-3.5" /> },
  shipped: { color: "bg-purple-100 text-purple-700", icon: <Truck className="w-3.5 h-3.5" /> },
  delivered: { color: "bg-success/10 text-success", icon: <CheckCircle className="w-3.5 h-3.5" /> },
};

export default function AdminOrdersPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [orders, setOrders] = useState<Any[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Any>(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const fetchOrders = useCallback(() => {
    fetch("/api/admin/orders").then(r => r.json()).then(d => {
      if (d.orders) setOrders(d.orders);
    }).catch(() => toast.error("Failed to load orders"));
  }, []);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const filtered = orders.filter((o: Any) => {
    const matchesSearch = !search || o.orderNumber?.toLowerCase().includes(search.toLowerCase()) || o.user?.name?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = !statusFilter || o.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const openDetail = async (orderId: string) => {
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`);
      const d = await res.json();
      if (d.order) setSelectedOrder(d.order);
    } catch { toast.error("Failed to load order details"); }
  };

  const updateOrderStatus = async (status: string) => {
    if (!selectedOrder) return;
    setUpdatingStatus(true);
    try {
      const res = await fetch(`/api/admin/orders/${selectedOrder.id}`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("Failed");
      toast.success(`Order status updated to ${status}`);
      setSelectedOrder({ ...selectedOrder, status });
      fetchOrders();
    } catch { toast.error("Failed to update status"); }
    finally { setUpdatingStatus(false); }
  };

  const updatePaymentStatus = async (paymentStatus: string) => {
    if (!selectedOrder) return;
    setUpdatingStatus(true);
    try {
      const res = await fetch(`/api/admin/orders/${selectedOrder.id}`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentStatus }),
      });
      if (!res.ok) throw new Error("Failed");
      toast.success(`Payment status updated to ${paymentStatus}`);
      setSelectedOrder({ ...selectedOrder, paymentStatus });
      fetchOrders();
    } catch { toast.error("Failed to update payment status"); }
    finally { setUpdatingStatus(false); }
  };

  const statusCounts = orders.reduce((acc: Record<string, number>, o: Any) => {
    acc[o.status] = (acc[o.status] || 0) + 1; return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text">Orders</h1>
          <p className="text-text-muted text-sm mt-1">Manage and track customer orders ({orders.length} total)</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: "All", count: orders.length, active: !statusFilter },
          { label: "Pending", count: statusCounts.pending || 0, active: statusFilter === "pending" },
          { label: "Processing", count: statusCounts.processing || 0, active: statusFilter === "processing" },
          { label: "Shipped", count: statusCounts.shipped || 0, active: statusFilter === "shipped" },
          { label: "Completed", count: statusCounts.completed || 0, active: statusFilter === "completed" },
        ].map((tab) => (
          <button key={tab.label} onClick={() => setStatusFilter(tab.label === "All" ? "" : tab.label.toLowerCase())} className={`p-3 rounded-xl text-center transition-all ${tab.active ? "bg-accent text-white shadow-md" : "bg-white border border-border hover:border-accent/30"}`}>
            <p className="text-xl font-bold">{tab.count}</p>
            <p className="text-xs mt-0.5 opacity-70">{tab.label}</p>
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-border p-4 flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <Input placeholder="Search by order ID or customer..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10 rounded-lg bg-surface border-0" />
        </div>
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-xs text-text-muted uppercase tracking-wider border-b border-border">
                <th className="px-5 py-4">Order ID</th>
                <th className="px-5 py-4">Customer</th>
                <th className="px-5 py-4">Items</th>
                <th className="px-5 py-4">Total</th>
                <th className="px-5 py-4">Payment</th>
                <th className="px-5 py-4">Status</th>
                <th className="px-5 py-4">Date</th>
                <th className="px-5 py-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((order: Any) => (
                <tr key={order.id} className="hover:bg-surface/50 transition-colors">
                  <td className="px-5 py-3.5 text-sm font-mono font-medium text-text">{order.orderNumber}</td>
                  <td className="px-5 py-3.5">
                    <div>
                      <p className="text-sm font-medium text-text">{order.user?.name || "Guest"}</p>
                      <p className="text-xs text-text-muted">{order.user?.email}</p>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-sm text-text">{order._count?.items ?? order.items?.length ?? 0}</td>
                  <td className="px-5 py-3.5 text-sm font-semibold text-text">{formatPrice(order.total)}</td>
                  <td className="px-5 py-3.5">
                    <Badge variant={order.paymentStatus === "paid" ? "success" : order.paymentStatus === "refunded" ? "outline" : "warning"} className="text-xs capitalize">{order.paymentStatus}</Badge>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${statusConfig[order.status]?.color || "bg-gray-100 text-gray-600"}`}>
                      {statusConfig[order.status]?.icon}
                      {order.status?.charAt(0).toUpperCase() + order.status?.slice(1)}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-sm text-text-muted">{new Date(order.createdAt).toLocaleDateString()}</td>
                  <td className="px-5 py-3.5">
                    <button onClick={() => openDetail(order.id)} className="p-1.5 hover:bg-surface rounded-lg transition-colors text-text-muted hover:text-accent"><Eye className="w-4 h-4" /></button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan={8} className="px-5 py-10 text-center text-text-muted">No orders found</td></tr>}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setSelectedOrder(null)}>
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} onClick={(e) => e.stopPropagation()} className="bg-white rounded-none sm:rounded-2xl max-w-2xl w-full h-full sm:h-auto sm:max-h-[85vh] overflow-y-auto p-4 sm:p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-text">Order {selectedOrder.orderNumber}</h2>
                <p className="text-sm text-text-muted">{new Date(selectedOrder.createdAt).toLocaleString()}</p>
              </div>
              <button onClick={() => setSelectedOrder(null)} className="p-2 hover:bg-surface rounded-lg"><X className="w-5 h-5" /></button>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-surface rounded-xl p-4">
                <p className="text-xs text-text-muted mb-1">Customer</p>
                <p className="text-sm font-medium">{selectedOrder.user?.name || "Guest"}</p>
                <p className="text-xs text-text-muted">{selectedOrder.user?.email}</p>
                {selectedOrder.user?.phone && <p className="text-xs text-text-muted">{selectedOrder.user.phone}</p>}
              </div>
              <div className="bg-surface rounded-xl p-4">
                <p className="text-xs text-text-muted mb-1">Shipping</p>
                <p className="text-sm">{selectedOrder.shippingAddress}</p>
                <p className="text-xs text-text-muted">{selectedOrder.shippingCity}</p>
              </div>
            </div>

            <div className="mb-6">
              <h3 className="font-semibold text-text mb-3">Order Items</h3>
              <div className="space-y-2">
                {selectedOrder.items?.map((item: Any) => (
                  <div key={item.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                    <div>
                      <p className="text-sm font-medium">{item.product?.name || "Product"}</p>
                      {item.variantLabel && <p className="text-xs text-accent">{item.variantLabel}</p>}
                      <p className="text-xs text-text-muted">Qty: {item.quantity}</p>
                    </div>
                    <p className="text-sm font-semibold">{formatPrice(item.price * item.quantity)}</p>
                  </div>
                ))}
              </div>
              <div className="flex justify-between pt-3 mt-2 border-t border-border font-bold">
                <span>Total</span><span>{formatPrice(selectedOrder.total)}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-text block mb-1.5">Order Status</label>
                <select value={selectedOrder.status} onChange={(e) => updateOrderStatus(e.target.value)} disabled={updatingStatus} className="w-full bg-surface border-0 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-accent">
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="processing">Processing</option>
                  <option value="shipped">Shipped</option>
                  <option value="delivered">Delivered</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-text block mb-1.5">Payment Status</label>
                <select value={selectedOrder.paymentStatus} onChange={(e) => updatePaymentStatus(e.target.value)} disabled={updatingStatus} className="w-full bg-surface border-0 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-accent">
                  <option value="pending">Pending</option>
                  <option value="paid">Paid</option>
                  <option value="failed">Failed</option>
                  <option value="refunded">Refunded</option>
                </select>
              </div>
            </div>
            {updatingStatus && <div className="flex items-center gap-2 mt-3 text-sm text-text-muted"><Loader2 className="w-4 h-4 animate-spin" /> Updating...</div>}
          </motion.div>
        </div>
      )}
    </div>
  );
}
