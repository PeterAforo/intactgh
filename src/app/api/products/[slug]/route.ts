import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

const productInclude = {
  images: { orderBy: { order: "asc" as const } },
  category: { select: { id: true, name: true, slug: true } },
  brand: { select: { id: true, name: true, slug: true } },
  reviews: {
    include: { user: { select: { id: true, name: true, avatar: true } } },
    orderBy: { createdAt: "desc" as const },
    take: 10,
  },
  variants: { select: { id: true, name: true, options: true }, orderBy: { createdAt: "asc" as const } },
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  const product = await prisma.product.findUnique({
    where: { slug },
    include: productInclude,
  });

  if (!product) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  const relatedProducts = await prisma.product.findMany({
    where: {
      categoryId: product.categoryId,
      id: { not: product.id },
      status: "active",
      price: { gt: 0 },
    },
    include: {
      images: { orderBy: { order: "asc" }, take: 1 },
      category: { select: { id: true, name: true, slug: true } },
      brand: { select: { id: true, name: true, slug: true } },
    },
    take: 4,
  });

  return NextResponse.json({ product, relatedProducts });
}
