"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Package,
  ShoppingCart,
  Users,
  DollarSign,
  ArrowUpRight,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Truck,
} from "lucide-react";
import { formatPrice } from "@/lib/utils";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = any;

const statusColors: Record<string, string> = {
  completed: "bg-success/10 text-success",
  confirmed: "bg-info/10 text-info",
  processing: "bg-info/10 text-info",
  pending: "bg-warning/10 text-warning",
  cancelled: "bg-accent/10 text-accent",
  shipped: "bg-purple-100 text-purple-700",
  delivered: "bg-success/10 text-success",
};

const statusIcons: Record<string, React.ReactNode> = {
  completed: <CheckCircle className="w-4 h-4" />,
  confirmed: <CheckCircle className="w-4 h-4" />,
  processing: <Clock className="w-4 h-4" />,
  pending: <AlertTriangle className="w-4 h-4" />,
  cancelled: <XCircle className="w-4 h-4" />,
  shipped: <Truck className="w-4 h-4" />,
  delivered: <CheckCircle className="w-4 h-4" />,
};

export default function AdminDashboard() {
  const [stats, setStats] = useState({ totalRevenue: 0, totalOrders: 0, totalProducts: 0, totalCustomers: 0 });
  const [recentOrders, setRecentOrders] = useState<Any[]>([]);

  useEffect(() => {
    fetch("/api/admin/dashboard").then(r => r.json()).then(d => {
      if (d.stats) setStats(d.stats);
      if (d.recentOrders) setRecentOrders(d.recentOrders);
    }).catch(() => {});
  }, []);

  const statCards = [
    { label: "Total Revenue", value: formatPrice(stats.totalRevenue), icon: DollarSign, color: "bg-success/10 text-success" },
    { label: "Total Orders", value: stats.totalOrders.toLocaleString(), icon: ShoppingCart, color: "bg-info/10 text-info" },
    { label: "Total Products", value: stats.totalProducts.toLocaleString(), icon: Package, color: "bg-accent/10 text-accent" },
    { label: "Total Customers", value: stats.totalCustomers.toLocaleString(), icon: Users, color: "bg-gold/10 text-gold" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text">Dashboard</h1>
        <p className="text-text-muted text-sm mt-1">Welcome back! Here&apos;s what&apos;s happening with your store.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, i) => (
          <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="bg-white rounded-2xl border border-border p-5">
            <div className="flex items-center justify-between mb-4">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${stat.color}`}>
                <stat.icon className="w-5 h-5" />
              </div>
            </div>
            <p className="text-2xl font-bold text-text">{stat.value}</p>
            <p className="text-xs text-text-muted mt-1">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="lg:col-span-3 bg-white rounded-2xl border border-border">
          <div className="p-5 border-b border-border flex items-center justify-between">
            <h2 className="font-bold text-text">Recent Orders</h2>
            <Link href="/admin/orders" className="text-sm text-accent hover:underline flex items-center gap-1">
              View All <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-xs text-text-muted uppercase tracking-wider">
                  <th className="px-5 py-3">Order ID</th>
                  <th className="px-5 py-3">Customer</th>
                  <th className="px-5 py-3">Total</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {recentOrders.map((order: Any) => (
                  <tr key={order.id} className="hover:bg-surface/50 transition-colors">
                    <td className="px-5 py-3.5 text-sm font-mono font-medium text-text">{order.orderNumber}</td>
                    <td className="px-5 py-3.5 text-sm text-text">{order.user?.name || "Guest"}</td>
                    <td className="px-5 py-3.5 text-sm font-semibold text-text">{formatPrice(order.total)}</td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${statusColors[order.status] || "bg-gray-100 text-gray-600"}`}>
                        {statusIcons[order.status]}
                        {order.status?.charAt(0).toUpperCase() + order.status?.slice(1)}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-text-muted">{new Date(order.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
                {recentOrders.length === 0 && <tr><td colSpan={5} className="px-5 py-8 text-center text-text-muted">No orders yet</td></tr>}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
