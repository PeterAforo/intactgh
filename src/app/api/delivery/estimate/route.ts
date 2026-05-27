import { NextRequest, NextResponse } from "next/server";

// Delivery Fee Estimation API
// Calculates estimated delivery fees for Yango, Bolt, and standard delivery
// Standard delivery uses region-based pricing OR GPS distance (whichever is available)

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
  standard: { baseFee: 30, perKm: 0.50, minFee: 40, maxFee: 300 },
};

// Region-based delivery fees from A&C Mall, East Legon (GH₵)
const REGION_FEES: Record<string, { fee: number; estimatedTime: string }> = {
  "Greater Accra": { fee: 50, estimatedTime: "1-2 business days" },
  "Eastern":       { fee: 80, estimatedTime: "2-3 business days" },
  "Central":       { fee: 100, estimatedTime: "2-3 business days" },
  "Volta":         { fee: 120, estimatedTime: "3-4 business days" },
  "Oti":           { fee: 150, estimatedTime: "3-5 business days" },
  "Ashanti":       { fee: 150, estimatedTime: "3-4 business days" },
  "Western":       { fee: 150, estimatedTime: "3-5 business days" },
  "Western North": { fee: 180, estimatedTime: "4-5 business days" },
  "Ahafo":         { fee: 180, estimatedTime: "4-5 business days" },
  "Bono":          { fee: 180, estimatedTime: "4-5 business days" },
  "Bono East":     { fee: 180, estimatedTime: "4-5 business days" },
  "Northern":      { fee: 200, estimatedTime: "5-7 business days" },
  "Savannah":      { fee: 200, estimatedTime: "5-7 business days" },
  "North East":    { fee: 220, estimatedTime: "5-7 business days" },
  "Upper East":    { fee: 250, estimatedTime: "5-7 business days" },
  "Upper West":    { fee: 250, estimatedTime: "5-7 business days" },
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { provider, pickupLat, pickupLng, dropoffLat, dropoffLng, region } = body;

    if (!provider) {
      return NextResponse.json(
        { error: "Missing required field: provider" },
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

    // Standard delivery: use GPS distance if available, otherwise region-based
    if (provider === "standard") {
      let fee: number;
      let estimatedTime: string;
      let distanceKm: number | null = null;

      if (pickupLat && pickupLng && dropoffLat && dropoffLng) {
        distanceKm = haversineDistance(pickupLat, pickupLng, dropoffLat, dropoffLng);
        const rawFee = pricing.baseFee + distanceKm * pricing.perKm;
        fee = Math.round(Math.min(Math.max(rawFee, pricing.minFee), pricing.maxFee));

        if (distanceKm <= 30) estimatedTime = "1-2 business days";
        else if (distanceKm <= 100) estimatedTime = "2-3 business days";
        else if (distanceKm <= 250) estimatedTime = "3-4 business days";
        else if (distanceKm <= 500) estimatedTime = "5-7 business days";
        else estimatedTime = "5-7 business days";
      } else if (region && REGION_FEES[region]) {
        fee = REGION_FEES[region].fee;
        estimatedTime = REGION_FEES[region].estimatedTime;
      } else {
        fee = 50;
        estimatedTime = "2-5 business days";
      }

      return NextResponse.json({
        provider,
        distanceKm: distanceKm ? Math.round(distanceKm * 10) / 10 : null,
        fee,
        estimatedTime,
        currency: "GHS",
        note: distanceKm
          ? `Delivery fee based on ${Math.round(distanceKm)}km distance.`
          : region
          ? `Standard delivery to ${region}.`
          : "Standard Intact Ghana delivery.",
      });
    }

    // Yango / Bolt — require GPS coordinates
    if (!pickupLat || !pickupLng || !dropoffLat || !dropoffLng) {
      return NextResponse.json(
        { error: "Missing GPS coordinates for delivery estimate" },
        { status: 400 }
      );
    }

    const distanceKm = haversineDistance(pickupLat, pickupLng, dropoffLat, dropoffLng);
    const rawFee = pricing.baseFee + distanceKm * pricing.perKm;
    const fee = Math.round(Math.min(Math.max(rawFee, pricing.minFee), pricing.maxFee) * 100) / 100;

    let estimatedTime = "";
    if (provider === "yango") {
      estimatedTime = distanceKm <= 10 ? "30-60 min" : distanceKm <= 25 ? "1-2 hours" : "2-3 hours";
    } else if (provider === "bolt") {
      estimatedTime = distanceKm <= 10 ? "45-90 min" : distanceKm <= 25 ? "1.5-3 hours" : "2-4 hours";
    }

    return NextResponse.json({
      provider,
      distanceKm: Math.round(distanceKm * 10) / 10,
      fee,
      estimatedTime,
      currency: "GHS",
      note: `Estimated fee via ${provider}. Final price may vary based on traffic and demand.`,
    });
  } catch (error) {
    console.error("Delivery estimate error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
