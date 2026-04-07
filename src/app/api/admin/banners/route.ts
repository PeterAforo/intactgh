import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyStaff } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const auth = await verifyStaff(request); if (auth.error) return auth.error;
  const banners = await prisma.banner.findMany({ orderBy: { order: "asc" } });
  return NextResponse.json({ banners });
}

export async function POST(request: NextRequest) {
  const auth = await verifyStaff(request); if (auth.error) return auth.error;
  try {
    const body = await request.json();
    const banner = await prisma.banner.create({ data: body });
    return NextResponse.json({ success: true, banner });
  } catch (error) {
    console.error("Banner create error:", error);
    return NextResponse.json({ error: "Failed to create banner" }, { status: 500 });
  }
}
