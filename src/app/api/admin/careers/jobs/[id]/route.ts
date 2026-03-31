import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyAdmin } from "@/lib/auth";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await verifyAdmin(request);
  if (auth.error) return auth.error;
  const { id } = await params;
  const job = await prisma.jobPosting.findUnique({
    where: { id },
    include: { applications: { orderBy: { createdAt: "desc" } } },
  });
  if (!job) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ job });
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await verifyAdmin(request);
  if (auth.error) return auth.error;
  const { id } = await params;
  try {
    const body = await request.json();
    const { title, department, location, type, description, requirements, status } = body;
    const job = await prisma.jobPosting.update({
      where: { id },
      data: { title, department, location, type, description, requirements: requirements || null, status },
    });
    return NextResponse.json({ job });
  } catch (error) {
    console.error("Job update error:", error);
    return NextResponse.json({ error: "Failed to update job posting" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await verifyAdmin(request);
  if (auth.error) return auth.error;
  const { id } = await params;
  try {
    await prisma.jobPosting.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Job delete error:", error);
    return NextResponse.json({ error: "Failed to delete job posting" }, { status: 500 });
  }
}
