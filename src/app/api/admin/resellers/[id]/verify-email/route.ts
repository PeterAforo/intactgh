import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyStaff } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

const resellerUserSelect = {
  id: true,
  name: true,
  email: true,
  phone: true,
  createdAt: true,
  emailVerified: true,
  loginAttempts: true,
  lockedUntil: true,
} as const;

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await verifyStaff(request);
  if (auth.error) return auth.error;

  try {
    const { id } = await params;
    const reseller = await prisma.reseller.findUnique({
      where: { id },
      select: {
        id: true,
        storeName: true,
        userId: true,
        user: { select: { id: true, email: true, emailVerified: true } },
      },
    });

    if (!reseller) return NextResponse.json({ error: "Not found" }, { status: 404 });

    if (!reseller.user.emailVerified) {
      await prisma.user.update({
        where: { id: reseller.userId },
        data: { emailVerified: true, verifyToken: null, verifyTokenExpiry: null },
      });
    }

    if (auth.user) {
      await logAudit({
        userId: auth.user.id,
        action: "verify_email",
        entity: "reseller",
        entityId: id,
        details: { storeName: reseller.storeName, targetEmail: reseller.user.email, alreadyVerified: reseller.user.emailVerified },
        request,
      });
    }

    const updated = await prisma.reseller.findUnique({
      where: { id },
      include: {
        user: { select: resellerUserSelect },
        _count: { select: { orders: true, clients: true, invoices: true, payouts: true, promotions: true, referrals: true } },
      },
    });

    if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ ...updated, alreadyVerified: reseller.user.emailVerified });
  } catch (error) {
    console.error("Reseller verify email error:", error);
    return NextResponse.json({ error: "Failed to verify email" }, { status: 500 });
  }
}
