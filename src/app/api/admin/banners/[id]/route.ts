import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyAdmin } from "@/lib/auth";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await verifyAdmin(request); if (auth.error) return auth.error;
  try {
    const { id } = await params;
    const body = await request.json();
    const banner = await prisma.banner.update({ where: { id }, data: body });
    return NextResponse.json({ success: true, banner });
  } catch (error) {
    console.error("Banner update error:", error);
    return NextResponse.json({ error: "Failed to update banner" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await verifyAdmin(request); if (auth.error) return auth.error;
  try {
    const { id } = await params;
    await prisma.banner.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Banner delete error:", error);
    return NextResponse.json({ error: "Failed to delete banner" }, { status: 500 });
  }
}
