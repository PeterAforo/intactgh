import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// Public endpoint — track order by orderNumber + email
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const orderNumber = searchParams.get("orderNumber")?.trim();
  const email = searchParams.get("email")?.trim().toLowerCase();

  if (!orderNumber || !email) {
    return NextResponse.json({ error: "orderNumber and email are required" }, { status: 400 });
  }

  const order = await prisma.order.findFirst({
    where: {
      orderNumber,
      user: { email: { equals: email, mode: "insensitive" } },
    },
    select: {
      id: true,
      orderNumber: true,
      status: true,
      paymentStatus: true,
      paymentMethod: true,
      subtotal: true,
      shipping: true,
      total: true,
      createdAt: true,
      updatedAt: true,
      shippingName: true,
      shippingPhone: true,
      shippingCity: true,
      shippingRegion: true,
      user: { select: { email: true } },
      items: {
        select: {
          quantity: true,
          price: true,
          product: { select: { name: true, slug: true, images: { take: 1, select: { url: true } } } },
        },
      },
    },
  });

  if (!order) {
    return NextResponse.json({ error: "Order not found. Check your order number and email." }, { status: 404 });
  }

  return NextResponse.json({ order });
}
