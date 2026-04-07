import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyStaff } from "@/lib/auth";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await verifyStaff(request); if (auth.error) return auth.error;
  try {
    const { id } = await params;
    const body = await request.json();
    const page = await prisma.page.update({ where: { id }, data: body });
    return NextResponse.json({ success: true, page });
  } catch (error) {
    console.error("Page update error:", error);
    return NextResponse.json({ error: "Failed to update page" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await verifyStaff(request); if (auth.error) return auth.error;
  try {
    const { id } = await params;
    await prisma.page.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Page delete error:", error);
    return NextResponse.json({ error: "Failed to delete page" }, { status: 500 });
  }
}
