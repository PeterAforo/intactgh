import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// Hubtel Payment Callback Handler
//   POST: Hubtel server-to-server webhook with payment status
//   GET:  User redirect back from Hubtel checkout page

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { ResponseCode, Data } = body;

    if (ResponseCode === "0000" && Data) {
      const { ClientReference, Amount } = Data;

      // Find order by orderNumber (ClientReference)
      const order = await prisma.order.findUnique({ where: { orderNumber: ClientReference } });
      if (order) {
        // Verify amount matches
        if (Math.abs(order.total - parseFloat(Amount)) < 1) {
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

// GET: User redirected back from Hubtel after payment
export async function GET(request: NextRequest) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  const params = request.nextUrl.searchParams;
  const clientReference = params.get("clientReference") || params.get("checkoutId") || "";

  const successUrl = new URL("/checkout/success", baseUrl);
  if (clientReference) successUrl.searchParams.set("ref", clientReference);
  successUrl.searchParams.set("method", "hubtel");

  return NextResponse.redirect(successUrl.toString());
}
