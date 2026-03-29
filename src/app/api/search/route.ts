import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") || "";

  if (!q) {
    return NextResponse.json({ products: [], categories: [], brands: [], total: 0 });
  }

  const [products, categories, brands] = await Promise.all([
    prisma.product.findMany({
      where: {
        status: "active",
        OR: [
          { name: { contains: q } },
          { description: { contains: q } },
          { tags: { contains: q } },
          { brand: { name: { contains: q } } },
        ],
      },
      include: {
        images: { orderBy: { order: "asc" }, take: 1 },
        category: { select: { id: true, name: true, slug: true } },
        brand: { select: { id: true, name: true, slug: true } },
      },
      take: 20,
    }),
    prisma.category.findMany({
      where: {
        OR: [
          { name: { contains: q } },
          { slug: { contains: q } },
        ],
      },
    }),
    prisma.brand.findMany({
      where: {
        OR: [
          { name: { contains: q } },
          { slug: { contains: q } },
        ],
      },
    }),
  ]);

  return NextResponse.json({
    products,
    categories,
    brands,
    total: products.length,
  });
}
