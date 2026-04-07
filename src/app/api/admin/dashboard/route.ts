import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyStaff } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const auth = await verifyStaff(request); if (auth.error) return auth.error;
  try {
    const now = new Date();
    const dayStart = (d: Date) => { const x = new Date(d); x.setHours(0,0,0,0); return x; };
    const today = dayStart(now);
    const last7Start = new Date(today); last7Start.setDate(today.getDate() - 6);
    const prev7Start = new Date(today); prev7Start.setDate(today.getDate() - 13);

    const [
      totalProducts, totalOrders, totalCustomers, revenueAgg,
      prevRevenueAgg, recentOrders, allOrdersLast7, allOrderItems,
      lowStockProducts, orderStatusBreakdown, newProductsThisMonth,
    ] = await Promise.all([
      prisma.product.count(),
      prisma.order.count(),
      prisma.user.count({ where: { role: "customer" } }),
      prisma.order.aggregate({ _sum: { total: true }, where: { paymentStatus: "paid" } }),
      prisma.order.aggregate({ _sum: { total: true }, where: { paymentStatus: "paid", createdAt: { gte: prev7Start, lt: last7Start } } }),
      prisma.order.findMany({
        orderBy: { createdAt: "desc" }, take: 8,
        include: { user: { select: { name: true, email: true } }, _count: { select: { items: true } } },
      }),
      prisma.order.findMany({
        where: { createdAt: { gte: last7Start } },
        select: { total: true, createdAt: true, paymentStatus: true },
      }),
      prisma.orderItem.groupBy({
        by: ["productId"],
        _sum: { quantity: true },
        orderBy: { _sum: { quantity: "desc" } },
        take: 5,
      }),
      prisma.product.findMany({
        where: { stock: { lte: 10 }, status: "active" },
        select: { id: true, name: true, stock: true, sku: true, slug: true, images: { take: 1, select: { url: true } } },
        orderBy: { stock: "asc" },
        take: 8,
      }),
      prisma.order.groupBy({ by: ["status"], _count: { status: true } }),
      prisma.product.count({ where: { createdAt: { gte: new Date(now.getFullYear(), now.getMonth(), 1) } } }),
    ]);

    // Build 7-day sales trend
    const trendMap: Record<string, number> = {};
    for (let i = 0; i < 7; i++) {
      const d = new Date(last7Start); d.setDate(last7Start.getDate() + i);
      trendMap[d.toISOString().slice(0, 10)] = 0;
    }
    allOrdersLast7.forEach((o) => {
      const key = new Date(o.createdAt).toISOString().slice(0, 10);
      if (key in trendMap) trendMap[key] += o.paymentStatus === "paid" ? (o.total ?? 0) : 0;
    });
    const salesTrend = Object.entries(trendMap).map(([date, revenue]) => ({ date, revenue }));

    // Orders per day (volume, not revenue)
    const ordersTrendMap: Record<string, number> = {};
    Object.keys(trendMap).forEach((k) => (ordersTrendMap[k] = 0));
    allOrdersLast7.forEach((o) => {
      const key = new Date(o.createdAt).toISOString().slice(0, 10);
      if (key in ordersTrendMap) ordersTrendMap[key]++;
    });
    const ordersTrend = Object.entries(ordersTrendMap).map(([date, count]) => ({ date, count }));

    // Top products with names
    const topProductIds = allOrderItems.map((i) => i.productId);
    const topProductDetails = await prisma.product.findMany({
      where: { id: { in: topProductIds } },
      select: { id: true, name: true, price: true, images: { take: 1, select: { url: true } } },
    });
    const topProducts = allOrderItems.map((item) => ({
      ...topProductDetails.find((p) => p.id === item.productId),
      sold: item._sum.quantity ?? 0,
    }));

    // Revenue change %
    const currentRev = revenueAgg._sum.total ?? 0;
    const prevRev = prevRevenueAgg._sum.total ?? 0;
    const revenueChange = prevRev > 0 ? ((currentRev - prevRev) / prevRev) * 100 : null;

    // Order status breakdown
    const statusBreakdown = Object.fromEntries(
      orderStatusBreakdown.map((s) => [s.status, s._count.status])
    );

    return NextResponse.json({
      stats: { totalRevenue: currentRev, totalOrders, totalProducts, totalCustomers },
      recentOrders,
      salesTrend,
      ordersTrend,
      topProducts,
      lowStockProducts,
      statusBreakdown,
      revenueChange,
      newProductsThisMonth,
    });
  } catch (error) {
    console.error("Dashboard stats error:", error);
    return NextResponse.json({ error: "Failed to fetch dashboard stats" }, { status: 500 });
  }
}
