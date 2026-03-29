"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Package, ShoppingCart, Users, DollarSign, ArrowUpRight,
  Clock, CheckCircle, XCircle, AlertTriangle, Truck,
  TrendingUp, TrendingDown, Minus, AlertCircle,
  Sparkles, Brain, RefreshCw,
} from "lucide-react";
import { formatPrice } from "@/lib/utils";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = any;

const statusColors: Record<string, string> = {
  completed: "bg-green-100 text-green-700",
  confirmed: "bg-blue-100 text-blue-700",
  processing: "bg-blue-100 text-blue-700",
  pending: "bg-yellow-100 text-yellow-700",
  cancelled: "bg-red-100 text-red-600",
  shipped: "bg-purple-100 text-purple-700",
  delivered: "bg-green-100 text-green-700",
};
const statusIcons: Record<string, React.ReactNode> = {
  completed: <CheckCircle className="w-3.5 h-3.5" />,
  confirmed: <CheckCircle className="w-3.5 h-3.5" />,
  processing: <Clock className="w-3.5 h-3.5" />,
  pending: <AlertTriangle className="w-3.5 h-3.5" />,
  cancelled: <XCircle className="w-3.5 h-3.5" />,
  shipped: <Truck className="w-3.5 h-3.5" />,
  delivered: <CheckCircle className="w-3.5 h-3.5" />,
};

// ── Mini SVG Bar Chart ────────────────────────────────────────────────────────
function BarChart({ data, color = "#0052cc", height = 80 }: { data: number[]; color?: string; height?: number }) {
  const max = Math.max(...data, 1);
  const W = 300; const barW = Math.floor(W / data.length) - 4;
  return (
    <svg viewBox={`0 0 ${W} ${height}`} className="w-full" preserveAspectRatio="none">
      {data.map((v, i) => {
        const bh = Math.max(2, (v / max) * (height - 8));
        const x = i * (W / data.length) + 2;
        return (
          <g key={i}>
            <rect x={x} y={height - bh} width={barW} height={bh} rx="3" fill={color} opacity="0.15" />
            <rect x={x} y={height - bh} width={barW} height={Math.min(bh, 4)} rx="3" fill={color} />
          </g>
        );
      })}
    </svg>
  );
}

// ── SVG Sparkline ─────────────────────────────────────────────────────────────
function Sparkline({ data, color = "#0052cc" }: { data: number[]; color?: string }) {
  if (data.length < 2) return null;
  const max = Math.max(...data, 1); const min = 0;
  const W = 120; const H = 40;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * W;
    const y = H - ((v - min) / (max - min)) * H;
    return `${x},${y}`;
  }).join(" ");
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-[80px] h-[30px]">
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ── AI Insight Generator ──────────────────────────────────────────────────────
function generateInsights(data: Any): string[] {
  const insights: string[] = [];
  const { stats, salesTrend, lowStockProducts, statusBreakdown, revenueChange, topProducts } = data;

  if (revenueChange !== null && revenueChange !== undefined) {
    if (revenueChange > 10) insights.push(`📈 Revenue is up ${revenueChange.toFixed(1)}% vs the previous 7 days — great momentum! Consider running a promotion to maintain growth.`);
    else if (revenueChange < -10) insights.push(`📉 Revenue dropped ${Math.abs(revenueChange).toFixed(1)}% vs last week. Review your top-performing products and consider a flash sale.`);
    else insights.push(`📊 Revenue is stable week-over-week (${revenueChange > 0 ? "+" : ""}${revenueChange.toFixed(1)}%).`);
  }

  const pendingOrders = statusBreakdown?.pending || 0;
  if (pendingOrders > 0) insights.push(`⏳ You have ${pendingOrders} pending order${pendingOrders > 1 ? "s" : ""} waiting to be confirmed. Process them to improve customer satisfaction.`);

  const outOfStock = lowStockProducts?.filter((p: Any) => p.stock === 0).length || 0;
  const criticalStock = lowStockProducts?.filter((p: Any) => p.stock > 0 && p.stock <= 3).length || 0;
  if (outOfStock > 0) insights.push(`🚨 ${outOfStock} product${outOfStock > 1 ? "s are" : " is"} out of stock — restock urgently to avoid lost sales.`);
  if (criticalStock > 0) insights.push(`⚠️ ${criticalStock} product${criticalStock > 1 ? "s have" : " has"} 3 or fewer units left. Place restock orders soon.`);

  const maxDay = salesTrend?.reduce((best: Any, d: Any) => d.revenue > (best?.revenue ?? 0) ? d : best, null);
  if (maxDay?.revenue > 0) {
    const dayName = new Date(maxDay.date).toLocaleDateString("en-US", { weekday: "long" });
    insights.push(`💡 Your best sales day this week was ${dayName} (${formatPrice(maxDay.revenue)}). Consider scheduling promotions on this day.`);
  }

  if (topProducts?.length > 0 && topProducts[0]?.name) {
    insights.push(`🏆 "${topProducts[0].name}" is your best-selling product. Ensure it's always in stock and featured on the homepage.`);
  }

  const convRate = stats?.totalOrders > 0 ? ((stats.totalOrders / Math.max(stats.totalCustomers, 1)) * 100).toFixed(1) : null;
  if (convRate) insights.push(`👥 You have ${stats.totalCustomers} registered customers and ${stats.totalOrders} total orders (~${convRate}% order rate). Run email campaigns to re-engage inactive customers.`);

  if (insights.length === 0) insights.push("📦 Add products, set up categories, and start receiving orders to see personalised AI insights here.");
  return insights.slice(0, 5);
}

