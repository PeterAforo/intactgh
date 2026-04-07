import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyStaff } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const auth = await verifyStaff(request);
  if (auth.error) return auth.error;
  const jobs = await prisma.jobPosting.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { applications: true } } },
  });
  return NextResponse.json({ jobs });
}

export async function POST(request: NextRequest) {
  const auth = await verifyStaff(request);
  if (auth.error) return auth.error;
  try {
    const body = await request.json();
    const { title, department, location, type, description, requirements, status } = body;
    if (!title || !department || !location || !description) {
      return NextResponse.json({ error: "title, department, location, and description are required" }, { status: 400 });
    }
    const job = await prisma.jobPosting.create({
      data: { title, department, location, type: type || "Full-time", description, requirements: requirements || null, status: status || "active" },
    });
    return NextResponse.json({ job }, { status: 201 });
  } catch (error) {
    console.error("Job create error:", error);
    return NextResponse.json({ error: "Failed to create job posting" }, { status: 500 });
  }
}
