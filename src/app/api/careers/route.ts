import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  const jobs = await prisma.jobPosting.findMany({
    where: { status: "active" },
    orderBy: { createdAt: "desc" },
    select: { id: true, title: true, department: true, location: true, type: true, description: true, requirements: true, createdAt: true },
  });
  return NextResponse.json({ jobs });
}
