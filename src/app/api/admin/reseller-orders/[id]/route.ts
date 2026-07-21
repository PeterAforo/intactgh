import { NextRequest, NextResponse } from "next/server";
import { verifyStaff } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { sendEmail, emailLayout } from "@/lib/email";

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const staff = await verifyStaff(request);
  if (!staff) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const body = await request.json();
  const { status, paymentStatus } = body;

  const order = await prisma.resellerOrder.findUnique({
    where: { id },
    include: {
      items: true,
      reseller: { include: { user: { select: { email: true, name: true } } } },
      client: { select: { name: true, phone: true, email: true } },
    },
  });
  if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const updates: Record<string, unknown> = {};
  if (status) updates.status = status;
  if (paymentStatus) updates.paymentStatus = paymentStatus;

  // Confirm payment manually
  if (paymentStatus === "paid" && order.paymentStatus !== "paid") {
    updates.paidAt = new Date();
    if (order.status === "pending_payment") updates.status = "processing";

    const products = await prisma.product.findMany({
      where: { id: { in: order.items.map((i) => i.productId) } },
      select: { id: true, stock: true },
    });
    const stockMap = new Map(products.map((p) => [p.id, p.stock]));
    const insufficient = order.items.filter((i) => (stockMap.get(i.productId) || 0) < i.quantity);

    if (insufficient.length > 0) {
      return NextResponse.json({ error: "Insufficient stock to confirm payment" }, { status: 400 });
    }

    await prisma.$transaction(async (tx) => {
      for (const item of order.items) {
        await tx.product.update({ where: { id: item.productId }, data: { stock: { decrement: item.quantity } } });
      }
      await tx.reseller.update({ where: { id: order.resellerId }, data: { pendingCommission: { increment: order.commission } } });
      await tx.resellerOrder.update({ where: { id: order.id }, data: { ...updates } });
    });
    return NextResponse.json({ success: true });
  }

  // Handle status changes
  if (status) {
    if (status === "delivered" && order.status !== "delivered") {
      updates.deliveredAt = new Date();
      if (order.paymentStatus === "paid" && !order.commissionReleased) {
        updates.commissionReleased = true;
        await prisma.$transaction(async (tx) => {
          await tx.reseller.update({
            where: { id: order.resellerId },
            data: {
              pendingCommission: { decrement: order.commission },
              commissionBalance: { increment: order.commission },
            },
          });
          await tx.resellerOrder.update({ where: { id: order.id }, data: { ...updates } });
        });
        // Notify reseller
        try {
          await sendEmail(
            order.reseller.user.email,
            `Order ${order.orderNumber} delivered`,
            emailLayout("Order Delivered", `
              <h2 style="color:#333">Order Delivered</h2>
              <p>Order <strong>${order.orderNumber}</strong> has been delivered to <strong>${order.client?.name || order.shippingName || "the customer"}</strong>.</p>
              <p style="color:#22c55e;font-weight:bold">Commission released: GH₵${order.commission.toFixed(2)}</p>
              <p style="color:#666">Shipping: ${order.shippingAddress || ""}, ${order.shippingCity || ""}</p>
            `)
          );
        } catch (e) { console.error("Failed to send delivery notification:", e); }
        return NextResponse.json({ success: true });
      }
    }

    if (status === "cancelled" && order.status !== "cancelled" && order.paymentStatus === "paid" && !order.commissionReleased) {
      await prisma.$transaction(async (tx) => {
        for (const item of order.items) {
          await tx.product.update({ where: { id: item.productId }, data: { stock: { increment: item.quantity } } });
        }
        await tx.reseller.update({ where: { id: order.resellerId }, data: { pendingCommission: { decrement: order.commission } } });
        await tx.resellerOrder.update({ where: { id: order.id }, data: { ...updates } });
      });
      return NextResponse.json({ success: true });
    }
  }

  const updated = await prisma.resellerOrder.update({ where: { id }, data: updates });
  return NextResponse.json(updated);
}
