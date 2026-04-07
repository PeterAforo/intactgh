import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyStaff } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const auth = await verifyStaff(request); if (auth.error) return auth.error;
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");
  const search = searchParams.get("q") || "";
  const status = searchParams.get("status");
  const categorySlug = searchParams.get("category");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: Record<string, any> = {};
  if (status) where.status = status;
  if (categorySlug) {
    where.AND = [
      ...(where.AND || []),
      { OR: [
        { categoryId: categorySlug },
        { category: { parentId: categorySlug } },
      ] },
    ];
  }
  if (search) {
    // Split into words so "DELL LATITUDE 7330" matches "DELL  LATITUDE 7330"
    const words = search.trim().split(/\s+/).filter(Boolean);
    for (const word of words) {
      where.AND = [
        ...(where.AND || []),
        { OR: [
          { name: { contains: word, mode: "insensitive" } },
          { sku: { contains: word, mode: "insensitive" } },
          { description: { contains: word, mode: "insensitive" } },
          { tags: { contains: word, mode: "insensitive" } },
          { brand: { name: { contains: word, mode: "insensitive" } } },
          { category: { name: { contains: word, mode: "insensitive" } } },
        ] },
      ];
    }
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
  const auth = await verifyStaff(request); if (auth.error) return auth.error;
  try {
    const body = await request.json();
    const {
      name, slug, description, price, comparePrice, costPrice, sku, stock,
      categoryId, brandId, featured, isNew, onSale, tags, images, specs, videoUrl, variants,
    } = body;

    if (!name || !slug || !description || !price || !categoryId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Auto-generate sequential SKU: INT0001 format (total products + 1)
    const count = await prisma.product.count();
    let nextNum = count + 1;
    let finalSku = `INT${String(nextNum).padStart(4, "0")}`;
    // Ensure uniqueness in case of gaps/deletes
    while (await prisma.product.findFirst({ where: { sku: finalSku } })) {
      nextNum++;
      finalSku = `INT${String(nextNum).padStart(4, "0")}`;
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

    if (variants && variants.length > 0) {
      const cleanVariants = variants.filter((v: { name: string; options: ({ value: string; priceAdd: number } | string)[] }) =>
        v.name?.trim() && v.options?.some((o) => typeof o === "string" ? o.trim() : o.value?.trim())
      );
      if (cleanVariants.length > 0) {
        await prisma.productVariant.createMany({
          data: cleanVariants.map((v: { name: string; options: ({ value: string; priceAdd: number } | string)[] }) => {
            const opts = v.options
              .map((o) => (typeof o === "string" ? { value: o, priceAdd: 0 } : o))
              .filter((o) => o.value.trim());
            return {
              productId: product.id,
              name: v.name.trim(),
              options: JSON.stringify(opts),
            };
          }),
        });
      }
    }

    return NextResponse.json({ success: true, product });
  } catch (error) {
    console.error("Product create error:", error);
    return NextResponse.json({ error: "Failed to create product" }, { status: 500 });
  }
}
