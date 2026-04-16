import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";

// Admin-only analytics query endpoint
export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthUser(request);
    if (!auth || auth.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = request.nextUrl;
    const range = searchParams.get("range") || "7d"; // 7d, 30d, 90d

    const now = new Date();
    const daysMap: Record<string, number> = { "24h": 1, "7d": 7, "30d": 30, "90d": 90 };
    const days = daysMap[range] || 7;
    const since = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

    // Run all queries in parallel
    const [
      totalPageViews,
      totalSessions,
      uniqueVisitors,
      pageViewsByDay,
      topPages,
      topReferrers,
      deviceBreakdown,
      browserBreakdown,
      osBreakdown,
      recentPageViews,
    ] = await Promise.all([
      // Total page views
      prisma.analyticsPageView.count({
        where: { createdAt: { gte: since } },
      }),

      // Total sessions
      prisma.analyticsSession.count({
        where: { startedAt: { gte: since } },
      }),

      // Unique visitors
      prisma.analyticsSession.groupBy({
        by: ["visitorId"],
        where: { startedAt: { gte: since } },
      }).then((r) => r.length),

      // Page views by day
      prisma.$queryRawUnsafe<{ date: string; count: bigint }[]>(
        `SELECT DATE("createdAt") as date, COUNT(*)::bigint as count
         FROM "AnalyticsPageView"
         WHERE "createdAt" >= $1
         GROUP BY DATE("createdAt")
         ORDER BY date ASC`,
        since
      ),

      // Top pages
      prisma.$queryRawUnsafe<{ path: string; count: bigint }[]>(
        `SELECT path, COUNT(*)::bigint as count
         FROM "AnalyticsPageView"
         WHERE "createdAt" >= $1
         GROUP BY path
         ORDER BY count DESC
         LIMIT 20`,
        since
      ),

      // Top referrers
      prisma.$queryRawUnsafe<{ referrer: string; count: bigint }[]>(
        `SELECT referrer, COUNT(*)::bigint as count
         FROM "AnalyticsSession"
         WHERE "startedAt" >= $1 AND referrer IS NOT NULL AND referrer != ''
         GROUP BY referrer
         ORDER BY count DESC
         LIMIT 15`,
        since
      ),

      // Device breakdown
      prisma.$queryRawUnsafe<{ device: string; count: bigint }[]>(
        `SELECT COALESCE(device, 'unknown') as device, COUNT(*)::bigint as count
         FROM "AnalyticsSession"
         WHERE "startedAt" >= $1
         GROUP BY device
         ORDER BY count DESC`,
        since
      ),

      // Browser breakdown
      prisma.$queryRawUnsafe<{ browser: string; count: bigint }[]>(
        `SELECT COALESCE(browser, 'unknown') as browser, COUNT(*)::bigint as count
         FROM "AnalyticsSession"
         WHERE "startedAt" >= $1
         GROUP BY browser
         ORDER BY count DESC`,
        since
      ),

      // OS breakdown
      prisma.$queryRawUnsafe<{ os: string; count: bigint }[]>(
        `SELECT COALESCE(os, 'unknown') as os, COUNT(*)::bigint as count
         FROM "AnalyticsSession"
         WHERE "startedAt" >= $1
         GROUP BY os
         ORDER BY count DESC`,
        since
      ),

      // Recent page views (last 50)
      prisma.analyticsPageView.findMany({
        where: { createdAt: { gte: since } },
        orderBy: { createdAt: "desc" },
        take: 50,
        include: {
          session: {
            select: { visitorId: true, device: true, browser: true, os: true, country: true, ip: true },
          },
        },
      }),
    ]);

    // Compute avg pages per session
    const avgPagesPerSession = totalSessions > 0 ? Math.round((totalPageViews / totalSessions) * 10) / 10 : 0;

    // Serialize bigint
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const serializeBigint = (arr: any[]) =>
      arr.map((r: any) => ({ ...r, count: Number(r.count) }));

    return NextResponse.json({
      range,
      since: since.toISOString(),
      summary: {
        totalPageViews,
        totalSessions,
        uniqueVisitors,
        avgPagesPerSession,
      },
      pageViewsByDay: serializeBigint(pageViewsByDay).map((r) => ({
        date: String(r.date).slice(0, 10),
        views: r.count,
      })),
      topPages: serializeBigint(topPages).map((r) => ({ path: r.path, views: r.count })),
      topReferrers: serializeBigint(topReferrers).map((r) => ({ referrer: r.referrer, sessions: r.count })),
      devices: serializeBigint(deviceBreakdown).map((r) => ({ device: r.device, sessions: r.count })),
      browsers: serializeBigint(browserBreakdown).map((r) => ({ browser: r.browser, sessions: r.count })),
      operatingSystems: serializeBigint(osBreakdown).map((r) => ({ os: r.os, sessions: r.count })),
      recentPageViews: recentPageViews.map((pv) => ({
        path: pv.path,
        title: pv.title,
        time: pv.createdAt,
        device: pv.session.device,
        browser: pv.session.browser,
        os: pv.session.os,
        ip: pv.session.ip,
      })),
    });
  } catch (error) {
    console.error("[Analytics] Query error:", error);
    return NextResponse.json({ error: "Failed to fetch analytics" }, { status: 500 });
  }
}
