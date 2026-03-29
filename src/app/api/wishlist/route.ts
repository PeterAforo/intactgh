import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";

const PRODUCT_SELECT = {
  id: true, name: true, slug: true, price: true, comparePrice: true,
  stock: true, rating: true, reviewCount: true, isNew: true, onSale: true, featured: true,
  images: { orderBy: { order: "asc" as const }, take: 1, select: { id: true, url: true, alt: true } },
  brand: { select: { id: true, name: true, slug: true } },
  category: { select: { id: true, name: true, slug: true } },
};

// GET /api/wishlist — returns wishlist items for logged-in user
export async function GET(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const items = await prisma.wishlistItem.findMany({
    where: { userId: user.id },
    include: { product: { select: PRODUCT_SELECT } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ items: items.map((i) => i.product) });
}

// POST /api/wishlist — add product to wishlist
// Body: { productId }
export async function POST(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { productId } = await request.json().catch(() => ({}));
  if (!productId) return NextResponse.json({ error: "productId is required" }, { status: 400 });

  const product = await prisma.product.findUnique({ where: { id: productId }, select: { id: true } });
  if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 });

  const existing = await prisma.wishlistItem.findFirst({ where: { userId: user.id, productId } });
  if (existing) return NextResponse.json({ message: "Already in wishlist" });

  await prisma.wishlistItem.create({ data: { userId: user.id, productId } });
  return NextResponse.json({ message: "Added to wishlist" }, { status: 201 });
}

// DELETE /api/wishlist?productId=xxx — remove from wishlist
export async function DELETE(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const productId = new URL(request.url).searchParams.get("productId");
  if (!productId) return NextResponse.json({ error: "productId is required" }, { status: 400 });

  await prisma.wishlistItem.deleteMany({ where: { userId: user.id, productId } });
  return NextResponse.json({ message: "Removed from wishlist" });
}
