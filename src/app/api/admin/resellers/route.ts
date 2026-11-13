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
      _count: { select: { orders: true, clients: true, invoices: true, payouts: true, promotions: true, referrals: true } },
    },
  });

  // Aggregate activity counts (relations without FK or too costly for _count)
  const [orderRows, clientRows, invoiceRows, payoutRows, promoRows, referralRows, eventRows] = await Promise.all([
    prisma.resellerOrder.groupBy({ by: ["resellerId"], _count: { _all: true } }),
    prisma.resellerClient.groupBy({ by: ["resellerId"], _count: { _all: true } }),
    prisma.invoice.groupBy({ by: ["resellerId"], _count: { _all: true } }),
    prisma.payout.groupBy({ by: ["resellerId"], _count: { _all: true } }),
    prisma.resellerPromotion.groupBy({ by: ["resellerId"], _count: { _all: true } }),
    prisma.reseller.groupBy({ by: ["referredById"], _count: { _all: true } }),
    prisma.storeEvent.groupBy({ by: ["resellerId"], _count: { _all: true } }),
  ]);

  const toMap = (rows: { resellerId?: string | null; referredById?: string | null; _count: { _all: number } }[]) => {
    const map = new Map<string, number>();
    for (const row of rows) {
      const key = row.resellerId ?? row.referredById;
      if (key) map.set(key, (map.get(key) ?? 0) + row._count._all);
    }
    return map;
  };
  const orderMap = toMap(orderRows);
  const clientMap = toMap(clientRows);
  const invoiceMap = toMap(invoiceRows);
  const payoutMap = toMap(payoutRows);
  const promoMap = toMap(promoRows);
  const referralMap = toMap(referralRows);
  const eventMap = toMap(eventRows);

  const result = resellers.map((r) => ({
    ...r,
    activityCount:
      (orderMap.get(r.id) ?? 0) +
      (clientMap.get(r.id) ?? 0) +
      (invoiceMap.get(r.id) ?? 0) +
      (payoutMap.get(r.id) ?? 0) +
      (promoMap.get(r.id) ?? 0) +
      (referralMap.get(r.id) ?? 0) +
      (eventMap.get(r.id) ?? 0),
  }));

  return NextResponse.json(result);
}
