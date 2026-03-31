import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyAdmin } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await verifyAdmin(request); if (auth.error) return auth.error;
  try {
    const { id } = await params;
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        images: { orderBy: { order: "asc" } },
        category: true,
        brand: true,
        reviews: { include: { user: { select: { name: true } } }, orderBy: { createdAt: "desc" } },
        variants: { select: { id: true, name: true, options: true }, orderBy: { createdAt: "asc" } },
      },
    });

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    return NextResponse.json({ product });
  } catch (error) {
    console.error("Product GET error:", error);
    return NextResponse.json({ error: "Failed to load product" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await verifyAdmin(request); if (auth.error) return auth.error;
  try {
    const { id } = await params;
    const body = await request.json();
    const {
      name, slug, description, price, comparePrice, costPrice, sku, stock,
      categoryId, brandId, featured, isNew, onSale, tags, specs, status, images, variants, videoUrl,
    } = body;

    const data: Record<string, unknown> = {};
    if (name !== undefined) data.name = name;
    if (slug !== undefined) data.slug = slug;
    if (description !== undefined) data.description = description;
    if (price !== undefined) data.price = parseFloat(price);
    if (comparePrice !== undefined) data.comparePrice = comparePrice ? parseFloat(comparePrice) : null;
    if (costPrice !== undefined) data.costPrice = costPrice ? parseFloat(costPrice) : null;
    if (sku !== undefined) data.sku = sku;
    if (stock !== undefined) data.stock = parseInt(stock);
    if (categoryId !== undefined) data.categoryId = categoryId;
    if (brandId !== undefined) data.brandId = brandId || null;
    if (featured !== undefined) data.featured = !!featured;
    if (isNew !== undefined) data.isNew = !!isNew;
    if (onSale !== undefined) data.onSale = !!onSale;
    if (tags !== undefined) data.tags = tags;
    if (specs !== undefined) data.specs = specs;
    if (status !== undefined) data.status = status;
    if (videoUrl !== undefined) data.videoUrl = videoUrl || null;

    const product = await prisma.product.update({
      where: { id },
      data,
      include: {
        images: { orderBy: { order: "asc" } },
        category: { select: { id: true, name: true } },
        brand: { select: { id: true, name: true } },
      },
    });

    if (images) {
      await prisma.productImage.deleteMany({ where: { productId: id } });
      await prisma.productImage.createMany({
        data: images.map((img: { url: string; alt?: string }, idx: number) => ({
          productId: id, url: img.url, alt: img.alt || null, order: idx,
        })),
      });
    }

    if (variants !== undefined) {
      await prisma.productVariant.deleteMany({ where: { productId: id } });
      if (variants.length > 0) {
        await prisma.productVariant.createMany({
          data: variants.map((v: { name: string; options: string[] }) => ({
            productId: id,
            name: v.name.trim(),
            options: JSON.stringify(v.options.filter((o: string) => o.trim())),
          })),
        });
      }
    }

    return NextResponse.json({ success: true, product });
  } catch (error) {
    console.error("Product update error:", error);
    return NextResponse.json({ error: "Failed to update product" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await verifyAdmin(request); if (auth.error) return auth.error;
  try {
    const { id } = await params;
    await prisma.productImage.deleteMany({ where: { productId: id } });
    await prisma.productVariant.deleteMany({ where: { productId: id } });
    await prisma.product.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Product delete error:", error);
    return NextResponse.json({ error: "Failed to delete product" }, { status: 500 });
  }
}
