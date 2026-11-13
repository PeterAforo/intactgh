import { NextRequest, NextResponse } from "next/server";
import { verifyStaff } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  const auth = await verifyStaff(request);
  if (auth.error) return auth.error;

  const url = new URL(request.url);
  const status = url.searchParams.get("status");
  const resellerId = url.searchParams.get("resellerId");

  const where: Record<string, unknown> = {};
  if (status && status !== "all") where.status = status;
  if (resellerId) where.resellerId = resellerId;

  const invoices = await prisma.invoice.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      reseller: { select: { storeName: true, user: { select: { name: true } } } },
      client: { select: { name: true, email: true, phone: true } },
      items: true,
    },
  });

  return NextResponse.json(invoices);
}
