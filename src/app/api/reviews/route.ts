import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";

// GET /api/reviews?productId=xxx&page=1
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const productId = searchParams.get("productId");
  const page = parseInt(searchParams.get("page") ?? "1");
  const limit = 10;

  if (!productId) {
    return NextResponse.json({ error: "productId is required" }, { status: 400 });
  }

  const [reviews, total] = await Promise.all([
    prisma.review.findMany({
      where: { productId },
      include: { user: { select: { id: true, name: true, avatar: true } } },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.review.count({ where: { productId } }),
  ]);

  const distribution = await prisma.review.groupBy({
    by: ["rating"],
    where: { productId },
    _count: { rating: true },
  });

  const dist: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  for (const d of distribution) dist[d.rating] = d._count.rating;

  return NextResponse.json({ reviews, total, page, limit, distribution: dist });
}

// POST /api/reviews
// Body: { productId, rating, comment }
// Auth: required
export async function POST(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) {
    return NextResponse.json({ error: "You must be logged in to leave a review." }, { status: 401 });
  }

  let body: { productId: string; rating: number; comment?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const { productId, rating, comment } = body;

  if (!productId || !rating) {
    return NextResponse.json({ error: "productId and rating are required." }, { status: 400 });
  }
  if (rating < 1 || rating > 5 || !Number.isInteger(rating)) {
    return NextResponse.json({ error: "Rating must be an integer between 1 and 5." }, { status: 400 });
  }

  // Check product exists
  const product = await prisma.product.findUnique({ where: { id: productId }, select: { id: true } });
  if (!product) {
    return NextResponse.json({ error: "Product not found." }, { status: 404 });
  }

  // One review per user per product
  const existing = await prisma.review.findFirst({ where: { productId, userId: user.id } });
  if (existing) {
    // Update existing review
    const updated = await prisma.review.update({
      where: { id: existing.id },
      data: { rating, comment: comment?.trim() ?? null },
      include: { user: { select: { id: true, name: true, avatar: true } } },
    });
    await recalcProductRating(productId);
    return NextResponse.json({ review: updated, updated: true });
  }

  // Create new review
  const review = await prisma.review.create({
    data: { productId, userId: user.id, rating, comment: comment?.trim() ?? null },
    include: { user: { select: { id: true, name: true, avatar: true } } },
  });

  await recalcProductRating(productId);

  return NextResponse.json({ review, updated: false }, { status: 201 });
}

// Recalculates and persists product.rating + reviewCount
async function recalcProductRating(productId: string) {
  const agg = await prisma.review.aggregate({
    where: { productId },
    _avg: { rating: true },
    _count: { rating: true },
  });
  await prisma.product.update({
    where: { id: productId },
    data: {
      rating: Math.round((agg._avg.rating ?? 0) * 10) / 10,
      reviewCount: agg._count.rating,
    },
  });
}
