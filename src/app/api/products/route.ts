import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category");
  const brand = searchParams.get("brand");
  const search = searchParams.get("q");
  const sort = searchParams.get("sort");
  const featured = searchParams.get("featured");
  const onSale = searchParams.get("onSale");
  const isNew = searchParams.get("isNew");
  const minPrice = searchParams.get("minPrice");
  const maxPrice = searchParams.get("maxPrice");
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "12");

  const where: Prisma.ProductWhereInput = { status: "active", price: { gt: 0 } };

  if (category) {
    const cat = await prisma.category.findUnique({
      where: { slug: category },
      select: { id: true, children: { select: { id: true } } },
    });
    if (cat) {
      const ids = [cat.id, ...cat.children.map((c) => c.id)];
      where.categoryId = { in: ids };
    } else {
      where.category = { slug: category };
    }
  }
  if (brand) {
    where.brand = { slug: brand };
  }
  if (featured === "true") {
    where.featured = true;
  }
  if (onSale === "true") {
    where.onSale = true;
  }
  if (isNew === "true") {
    where.isNew = true;
  }
  if (minPrice || maxPrice) {
    const priceFilter: Prisma.FloatFilter = { gt: 0 };
    if (minPrice) priceFilter.gte = parseFloat(minPrice);
    if (maxPrice) priceFilter.lte = parseFloat(maxPrice);
    where.price = priceFilter;
  }
  if (search) {
    // Pre-lookup IDs — Prisma/SQLite can't resolve relation filters inside OR reliably
    const [matchingBrands, matchingCategories] = await Promise.all([
      prisma.brand.findMany({ where: { name: { contains: search } }, select: { id: true } }),
      prisma.category.findMany({ where: { name: { contains: search } }, select: { id: true } }),
    ]);
    const brandIds = matchingBrands.map((b) => b.id);
    const catIds = matchingCategories.map((c) => c.id);
    where.OR = [
      { name: { contains: search } },
      { description: { contains: search } },
      { tags: { contains: search } },
      { sku: { contains: search } },
      ...(brandIds.length ? [{ brandId: { in: brandIds } }] : []),
      ...(catIds.length ? [{ categoryId: { in: catIds } }] : []),
    ];
  }

  let orderBy: Prisma.ProductOrderByWithRelationInput = { createdAt: "desc" };
  switch (sort) {
    case "price-asc": orderBy = { price: "asc" }; break;
    case "price-desc": orderBy = { price: "desc" }; break;
    case "rating": orderBy = { rating: "desc" }; break;
    case "newest": orderBy = { createdAt: "desc" }; break;
    case "name-asc": orderBy = { name: "asc" }; break;
  }

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      include: {
        images: { orderBy: { order: "asc" } },
        category: { select: { id: true, name: true, slug: true } },
        brand: { select: { id: true, name: true, slug: true } },
      },
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.product.count({ where }),
  ]);

  return NextResponse.json({
    products,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
}
