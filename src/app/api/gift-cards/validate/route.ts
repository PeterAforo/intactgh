import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const { code, pin } = await request.json();
    if (!code || !pin) return NextResponse.json({ error: "Code and PIN required" }, { status: 400 });

    const card = await prisma.giftCard.findUnique({ where: { code: code.trim().toUpperCase() } });

    if (!card) return NextResponse.json({ error: "Invalid gift card code" }, { status: 404 });
    if (card.pin !== pin.trim()) return NextResponse.json({ error: "Incorrect PIN" }, { status: 400 });
    if (card.status === "voided") return NextResponse.json({ error: "This gift card has been voided" }, { status: 400 });
    if (card.status === "used" || card.balance <= 0) return NextResponse.json({ error: "This gift card has no remaining balance" }, { status: 400 });
    if (card.expiresAt && card.expiresAt < new Date()) return NextResponse.json({ error: "This gift card has expired" }, { status: 400 });

    return NextResponse.json({
      valid: true,
      code: card.code,
      balance: card.balance,
      amount: card.amount,
      expiresAt: card.expiresAt,
    });
  } catch {
    return NextResponse.json({ error: "Validation failed" }, { status: 500 });
  }
}