export default function AdminDashboard() {
  const [data, setData] = useState<Any>({});
  const [loading, setLoading] = useState(true);
  const [aiExpanded, setAiExpanded] = useState(true);

  const fetchData = () => {
    setLoading(true);
    fetch("/api/admin/dashboard").then(r => r.json()).then(d => setData(d)).catch(() => {}).finally(() => setLoading(false));
  };
  useEffect(fetchData, []);

  const stats = data.stats ?? { totalRevenue: 0, totalOrders: 0, totalProducts: 0, totalCustomers: 0 };
  const salesTrend: Any[] = data.salesTrend ?? [];
  const ordersTrend: Any[] = data.ordersTrend ?? [];
  const recentOrders: Any[] = data.recentOrders ?? [];
  const topProducts: Any[] = data.topProducts ?? [];
  const lowStockProducts: Any[] = data.lowStockProducts ?? [];
  const statusBreakdown: Record<string, number> = data.statusBreakdown ?? {};
  const revenueChange: number | null = data.revenueChange ?? null;

  const revenueSparkline = salesTrend.map((d: Any) => d.revenue);
  const ordersSparkline = ordersTrend.map((d: Any) => d.count);

  const statCards = [
    {
      label: "Total Revenue", value: formatPrice(stats.totalRevenue),
      icon: DollarSign, bg: "bg-green-50", iconColor: "text-green-600",
      change: revenueChange, sparkline: revenueSparkline, sparkColor: "#16a34a",
    },
    {
      label: "Total Orders", value: stats.totalOrders.toLocaleString(),
      icon: ShoppingCart, bg: "bg-blue-50", iconColor: "text-blue-600",
      change: null, sparkline: ordersSparkline, sparkColor: "#2563eb",
    },
    {
      label: "Products Listed", value: stats.totalProducts.toLocaleString(),
      icon: Package, bg: "bg-purple-50", iconColor: "text-purple-600",
      change: null, sparkline: null, sparkColor: "#7c3aed",
      sub: data.newProductsThisMonth > 0 ? `+${data.newProductsThisMonth} this month` : null,
    },
    {
      label: "Customers", value: stats.totalCustomers.toLocaleString(),
      icon: Users, bg: "bg-orange-50", iconColor: "text-orange-500",
      change: null, sparkline: null, sparkColor: "#ea580c",
    },
  ];

  const insights = generateInsights(data);

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text">Dashboard</h1>
          <p className="text-text-muted text-sm mt-0.5">Welcome back! Here&apos;s what&apos;s happening with your store.</p>
        </div>
        <button onClick={fetchData} className="p-2 hover:bg-surface rounded-lg transition-colors text-text-muted hover:text-text" title="Refresh">
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* ── Stat Cards ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
            className="bg-white rounded-2xl border border-border p-5 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${s.bg}`}>
                <s.icon className={`w-5 h-5 ${s.iconColor}`} />
              </div>
              {s.sparkline && s.sparkline.length > 1 && <Sparkline data={s.sparkline} color={s.sparkColor} />}
            </div>
            <div>
              <p className="text-2xl font-bold text-text">{s.value}</p>
              <div className="flex items-center gap-2 mt-0.5">
                <p className="text-xs text-text-muted">{s.label}</p>
                {s.change !== null && s.change !== undefined && (
                  <span className={`text-[11px] font-medium flex items-center gap-0.5 ${s.change > 0 ? "text-green-600" : s.change < 0 ? "text-red-500" : "text-gray-400"}`}>
                    {s.change > 0 ? <TrendingUp className="w-3 h-3" /> : s.change < 0 ? <TrendingDown className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
                    {s.change > 0 ? "+" : ""}{s.change.toFixed(1)}%
                  </span>
                )}
                {s.sub && <span className="text-[11px] text-green-600 font-medium">{s.sub}</span>}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* ── AI Insights ────────────────────────────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
        className="bg-gradient-to-br from-[#0041a8] to-[#0052cc] rounded-2xl text-white overflow-hidden">
        <button onClick={() => setAiExpanded(!aiExpanded)} className="w-full p-5 flex items-center gap-3 text-left">
          <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center shrink-0">
            <Brain className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <p className="font-bold text-sm">AI Insights & Business Advisor</p>
            <p className="text-white/70 text-xs mt-0.5">Powered by your live store data</p>
          </div>
          <Sparkles className="w-4 h-4 text-white/60 shrink-0" />
        </button>
        {aiExpanded && (
          <div className="px-5 pb-5 space-y-2.5">
            {insights.map((insight, i) => (
              <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}
                className="bg-white/10 rounded-xl px-4 py-3 text-sm leading-relaxed text-white/90">
                {insight}
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>

      {/* ── Sales Trend + Orders Trend ──────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Sales Trend */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
          className="lg:col-span-2 bg-white rounded-2xl border border-border p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-bold text-text">Sales Trend</h2>
              <p className="text-xs text-text-muted mt-0.5">Revenue — last 7 days</p>
            </div>
            {revenueChange !== null && (
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1 ${revenueChange >= 0 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}>
                {revenueChange >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {revenueChange >= 0 ? "+" : ""}{revenueChange.toFixed(1)}% vs prev week
              </span>
            )}
          </div>
          <div className="mb-3">
            <BarChart data={salesTrend.map((d: Any) => d.revenue)} color="#0052cc" height={96} />
          </div>
          <div className="grid grid-cols-7 gap-0.5 mt-1">
            {salesTrend.map((d: Any) => (
              <div key={d.date} className="text-center">
                <p className="text-[10px] text-text-muted">{new Date(d.date).toLocaleDateString("en-US", { weekday: "short" })}</p>
                <p className="text-[9px] text-text-muted/70">{d.revenue > 0 ? formatPrice(d.revenue).replace("GH₵", "₵") : "—"}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Order Status Breakdown */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          className="bg-white rounded-2xl border border-border p-5">
          <h2 className="font-bold text-text mb-1">Order Status</h2>
          <p className="text-xs text-text-muted mb-4">Breakdown of all orders</p>
          <div className="space-y-3">
            {[
              { key: "pending", label: "Pending", color: "bg-yellow-400" },
              { key: "confirmed", label: "Confirmed", color: "bg-blue-500" },
              { key: "processing", label: "Processing", color: "bg-indigo-500" },
              { key: "shipped", label: "Shipped", color: "bg-purple-500" },
              { key: "delivered", label: "Delivered", color: "bg-green-500" },
              { key: "cancelled", label: "Cancelled", color: "bg-red-400" },
            ].map(({ key, label, color }) => {
              const count = statusBreakdown[key] || 0;
              const total = Object.values(statusBreakdown).reduce((a, b) => a + b, 0) || 1;
              const pct = Math.round((count / total) * 100);
              return (
                <div key={key}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-text">{label}</span>
                    <span className="text-xs font-semibold text-text-muted">{count}</span>
                  </div>
                  <div className="h-1.5 bg-surface rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      </div>

      {/* ── Orders Volume Chart ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.42 }}
          className="bg-white rounded-2xl border border-border p-5">
          <div className="mb-4">
            <h2 className="font-bold text-text">Order Volume</h2>
            <p className="text-xs text-text-muted mt-0.5">Number of orders — last 7 days</p>
          </div>
          <BarChart data={ordersTrend.map((d: Any) => d.count)} color="#7c3aed" height={80} />
          <div className="grid grid-cols-7 gap-0.5 mt-2">
            {ordersTrend.map((d: Any) => (
              <div key={d.date} className="text-center">
                <p className="text-[10px] text-text-muted">{new Date(d.date).toLocaleDateString("en-US", { weekday: "short" })}</p>
                <p className="text-[11px] font-semibold text-purple-600">{d.count || "—"}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Top Products */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}
          className="bg-white rounded-2xl border border-border p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-bold text-text">Top Products</h2>
              <p className="text-xs text-text-muted mt-0.5">By units sold (all time)</p>
            </div>
            <Link href="/admin/products" className="text-xs text-accent hover:underline flex items-center gap-1">View all <ArrowUpRight className="w-3 h-3" /></Link>
          </div>
          {topProducts.length === 0 ? (
            <p className="text-sm text-text-muted text-center py-6">No sales data yet</p>
          ) : (
            <div className="space-y-3">
              {topProducts.slice(0, 5).map((p: Any, i: number) => (
                <div key={p.id ?? i} className="flex items-center gap-3">
                  <span className="text-xs font-bold text-text-muted w-4 shrink-0">{i + 1}</span>
                  <div className="w-9 h-9 rounded-lg overflow-hidden bg-surface shrink-0">
                    {p.images?.[0]?.url ? <Image src={p.images[0].url} alt={p.name ?? ""} width={36} height={36} className="object-cover w-full h-full" /> : <div className="w-full h-full flex items-center justify-center"><Package className="w-4 h-4 text-text-muted" /></div>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text truncate">{p.name ?? "Unknown"}</p>
                    <p className="text-xs text-text-muted">{formatPrice(p.price ?? 0)}</p>
                  </div>
                  <span className="text-xs font-semibold text-accent shrink-0">{p.sold} sold</span>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      {/* ── Low Inventory + Recent Orders ──────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Low Inventory */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.48 }}
          className="bg-white rounded-2xl border border-border p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-red-50 rounded-xl flex items-center justify-center">
                <AlertCircle className="w-4 h-4 text-red-500" />
              </div>
              <div>
                <h2 className="font-bold text-text text-sm">Inventory Alert</h2>
                <p className="text-xs text-text-muted">≤ 10 units remaining</p>
              </div>
            </div>
            <Link href="/admin/products" className="text-xs text-accent hover:underline">Manage</Link>
          </div>
          {lowStockProducts.length === 0 ? (
            <div className="text-center py-6">
              <CheckCircle className="w-8 h-8 text-green-400 mx-auto mb-2" />
              <p className="text-sm text-green-600 font-medium">All stocked up!</p>
              <p className="text-xs text-text-muted">No low inventory items</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {lowStockProducts.map((p: Any) => (
                <div key={p.id} className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg overflow-hidden bg-surface shrink-0">
                    {p.images?.[0]?.url ? <Image src={p.images[0].url} alt={p.name} width={32} height={32} className="object-cover w-full h-full" /> : <div className="w-full h-full flex items-center justify-center"><Package className="w-3 h-3 text-text-muted" /></div>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-text truncate">{p.name}</p>
                    <p className="text-[10px] text-text-muted font-mono">{p.sku}</p>
                  </div>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full shrink-0 ${p.stock === 0 ? "bg-red-100 text-red-600" : p.stock <= 3 ? "bg-orange-100 text-orange-600" : "bg-yellow-100 text-yellow-700"}`}>
                    {p.stock === 0 ? "Out" : `${p.stock} left`}
                  </span>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Recent Orders */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
          className="lg:col-span-2 bg-white rounded-2xl border border-border">
          <div className="p-5 border-b border-border flex items-center justify-between">
            <h2 className="font-bold text-text">Recent Orders</h2>
            <Link href="/admin/orders" className="text-sm text-accent hover:underline flex items-center gap-1">
              View All <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-xs text-text-muted uppercase tracking-wider bg-surface/50">
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
                    <td className="px-5 py-3 text-xs font-mono font-medium text-text">{order.orderNumber}</td>
                    <td className="px-5 py-3 text-sm text-text">{order.user?.name || "Guest"}</td>
                    <td className="px-5 py-3 text-sm font-semibold text-text">{formatPrice(order.total)}</td>
                    <td className="px-5 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[order.status] || "bg-gray-100 text-gray-600"}`}>
                        {statusIcons[order.status]}
                        {order.status?.charAt(0).toUpperCase() + order.status?.slice(1)}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-xs text-text-muted">{new Date(order.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
                {recentOrders.length === 0 && <tr><td colSpan={5} className="px-5 py-8 text-center text-text-muted text-sm">No orders yet</td></tr>}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
