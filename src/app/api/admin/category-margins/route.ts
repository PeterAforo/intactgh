import { NextRequest, NextResponse } from "next/server";
import { verifyStaff } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  const staff = await verifyStaff(request);
  if (!staff) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const categories = await prisma.category.findMany({
    where: { parentId: null },
    orderBy: { name: "asc" },
    include: {
      categoryMargin: true,
      children: { orderBy: { name: "asc" }, include: { categoryMargin: true } },
      _count: { select: { products: true } },
    },
  });

  return NextResponse.json(categories);
}

export async function PUT(request: NextRequest) {
  const staff = await verifyStaff(request);
  if (!staff) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { categoryId, marginPercent } = await request.json();
  if (!categoryId || marginPercent === undefined) {
    return NextResponse.json({ error: "categoryId and marginPercent required" }, { status: 400 });
  }

  const margin = await prisma.categoryMargin.upsert({
    where: { categoryId },
    update: { marginPercent: parseFloat(marginPercent) },
    create: { categoryId, marginPercent: parseFloat(marginPercent) },
  });

  return NextResponse.json(margin);
}
