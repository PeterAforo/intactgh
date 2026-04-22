import { NextRequest, NextResponse } from "next/server";
import { verifyStaff, getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { sendEmail, emailLayout } from "@/lib/email";

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const staff = await verifyStaff(request);
  if (!staff) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const { status, adminNotes } = await request.json();
  const authUser = await getAuthUser(request);

  const payout = await prisma.payout.findUnique({
    where: { id },
    include: { reseller: { include: { user: { select: { email: true, name: true } } } } },
  });

  if (!payout) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const data: Record<string, unknown> = {};
  if (status) {
    data.status = status;
    if (status === "paid" || status === "rejected") {
      data.processedAt = new Date();
      data.processedById = authUser?.id;
    }
  }
  if (adminNotes !== undefined) data.adminNotes = adminNotes;

  // If rejecting, refund the balance
  if (status === "rejected" && payout.status === "requested") {
    await prisma.reseller.update({
      where: { id: payout.resellerId },
      data: { commissionBalance: { increment: payout.amount } },
    });
  }

  const updated = await prisma.payout.update({ where: { id }, data });

  // Notify reseller
  try {
    const statusText = status === "paid" ? "processed and paid" : status === "rejected" ? "rejected" : "updated";
    await sendEmail(
      payout.reseller.user.email,
      `Payout ${statusText} — GH₵${payout.amount.toFixed(2)}`,
      emailLayout("Payout Update", `
        <h2 style="color:#333">Payout ${statusText.charAt(0).toUpperCase() + statusText.slice(1)}</h2>
        <p>Your payout request of <strong>GH₵${payout.amount.toFixed(2)}</strong> has been <strong>${statusText}</strong>.</p>
        ${adminNotes ? `<p style="color:#666">Admin notes: ${adminNotes}</p>` : ""}
        ${status === "rejected" ? `<p style="color:#666">The amount has been returned to your commission balance.</p>` : ""}
      `)
    );
  } catch (e) {
    console.error("Failed to send payout email:", e);
  }

  return NextResponse.json(updated);
}
