import { NextRequest, NextResponse } from "next/server";

// Hubtel Payment API Integration
// Mirrors the production PHP hubtelpay.php implementation
// Docs: https://developers.hubtel.com/reference/online-checkout
// Set credentials in .env:
//   HUBTEL_AUTH_BASIC=<Base64 encoded clientId:clientSecret>
//   HUBTEL_MERCHANT_ACCOUNT=2017118
//   NEXT_PUBLIC_BASE_URL=https://intactghana.com

const HUBTEL_API_URL = "https://payproxyapi.hubtel.com/items/initiate";
const COUNTRY_CODE = "233";

function formatPhone(rawPhone: string): string {
  // Convert 024XXXXXXX -> 23324XXXXXXX (strip leading 0, prepend 233)
  const cleaned = rawPhone.replace(/\s+/g, "").replace(/^\+/, "");
  if (cleaned.startsWith("0")) {
    return COUNTRY_CODE + cleaned.substring(1);
  }
  if (cleaned.startsWith(COUNTRY_CODE)) {
    return cleaned;
  }
  return COUNTRY_CODE + cleaned;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, amount, firstName, lastName, phone, ref, label } = body;

    if (!amount) {
      return NextResponse.json(
        { error: "Amount is required" },
        { status: 400 }
      );
    }

    const hubtelAuth = process.env.HUBTEL_AUTH_BASIC;
    const merchantAccount = process.env.HUBTEL_MERCHANT_ACCOUNT || "2017118";
    // Derive base URL from the incoming request so callbacks always match the live domain
    const origin = request.headers.get("origin") || request.headers.get("referer")?.replace(/\/[^/]*$/, "") || "";
    const baseUrl = origin || process.env.NEXT_PUBLIC_BASE_URL?.replace(/\/$/, "") || "https://www.intactghana.com";

    // Dev mode fallback if no Hubtel credentials
    if (!hubtelAuth) {
      const devRef = ref || `INT-${Date.now()}`;
      return NextResponse.json({
        success: true,
        message: "Development mode — Hubtel credentials not configured",
        checkoutUrl: `${baseUrl}/checkout/success?ref=${devRef}&method=hubtel`,
        reference: devRef,
      });
    }

    const clientReference = ref || String(Date.now());
    const formattedPhone = phone ? formatPhone(phone) : "";
    const paymentLabel = label || "Intact Ghana";

    // Match exact payload structure from hubtelpay.php
    const hubtelPayload = {
      totalAmount: parseFloat(String(amount)),
      description: `Payment for ${paymentLabel}`,
      callbackUrl: `${baseUrl}/api/payments/hubtel/callback`,
      returnUrl: `${baseUrl}/api/payments/hubtel/callback`,
      merchantAccountNumber: merchantAccount,
      cancellationUrl: `${baseUrl}/cart`,
      PayeeMobileNumber: formattedPhone,
      PayeeName: `${firstName || ""} ${lastName || ""}`.trim(),
      PayeeEmail: email || "",
      clientReference,
    };

    const hubtelResponse = await fetch(HUBTEL_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${hubtelAuth}`,
      },
      body: JSON.stringify(hubtelPayload),
    });

    const hubtelData = await hubtelResponse.json();

    if (hubtelData?.data?.checkoutUrl) {
      return NextResponse.json({
        success: true,
        checkoutUrl: hubtelData.data.checkoutUrl,
        reference: clientReference,
      });
    }

    console.error("Hubtel error response:", hubtelData);
    return NextResponse.json(
      {
        error: "Failed to initiate Hubtel payment — no checkout URL returned",
        details: hubtelData,
      },
      { status: 500 }
    );
  } catch (error) {
    console.error("Hubtel payment error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
