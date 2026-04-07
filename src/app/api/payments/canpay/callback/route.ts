import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// CanPay BNPL Callback Handler

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const refTrx = request.nextUrl.searchParams.get("ref_trx");

    const { status, amount } = body;

    if (status === "success" || status === "completed") {
      // refTrx is the order number
      if (refTrx) {
        const order = await prisma.order.findUnique({ where: { orderNumber: refTrx } });
        if (order && Math.abs(order.total - parseFloat(amount)) < 1) {
          await prisma.order.update({
            where: { id: order.id },
            data: { paymentStatus: "paid", status: "confirmed" },
          });
        }
      }
      return NextResponse.json({ status: "success" });
    }

    return NextResponse.json({ status: "noted" });
  } catch {
    return NextResponse.json({ error: "Callback processing failed" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const refTrx = request.nextUrl.searchParams.get("ref_trx");
  const status = request.nextUrl.searchParams.get("status")?.toLowerCase();

  const origin = request.headers.get("origin") || request.headers.get("referer")?.replace(/\/[^/]*$/, "") || "";
  const baseUrl = origin || process.env.NEXT_PUBLIC_BASE_URL?.replace(/\/$/, "") || "https://www.intactghana.com";

  console.log("[CanPay Callback GET] ref:", refTrx, "status:", status);

  // Only redirect to success for confirmed payments
  if (status === "success" || status === "completed" || status === "paid") {
    const successUrl = new URL("/checkout/success", baseUrl);
    if (refTrx) successUrl.searchParams.set("ref", refTrx);
    successUrl.searchParams.set("method", "canpay");
    return NextResponse.redirect(successUrl.toString());
  }

  // Cancelled / failed / any other status → redirect to checkout with error
  const checkoutUrl = new URL("/checkout/success", baseUrl);
  if (refTrx) checkoutUrl.searchParams.set("ref", refTrx);
  checkoutUrl.searchParams.set("method", "canpay");
  checkoutUrl.searchParams.set("status", status || "cancelled");
  return NextResponse.redirect(checkoutUrl.toString());
}
