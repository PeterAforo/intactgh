import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyStaff } from "@/lib/auth";
import { recalcProductRating } from "@/app/api/reviews/route";

// POST /api/admin/products/[id]/reviews
// Admin/staff can seed initial reviews for a product. These are not tied to a
// real buyer (userId = null, isAdminSeed = true) and bypass purchase verification.
// Body: { reviews: [{ rating: 1-5, comment?: string, authorName?: string }] }
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await verifyStaff(request);
  if (auth.error) return auth.error;

  const { id: productId } = await params;

  const product = await prisma.product.findUnique({ where: { id: productId }, select: { id: true } });
  if (!product) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  let body: { reviews: { rating: number; comment?: string; authorName?: string }[] };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const { reviews } = body;
  if (!Array.isArray(reviews) || reviews.length === 0) {
    return NextResponse.json({ error: "reviews array is required." }, { status: 400 });
  }

  // Validate each entry
  for (const r of reviews) {
    if (!Number.isInteger(r.rating) || r.rating < 1 || r.rating > 5) {
      return NextResponse.json({ error: "Each rating must be an integer between 1 and 5." }, { status: 400 });
    }
  }

  let created = 0;
  for (const r of reviews) {
    await prisma.review.create({
      data: {
        productId,
        userId: null,
        rating: r.rating,
        comment: r.comment?.trim() || null,
        isAdminSeed: true,
        verifiedPurchase: false,
        seedAuthorName: r.authorName?.trim() || null,
      },
    });
    created++;
  }

  await recalcProductRating(productId);

  return NextResponse.json({ success: true, created }, { status: 201 });
}

// DELETE /api/admin/products/[id]/reviews
// Remove all admin-seeded reviews for a product (keeps genuine buyer reviews).
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await verifyStaff(request);
  if (auth.error) return auth.error;

  const { id: productId } = await params;

  const result = await prisma.review.deleteMany({
    where: { productId, isAdminSeed: true },
  });

  await recalcProductRating(productId);

  return NextResponse.json({ success: true, deleted: result.count });
}
