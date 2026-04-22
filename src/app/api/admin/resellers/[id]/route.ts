import { NextRequest, NextResponse } from "next/server";
import { verifyStaff } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { sendEmail, emailLayout } from "@/lib/email";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const staff = await verifyStaff(request);
  if (!staff) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const reseller = await prisma.reseller.findUnique({
    where: { id },
    include: {
      user: { select: { name: true, email: true, phone: true, createdAt: true } },
      _count: { select: { orders: true, clients: true, invoices: true, payouts: true } },
    },
  });

  if (!reseller) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(reseller);
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const staff = await verifyStaff(request);
  if (!staff) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const body = await request.json();
  const { status, bio } = body;

  const reseller = await prisma.reseller.findUnique({ where: { id }, include: { user: { select: { email: true, name: true } } } });
  if (!reseller) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const data: Record<string, unknown> = {};
  if (status) data.status = status;
  if (bio !== undefined) data.bio = bio;

  const updated = await prisma.reseller.update({ where: { id }, data });

  // Send notification email on status change
  if (status && status !== reseller.status) {
    try {
      if (status === "approved") {
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3001";
        await sendEmail(
          reseller.user.email,
          "Your IntactConnect account has been approved!",
          emailLayout("Account Approved", `
            <h2 style="color:#333">Congratulations, ${reseller.user.name}!</h2>
            <p>Your IntactConnect reseller account has been <strong style="color:#22c55e">approved</strong>.</p>
            <p>You can now log in and start selling:</p>
            <a href="${baseUrl}/login" style="display:inline-block;background:#7c3aed;color:#fff;padding:12px 32px;border-radius:8px;text-decoration:none;font-weight:600;margin:16px 0;">Go to Dashboard</a>
            <p style="color:#666">Your store URL: <a href="${baseUrl}/store/${reseller.storeSlug}">${baseUrl}/store/${reseller.storeSlug}</a></p>
          `)
        );
      } else if (status === "rejected") {
        await sendEmail(
          reseller.user.email,
          "IntactConnect account update",
          emailLayout("Account Update", `
            <h2 style="color:#333">Account Update</h2>
            <p>Hi ${reseller.user.name}, unfortunately your reseller application was not approved at this time.</p>
            <p>If you believe this was in error, please contact us at <a href="mailto:support@intactghana.com">support@intactghana.com</a>.</p>
          `)
        );
      }
    } catch (e) {
      console.error("Failed to send reseller status email:", e);
    }
  }

  return NextResponse.json(updated);
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const staff = await verifyStaff(request);
  if (!staff) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  await prisma.reseller.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
