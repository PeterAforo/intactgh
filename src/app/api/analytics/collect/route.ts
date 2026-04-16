import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// Lightweight analytics collector — accepts page views from the client tracker
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { visitorId, sessionId, path, title, referrer, utmSource, utmMedium, utmCampaign } = body;

    if (!visitorId || !path) {
      return NextResponse.json({ ok: false }, { status: 400 });
    }

    // Parse user-agent
    const ua = request.headers.get("user-agent") || "";
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
               request.headers.get("x-real-ip") || "unknown";

    const device = /Mobile|Android|iPhone|iPad/i.test(ua) ? "mobile" : /Tablet/i.test(ua) ? "tablet" : "desktop";
    const browser = extractBrowser(ua);
    const os = extractOS(ua);

    let session;

    if (sessionId) {
      // Try to find existing session
      session = await prisma.analyticsSession.findUnique({ where: { id: sessionId } });
    }

    if (!session) {
      // Create new session
      session = await prisma.analyticsSession.create({
        data: {
          visitorId,
          ip,
          userAgent: ua.slice(0, 500),
          device,
          browser,
          os,
          referrer: referrer || null,
          utmSource: utmSource || null,
          utmMedium: utmMedium || null,
          utmCampaign: utmCampaign || null,
        },
      });
    }

    // Record page view
    await prisma.analyticsPageView.create({
      data: {
        sessionId: session.id,
        path,
        title: title?.slice(0, 255) || null,
        referrer: referrer || null,
      },
    });

    // Update session endedAt
    await prisma.analyticsSession.update({
      where: { id: session.id },
      data: { endedAt: new Date() },
    });

    return NextResponse.json({ ok: true, sessionId: session.id });
  } catch (error) {
    console.error("[Analytics] Collect error:", error);
    // Never fail the user experience for analytics
    return NextResponse.json({ ok: false }, { status: 200 });
  }
}

function extractBrowser(ua: string): string {
  if (/Edg\//i.test(ua)) return "Edge";
  if (/OPR\//i.test(ua) || /Opera/i.test(ua)) return "Opera";
  if (/Firefox\//i.test(ua)) return "Firefox";
  if (/Chrome\//i.test(ua)) return "Chrome";
  if (/Safari\//i.test(ua)) return "Safari";
  if (/MSIE|Trident/i.test(ua)) return "IE";
  return "Other";
}

function extractOS(ua: string): string {
  if (/Windows/i.test(ua)) return "Windows";
  if (/Macintosh|Mac OS/i.test(ua)) return "macOS";
  if (/Linux/i.test(ua) && !/Android/i.test(ua)) return "Linux";
  if (/Android/i.test(ua)) return "Android";
  if (/iPhone|iPad|iPod/i.test(ua)) return "iOS";
  return "Other";
}
