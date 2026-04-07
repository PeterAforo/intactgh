import { NextRequest, NextResponse } from "next/server";

// CanPay BNPL (Buy Now Pay Later) API Integration
// Mirrors the production PHP CanPayBNPL.php exactly
// Set credentials in .env:
//   CANPAY_BASE_URL=https://pay.canpaybnpl.com/api/v1
//   CANPAY_MERCHANT_KEY=876480
//   CANPAY_API_KEY=<api_key>
//   CANPAY_ENVIRONMENT=production
//   NEXT_PUBLIC_BASE_URL=https://intactghana.com

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { amount, description, customerName, customerEmail, orderNumber } = body;

    if (!amount) {
      return NextResponse.json(
        { error: "Amount is required" },
        { status: 400 }
      );
    }

    const canpayBaseUrl = process.env.CANPAY_BASE_URL;
    const merchantKey = process.env.CANPAY_MERCHANT_KEY;
    const apiKey = process.env.CANPAY_API_KEY;
    const environment = process.env.CANPAY_ENVIRONMENT || "production";
    // Derive base URL from the incoming request so callback always matches the live domain
    const origin = request.headers.get("origin") || request.headers.get("referer")?.replace(/\/[^/]*$/, "") || "";
    const baseUrl = origin || process.env.NEXT_PUBLIC_BASE_URL?.replace(/\/$/, "") || "https://www.intactghana.com";

    // Use real order number if provided so callback can match it to DB order
    const reference = orderNumber || `ORDER_${Date.now()}`;
    const callbackUrl = `${baseUrl}/api/payments/canpay/callback?ref_trx=${encodeURIComponent(reference)}`;

    // Dev mode fallback if no CanPay credentials
    if (!canpayBaseUrl || !merchantKey || !apiKey) {
      return NextResponse.json({
        success: true,
        message: "Development mode — CanPay credentials not configured",
        redirectUrl: `${baseUrl}/checkout/success?ref=${reference}&method=canpay`,
        reference,
      });
    }

    // Match the PHP CanPayBNPL.php initiatePayment() exactly
    const canpayPayload = {
      payment_amount: parseFloat(String(amount)),
      currency_code: "GHC",
      ref_trx: reference,
      description: description || "Intact Ghana Order",
      callback_url: callbackUrl,
    };

    console.log("[CanPay] Initiating payment:", { reference, amount: canpayPayload.payment_amount, callbackUrl });

    const canpayResponse = await fetch(`${canpayBaseUrl}/initiate-payment`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Environment": environment,
        "X-Merchant-Key": merchantKey,
        "X-API-Key": apiKey,
      },
      body: JSON.stringify(canpayPayload),
    });

    const canpayText = await canpayResponse.text();
    let canpayData;
    try { canpayData = JSON.parse(canpayText); } catch { canpayData = { raw: canpayText }; }

    console.log("[CanPay] Response status:", canpayResponse.status, "body:", canpayText.slice(0, 500));

    // CanPay returns a checkout URL to redirect the user to
    const redirectUrl =
      canpayData?.payment_url ||
      canpayData?.checkout_url ||
      canpayData?.data?.checkout_url ||
      canpayData?.data?.payment_url ||
      canpayData?.redirect_url ||
      canpayData?.data?.redirect_url;

    if (redirectUrl) {
      return NextResponse.json({
        success: true,
        redirectUrl,
        reference,
      });
    }

    const apiError = canpayData?.message || canpayData?.error || canpayData?.data?.message || "No checkout URL returned";
    console.error("[CanPay] Error:", canpayResponse.status, canpayData);
    return NextResponse.json(
      {
        error: `CanPay error: ${apiError}`,
        details: canpayData,
      },
      { status: 502 }
    );
  } catch (error) {
    console.error("CanPay payment error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
