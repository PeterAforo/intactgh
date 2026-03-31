import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q = (searchParams.get("q") || "").trim();
  const limit = Math.min(parseInt(searchParams.get("limit") || "8"), 48);

  if (!q) {
    return NextResponse.json({ products: [], categories: [], brands: [], total: 0 });
  }

  // Pre-lookup matching brand/category IDs — Prisma/SQLite OR+relation filter is unreliable
  const [matchingBrands, matchingCategories] = await Promise.all([
    prisma.brand.findMany({
      where: { OR: [{ name: { contains: q } }, { slug: { contains: q } }] },
      select: { id: true, name: true, slug: true },
    }),
    prisma.category.findMany({
      where: { OR: [{ name: { contains: q } }, { slug: { contains: q } }] },
      select: { id: true, name: true, slug: true, icon: true },
    }),
  ]);

  const brandIds = matchingBrands.map((b) => b.id);
  const catIds = matchingCategories.map((c) => c.id);

  const products = await prisma.product.findMany({
    where: {
      status: "active",
      OR: [
        { name: { contains: q } },
        { tags: { contains: q } },
        { sku: { contains: q } },
        ...(brandIds.length ? [{ brandId: { in: brandIds } }] : []),
        ...(catIds.length ? [{ categoryId: { in: catIds } }] : []),
      ],
    },
    include: {
      images: { orderBy: { order: "asc" }, take: 1 },
      category: { select: { id: true, name: true, slug: true } },
      brand: { select: { id: true, name: true, slug: true } },
    },
    orderBy: { featured: "desc" },
    take: limit,
  });

  return NextResponse.json({
    products,
    categories: matchingCategories,
    brands: matchingBrands,
    total: products.length,
  });
}
