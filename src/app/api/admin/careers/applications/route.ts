import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyStaff } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const auth = await verifyStaff(request);
  if (auth.error) return auth.error;
  const { searchParams } = new URL(request.url);
  const jobId = searchParams.get("jobId");
  const applications = await prisma.jobApplication.findMany({
    where: jobId ? { jobId } : {},
    orderBy: { createdAt: "desc" },
    include: { job: { select: { id: true, title: true, department: true } } },
  });
  return NextResponse.json({ applications });
}

export async function PUT(request: NextRequest) {
  const auth = await verifyStaff(request);
  if (auth.error) return auth.error;
  try {
    const body = await request.json();
    const { id, status } = body;
    if (!id || !status) return NextResponse.json({ error: "id and status required" }, { status: 400 });
    const application = await prisma.jobApplication.update({ where: { id }, data: { status } });
    return NextResponse.json({ application });
  } catch (error) {
    console.error("Application update error:", error);
    return NextResponse.json({ error: "Failed to update application" }, { status: 500 });
  }
}
