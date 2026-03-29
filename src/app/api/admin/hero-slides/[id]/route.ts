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
    const slide = await prisma.heroSlide.update({ where: { id }, data: body });
    return NextResponse.json({ success: true, slide });
  } catch (error) {
    console.error("Hero slide update error:", error);
    return NextResponse.json({ error: "Failed to update slide" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await verifyAdmin(request); if (auth.error) return auth.error;
  try {
    const { id } = await params;
    await prisma.heroSlide.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Hero slide delete error:", error);
    return NextResponse.json({ error: "Failed to delete slide" }, { status: 500 });
  }
}
