import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const { code } = await request.json();
    if (!code || typeof code !== "string") {
      return NextResponse.json({ error: "Coupon code is required" }, { status: 400 });
    }

    const promo = await prisma.promotion.findFirst({
      where: {
        code: { equals: code.trim().toUpperCase(), mode: "insensitive" },
        active: true,
        startDate: { lte: new Date() },
        endDate: { gte: new Date() },
      },
    });

    if (!promo) {
      return NextResponse.json({ error: "Invalid or expired coupon code" }, { status: 404 });
    }

    return NextResponse.json({
      id: promo.id,
      code: promo.code,
      title: promo.title,
      discount: promo.discount,
      type: promo.type, // "percentage" or "fixed"
    });
  } catch {
    return NextResponse.json({ error: "Failed to validate coupon" }, { status: 500 });
  }
}
