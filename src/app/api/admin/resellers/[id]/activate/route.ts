import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyStaff } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { sendResellerStatusEmail } from "@/lib/reseller-notifications";

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
        storeSlug: true,
        status: true,
        userId: true,
        user: { select: { id: true, name: true, email: true } },
      },
    });

    if (!reseller) return NextResponse.json({ error: "Not found" }, { status: 404 });

    await prisma.$transaction([
      prisma.reseller.update({
        where: { id },
        data: { status: "approved", onboardingComplete: true },
      }),
      prisma.user.update({
        where: { id: reseller.userId },
        data: { emailVerified: true, loginAttempts: 0, lockedUntil: null },
      }),
    ]);

    const updated = await prisma.reseller.findUnique({
      where: { id },
      include: {
        user: { select: resellerUserSelect },
        _count: { select: { orders: true, clients: true, invoices: true, payouts: true, promotions: true, referrals: true } },
      },
    });

    if (auth.user) {
      await logAudit({
        userId: auth.user.id,
        action: "activate",
        entity: "reseller",
        entityId: id,
        details: {
          storeName: reseller.storeName,
          targetEmail: reseller.user.email,
          previousStatus: reseller.status,
        },
        request,
      });
    }

    try {
      await sendResellerStatusEmail({
        status: "approved",
        userName: reseller.user.name,
        userEmail: reseller.user.email,
        storeSlug: reseller.storeSlug,
      });
    } catch (e) {
      console.error("Failed to send reseller activation email:", e);
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Reseller activate error:", error);
    return NextResponse.json({ error: "Failed to activate reseller" }, { status: 500 });
  }
}
