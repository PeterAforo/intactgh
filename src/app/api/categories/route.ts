import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  const categories = await prisma.category.findMany({
    include: {
      _count: { select: { products: true } },
      children: { select: { id: true, name: true, slug: true } },
    },
    orderBy: { order: "asc" },
  });

  const mapped = categories.map((c) => ({
    ...c,
    productCount: c._count.products,
    _count: undefined,
  }));

  return NextResponse.json({ categories: mapped });
}
