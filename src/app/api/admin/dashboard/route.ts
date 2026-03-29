import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyAdmin } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const auth = await verifyAdmin(request); if (auth.error) return auth.error;
  try {
    const [totalProducts, totalOrders, totalCustomers, revenueAgg, recentOrders] = await Promise.all([
      prisma.product.count(),
      prisma.order.count(),
      prisma.user.count({ where: { role: "customer" } }),
      prisma.order.aggregate({ _sum: { total: true }, where: { paymentStatus: "paid" } }),
      prisma.order.findMany({
        orderBy: { createdAt: "desc" },
        take: 5,
        include: {
          user: { select: { name: true, email: true } },
          _count: { select: { items: true } },
        },
      }),
    ]);

    return NextResponse.json({
      stats: {
        totalRevenue: revenueAgg._sum.total || 0,
        totalOrders,
        totalProducts,
        totalCustomers,
      },
      recentOrders,
    });
  } catch (error) {
    console.error("Dashboard stats error:", error);
    return NextResponse.json({ error: "Failed to fetch dashboard stats" }, { status: 500 });
  }
}
