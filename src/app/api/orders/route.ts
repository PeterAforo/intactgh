import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { generateOrderNumber } from "@/lib/utils";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { items, shipping, paymentMethod, deliveryFee: clientDeliveryFee, userId } = body;

    if (!items || items.length === 0) {
      return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
    }

    if (!shipping?.firstName || !shipping?.phone || !shipping?.street || !shipping?.city) {
      return NextResponse.json({ error: "Shipping information is incomplete" }, { status: 400 });
    }

    const orderNumber = generateOrderNumber();
    const subtotal = items.reduce(
      (sum: number, item: { price: number; quantity: number }) => sum + item.price * item.quantity,
      0
    );
    const deliveryFee = clientDeliveryFee ?? (subtotal >= 3000 ? 0 : 50);
    const total = subtotal + deliveryFee;

    // Find or create guest user
    let resolvedUserId = userId;
    if (!resolvedUserId) {
      const email = shipping.email || `guest_${Date.now()}@intactghana.com`;
      let user = await prisma.user.findUnique({ where: { email } });
      if (!user) {
        user = await prisma.user.create({
          data: {
            email,
            name: `${shipping.firstName} ${shipping.lastName || ""}`.trim(),
            phone: shipping.phone,
            password: "",
            role: "customer",
          },
        });
      }
      resolvedUserId = user.id;
    }

    const order = await prisma.order.create({
      data: {
        orderNumber,
        userId: resolvedUserId,
        subtotal,
        shipping: deliveryFee,
        total,
        status: "confirmed",
        paymentMethod: paymentMethod || "cod",
        paymentStatus: paymentMethod === "cod" ? "pending" : "paid",
        shippingName: `${shipping.firstName} ${shipping.lastName || ""}`.trim(),
        shippingPhone: shipping.phone,
        shippingAddress: shipping.street,
        shippingCity: shipping.city,
        shippingRegion: shipping.region || "",
        notes: shipping.notes || null,
        items: {
          create: items.map((item: { productId: string; quantity: number; price: number }) => ({
            productId: item.productId,
            quantity: item.quantity,
            price: item.price,
          })),
        },
      },
      include: {
        items: { include: { product: { select: { name: true, slug: true } } } },
      },
    });

    return NextResponse.json({ success: true, order });
  } catch (error) {
    console.error("Order creation error:", error);
    return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");

  const where = status ? { status } : {};

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, email: true } },
        items: { include: { product: { select: { name: true, slug: true } } } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.order.count({ where }),
  ]);

  return NextResponse.json({
    orders,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
}
