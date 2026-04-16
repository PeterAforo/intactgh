import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyStaff } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const auth = await verifyStaff(request); if (auth.error) return auth.error;
  const promotions = await prisma.promotion.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      products: {
        include: { product: { select: { id: true, name: true, slug: true, price: true, images: { take: 1, select: { url: true } } } } },
      },
    },
  });
  return NextResponse.json({ promotions });
}

export async function POST(request: NextRequest) {
  const auth = await verifyStaff(request); if (auth.error) return auth.error;
  try {
    const body = await request.json();
    const { title, description, code, discount, type, startDate, endDate, active, showOnHome, productIds } = body;
    if (!title || !discount || !startDate || !endDate) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }
    const promotion = await prisma.promotion.create({
      data: {
        title, description, code: code || null,
        discount: parseFloat(discount), type: type || "percentage",
        startDate: new Date(startDate), endDate: new Date(endDate),
        active: active !== false,
        showOnHome: showOnHome === true,
        ...(Array.isArray(productIds) && productIds.length > 0
          ? { products: { create: productIds.map((pid: string) => ({ productId: pid })) } }
          : {}),
      },
      include: { products: true },
    });
    return NextResponse.json({ success: true, promotion });
  } catch (error) {
    console.error("Promotion create error:", error);
    return NextResponse.json({ error: "Failed to create promotion" }, { status: 500 });
  }
}
