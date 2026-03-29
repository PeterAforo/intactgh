import { NextRequest, NextResponse } from "next/server";

// Delivery Fee Estimation API
// Calculates estimated delivery fees for Yango, Bolt, and standard delivery
// Uses Haversine distance formula for distance-based pricing
// In production, integrate with actual Yango/Bolt APIs for real-time quotes

function haversineDistance(
  lat1: number, lng1: number,
  lat2: number, lng2: number
): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Pricing tiers per provider (GH₵)
const PRICING: Record<string, { baseFee: number; perKm: number; minFee: number; maxFee: number }> = {
  yango: { baseFee: 15, perKm: 3.5, minFee: 25, maxFee: 200 },
  bolt:  { baseFee: 12, perKm: 3.0, minFee: 20, maxFee: 180 },
  standard: { baseFee: 50, perKm: 0, minFee: 50, maxFee: 50 },
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { provider, pickupLat, pickupLng, dropoffLat, dropoffLng } = body;

    if (!provider || !pickupLat || !pickupLng || !dropoffLat || !dropoffLng) {
      return NextResponse.json(
        { error: "Missing required fields: provider, pickupLat, pickupLng, dropoffLat, dropoffLng" },
        { status: 400 }
      );
    }

    const pricing = PRICING[provider];
    if (!pricing) {
      return NextResponse.json(
        { error: `Unknown provider: ${provider}` },
        { status: 400 }
      );
    }

    const distanceKm = haversineDistance(pickupLat, pickupLng, dropoffLat, dropoffLng);
    const rawFee = pricing.baseFee + distanceKm * pricing.perKm;
    const fee = Math.round(Math.min(Math.max(rawFee, pricing.minFee), pricing.maxFee) * 100) / 100;

    // Estimate delivery time based on distance
    let estimatedTime = "";
    if (provider === "yango") {
      estimatedTime = distanceKm <= 10 ? "30-60 min" : distanceKm <= 25 ? "1-2 hours" : "2-3 hours";
    } else if (provider === "bolt") {
      estimatedTime = distanceKm <= 10 ? "45-90 min" : distanceKm <= 25 ? "1.5-3 hours" : "2-4 hours";
    } else {
      estimatedTime = "2-5 business days";
    }

    return NextResponse.json({
      provider,
      distanceKm: Math.round(distanceKm * 10) / 10,
      fee,
      estimatedTime,
      currency: "GHS",
      note: provider === "yango" || provider === "bolt"
        ? `Estimated fee via ${provider}. Final price may vary based on traffic and demand.`
        : "Standard Intact Ghana delivery.",
    });
  } catch (error) {
    console.error("Delivery estimate error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
