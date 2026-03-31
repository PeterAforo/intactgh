import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  const now = new Date();

  const promotions = await prisma.promotion.findMany({
    where: {
      active: true,
      startDate: { lte: now },
      endDate: { gte: now },
    },
    orderBy: { endDate: "asc" },
  });

  return NextResponse.json({ promotions });
}
