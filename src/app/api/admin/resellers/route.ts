import { NextRequest, NextResponse } from "next/server";
import { verifyStaff } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  const auth = await verifyStaff(request);
  if (auth.error) return auth.error;

  const url = new URL(request.url);
  const status = url.searchParams.get("status");
  const search = url.searchParams.get("search");

  const where: Record<string, unknown> = {};
  if (status && status !== "all") where.status = status;
  if (search) {
    where.OR = [
      { storeName: { contains: search, mode: "insensitive" } },
      { storeSlug: { contains: search, mode: "insensitive" } },
      { phone: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
      { user: { name: { contains: search, mode: "insensitive" } } },
      { user: { email: { contains: search, mode: "insensitive" } } },
      { user: { phone: { contains: search, mode: "insensitive" } } },
    ];
  }

  const resellers = await prisma.reseller.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          createdAt: true,
          emailVerified: true,
          loginAttempts: true,
          lockedUntil: true,
        },
      },
      _count: { select: { orders: true, clients: true } },
    },
  });

  return NextResponse.json(resellers);
}
