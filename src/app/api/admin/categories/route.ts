import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyAdmin } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const auth = await verifyAdmin(request); if (auth.error) return auth.error;
  const categories = await prisma.category.findMany({
    include: {
      _count: { select: { products: true } },
      parent: { select: { id: true, name: true } },
      children: { select: { id: true, name: true, slug: true } },
    },
    orderBy: { order: "asc" },
  });
  return NextResponse.json({ categories });
}

export async function POST(request: NextRequest) {
  const auth = await verifyAdmin(request); if (auth.error) return auth.error;
  try {
    const { name, slug, description, image, icon, parentId, featured, order } = await request.json();
    if (!name || !slug) {
      return NextResponse.json({ error: "Name and slug are required" }, { status: 400 });
    }
    const category = await prisma.category.create({
      data: { name, slug, description, image, icon, parentId: parentId || null, featured: !!featured, order: order || 0 },
    });
    return NextResponse.json({ success: true, category });
  } catch (error) {
    console.error("Category create error:", error);
    return NextResponse.json({ error: "Failed to create category" }, { status: 500 });
  }
}
