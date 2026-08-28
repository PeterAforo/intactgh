import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";
import { recalcProductRating } from "../route";

// DELETE /api/reviews/[id]
// A logged-in user can delete their own review. Admins can delete any review.
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser(request);
  if (!user) {
    return NextResponse.json({ error: "You must be logged in." }, { status: 401 });
  }

  const { id } = await params;

  const review = await prisma.review.findUnique({ where: { id } });
  if (!review) {
    return NextResponse.json({ error: "Review not found." }, { status: 404 });
  }

  // Only the review owner or an admin may delete
  if (review.userId !== user.id && user.role !== "admin") {
    return NextResponse.json({ error: "You can only delete your own review." }, { status: 403 });
  }

  const productId = review.productId;
  await prisma.review.delete({ where: { id } });
  await recalcProductRating(productId);

  return NextResponse.json({ success: true });
}
