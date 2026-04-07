import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyStaff } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const auth = await verifyStaff(request); if (auth.error) return auth.error;
  const slides = await prisma.heroSlide.findMany({ orderBy: { order: "asc" } });
  return NextResponse.json({ slides });
}

export async function POST(request: NextRequest) {
  const auth = await verifyStaff(request); if (auth.error) return auth.error;
  try {
    const body = await request.json();
    const slide = await prisma.heroSlide.create({ data: body });
    return NextResponse.json({ success: true, slide });
  } catch (error) {
    console.error("Hero slide create error:", error);
    return NextResponse.json({ error: "Failed to create slide" }, { status: 500 });
  }
}
