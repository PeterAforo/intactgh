import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyStaff } from "@/lib/auth";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await verifyStaff(request); if (auth.error) return auth.error;
  const { id } = await params;
  const card = await prisma.giftCard.findUnique({ where: { id } });
  if (!card) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ card });
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await verifyStaff(request); if (auth.error) return auth.error;
  const { id } = await params;
  try {
    const body = await request.json();
    const { status, notes, expiresAt, balance } = body;
    const data: Record<string, unknown> = {};
    if (status !== undefined) data.status = status;
    if (notes !== undefined) data.notes = notes;
    if (expiresAt !== undefined) data.expiresAt = expiresAt ? new Date(expiresAt) : null;
    if (balance !== undefined) data.balance = parseFloat(String(balance));
    const card = await prisma.giftCard.update({ where: { id }, data });
    return NextResponse.json({ success: true, card });
  } catch {
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await verifyStaff(request); if (auth.error) return auth.error;
  const { id } = await params;
  await prisma.giftCard.update({ where: { id }, data: { status: "voided" } });
  return NextResponse.json({ success: true });
}
