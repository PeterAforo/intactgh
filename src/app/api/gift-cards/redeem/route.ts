import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// POST /api/gift-cards/redeem
// Applies a gift card to an order — deducts balance, marks used if fully spent
export async function POST(request: NextRequest) {
  try {
    const { code, pin, amountToUse, orderId, redeemedBy } = await request.json();
    if (!code || !pin || !amountToUse) {
      return NextResponse.json({ error: "code, pin, and amountToUse required" }, { status: 400 });
    }

    const card = await prisma.giftCard.findUnique({ where: { code: code.trim().toUpperCase() } });

    if (!card) return NextResponse.json({ error: "Invalid gift card code" }, { status: 404 });
    if (card.pin !== pin.trim()) return NextResponse.json({ error: "Incorrect PIN" }, { status: 400 });
    if (card.status === "voided") return NextResponse.json({ error: "Gift card is voided" }, { status: 400 });
    if (card.status === "used" || card.balance <= 0) return NextResponse.json({ error: "No remaining balance" }, { status: 400 });
    if (card.expiresAt && card.expiresAt < new Date()) return NextResponse.json({ error: "Gift card expired" }, { status: 400 });

    const deduct = Math.min(parseFloat(String(amountToUse)), card.balance);
    const newBalance = Math.max(0, card.balance - deduct);
    const newStatus = newBalance <= 0 ? "used" : "active";

    const updated = await prisma.giftCard.update({
      where: { id: card.id },
      data: {
        balance: newBalance,
        status: newStatus,
        redeemedBy: redeemedBy || card.redeemedBy || null,
        redeemedAt: newStatus === "used" ? new Date() : card.redeemedAt,
        orderId: orderId || card.orderId || null,
      },
    });

    return NextResponse.json({
      success: true,
      amountApplied: deduct,
      remainingBalance: updated.balance,
      card: { code: updated.code, balance: updated.balance, status: updated.status },
    });
  } catch {
    return NextResponse.json({ error: "Redemption failed" }, { status: 500 });
  }
}
