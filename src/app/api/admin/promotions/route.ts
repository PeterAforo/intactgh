import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyAdmin } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const auth = await verifyAdmin(request); if (auth.error) return auth.error;
  const promotions = await prisma.promotion.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json({ promotions });
}

export async function POST(request: NextRequest) {
  const auth = await verifyAdmin(request); if (auth.error) return auth.error;
  try {
    const body = await request.json();
    const { title, description, code, discount, type, startDate, endDate, active } = body;
    if (!title || !discount || !startDate || !endDate) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }
    const promotion = await prisma.promotion.create({
      data: {
        title, description, code: code || null,
        discount: parseFloat(discount), type: type || "percentage",
        startDate: new Date(startDate), endDate: new Date(endDate),
        active: active !== false,
      },
    });
    return NextResponse.json({ success: true, promotion });
  } catch (error) {
    console.error("Promotion create error:", error);
    return NextResponse.json({ error: "Failed to create promotion" }, { status: 500 });
  }
}
