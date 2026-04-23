import { NextRequest, NextResponse } from "next/server";
import { verifyStaff } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { sendEmail, emailLayout } from "@/lib/email";

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const staff = await verifyStaff(request);
  if (!staff) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const { status } = await request.json();

  const order = await prisma.resellerOrder.findUnique({
    where: { id },
    include: {
      reseller: { include: { user: { select: { email: true, name: true } } } },
      client: { select: { name: true, phone: true, email: true } },
    },
  });
  if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const updated = await prisma.resellerOrder.update({ where: { id }, data: { status } });

  // Notify reseller when order is delivered
  if (status === "delivered" && order.status !== "delivered") {
    try {
      await sendEmail(
        order.reseller.user.email,
        `Order ${order.orderNumber} delivered`,
        emailLayout("Order Delivered", `
          <h2 style="color:#333">Order Delivered</h2>
          <p>Order <strong>${order.orderNumber}</strong> has been delivered to <strong>${order.client?.name || order.shippingName || "the customer"}</strong>.</p>
          <p style="color:#666">Shipping: ${order.shippingAddress || ""}, ${order.shippingCity || ""}</p>
        `)
      );
    } catch (e) {
      console.error("Failed to send delivery notification:", e);
    }
  }

  return NextResponse.json(updated);
}
