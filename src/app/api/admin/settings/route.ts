import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyAdmin } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const auth = await verifyAdmin(request); if (auth.error) return auth.error;
  const settings = await prisma.siteSetting.findMany();
  const mapped: Record<string, string> = {};
  for (const s of settings) mapped[s.key] = s.value;
  return NextResponse.json({ settings: mapped });
}

export async function PUT(request: NextRequest) {
  const auth = await verifyAdmin(request); if (auth.error) return auth.error;
  try {
    const body = await request.json();
    const entries = Object.entries(body) as [string, string][];
    for (const [key, value] of entries) {
      await prisma.siteSetting.upsert({
        where: { key },
        update: { value },
        create: { key, value },
      });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Settings update error:", error);
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 });
  }
}
