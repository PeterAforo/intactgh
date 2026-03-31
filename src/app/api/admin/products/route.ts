import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyAdmin } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const auth = await verifyAdmin(request); if (auth.error) return auth.error;
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");
  const search = searchParams.get("q") || "";
  const status = searchParams.get("status");

  const where: Record<string, unknown> = {};
  if (status) where.status = status;
  if (search) {
    where.OR = [
      { name: { contains: search } },
      { sku: { contains: search } },
      { description: { contains: search } },
      { tags: { contains: search } },
      { brand: { name: { contains: search } } },
      { category: { name: { contains: search } } },
    ];
  }

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      include: {
        images: { orderBy: { order: "asc" }, take: 1 },
        category: { select: { id: true, name: true } },
        brand: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.product.count({ where }),
  ]);

  return NextResponse.json({
    products,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
}

export async function POST(request: NextRequest) {
  const auth = await verifyAdmin(request); if (auth.error) return auth.error;
  try {
    const body = await request.json();
    const {
      name, slug, description, price, comparePrice, costPrice, sku, stock,
      categoryId, brandId, featured, isNew, onSale, tags, images, specs, videoUrl, variants,
    } = body;

    if (!name || !slug || !description || !price || !categoryId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Auto-generate sequential SKU: INT00001 – INT99999
    let finalSku = sku?.trim() || "";
    if (!finalSku) {
      const count = await prisma.product.count();
      finalSku = `INT${String((count + 1) % 99999 || 99999).padStart(5, "0")}`;
      // Ensure uniqueness in case of gaps/deletes
      const existing = await prisma.product.findFirst({ where: { sku: finalSku } });
      if (existing) {
        finalSku = `INT${String(((count + Date.now()) % 99999) + 1).padStart(5, "0")}`;
      }
    }

    const product = await prisma.product.create({
      data: {
        name, slug, description,
        price: parseFloat(price),
        comparePrice: comparePrice ? parseFloat(comparePrice) : null,
        costPrice: costPrice ? parseFloat(costPrice) : null,
        sku: finalSku,
        stock: parseInt(stock) || 0,
        categoryId, brandId: brandId || null,
        featured: !!featured, isNew: !!isNew, onSale: !!onSale,
        tags: tags || null, specs: specs || null,
        videoUrl: videoUrl || null,
        images: images?.length ? {
          create: images.map((img: { url: string; alt?: string }, idx: number) => ({
            url: img.url, alt: img.alt || null, order: idx,
          })),
        } : undefined,
      },
      include: {
        images: true,
        category: { select: { id: true, name: true } },
        brand: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json({ success: true, product });
  } catch (error) {
    console.error("Product create error:", error);
    return NextResponse.json({ error: "Failed to create product" }, { status: 500 });
  }
}
