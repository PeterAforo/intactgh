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
    const post = await prisma.newsPost.update({ where: { id }, data: body });
    return NextResponse.json({ success: true, post });
  } catch (error) {
    console.error("News update error:", error);
    return NextResponse.json({ error: "Failed to update post" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await verifyStaff(request); if (auth.error) return auth.error;
  try {
    const { id } = await params;
    await prisma.newsPost.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("News delete error:", error);
    return NextResponse.json({ error: "Failed to delete post" }, { status: 500 });
  }
}
