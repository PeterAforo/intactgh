import { NextRequest, NextResponse } from "next/server";
import { verifyStaff } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  const staff = await verifyStaff(request);
  if (!staff) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(request.url);
  const status = url.searchParams.get("status");

  const where: Record<string, unknown> = {};
  if (status && status !== "all") where.status = status;

  const payouts = await prisma.payout.findMany({
    where,
    orderBy: { requestedAt: "desc" },
    include: {
      reseller: { select: { storeName: true, user: { select: { name: true, email: true } } } },
    },
  });

  return NextResponse.json(payouts);
}
