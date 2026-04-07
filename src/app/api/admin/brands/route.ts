import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyStaff } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const auth = await verifyStaff(request); if (auth.error) return auth.error;
  const brands = await prisma.brand.findMany({
    include: { _count: { select: { products: true } } },
    orderBy: { name: "asc" },
  });
  return NextResponse.json({ brands });
}

export async function POST(request: NextRequest) {
  const auth = await verifyStaff(request); if (auth.error) return auth.error;
  try {
    const { name, slug, logo, description, featured } = await request.json();
    if (!name || !slug) {
      return NextResponse.json({ error: "Name and slug are required" }, { status: 400 });
    }
    const brand = await prisma.brand.create({
      data: { name, slug, logo, description, featured: !!featured },
    });
    return NextResponse.json({ success: true, brand });
  } catch (error) {
    console.error("Brand create error:", error);
    return NextResponse.json({ error: "Failed to create brand" }, { status: 500 });
  }
}
