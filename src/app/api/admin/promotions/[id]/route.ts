import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyAdmin } from "@/lib/auth";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await verifyAdmin(request); if (auth.error) return auth.error;
  try {
    const { id } = await params;
    const body = await request.json();
    if (body.startDate) body.startDate = new Date(body.startDate);
    if (body.endDate) body.endDate = new Date(body.endDate);
    if (body.discount) body.discount = parseFloat(body.discount);
    const promotion = await prisma.promotion.update({ where: { id }, data: body });
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
  const auth = await verifyAdmin(request); if (auth.error) return auth.error;
  try {
    const { id } = await params;
    await prisma.promotion.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Promotion delete error:", error);
    return NextResponse.json({ error: "Failed to delete promotion" }, { status: 500 });
  }
}
