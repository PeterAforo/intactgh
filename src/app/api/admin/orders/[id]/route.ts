import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyStaff, verifyAdmin } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await verifyStaff(request); if (auth.error) return auth.error;
  const { id } = await params;
  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, name: true, email: true, phone: true } },
      items: {
        include: {
          product: {
            select: {
              name: true,
              slug: true,
              images: { take: 1, orderBy: { order: "asc" }, select: { url: true, alt: true } },
            },
          },
        },
      },
    },
  });

  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }
  return NextResponse.json({ order });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await verifyStaff(request); if (auth.error) return auth.error;
  try {
    const { id } = await params;
    const { status, paymentStatus, notes } = await request.json();

    const oldOrder = await prisma.order.findUnique({ where: { id }, select: { status: true, paymentStatus: true, orderNumber: true } });

    const data: Record<string, unknown> = {};
    if (status) data.status = status;
    if (paymentStatus) data.paymentStatus = paymentStatus;
    if (notes !== undefined) data.notes = notes;

    const order = await prisma.order.update({ where: { id }, data });

    if (auth.user) {
      await logAudit({
        userId: auth.user.id,
        action: "update",
        entity: "order",
        entityId: id,
        details: {
          orderNumber: oldOrder?.orderNumber,
          changes: data,
          previous: { status: oldOrder?.status, paymentStatus: oldOrder?.paymentStatus },
        },
        request,
      });
    }

    return NextResponse.json({ success: true, order });
  } catch (error) {
    console.error("Order update error:", error);
    return NextResponse.json({ error: "Failed to update order" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await verifyAdmin(request); if (auth.error) return auth.error;
  try {
    const { id } = await params;
    const order = await prisma.order.findUnique({ where: { id }, select: { orderNumber: true, total: true, status: true } });
    if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

    await prisma.orderItem.deleteMany({ where: { orderId: id } });
    await prisma.order.delete({ where: { id } });

    if (auth.user) {
      await logAudit({
        userId: auth.user.id,
        action: "delete",
        entity: "order",
        entityId: id,
        details: { orderNumber: order.orderNumber, total: order.total, status: order.status },
        request,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Order delete error:", error);
    return NextResponse.json({ error: "Failed to delete order" }, { status: 500 });
  }
}
