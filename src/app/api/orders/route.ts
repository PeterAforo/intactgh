import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { generateOrderNumber } from "@/lib/utils";
import { sendCustomerOrderEmail, sendAdminOrderEmail, type OrderEmailData } from "@/lib/email";
import { sendCustomerOrderSMS, sendAdminOrderSMS } from "@/lib/sms";
import { fulfillGiftCardProducts } from "@/lib/gift-card-fulfillment";

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

    const customerName = `${shipping.firstName} ${shipping.lastName || ""}`.trim();

    const order = await prisma.order.create({
      data: {
        orderNumber,
        userId: resolvedUserId,
        subtotal,
        shipping: deliveryFee,
        total,
        status: paymentMethod === "canpay" ? "pending" : "confirmed",
        paymentMethod: paymentMethod || "cod",
        paymentStatus: (paymentMethod === "cod" || paymentMethod === "canpay") ? "pending" : "paid",
        shippingName: customerName,
        shippingPhone: shipping.phone,
        shippingAddress: shipping.street,
        shippingCity: shipping.city,
        shippingRegion: shipping.region || "",
        notes: shipping.notes || null,
        items: {
          create: items.map((item: { productId: string; quantity: number; price: number; variantLabel?: string }) => ({
            productId: item.productId,
            quantity: item.quantity,
            price: item.price,
            variantLabel: item.variantLabel || null,
          })),
        },
      },
      include: {
        items: {
          include: {
            product: {
              select: {
                name: true,
                slug: true,
                images: { orderBy: { order: "asc" }, take: 1, select: { url: true } },
              },
            },
          },
        },
        user: { select: { name: true, email: true, phone: true } },
      },
    });

    // ── Fire notifications (non-blocking — never fail the order response) ────
    fireOrderNotifications(order, customerName, shipping.email).catch((e) =>
      console.error("[Notifications] error:", e)
    );

    // ── Auto-generate gift card codes if gift card products were purchased ────
    fulfillGiftCardProducts(
      order.id, orderNumber, customerName,
      shipping.email || "", shipping.phone || "",
    ).catch((e) => console.error("[GiftCard Fulfillment] error:", e));

    return NextResponse.json({ success: true, order });
  } catch (error) {
    console.error("Order creation error:", error);
    return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function fireOrderNotifications(order: any, customerName: string, shippingEmail?: string) {
  // Fetch notification settings from DB
  const settings = await prisma.siteSetting.findMany({
    where: { key: { in: ["notification_email", "notification_sms_number", "mnotify_sender_id"] } },
  });
  const settingsMap: Record<string, string> = {};
  for (const s of settings) settingsMap[s.key] = s.value;

  const adminEmail = settingsMap["notification_email"] ?? "sales@intactghana.com";
  const adminSmsPhone = settingsMap["notification_sms_number"] ?? "";
  const customerEmail = shippingEmail || (order.user?.email ?? "");
  const customerPhone = order.shippingPhone ?? order.user?.phone ?? "";

  // Build shared email data
  const emailData: OrderEmailData = {
    orderNumber: order.orderNumber,
    createdAt: order.createdAt,
    customerName,
    customerEmail,
    shippingAddress: order.shippingAddress ?? "",
    shippingCity: order.shippingCity ?? "",
    shippingRegion: order.shippingRegion ?? "",
    shippingPhone: order.shippingPhone ?? "",
    paymentMethod: order.paymentMethod ?? "cod",
    subtotal: order.subtotal,
    deliveryFee: order.shipping ?? 0,
    total: order.total,
    notes: order.notes,
    items: order.items.map((item: any) => ({
      name: item.product.name,
      quantity: item.quantity,
      price: item.price,
      imageUrl: item.product.images?.[0]?.url ?? undefined,
      variantLabel: item.variantLabel ?? undefined,
    })),
  };

  await Promise.allSettled([
    // 1. Customer confirmation email
    customerEmail
      ? sendCustomerOrderEmail(emailData)
      : Promise.resolve(),

    // 2. Admin new-order alert email
    sendAdminOrderEmail(emailData, adminEmail),

    // 3. Customer SMS
    customerPhone
      ? sendCustomerOrderSMS({
          phone: customerPhone,
          orderNumber: order.orderNumber,
          customerName,
          total: order.total,
          paymentMethod: order.paymentMethod ?? "cod",
          itemCount: order.items.length,
        })
      : Promise.resolve(),

    // 4. Admin SMS (only if configured in settings)
    adminSmsPhone
      ? sendAdminOrderSMS({
          phone: adminSmsPhone,
          orderNumber: order.orderNumber,
          customerName,
          customerPhone,
          total: order.total,
          paymentMethod: order.paymentMethod ?? "cod",
          city: order.shippingCity ?? "",
        })
      : Promise.resolve(),
  ]);
}

export async function GET(request: NextRequest) {
  // Authenticate user from JWT cookie
  const { jwtVerify } = await import("jose");
  const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET!);
  const token = request.cookies.get("auth-token")?.value;

  if (!token) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  let userId: string;
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    userId = payload.userId as string;
  } catch {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");

  // Always filter by the authenticated user's ID
  const where: Record<string, unknown> = { userId };
  if (status) where.status = status;

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      include: {
        items: {
          include: {
            product: {
              select: {
                name: true, slug: true,
                images: { orderBy: { order: "asc" }, take: 1, select: { url: true } },
              },
            },
          },
        },
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
