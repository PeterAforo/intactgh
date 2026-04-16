import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyStaff } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await verifyStaff(request); if (auth.error) return auth.error;
  try {
    const { id } = await params;
    const body = await request.json();
    const { productIds, ...fields } = body;
    if (fields.startDate) fields.startDate = new Date(fields.startDate);
    if (fields.endDate) fields.endDate = new Date(fields.endDate);
    if (fields.discount) fields.discount = parseFloat(fields.discount);

    // Update promotion fields
    const promotion = await prisma.promotion.update({ where: { id }, data: fields });

    // Sync products if productIds provided
    if (Array.isArray(productIds)) {
      // Delete existing product links
      await prisma.promotionProduct.deleteMany({ where: { promotionId: id } });
      // Create new links
      if (productIds.length > 0) {
        await prisma.promotionProduct.createMany({
          data: productIds.map((pid: string) => ({ promotionId: id, productId: pid })),
        });
      }
    }

    if (auth.user) {
      await logAudit({
        userId: auth.user.id, action: "update", entity: "promotion",
        entityId: id, details: { changes: fields, productCount: productIds?.length }, request,
      });
    }

    return NextResponse.json({ success: true, promotion });
  } catch (error) {
    console.error("Promotion update error:", error);
    return NextResponse.json({ error: "Failed to update promotion" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await verifyStaff(request); if (auth.error) return auth.error;
  try {
    const { id } = await params;
    const promo = await prisma.promotion.findUnique({ where: { id }, select: { title: true } });
    await prisma.promotion.delete({ where: { id } });

    if (auth.user) {
      await logAudit({
        userId: auth.user.id, action: "delete", entity: "promotion",
        entityId: id, details: { title: promo?.title }, request,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Promotion delete error:", error);
    return NextResponse.json({ error: "Failed to delete promotion" }, { status: 500 });
  }
}
