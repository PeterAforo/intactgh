"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  BarChart3,
  Eye,
  Users,
  MousePointerClick,
  Globe,
  Monitor,
  Smartphone,
  Tablet,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  Clock,
  TrendingUp,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = any;

const RANGE_OPTIONS = [
  { value: "24h", label: "Last 24h" },
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
  { value: "90d", label: "Last 90 days" },
];

const DEVICE_ICONS: Record<string, React.ElementType> = {
  desktop: Monitor,
  mobile: Smartphone,
  tablet: Tablet,
};

const COLORS = [
  "bg-accent", "bg-blue-500", "bg-emerald-500", "bg-amber-500",
  "bg-rose-500", "bg-purple-500", "bg-cyan-500", "bg-pink-500",
];

export default function AnalyticsPage() {
  const [data, setData] = useState<Any>(null);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState("7d");

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/analytics?range=${range}`);
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [range]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const summary = data?.summary;
  const maxDayViews = Math.max(...(data?.pageViewsByDay?.map((d: Any) => d.views) || [1]));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-accent" />
            Analytics
          </h1>
          <p className="text-sm text-text-muted mt-1">Monitor your site traffic and visitor behavior</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-surface rounded-lg p-1">
            {RANGE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setRange(opt.value)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                  range === opt.value
                    ? "bg-accent text-white shadow-sm"
                    : "text-text-muted hover:text-text"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <Button
            onClick={fetchAnalytics}
            variant="outline"
            size="sm"
            className="rounded-lg"
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      {loading && !data ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-accent animate-spin" />
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <SummaryCard
              title="Page Views"
              value={summary?.totalPageViews || 0}
              icon={Eye}
              color="text-accent"
              bgColor="bg-accent/10"
            />
            <SummaryCard
              title="Sessions"
              value={summary?.totalSessions || 0}
              icon={MousePointerClick}
              color="text-blue-500"
              bgColor="bg-blue-500/10"
            />
            <SummaryCard
              title="Unique Visitors"
              value={summary?.uniqueVisitors || 0}
              icon={Users}
              color="text-emerald-500"
              bgColor="bg-emerald-500/10"
            />
            <SummaryCard
              title="Pages / Session"
              value={summary?.avgPagesPerSession || 0}
              icon={TrendingUp}
              color="text-amber-500"
              bgColor="bg-amber-500/10"
              isDecimal
            />
          </div>

          {/* Page Views Chart */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl border border-border p-5"
          >
            <h3 className="text-sm font-semibold text-text mb-4 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-accent" />
              Page Views Over Time
            </h3>
            {data?.pageViewsByDay?.length > 0 ? (
              <div className="flex items-end gap-1 h-48">
                {data.pageViewsByDay.map((day: Any, i: number) => (
                  <div key={day.date} className="flex-1 flex flex-col items-center gap-1 group relative">
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-primary text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                      {day.views} views · {day.date}
                    </div>
                    <div
                      className="w-full bg-accent/80 rounded-t-sm hover:bg-accent transition-colors cursor-pointer min-h-[2px]"
                      style={{ height: `${Math.max((day.views / maxDayViews) * 100, 1)}%` }}
                    />
                    {(i === 0 || i === data.pageViewsByDay.length - 1 || data.pageViewsByDay.length <= 14) && (
                      <span className="text-[9px] text-text-muted truncate w-full text-center">
                        {day.date.slice(5)}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-48 flex items-center justify-center text-text-muted text-sm">
                No data yet for this period
              </div>
            )}
          </motion.div>

          {/* Three-column breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Top Pages */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-xl border border-border p-5"
            >
              <h3 className="text-sm font-semibold text-text mb-3 flex items-center gap-2">
                <Globe className="w-4 h-4 text-accent" />
                Top Pages
              </h3>
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {data?.topPages?.length > 0 ? data.topPages.map((page: Any, i: number) => (
                  <div key={page.path} className="flex items-center gap-2 text-sm">
                    <span className="text-xs text-text-muted w-5 shrink-0">{i + 1}.</span>
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-text font-medium text-xs">{page.path}</p>
                      <div className="w-full bg-surface rounded-full h-1.5 mt-1">
                        <div
                          className="bg-accent h-1.5 rounded-full"
                          style={{ width: `${(page.views / (data.topPages[0]?.views || 1)) * 100}%` }}
                        />
                      </div>
                    </div>
                    <span className="text-xs font-semibold text-text-muted shrink-0">{page.views}</span>
                  </div>
                )) : (
                  <p className="text-xs text-text-muted">No data yet</p>
                )}
              </div>
            </motion.div>

            {/* Top Referrers */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="bg-white rounded-xl border border-border p-5"
            >
              <h3 className="text-sm font-semibold text-text mb-3 flex items-center gap-2">
                <ArrowUpRight className="w-4 h-4 text-blue-500" />
                Top Referrers
              </h3>
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {data?.topReferrers?.length > 0 ? data.topReferrers.map((ref: Any, i: number) => {
                  let domain = ref.referrer;
                  try { domain = new URL(ref.referrer).hostname; } catch { /* keep raw */ }
                  return (
                    <div key={ref.referrer} className="flex items-center gap-2 text-sm">
                      <span className="text-xs text-text-muted w-5 shrink-0">{i + 1}.</span>
                      <p className="flex-1 truncate text-text text-xs">{domain}</p>
                      <span className="text-xs font-semibold text-text-muted shrink-0">{ref.sessions}</span>
                    </div>
                  );
                }) : (
                  <p className="text-xs text-text-muted">No referrer data yet</p>
                )}
              </div>
            </motion.div>

            {/* Devices */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-xl border border-border p-5"
            >
              <h3 className="text-sm font-semibold text-text mb-3 flex items-center gap-2">
                <Monitor className="w-4 h-4 text-emerald-500" />
                Devices
              </h3>
              <div className="space-y-3">
                {data?.devices?.length > 0 ? data.devices.map((d: Any) => {
                  const Icon = DEVICE_ICONS[d.device] || Monitor;
                  const total = data.devices.reduce((s: number, x: Any) => s + x.sessions, 0);
                  const pct = total > 0 ? Math.round((d.sessions / total) * 100) : 0;
                  return (
                    <div key={d.device} className="flex items-center gap-3">
                      <Icon className="w-5 h-5 text-text-muted shrink-0" />
                      <div className="flex-1">
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="font-medium text-text capitalize">{d.device}</span>
                          <span className="text-text-muted">{pct}% ({d.sessions})</span>
                        </div>
                        <div className="w-full bg-surface rounded-full h-2">
                          <div className="bg-emerald-500 h-2 rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    </div>
                  );
                }) : (
                  <p className="text-xs text-text-muted">No data yet</p>
                )}
              </div>
            </motion.div>
          </div>

          {/* Two-column: Browsers + OS */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <BreakdownCard
              title="Browsers"
              data={data?.browsers?.map((b: Any) => ({ label: b.browser, count: b.sessions })) || []}
              delay={0.25}
            />
            <BreakdownCard
              title="Operating Systems"
              data={data?.operatingSystems?.map((o: Any) => ({ label: o.os, count: o.sessions })) || []}
              delay={0.3}
            />
          </div>

          {/* Recent Page Views */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="bg-white rounded-xl border border-border p-5"
          >
            <h3 className="text-sm font-semibold text-text mb-3 flex items-center gap-2">
              <Clock className="w-4 h-4 text-text-muted" />
              Recent Page Views
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 px-2 font-semibold text-text-muted">Page</th>
                    <th className="text-left py-2 px-2 font-semibold text-text-muted">Device</th>
                    <th className="text-left py-2 px-2 font-semibold text-text-muted">Browser</th>
                    <th className="text-left py-2 px-2 font-semibold text-text-muted">OS</th>
                    <th className="text-left py-2 px-2 font-semibold text-text-muted">Time</th>
                  </tr>
                </thead>
                <tbody>
                  {data?.recentPageViews?.length > 0 ? data.recentPageViews.map((pv: Any, i: number) => (
                    <tr key={i} className="border-b border-border/50 hover:bg-surface/50">
                      <td className="py-2 px-2 text-text max-w-[200px] truncate">{pv.path}</td>
                      <td className="py-2 px-2 text-text-muted capitalize">{pv.device || "—"}</td>
                      <td className="py-2 px-2 text-text-muted">{pv.browser || "—"}</td>
                      <td className="py-2 px-2 text-text-muted">{pv.os || "—"}</td>
                      <td className="py-2 px-2 text-text-muted whitespace-nowrap">
                        {new Date(pv.time).toLocaleString("en-GB", {
                          day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit",
                        })}
                      </td>
                    </tr>
                  )) : (
                    <tr><td colSpan={5} className="py-8 text-center text-text-muted">No page views yet</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </motion.div>
        </>
      )}
    </div>
  );
}

function SummaryCard({
  title, value, icon: Icon, color, bgColor, isDecimal,
}: {
  title: string; value: number; icon: React.ElementType; color: string; bgColor: string; isDecimal?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl border border-border p-5 flex items-center gap-4"
    >
      <div className={`p-3 rounded-xl ${bgColor}`}>
        <Icon className={`w-5 h-5 ${color}`} />
      </div>
      <div>
        <p className="text-xs text-text-muted font-medium">{title}</p>
        <p className="text-2xl font-bold text-text">
          {isDecimal ? value.toFixed(1) : value.toLocaleString()}
        </p>
      </div>
    </motion.div>
  );
}

function BreakdownCard({
  title, data, delay,
}: {
  title: string; data: { label: string; count: number }[]; delay: number;
}) {
  const total = data.reduce((s, d) => s + d.count, 0);
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="bg-white rounded-xl border border-border p-5"
    >
      <h3 className="text-sm font-semibold text-text mb-3">{title}</h3>
      <div className="space-y-2">
        {data.length > 0 ? data.map((item, i) => {
          const pct = total > 0 ? Math.round((item.count / total) * 100) : 0;
          return (
            <div key={item.label} className="flex items-center gap-3">
              <div className={`w-2.5 h-2.5 rounded-full ${COLORS[i % COLORS.length]}`} />
              <span className="text-xs text-text flex-1">{item.label}</span>
              <span className="text-xs text-text-muted">{pct}%</span>
              <span className="text-xs font-semibold text-text w-10 text-right">{item.count}</span>
            </div>
          );
        }) : (
          <p className="text-xs text-text-muted">No data yet</p>
        )}
      </div>
    </motion.div>
  );
}
