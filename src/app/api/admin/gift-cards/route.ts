import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyAdmin } from "@/lib/auth";

function generateCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const seg = () => Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
  return `INTGC-${seg()}-${seg()}-${seg()}`;
}

function generatePin(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export async function GET(request: NextRequest) {
  const auth = await verifyAdmin(request); if (auth.error) return auth.error;
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "50");
  const status = searchParams.get("status");
  const search = searchParams.get("q") || "";

  const where: Record<string, unknown> = {};
  if (status) where.status = status;
  if (search) where.OR = [
    { code: { contains: search, mode: "insensitive" } },
    { purchasedBy: { contains: search, mode: "insensitive" } },
    { notes: { contains: search, mode: "insensitive" } },
  ];

  const [cards, total] = await Promise.all([
    prisma.giftCard.findMany({
      where, orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit, take: limit,
    }),
    prisma.giftCard.count({ where }),
  ]);

  return NextResponse.json({ cards, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
}

export async function POST(request: NextRequest) {
  const auth = await verifyAdmin(request); if (auth.error) return auth.error;
  try {
    const body = await request.json();
    const { amount, quantity = 1, expiresAt, notes, purchasedBy } = body;

    if (!amount || amount <= 0) return NextResponse.json({ error: "Valid amount required" }, { status: 400 });
    if (quantity < 1 || quantity > 200) return NextResponse.json({ error: "Quantity must be 1–200" }, { status: 400 });

    const cards = await Promise.all(
      Array.from({ length: quantity }, async () => {
        let code = generateCode();
        let attempts = 0;
        while (attempts < 5) {
          const existing = await prisma.giftCard.findUnique({ where: { code } });
          if (!existing) break;
          code = generateCode();
          attempts++;
        }
        return prisma.giftCard.create({
          data: {
            code,
            pin: generatePin(),
            amount: parseFloat(String(amount)),
            balance: parseFloat(String(amount)),
            status: "active",
            purchasedBy: purchasedBy || null,
            purchasedAt: purchasedBy ? new Date() : null,
            expiresAt: expiresAt ? new Date(expiresAt) : null,
            notes: notes || null,
          },
        });
      })
    );

    return NextResponse.json({ success: true, cards, count: cards.length });
  } catch (error) {
    console.error("Gift card generation error:", error);
    return NextResponse.json({ error: "Failed to generate gift cards" }, { status: 500 });
  }
}
